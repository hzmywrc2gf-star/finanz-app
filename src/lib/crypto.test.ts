import { beforeAll, describe, expect, it } from 'vitest'
import {
  IV_BYTES,
  PBKDF2_ITERATIONS,
  SALT_BYTES,
  base64ToBytes,
  bytesToBase64,
  decryptBytes,
  decryptJSON,
  deriveKeyFromPassword,
  encryptBytes,
  encryptJSON,
  generateDataKey,
  generateRecoveryKey,
  isEncryptedEnvelope,
  normalizeRecoveryKey,
  unwrapDataKey,
  wrapDataKey,
} from './crypto'

const FAST = 1000 // low-level tests only; the envelope always uses 600k
const WRONG = 'Passwort falsch oder Datei beschädigt.'
const CORRUPT = 'Die Datei ist beschädigt.'
const UNKNOWN = 'Unbekanntes Dateiformat.'
const secret = { note: 'Geheime Notiz Zahnarzt', amountCents: 12345, list: [1, 2, 3] }

describe('base64', () => {
  it('roundtrips small and 1 MB arrays', () => {
    expect(bytesToBase64(new Uint8Array([0, 1, 2, 250, 255]))).toBe('AAEC+v8=')
    expect(Array.from(base64ToBytes('AAEC+v8='))).toEqual([0, 1, 2, 250, 255])
    const big = new Uint8Array(1024 * 1024)
    for (let i = 0; i < big.length; i++) big[i] = (i * 31 + 7) & 255
    const back = base64ToBytes(bytesToBase64(big))
    expect(back.length).toBe(big.length)
    expect(back.every((v, i) => v === big[i])).toBe(true) // toEqual on 1M elements is very slow
  })
  it('rejects malformed input', () => {
    expect(() => base64ToBytes('abc')).toThrow(CORRUPT)
    expect(() => base64ToBytes('ab!d')).toThrow(CORRUPT)
  })
})

describe('low-level AES-GCM', () => {
  it('roundtrips with AAD, uses a fresh IV, fails on wrong key / AAD / tampering', async () => {
    const salt = new Uint8Array(SALT_BYTES).fill(1)
    const key = await deriveKeyFromPassword('geheim', salt, FAST)
    const other = await deriveKeyFromPassword('anders', salt, FAST)
    const data = new TextEncoder().encode('Hallo')
    const aad = new TextEncoder().encode('kopf')
    const a = await encryptBytes(key, data, aad)
    const b = await encryptBytes(key, data, aad)
    expect(a.iv).toHaveLength(IV_BYTES)
    expect(bytesToBase64(a.iv)).not.toBe(bytesToBase64(b.iv))
    expect(bytesToBase64(a.ciphertext)).not.toBe(bytesToBase64(b.ciphertext))
    expect(new TextDecoder().decode(await decryptBytes(key, a.iv, a.ciphertext, aad))).toBe('Hallo')
    await expect(decryptBytes(other, a.iv, a.ciphertext, aad)).rejects.toThrow()
    await expect(decryptBytes(key, a.iv, a.ciphertext, new TextEncoder().encode('kopf2'))).rejects.toThrow()
    await expect(decryptBytes(key, a.iv, a.ciphertext)).rejects.toThrow()
    const bad = a.ciphertext.slice()
    bad[0] ^= 1
    await expect(decryptBytes(key, a.iv, bad, aad)).rejects.toThrow()
  })
  it('derived keys are AES-GCM-256 and not extractable', async () => {
    const key = await deriveKeyFromPassword('x', new Uint8Array(SALT_BYTES), FAST)
    expect(key.extractable).toBe(false)
    expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 })
  })
  it('normalizes the password to NFC (composed and decomposed Ä are the same)', async () => {
    const salt = new Uint8Array(SALT_BYTES).fill(2)
    const k1 = await deriveKeyFromPassword('Ä', salt, FAST)
    const k2 = await deriveKeyFromPassword('Ä', salt, FAST)
    const { iv, ciphertext } = await encryptBytes(k1, new Uint8Array([1, 2, 3]))
    expect(Array.from(await decryptBytes(k2, iv, ciphertext))).toEqual([1, 2, 3])
  })
})

