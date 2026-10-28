/**
 * Crypto core. Web Crypto API only (`crypto.subtle`): no libraries, nothing home-made.
 * Password -> PBKDF2-SHA-256 (600k iterations, random 16-byte salt) -> AES-GCM-256 key. Every encryption uses a fresh
 * random 12-byte IV. Passwords and plaintext are never stored in module state and never logged.
 */

export const PBKDF2_ITERATIONS = 600_000
/** Upper bound accepted from a file header (a hostile file must not be able to freeze the browser for minutes). */
export const MAX_ITERATIONS = 10_000_000
export const SALT_BYTES = 16
export const IV_BYTES = 12

export const ENVELOPE_FORMAT = 'finanzklar-encrypted'
export const ENVELOPE_VERSION = 1

const ERR_FORMAT = 'Unbekanntes Dateiformat.'
const ERR_CORRUPT = 'Die Datei ist beschädigt.'
const ERR_PASSWORD = 'Passwort falsch oder Datei beschädigt.'

type Bytes = Uint8Array<ArrayBuffer>

// ---------- Base64 ----------

/** Chunked, so large arrays do not overflow the call stack in `String.fromCharCode(...bytes)`. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/** Strict: only canonical padded Base64, otherwise throws. */
export function base64ToBytes(text: string): Bytes {
  if (text.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw new Error(ERR_CORRUPT)
  const binary = atob(text)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

const randomBytes = (n: number): Bytes => crypto.getRandomValues(new Uint8Array(n))

// ---------- Key derivation and cipher ----------

/** Password -> AES-GCM-256 key (non-extractable). `usages` e.g. ['wrapKey', 'unwrapKey'] for a key-encrypting key. */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS,
  usages: KeyUsage[] = ['encrypt', 'decrypt'],
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password.normalize('NFC')), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as Bytes, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    usages,
  )
}

/** AES-GCM with a fresh random IV on every call (never reuse an IV under one key). */
export async function encryptBytes(
  key: CryptoKey,
  plaintext: Uint8Array,
  aad?: Uint8Array,
): Promise<{ iv: Bytes; ciphertext: Bytes }> {
  const iv = randomBytes(IV_BYTES)
  const params: AesGcmParams = { name: 'AES-GCM', iv }
  if (aad) params.additionalData = aad as Bytes
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(params, key, plaintext as Bytes))
  return { iv, ciphertext }
}

/** Throws the browser's OperationError when the key, IV, AAD or data do not match (authentication failed). */
export async function decryptBytes(key: CryptoKey, iv: Uint8Array, ciphertext: Uint8Array, aad?: Uint8Array): Promise<Bytes> {
  const params: AesGcmParams = { name: 'AES-GCM', iv: iv as Bytes }
  if (aad) params.additionalData = aad as Bytes
  return new Uint8Array(await crypto.subtle.decrypt(params, key, ciphertext as Bytes))
}

// ---------- Data key and recovery key (for the app lock, part B) ----------

/** Random AES-GCM-256 data key. Extractable only so it can be wrapped; unwrapped keys are non-extractable. */
export function generateDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

export async function wrapDataKey(dataKey: CryptoKey, kek: CryptoKey): Promise<{ iv: Bytes; wrapped: Bytes }> {
  const iv = randomBytes(IV_BYTES)
  const wrapped = new Uint8Array(await crypto.subtle.wrapKey('raw', dataKey, kek, { name: 'AES-GCM', iv }))
  return { iv, wrapped }
}

export function unwrapDataKey(wrapped: Uint8Array, iv: Uint8Array, kek: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    'raw',
    wrapped as Bytes,
    kek,
    { name: 'AES-GCM', iv: iv as Bytes },
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** Crockford Base32: no I, L, O, U, so nothing can be misread when copied by hand. */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** 128 random bits as 26 Crockford characters in groups of four, e.g. "7K3M-9XQ2-…-AB". */
export function generateRecoveryKey(): string {
  const bytes = randomBytes(16)
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
    value &= (1 << bits) - 1
  }
  if (bits > 0) out += CROCKFORD[(value << (5 - bits)) & 31] // last 3 bits, padded with zeros
  return out.replace(/(.{4})(?=.)/g, '$1-')
}

