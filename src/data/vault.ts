/**
 * App-lock vault (part B of the encryption). While the lock is on, the finance data lives ONLY in localStorage under
 * `finanz-app:vault`, encrypted. Web Crypto only (see lib/crypto.ts), nothing home-made.
 *
 * Key hierarchy: one random data key (DEK, AES-GCM-256) encrypts the AppData JSON. The DEK itself is wrapped
 * independently by up to three key-encrypting keys (KEK):
 *   - password:  PBKDF2-SHA-256 (600k, own salt) over the password,
 *   - recovery:  PBKDF2-SHA-256 (600k, own salt) over the normalized recovery key,
 *   - passkey:   HKDF-SHA-256 over the 32-byte WebAuthn PRF output (salt = prfSalt, info = HKDF_INFO).
 * Changing a password or the recovery key only re-wraps the DEK; the data is not touched. Every data save and every
 * wrap uses a fresh random IV. Unwrapped DEK/KEKs are non-extractable and live in memory only while unlocked (an
 * extractable DEK exists for the duration of one re-wrap, never longer).
 */
import type { AppData } from '../domain/types'
import {
  IV_BYTES,
  MAX_ITERATIONS,
  PBKDF2_ITERATIONS,
  SALT_BYTES,
  base64ToBytes,
  bytesToBase64,
  decryptBytes,
  deriveKeyFromPassword,
  encryptBytes,
  generateDataKey,
  generateRecoveryKey,
  normalizeRecoveryKey,
  wrapDataKey,
} from '../lib/crypto'
import { validateAppData } from './backup'
import { STORAGE_KEY as PLAIN_KEY } from './localStorageRepo'
import { migrate } from './migrate'

export const VAULT_KEY = 'finanz-app:vault'
export const VAULT_FORMAT = 'finanzklar-vault'
export const VAULT_VERSION = 1
/** Doubles as the HKDF `info` of the passkey KEK and (as UTF-8) as AAD of the data ciphertext. */
export const HKDF_INFO = 'finanzklar-vault-v1'
/** 0 = Sofort (lock as soon as the app is hidden). */
export const AUTO_LOCK_OPTIONS = [0, 1, 5, 15] as const
export type AutoLockMinutes = (typeof AUTO_LOCK_OPTIONS)[number]
export const DEFAULT_AUTO_LOCK: AutoLockMinutes = 1
/** AES-GCM-256 key (32 bytes) + 16-byte tag. */
const WRAPPED_BYTES = 48
const PRF_BYTES = 32
const KEK_USAGES: KeyUsage[] = ['wrapKey', 'unwrapKey']

type Bytes = Uint8Array<ArrayBuffer>
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type VaultErrorCode = 'format' | 'secret' | 'corrupt' | 'setup' | 'state'