describe('data key wrapping', () => {
  it('roundtrips, yields a non-extractable key, and fails with the wrong KEK', async () => {
    const salt = new Uint8Array(SALT_BYTES).fill(3)
    const kek = await deriveKeyFromPassword('pw', salt, FAST, ['wrapKey', 'unwrapKey'])
    const wrongKek = await deriveKeyFromPassword('pw2', salt, FAST, ['wrapKey', 'unwrapKey'])
    const dataKey = await generateDataKey()
    expect(dataKey.extractable).toBe(true)
    const { iv, wrapped } = await wrapDataKey(dataKey, kek)
    const again = await wrapDataKey(dataKey, kek)
    expect(bytesToBase64(again.iv)).not.toBe(bytesToBase64(iv))
    const unwrapped = await unwrapDataKey(wrapped, iv, kek)
    expect(unwrapped.extractable).toBe(false)
    const enc = await encryptBytes(dataKey, new Uint8Array([9, 8, 7]))
    expect(Array.from(await decryptBytes(unwrapped, enc.iv, enc.ciphertext))).toEqual([9, 8, 7])
    await expect(unwrapDataKey(wrapped, iv, wrongKek)).rejects.toThrow()
  })
})

describe('recovery key', () => {
  it('has 26 Crockford characters in groups of four and is random', () => {
    const k = generateRecoveryKey()
    expect(k).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-){6}[0-9A-HJKMNP-TV-Z]{2}$/)
    expect(k.replace(/-/g, '')).toHaveLength(26)
    expect(generateRecoveryKey()).not.toBe(k)
    // 130 bits carry 128 bits: the last character only uses 3 bits, so it is a multiple of 4
    expect('0123456789ABCDEFGHJKMNPQRSTVWXYZ'.indexOf(k.slice(-1)) % 4).toBe(0)
  })
  it('normalizes input', () => {
    expect(normalizeRecoveryKey(' ab0o-iL1 z ')).toBe('AB0011' + '1Z')
    const k = generateRecoveryKey()
    expect(normalizeRecoveryKey(k.toLowerCase().replace(/-/g, ' '))).toBe(k.replace(/-/g, ''))
  })
})