/** Uppercase, strip spaces and dashes, map the look-alikes O -> 0 and I/L -> 1. */
export function normalizeRecoveryKey(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
}

// ---------- Encrypted JSON envelope ----------

interface Header {
  format: string
  version: number
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string }
  cipher: { name: 'AES-GCM'; iv: string }
}

/** Canonical header bytes (fixed key order) bound to the ciphertext as AES-GCM additional authenticated data. */
function headerAad(h: Header): Bytes {
  const canonical = {
    format: h.format,
    version: h.version,
    kdf: { name: h.kdf.name, hash: h.kdf.hash, iterations: h.kdf.iterations, salt: h.kdf.salt },
    cipher: { name: h.cipher.name, iv: h.cipher.iv },
  }
  return new TextEncoder().encode(JSON.stringify(canonical))
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Cheap check whether a file is an encrypted Finanzklar file (does not validate it). */
export function isEncryptedEnvelope(text: string): boolean {
  const raw = tryParse(text)
  return isObj(raw) && raw.format === ENVELOPE_FORMAT
}

/** Encrypts any JSON value. `iterations` is only lowered by tests; decryptJSON rejects anything below the default. */
export async function encryptJSON(value: unknown, password: string, iterations: number = PBKDF2_ITERATIONS): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const key = await deriveKeyFromPassword(password, salt, iterations)
  // the IV is only known after encrypting, but the header is the AAD: generate it here and encrypt with exactly that IV
  const iv = randomBytes(IV_BYTES)
  const header: Header = {
    format: ENVELOPE_FORMAT,
    version: ENVELOPE_VERSION,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: bytesToBase64(salt) },
    cipher: { name: 'AES-GCM', iv: bytesToBase64(iv) },
  }
  const plaintext = new TextEncoder().encode(JSON.stringify(value))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: headerAad(header) }, key, plaintext),
  )
  return JSON.stringify({ ...header, data: bytesToBase64(ciphertext) }, null, 2)
}

/** Strict header validation; returns the parsed pieces. Throws German errors. */
function parseEnvelope(text: string): { header: Header; salt: Bytes; iv: Bytes; data: Bytes } {
  const raw = tryParse(text)
  if (!isObj(raw) || raw.format !== ENVELOPE_FORMAT || raw.version !== ENVELOPE_VERSION) throw new Error(ERR_FORMAT)
  const { kdf, cipher, data } = raw
  if (!isObj(kdf) || !isObj(cipher) || typeof data !== 'string' || !data) throw new Error(ERR_CORRUPT)
  if (kdf.name !== 'PBKDF2' || kdf.hash !== 'SHA-256' || cipher.name !== 'AES-GCM') throw new Error(ERR_CORRUPT)
  const it = kdf.iterations
  if (typeof it !== 'number' || !Number.isInteger(it) || it < PBKDF2_ITERATIONS || it > MAX_ITERATIONS) throw new Error(ERR_CORRUPT)
  if (typeof kdf.salt !== 'string' || typeof cipher.iv !== 'string') throw new Error(ERR_CORRUPT)
  const salt = base64ToBytes(kdf.salt)
  const iv = base64ToBytes(cipher.iv)
  if (salt.length !== SALT_BYTES || iv.length !== IV_BYTES) throw new Error(ERR_CORRUPT)
  const header: Header = {
    format: ENVELOPE_FORMAT,
    version: ENVELOPE_VERSION,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: it, salt: kdf.salt },
    cipher: { name: 'AES-GCM', iv: cipher.iv },
  }
  return { header, salt, iv, data: base64ToBytes(data) }
}

/** Returns the decrypted JSON value. Wrong password and tampering both surface as the same German message. */
export async function decryptJSON(text: string, password: string): Promise<unknown> {
  const { header, salt, iv, data } = parseEnvelope(text)
  const key = await deriveKeyFromPassword(password, salt, header.kdf.iterations)
  let plain: Uint8Array
  try {
    plain = await decryptBytes(key, iv, data, headerAad(header))
  } catch {
    throw new Error(ERR_PASSWORD)
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plain))
  } catch {
    throw new Error(ERR_CORRUPT)
  }
}