/** German message for the user; `code` tells the UI what kind of problem it is. */
export class VaultError extends Error {
  code: VaultErrorCode
  constructor(code: VaultErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

const ERR_FORMAT = 'Der Tresor ist beschädigt oder stammt von einer neueren Version. Deine Daten wurden nicht verändert.'
const ERR_CORRUPT = 'Die gespeicherten Daten sind beschädigt. Sie wurden nicht verändert; spiele am besten ein Backup ein.'
export const ERR_PASSWORD = 'Passwort falsch.'
export const ERR_RECOVERY = 'Wiederherstellungsschlüssel falsch.'
export const ERR_PASSKEY = 'Face ID konnte den Tresor nicht öffnen.'
const ERR_SETUP = 'Die App-Sperre konnte nicht eingerichtet werden. Deine Daten sind unverändert.'
const ERR_DISABLE = 'Die App-Sperre konnte nicht sicher ausgeschaltet werden. Deine Daten sind weiterhin verschlüsselt.'

// ---------- File format ----------

interface KdfParams {
  name: 'PBKDF2'
  hash: 'SHA-256'
  iterations: number
  salt: string
}
interface KdfSlot {
  kdf: KdfParams
  iv: string
  wrapped: string
}
interface PasskeySlot {
  credentialId: string
  prfSalt: string
  hkdfInfo: string
  iv: string
  wrapped: string
}
interface VaultFile {
  format: typeof VAULT_FORMAT
  version: typeof VAULT_VERSION
  autoLockMinutes: AutoLockMinutes
  unlock: { password: KdfSlot; recovery: KdfSlot; passkey?: PasskeySlot }
  data: { iv: string; ciphertext: string }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Fixed key order, so the stored text is deterministic. */
function serialize(f: VaultFile): string {
  const kdfSlot = (s: KdfSlot) => ({
    kdf: { name: s.kdf.name, hash: s.kdf.hash, iterations: s.kdf.iterations, salt: s.kdf.salt },
    iv: s.iv,
    wrapped: s.wrapped,
  })
  const unlock: Record<string, unknown> = { password: kdfSlot(f.unlock.password), recovery: kdfSlot(f.unlock.recovery) }
  if (f.unlock.passkey) {
    const p = f.unlock.passkey
    unlock.passkey = { credentialId: p.credentialId, prfSalt: p.prfSalt, hkdfInfo: p.hkdfInfo, iv: p.iv, wrapped: p.wrapped }
  }
  return JSON.stringify({
    format: f.format,
    version: f.version,
    autoLockMinutes: f.autoLockMinutes,
    unlock,
    data: { iv: f.data.iv, ciphertext: f.data.ciphertext },
  })
}

function b64(value: unknown, length?: number): string {
  if (typeof value !== 'string') throw new VaultError('format', ERR_FORMAT)
  try {
    const bytes = base64ToBytes(value)
    if (length !== undefined && bytes.length !== length) throw new Error()
  } catch {
    throw new VaultError('format', ERR_FORMAT)
  }
  return value
}

function parseKdfSlot(v: unknown, minIterations: number): KdfSlot {
  if (!isObj(v) || !isObj(v.kdf)) throw new VaultError('format', ERR_FORMAT)
  const k = v.kdf
  const it = k.iterations
  // a header that asks for fewer iterations than we would use ourselves is a downgrade attempt: reject
  if (k.name !== 'PBKDF2' || k.hash !== 'SHA-256') throw new VaultError('format', ERR_FORMAT)
  if (typeof it !== 'number' || !Number.isInteger(it) || it < minIterations || it > MAX_ITERATIONS) {
    throw new VaultError('format', ERR_FORMAT)
  }
  return {
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: it, salt: b64(k.salt, SALT_BYTES) },
    iv: b64(v.iv, IV_BYTES),
    wrapped: b64(v.wrapped, WRAPPED_BYTES),
  }
}

function parseVault(text: string | null, minIterations: number): VaultFile {
  let raw: unknown
  try {
    raw = text === null ? undefined : JSON.parse(text)
  } catch {
    throw new VaultError('format', ERR_FORMAT)
  }
  if (!isObj(raw) || raw.format !== VAULT_FORMAT || raw.version !== VAULT_VERSION) throw new VaultError('format', ERR_FORMAT)
  if (!AUTO_LOCK_OPTIONS.includes(raw.autoLockMinutes as AutoLockMinutes)) throw new VaultError('format', ERR_FORMAT)
  if (!isObj(raw.unlock) || !isObj(raw.data)) throw new VaultError('format', ERR_FORMAT)
  const file: VaultFile = {
    format: VAULT_FORMAT,
    version: VAULT_VERSION,
    autoLockMinutes: raw.autoLockMinutes as AutoLockMinutes,
    unlock: {
      password: parseKdfSlot(raw.unlock.password, minIterations),
      recovery: parseKdfSlot(raw.unlock.recovery, minIterations),
    },
    data: { iv: b64(raw.data.iv, IV_BYTES), ciphertext: b64(raw.data.ciphertext) },
  }
  if (!file.data.ciphertext) throw new VaultError('format', ERR_FORMAT)
  const p = raw.unlock.passkey
  if (p !== undefined) {
    if (!isObj(p) || p.hkdfInfo !== HKDF_INFO) throw new VaultError('format', ERR_FORMAT)
    file.unlock.passkey = {
      credentialId: b64(p.credentialId),
      prfSalt: b64(p.prfSalt, 32),
      hkdfInfo: HKDF_INFO,
      iv: b64(p.iv, IV_BYTES),
      wrapped: b64(p.wrapped, WRAPPED_BYTES),
    }
    if (!file.unlock.passkey.credentialId) throw new VaultError('format', ERR_FORMAT)
  }
  return file
}

// ---------- Helpers ----------

const randomBytes = (n: number): Bytes => crypto.getRandomValues(new Uint8Array(n))
const utf8 = (s: string): Bytes => new TextEncoder().encode(s)
const DATA_AAD = utf8(HKDF_INFO)

/** Key order and `undefined` do not matter: used to compare data before and after an encrypt/decrypt roundtrip. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (isObj(value)) {
    return `{${Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

/**
 * Passkey KEK: HKDF-SHA-256 over the 32-byte PRF output. The PRF output is a secret the authenticator only releases
 * after user verification (Face ID); the app stores nothing from which it could be recomputed.
 */
export async function derivePasskeyKek(prfOutput: Uint8Array, prfSalt: Uint8Array): Promise<CryptoKey> {
  if (prfOutput.length !== PRF_BYTES) throw new VaultError('state', ERR_PASSKEY)
  const material = await crypto.subtle.importKey('raw', prfOutput as Bytes, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: prfSalt as Bytes, info: utf8(HKDF_INFO) },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    KEK_USAGES,
  )
}

async function wrapSlot(dek: CryptoKey, kek: CryptoKey): Promise<{ iv: string; wrapped: string }> {
  const { iv, wrapped } = await wrapDataKey(dek, kek)
  return { iv: bytesToBase64(iv), wrapped: bytesToBase64(wrapped) }
}

/** Authentication failure of the wrapped key = wrong secret. `extractable` only for a re-wrap, then dropped again. */
async function unwrapDek(slot: { iv: string; wrapped: string }, kek: CryptoKey, extractable: boolean, error: string): Promise<CryptoKey> {
  try {
    return await crypto.subtle.unwrapKey(
      'raw',
      base64ToBytes(slot.wrapped),
      kek,
      { name: 'AES-GCM', iv: base64ToBytes(slot.iv) },
      { name: 'AES-GCM', length: 256 },
      extractable,
      ['encrypt', 'decrypt'],
    )
  } catch {
    throw new VaultError('secret', error)
  }
}

async function kdfSlotFor(dek: CryptoKey, secret: string, iterations: number): Promise<{ slot: KdfSlot; kek: CryptoKey }> {
  const salt = randomBytes(SALT_BYTES)
  const kek = await deriveKeyFromPassword(secret, salt, iterations, KEK_USAGES)
  const wrap = await wrapSlot(dek, kek)
  return { slot: { kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: bytesToBase64(salt) }, ...wrap }, kek }
}

