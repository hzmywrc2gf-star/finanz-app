import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { EncryptedRepository } from '../data/encryptedRepo'
import { recordFailure, recordSuccess, remainingWaitMs } from '../data/lockAttempts'
import { LocalStorageRepository } from '../data/localStorageRepo'
import { VaultError, vault } from '../data/vault'
import type { AutoLockMinutes, VaultSession } from '../data/vault'
import { Greeting } from '../components/Greeting'
import { LockScreen, NewPasswordScreen } from '../components/LockScreen'
import type { LockControls } from '../components/LockScreen'
import { greetingText } from '../lib/greeting'
import { haptic } from '../lib/haptics'
import { getPrfOutput, isPasskeyPrfLikelySupported, newPrfSalt, registerPasskey } from '../lib/passkey'
import { FinanceProvider } from './FinanceContext'
import { LockContext } from './LockContext'
import type { LockApi } from './LockContext'

const localRepo = new LocalStorageRepository()

/** Inactivity limit while "Sofort" is chosen: the app locks when it is hidden, and after this long without input. */
const IMMEDIATE_IDLE_MS = 60_000
const IDLE_CHECK_MS = 1000

type Unlocked = { session: VaultSession; repo: EncryptedRepository }
type LockReason = 'start' | 'auto' | 'manual'

const readHeader = () => vault.info()

/**
 * Decides whether the finance app or the lock screen is shown. Owns the in-memory vault session (data key), auto-lock,
 * privacy cover and the greeting. With the lock off it is just the FinanceProvider on plain local storage.
 */