describe('encrypted envelope (600k iterations)', () => {
  let text: string
  let env: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  beforeAll(async () => {
    text = await encryptJSON(secret, 'korrektes Passwort')
    env = JSON.parse(text)
  }, 30_000)
  const tamper = (fn: (e: Record<string, any>) => void) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const e = structuredClone(env)
    fn(e)
    return JSON.stringify(e)
  }
  const flip = (b64: string) => {
    const b = base64ToBytes(b64)
    b[0] ^= 1
    return bytesToBase64(b)
  }

  it('has the documented shape with 600000 iterations and no plaintext', () => {
    expect(PBKDF2_ITERATIONS).toBe(600_000)
    expect(Object.keys(env)).toEqual(['format', 'version', 'kdf', 'cipher', 'data'])
    expect(env.format).toBe('finanzklar-encrypted')
    expect(env.version).toBe(1)
    expect(env.kdf).toMatchObject({ name: 'PBKDF2', hash: 'SHA-256', iterations: 600000 })
    expect(base64ToBytes(env.kdf.salt)).toHaveLength(16)
    expect(env.cipher.name).toBe('AES-GCM')
    expect(base64ToBytes(env.cipher.iv)).toHaveLength(12)
    expect(text).not.toContain('Zahnarzt')
    expect(text).not.toContain('12345')
    expect(isEncryptedEnvelope(text)).toBe(true)
  })

  it('roundtrips with the right password (real 600k)', async () => {
    expect(await decryptJSON(text, 'korrektes Passwort')).toEqual(secret)
  }, 30_000)

  it('wrong password -> exact German error', async () => {
    await expect(decryptJSON(text, 'falsch')).rejects.toThrow(WRONG)
  }, 30_000)

  it('detects tampering with ciphertext, iv, salt, iterations and header fields', async () => {
    await expect(decryptJSON(tamper((e) => (e.data = flip(e.data))), 'korrektes Passwort')).rejects.toThrow(WRONG)
    await expect(decryptJSON(tamper((e) => (e.cipher.iv = flip(e.cipher.iv))), 'korrektes Passwort')).rejects.toThrow(WRONG)
    await expect(decryptJSON(tamper((e) => (e.kdf.salt = flip(e.kdf.salt))), 'korrektes Passwort')).rejects.toThrow(WRONG)
    await expect(decryptJSON(tamper((e) => (e.kdf.iterations = 600_001)), 'korrektes Passwort')).rejects.toThrow(WRONG)
  }, 60_000)

  it('two encryptions of the same data differ in salt, iv and data', async () => {
    const other = JSON.parse(await encryptJSON(secret, 'korrektes Passwort'))
    expect(other.kdf.salt).not.toBe(env.kdf.salt)
    expect(other.cipher.iv).not.toBe(env.cipher.iv)
    expect(other.data).not.toBe(env.data)
  }, 30_000)

  it('NFC: composed and decomposed passwords open the same file', async () => {
    const t = await encryptJSON(secret, 'Äbcdefghijk')
    expect(await decryptJSON(t, 'Äbcdefghijk')).toEqual(secret)
  }, 30_000)

  it('rejects invalid headers before deriving a key', async () => {
    const cases: [string, string][] = [
      ['kein JSON', UNKNOWN],
      ['[]', UNKNOWN],
      [JSON.stringify({ hello: 1 }), UNKNOWN],
      [tamper((e) => (e.format = 'anders')), UNKNOWN],
      [tamper((e) => (e.version = 2)), UNKNOWN],
      [tamper((e) => delete e.kdf), CORRUPT],
      [tamper((e) => delete e.cipher), CORRUPT],
      [tamper((e) => delete e.data), CORRUPT],
      [tamper((e) => (e.data = '')), CORRUPT],
      [tamper((e) => (e.data = 'kein base64!')), CORRUPT],
      [tamper((e) => (e.kdf.name = 'scrypt')), CORRUPT],
      [tamper((e) => (e.kdf.hash = 'SHA-1')), CORRUPT],
      [tamper((e) => (e.cipher.name = 'AES-CBC')), CORRUPT],
      [tamper((e) => (e.kdf.iterations = 599_999)), CORRUPT],
      [tamper((e) => (e.kdf.iterations = 1000)), CORRUPT],
      [tamper((e) => (e.kdf.iterations = 10_000_001)), CORRUPT],
      [tamper((e) => (e.kdf.iterations = 600_000.5)), CORRUPT],
      [tamper((e) => (e.kdf.iterations = '600000')), CORRUPT],
      [tamper((e) => (e.kdf.salt = bytesToBase64(new Uint8Array(8)))), CORRUPT],
      [tamper((e) => (e.cipher.iv = bytesToBase64(new Uint8Array(16)))), CORRUPT],
    ]
    for (const [input, message] of cases) await expect(decryptJSON(input, 'x')).rejects.toThrow(message)
  })

  it('rejects a validly encrypted file with too few iterations', async () => {
    const weak = await encryptJSON(secret, 'pw', 1000)
    expect(JSON.parse(weak).kdf.iterations).toBe(1000)
    await expect(decryptJSON(weak, 'pw')).rejects.toThrow(CORRUPT)
  })

  it('isEncryptedEnvelope tells plain backups apart', () => {
    expect(isEncryptedEnvelope(JSON.stringify({ version: 5 }))).toBe(false)
    expect(isEncryptedEnvelope('kein JSON')).toBe(false)
    expect(isEncryptedEnvelope('[]')).toBe(false)
  })
})