/** What stays in memory while the app is unlocked. `kek` is the key the vault was opened with (needed for re-wraps). */
export interface VaultSession {
  dek: CryptoKey
  kek: CryptoKey
  slot: 'password' | 'recovery' | 'passkey'
}

export interface PasskeyInfo {
  credentialId: Bytes
  prfSalt: Bytes
}

export interface VaultInfo {
  autoLockMinutes: AutoLockMinutes
  passkey: PasskeyInfo | null
}

export interface NewPasskey {
  credentialId: Uint8Array
  prfSalt: Uint8Array
  prfOutput: Uint8Array
}

/**
 * `iterations` is the PBKDF2 cost for new slots AND the minimum accepted from a stored header. Production always
 * uses PBKDF2_ITERATIONS (`vault` below); only tests pass a lower number to stay fast.
 */
export function createVault({ store, iterations = PBKDF2_ITERATIONS }: { store: () => Store; iterations?: number }) {
  const read = (): VaultFile => parseVault(store().getItem(VAULT_KEY), iterations)
  const write = (f: VaultFile) => store().setItem(VAULT_KEY, serialize(f))

  const exists = () => {
    try {
      return store().getItem(VAULT_KEY) !== null
    } catch {
      return false
    }
  }

  /** Header facts the lock screen needs before anything is unlocked. Null if the vault is unreadable. */
  function info(): VaultInfo | null {
    try {
      const f = read()
      const p = f.unlock.passkey
      return {
        autoLockMinutes: f.autoLockMinutes,
        passkey: p ? { credentialId: base64ToBytes(p.credentialId), prfSalt: base64ToBytes(p.prfSalt) } : null,
      }
    } catch {
      return null
    }
  }

  async function encryptData(dek: CryptoKey, data: AppData): Promise<{ iv: string; ciphertext: string }> {
    const { iv, ciphertext } = await encryptBytes(dek, utf8(JSON.stringify(data)), DATA_AAD)
    return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(ciphertext) }
  }

  async function loadRaw(dek: CryptoKey): Promise<unknown> {
    const f = read()
    try {
      const plain = await decryptBytes(dek, base64ToBytes(f.data.iv), base64ToBytes(f.data.ciphertext), DATA_AAD)
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plain))
    } catch {
      throw new VaultError('corrupt', ERR_CORRUPT)
    }
  }

  async function loadData(dek: CryptoKey): Promise<AppData> {
    const raw = await loadRaw(dek)
    try {
      return validateAppData(migrate(raw))
    } catch {
      throw new VaultError('corrupt', ERR_CORRUPT)
    }
  }

  /** Encrypts with a fresh IV and replaces the data in ONE setItem; the unlock header is read right before writing. */
  async function saveData(dek: CryptoKey, data: AppData): Promise<void> {
    const enc = await encryptData(dek, data)
    const f = read()
    f.data = enc
    write(f)
  }

  async function unlockWithPassword(password: string): Promise<VaultSession> {
    const f = read()
    const kek = await deriveKeyFromPassword(password, base64ToBytes(f.unlock.password.kdf.salt), f.unlock.password.kdf.iterations, KEK_USAGES)
    return { dek: await unwrapDek(f.unlock.password, kek, false, ERR_PASSWORD), kek, slot: 'password' }
  }

  async function unlockWithRecoveryKey(recoveryKey: string): Promise<VaultSession> {
    const f = read()
    const s = f.unlock.recovery
    const kek = await deriveKeyFromPassword(normalizeRecoveryKey(recoveryKey), base64ToBytes(s.kdf.salt), s.kdf.iterations, KEK_USAGES)
    return { dek: await unwrapDek(s, kek, false, ERR_RECOVERY), kek, slot: 'recovery' }
  }

  /** `prfOutput` comes from lib/passkey.ts (the WebAuthn part); everything cryptographic happens here. */
  async function unlockWithPasskey(prfOutput: Uint8Array): Promise<VaultSession> {
    const p = read().unlock.passkey
    if (!p) throw new VaultError('state', ERR_PASSKEY)
    const kek = await derivePasskeyKek(prfOutput, base64ToBytes(p.prfSalt))
    return { dek: await unwrapDek(p, kek, false, ERR_PASSKEY), kek, slot: 'passkey' }
  }

  /** A DEK that may be wrapped again; opened with the key the session was unlocked with. */
  async function extractableDek(session: VaultSession): Promise<CryptoKey> {
    const f = read()
    const slot = f.unlock[session.slot]
    if (!slot) throw new VaultError('state', ERR_FORMAT)
    return unwrapDek(slot, session.kek, true, ERR_FORMAT)
  }

  /** Writes a changed slot into the CURRENT vault text and proves the new slot opens the DEK. */
  async function replaceSlot(change: (f: VaultFile) => void, check: () => Promise<unknown>): Promise<void> {
    const f = read() // fresh: a data save may have happened while we were deriving keys
    change(f)
    write(f)
    await check()
  }

  async function setPasswordWith(dek: CryptoKey, newPassword: string): Promise<CryptoKey> {
    const { slot, kek } = await kdfSlotFor(dek, newPassword, iterations)
    await replaceSlot(
      (f) => (f.unlock.password = slot),
      () => unwrapDek(read().unlock.password, kek, false, ERR_FORMAT),
    )
    return kek
  }

  function afterPasswordChange(session: VaultSession, kek: CryptoKey): VaultSession {
    return session.slot === 'passkey' ? session : { dek: session.dek, kek, slot: 'password' }
  }

  return {
    exists,
    info,
    loadData,
    saveData,
    unlockWithPassword,
    unlockWithRecoveryKey,
    unlockWithPasskey,

    /**
     * Turns the lock on. Order matters: write the vault, read it back, decrypt it through the password AND the recovery
     * path and compare with the original; only then delete the plaintext. On any failure the half-written vault is
     * removed and the plaintext stays. `recoveryKey` may be passed in so the UI can show it before anything is stored.
     */
    async enable(data: AppData, password: string, recoveryKey: string = generateRecoveryKey()) {
      if (exists()) throw new VaultError('setup', 'Die App-Sperre ist schon eingerichtet.')
      let session: VaultSession
      try {
        const dek = await generateDataKey()
        const pw = await kdfSlotFor(dek, password, iterations)
        const rc = await kdfSlotFor(dek, normalizeRecoveryKey(recoveryKey), iterations)
        write({
          format: VAULT_FORMAT,
          version: VAULT_VERSION,
          autoLockMinutes: DEFAULT_AUTO_LOCK,
          unlock: { password: pw.slot, recovery: rc.slot },
          data: await encryptData(dek, data),
        })
        const expected = canonical(JSON.parse(JSON.stringify(data)))
        session = await unlockWithPassword(password)
        if (canonical(await loadRaw(session.dek)) !== expected) throw new Error('mismatch')
        await loadData(session.dek) // must also pass the normal load path
        const viaRecovery = await unlockWithRecoveryKey(recoveryKey)
        if (canonical(await loadRaw(viaRecovery.dek)) !== expected) throw new Error('mismatch')
      } catch {
        try {
          store().removeItem(VAULT_KEY)
        } catch {
          /* nothing more to do */
        }
        throw new VaultError('setup', ERR_SETUP)
      }
      // verified: now the plaintext may go (also the copy kept after an unreadable load)
      store().removeItem(PLAIN_KEY)
      store().removeItem(`${PLAIN_KEY}:corrupt`)
      return { recoveryKey, session }
    },

    /** Re-wraps the DEK under a new password after checking the old one. Data stays untouched. */
    async changePassword(session: VaultSession, oldPassword: string, newPassword: string): Promise<VaultSession> {
      const f = read()
      const oldKek = await deriveKeyFromPassword(oldPassword, base64ToBytes(f.unlock.password.kdf.salt), f.unlock.password.kdf.iterations, KEK_USAGES)
      const dek = await unwrapDek(f.unlock.password, oldKek, true, ERR_PASSWORD)
      return afterPasswordChange(session, await setPasswordWith(dek, newPassword))
    },

    /** After unlocking with the recovery key: the old password is gone or forgotten, so no old password is asked. */
    async resetPassword(session: VaultSession, newPassword: string): Promise<VaultSession> {
      return afterPasswordChange(session, await setPasswordWith(await extractableDek(session), newPassword))
    },

    /** New recovery key; the old one stops working. Returns the key to show once. */
    async regenerateRecoveryKey(session: VaultSession): Promise<string> {
      const dek = await extractableDek(session)
      const key = generateRecoveryKey()
      const { slot, kek } = await kdfSlotFor(dek, normalizeRecoveryKey(key), iterations)
      await replaceSlot(
        (f) => (f.unlock.recovery = slot),
        () => unwrapDek(read().unlock.recovery, kek, false, ERR_FORMAT),
      )
      return key
    },

    async addPasskey(session: VaultSession, passkey: NewPasskey): Promise<void> {
      const dek = await extractableDek(session)
      const kek = await derivePasskeyKek(passkey.prfOutput, passkey.prfSalt)
      const wrap = await wrapSlot(dek, kek)
      const slot: PasskeySlot = {
        credentialId: bytesToBase64(passkey.credentialId),
        prfSalt: bytesToBase64(passkey.prfSalt),
        hkdfInfo: HKDF_INFO,
        ...wrap,
      }
      await replaceSlot(
        (f) => (f.unlock.passkey = slot),
        () => unwrapDek(slot, kek, false, ERR_FORMAT),
      )
    },

    /** The credential itself stays in the device's passkey list (a page cannot delete it); it just opens nothing anymore. */
    removePasskey(): void {
      const f = read()
      delete f.unlock.passkey
      write(f)
    },

    setAutoLock(minutes: AutoLockMinutes): void {
      if (!AUTO_LOCK_OPTIONS.includes(minutes)) throw new VaultError('state', 'Ungültige Auswahl.')
      const f = read()
      f.autoLockMinutes = minutes
      write(f)
    },

    /** Turns the lock off (password required). Plaintext is written and verified BEFORE the vault is removed. */
    async disable(password: string): Promise<void> {
      const session = await unlockWithPassword(password)
      const data = await loadData(session.dek)
      let had: string | null = null
      try {
        had = store().getItem(PLAIN_KEY)
        store().setItem(PLAIN_KEY, JSON.stringify(data))
        const back = validateAppData(migrate(JSON.parse(store().getItem(PLAIN_KEY) ?? 'null')))
        if (canonical(back) !== canonical(data)) throw new Error('mismatch')
      } catch {
        try {
          if (had === null) store().removeItem(PLAIN_KEY)
          else store().setItem(PLAIN_KEY, had)
        } catch {
          /* nothing more to do */
        }
        throw new VaultError('setup', ERR_DISABLE)
      }
      store().removeItem(VAULT_KEY)
    },
  }
}

export type Vault = ReturnType<typeof createVault>

/** The app's vault: real localStorage, full PBKDF2 cost. */
export const vault: Vault = createVault({ store: () => localStorage })
