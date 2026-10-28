import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { PasswordFields } from './PasswordFields'
import { validateNewPassword } from '../lib/password'

export interface LockControls {
  hasPasskey: boolean
  /** The stored vault could not be read at all: nothing is changed, only the recovery key can still help (if at all). */
  unreadable: boolean
  /** Try Face ID by itself once the screen is shown (not right after the user locked manually). */
  autoPasskey: boolean
  onPassword(password: string): Promise<void>
  onRecovery(key: string): Promise<void>
  onPasskey(): Promise<void>
  /** Milliseconds until the next password attempt is allowed. */
  waitMs(): number
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Entsperren fehlgeschlagen.')

function AppHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="lock-head">
      <img className="lock-icon" src="./icon-192.png" alt="" width={88} height={88} />
      <h1>Finanzklar</h1>
      <p className="muted">{subtitle}</p>
    </div>
  )
}

const FaceIdGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M9 9.5v1.5M15 9.5v1.5M12 9.5v3.5h-1M9 16c1.7 1.3 4.3 1.3 6 0" />
  </svg>
)

/** Shown instead of the app while the vault is locked: no finance data exists in memory or DOM at this point. */
export function LockScreen({ hasPasskey, unreadable, autoPasskey, onPassword, onRecovery, onPasskey, waitMs }: LockControls) {
  const [mode, setMode] = useState<'password' | 'recovery'>('password')
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState<'secret' | 'face' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [wait, setWait] = useState(() => waitMs())
  const triedAuto = useRef(false)

  // countdown of the rate limit
  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setInterval(() => setWait(waitMs()), 1000)
    return () => window.clearInterval(timer)
  }, [wait, waitMs])

  const faceId = useCallback(
    async (auto: boolean) => {
      setBusy('face')
      setError(null)
      setHint(null)
      try {
        await onPasskey()
      } catch (e) {
        // an automatic attempt that fails stays calm: just a hint, the buttons below still work
        if (auto) setHint('Face ID hat nicht geklappt. Tippe auf „Mit Face ID entsperren“ oder nutze dein Passwort.')
        else setError(errMsg(e))
        setBusy(null)
      }
    },
    [onPasskey],
  )

  // once per screen, as soon as the page is visible (a lock that happened in the background waits for the return)
  useEffect(() => {
    if (!hasPasskey || !autoPasskey || unreadable) return
    const run = () => {
      if (triedAuto.current || document.visibilityState !== 'visible') return
      triedAuto.current = true
      void faceId(true)
    }
    run()
    document.addEventListener('visibilitychange', run)
    return () => document.removeEventListener('visibilitychange', run)
  }, [hasPasskey, autoPasskey, unreadable, faceId])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy || wait > 0) return
    if (!secret.trim()) {
      setError(mode === 'password' ? 'Bitte das Passwort eingeben.' : 'Bitte den Wiederherstellungsschlüssel eingeben.')
      return
    }
    setBusy('secret')
    setError(null)
    setHint(null)
    try {
      await (mode === 'password' ? onPassword(secret) : onRecovery(secret))
    } catch (err) {
      setError(errMsg(err))
      setBusy(null)
      setWait(waitMs())
    }
  }

  const locked = wait > 0
  const recovery = mode === 'recovery'
  return (
    <main className="lock-screen">
      <AppHeader subtitle={recovery ? 'Mit Wiederherstellungsschlüssel entsperren' : 'Gesperrt'} />
      {unreadable && (
        <div className="error" role="alert">
          Der Tresor konnte nicht gelesen werden. Deine Daten wurden nicht verändert. Versuche es mit dem Wiederherstellungsschlüssel
          oder spiele ein Backup ein.
        </div>
      )}
      {hasPasskey && !recovery && (
        <button className="btn lock-face" type="button" disabled={busy !== null} aria-busy={busy === 'face'} onClick={() => faceId(false)}>
          <FaceIdGlyph /> {busy === 'face' ? 'Face ID …' : 'Mit Face ID entsperren'}
        </button>
      )}
      <form onSubmit={submit} noValidate>
        <div className="card wide-labels">
          <div className="field">
            <label htmlFor="lock-secret">{recovery ? 'Schlüssel' : 'Passwort'}</label>
            <input
              id="lock-secret"
              className={recovery ? 'mono' : undefined}
              type={recovery ? 'text' : 'password'}
              autoComplete={recovery ? 'off' : 'current-password'}
              autoCapitalize={recovery ? 'characters' : 'off'}
              autoCorrect="off"
              spellCheck={false}
              placeholder={recovery ? 'XXXX-XXXX-XXXX-…' : undefined}
              value={secret}
              disabled={busy !== null || locked}
              onChange={(e) => {
                setSecret(e.target.value)
                setError(null)
              }}
              autoFocus={!hasPasskey || recovery}
            />
          </div>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {locked && (
          <div className="error" aria-live="off">
            Zu viele Fehlversuche. Bitte warte noch {Math.ceil(wait / 1000)} Sekunden.
          </div>
        )}
        {hint && <div className="footnote lock-hint">{hint}</div>}
        <button className={hasPasskey && !recovery ? 'btn secondary lock-alt' : 'btn'} type="submit" disabled={busy !== null || locked} aria-busy={busy === 'secret'}>
          {busy === 'secret' ? 'Wird entsperrt …' : recovery ? 'Mit Schlüssel entsperren' : 'Mit Passwort entsperren'}
        </button>
      </form>
      <button
        type="button"
        className="link-btn lock-link"
        disabled={busy !== null}
        onClick={() => {
          setMode(recovery ? 'password' : 'recovery')
          setSecret('')
          setError(null)
          setHint(null)
        }}
      >
        {recovery ? 'Zurück zum Passwort' : 'Wiederherstellungsschlüssel verwenden'}
      </button>
    </main>
  )
}

/** After unlocking with the recovery key a new password is mandatory (the old one is lost or unknown). */
export function NewPasswordScreen({ onSubmit }: { onSubmit: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const problem = validateNewPassword(password, repeat)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit(password)
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  return (
    <main className="lock-screen">
      <AppHeader subtitle="Neues Passwort festlegen" />
      <form onSubmit={submit} noValidate>
        <PasswordFields
          idPrefix="reset"
          password={password}
          repeat={repeat}
          onPassword={(v) => {
            setPassword(v)
            setError(null)
          }}
          onRepeat={(v) => {
            setRepeat(v)
            setError(null)
          }}
          disabled={busy}
          autoFocus
        />
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="footnote">
          Du hast dich mit dem Wiederherstellungsschlüssel angemeldet. Lege jetzt ein neues Passwort fest, um fortzufahren.
        </div>
        <button className="btn" type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Wird gespeichert …' : 'Passwort festlegen'}
        </button>
      </form>
    </main>
  )
}