export function LockProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => vault.exists())
  const [header, setHeader] = useState(readHeader)
  const [unlocked, setUnlocked] = useState<Unlocked | null>(null)
  const [pending, setPending] = useState<VaultSession | null>(null) // opened with the recovery key, new password still due
  const [reason, setReason] = useState<LockReason>('start')
  const [greeting, setGreeting] = useState<string | null>(null)
  const [passkeyLikely, setPasskeyLikely] = useState(false)

  const unlockedRef = useRef(unlocked)
  const locking = useRef(false)
  const busyOps = useRef(0) // > 0 while a Face ID prompt is open: the system sheet must not trigger the auto-lock
  const lastActive = useRef(0) // set when the app opens and on every input
  useEffect(() => {
    unlockedRef.current = unlocked
  })

  const minutes: AutoLockMinutes = header?.autoLockMinutes ?? 1
  const hasPasskey = header?.passkey != null

  useEffect(() => {
    void isPasskeyPrfLikelySupported().then(setPasskeyLikely)
  }, [])

  // ---------- locking ----------

  const lock = useCallback(async (why: LockReason) => {
    const u = unlockedRef.current
    if (!u || locking.current) return
    locking.current = true
    try {
      await u.repo.flush() // pending saves reach the vault before the key is dropped
      u.repo.close()
      unlockedRef.current = null
      setReason(why)
      setUnlocked(null) // unmounts the whole app: sheets, undo toast and all data leave React state
      setPending(null)
      setGreeting(null)
      setHeader(readHeader())
    } finally {
      locking.current = false
    }
  }, [])

  // Auto-lock: hidden for >= the chosen time, or no input for that long while visible ("Sofort": on hide / 1 min idle).
  const signedIn = unlocked !== null
  useEffect(() => {
    if (!signedIn || !enabled) return
    const limitMs = minutes === 0 ? 0 : minutes * 60_000
    const idleMs = minutes === 0 ? IMMEDIATE_IDLE_MS : limitMs
    let hiddenAt: number | null = null
    let hiddenTimer: number | undefined
    lastActive.current = Date.now()

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (busyOps.current > 0) return
        hiddenAt = Date.now()
        if (limitMs === 0) void lock('auto')
        else hiddenTimer = window.setTimeout(() => void lock('auto'), limitMs) // may be frozen by the OS; the check on return catches that
      } else {
        window.clearTimeout(hiddenTimer)
        const wasHiddenFor = hiddenAt === null ? 0 : Date.now() - hiddenAt
        hiddenAt = null
        if (wasHiddenFor >= limitMs && wasHiddenFor > 0) void lock('auto')
        else lastActive.current = Date.now()
      }
    }
    const onActivity = () => {
      lastActive.current = Date.now()
    }
    const idleTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || busyOps.current > 0) return
      if (Date.now() - lastActive.current >= idleMs) void lock('auto')
    }, IDLE_CHECK_MS)

    document.addEventListener('visibilitychange', onVisibility)
    const events = ['pointerdown', 'pointermove', 'keydown', 'wheel'] as const
    for (const name of events) window.addEventListener(name, onActivity, { passive: true })
    window.addEventListener('scroll', onActivity, { passive: true, capture: true })
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      for (const name of events) window.removeEventListener(name, onActivity)
      window.removeEventListener('scroll', onActivity, { capture: true })
      window.clearInterval(idleTimer)
      window.clearTimeout(hiddenTimer)
    }
  }, [signedIn, enabled, minutes, lock])

  // Privacy cover: the iOS app switcher snapshots the page when it is hidden, so cover it synchronously (a plain
  // attribute, no React render in between). The element itself lives in index.html.
  useEffect(() => {
    if (!enabled) return
    const root = document.documentElement
    const sync = () => {
      if (document.visibilityState === 'hidden') root.setAttribute('data-privacy', '')
      else root.removeAttribute('data-privacy')
    }
    const cover = () => root.setAttribute('data-privacy', '')
    sync()
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('pagehide', cover)
    window.addEventListener('pageshow', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('pagehide', cover)
      window.removeEventListener('pageshow', sync)
      root.removeAttribute('data-privacy')
    }
  }, [enabled])

  // ---------- unlocking ----------

  const waitMs = useCallback(() => remainingWaitMs(Date.now()), [])

  const guard = () => {
    const wait = waitMs()
    if (wait > 0) throw new Error(`Zu viele Fehlversuche. Bitte warte noch ${Math.ceil(wait / 1000)} Sekunden.`)
  }

  /** Counts a wrong password/recovery key for the rate limit (only those, not a cancelled Face ID). */
  const counted = async (open: () => Promise<VaultSession>): Promise<VaultSession> => {
    try {
      return await open()
    } catch (e) {
      if (e instanceof VaultError && e.code === 'secret') recordFailure(Date.now())
      throw e
    }
  }

  const openApp = async (session: VaultSession, viaFaceId: boolean) => {
    // reading the data first: a damaged vault is reported on the lock screen and the app never mounts on defaults
    const data = await vault.loadData(session.dek)
    recordSuccess()
    lastActive.current = Date.now()
    setPending(null)
    // the greeting is set first and in the same batch as the app: the lock screen is replaced by the app and the
    // (opaque) greeting in one commit, so the start page is never on screen without it
    if (viaFaceId) setGreeting(greetingText(data.settings.displayName))
    setUnlocked({ session, repo: new EncryptedRepository(session.dek) })
    haptic()
  }

  const controls: LockControls = {
    hasPasskey,
    unreadable: header === null,
    autoPasskey: reason !== 'manual',
    waitMs,
    onPassword: async (password) => {
      guard()
      const session = await counted(() => vault.unlockWithPassword(password))
      await openApp(session, false)
    },
    onRecovery: async (key) => {
      guard()
      const session = await counted(() => vault.unlockWithRecoveryKey(key))
      await vault.loadData(session.dek)
      recordSuccess()
      setPending(session) // the old password is lost or unknown: a new one is mandatory before the app opens
    },
    onPasskey: async () => {
      const passkey = vault.info()?.passkey
      if (!passkey) throw new Error('Face ID ist nicht eingerichtet.')
      const output = await getPrfOutput(passkey.credentialId, passkey.prfSalt)
      await openApp(await vault.unlockWithPasskey(output), true)
    },
  }

  // ---------- settings API ----------

  const api = useMemo<LockApi>(() => {
    const current = () => {
      const u = unlockedRef.current
      if (!u) throw new Error('Die App ist gesperrt.')
      return u
    }
    const setSession = (session: VaultSession) => setUnlocked((u) => (u ? { ...u, session } : u))
    const withFaceId = async <T,>(fn: () => Promise<T>): Promise<T> => {
      busyOps.current++
      try {
        return await fn()
      } finally {
        busyOps.current--
        lastActive.current = Date.now()
      }
    }
    return {
      enabled,
      autoLockMinutes: minutes,
      hasPasskey,
      passkeyLikely,
      async enable(data, password, recoveryKey) {
        const { session } = await vault.enable(data, password, recoveryKey)
        setHeader(readHeader())
        setEnabled(true)
        // the running FinanceProvider carries its in-memory data over to the new (encrypted) repository
        setUnlocked({ session, repo: new EncryptedRepository(session.dek) })
        haptic()
      },
      async disable(password) {
        const u = current()
        await u.repo.flush()
        await vault.disable(password) // throws on a wrong password; plaintext is verified before the vault goes
        u.repo.close()
        unlockedRef.current = null
        setUnlocked(null)
        setEnabled(false)
        setHeader(null)
      },
      async changePassword(oldPassword, newPassword) {
        setSession(await vault.changePassword(current().session, oldPassword, newPassword))
      },
      regenerateRecoveryKey: () => vault.regenerateRecoveryKey(current().session),
      async addPasskey() {
        const session = current().session
        await withFaceId(async () => {
          const prfSalt = newPrfSalt()
          const { credentialId, prfOutput } = await registerPasskey(prfSalt)
          await vault.addPasskey(session, { credentialId, prfSalt, prfOutput })
        })
        setHeader(readHeader())
      },
      removePasskey() {
        vault.removePasskey()
        setHeader(readHeader())
      },
      setAutoLock(next) {
        vault.setAutoLock(next)
        setHeader(readHeader())
      },
      lockNow: () => void lock('manual'),
    }
  }, [enabled, minutes, hasPasskey, passkeyLikely, lock])

  const clearGreeting = useCallback(() => setGreeting(null), [])

  let body: ReactNode
  if (enabled && !unlocked) {
    body = pending ? (
      <NewPasswordScreen
        onSubmit={async (password) => {
          await openApp(await vault.resetPassword(pending, password), false)
        }}
      />
    ) : (
      <LockScreen {...controls} />
    )
  } else {
    body = <FinanceProvider repository={unlocked?.repo ?? localRepo}>{children}</FinanceProvider>
  }
  return (
    <LockContext.Provider value={api}>
      {body}
      {greeting !== null && <Greeting text={greeting} onDone={clearGreeting} />}
    </LockContext.Provider>
  )
}
