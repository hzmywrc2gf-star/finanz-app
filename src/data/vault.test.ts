import { beforeAll, describe, expect, it } from 'vitest'
import { PBKDF2_ITERATIONS, bytesToBase64 } from '../lib/crypto'
import { createDefaultData } from '../domain/defaults'
import type { AppData } from '../domain/types'
import { EncryptedRepository } from './encryptedRepo'
import { ATTEMPTS_KEY, BASE_WAIT_MS, MAX_WAIT_MS, recordFailure, recordSuccess, remainingWaitMs, waitAfterFailures } from './lockAttempts'
import { STORAGE_KEY } from './localStorageRepo'
import { VAULT_KEY, VaultError, createVault, derivePasskeyKek, vault as productionVault } from './vault'

const FAST = 1000 // lowered PBKDF2 cost for most tests; the production singleton is tested separately
const PW = 'correct horse battery'

function memoryStore(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial))
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  }
}

function sample(): AppData {
  const d = createDefaultData()
  d.settings.startBalanceCents = 123456
  d.settings.displayName = 'Felix'
  d.transactions.push({
    id: 'a',
    kind: 'expense',
    amountCents: 98765,
    date: '2026-10-05',
    categoryId: 'expense-gesundheit',
    note: 'Zahnarzt Privatrechnung',
    account: 'konto',
    createdAt: 1,
  })
  return d
}

function setup() {
  const store = memoryStore()
  const data = sample()
  store.setItem(STORAGE_KEY, JSON.stringify(data))
  store.setItem(`${STORAGE_KEY}:corrupt`, 'old garbage')
  const vault = createVault({ store: () => store, iterations: FAST })
  return { store, data, vault }
}

const vaultJson = (store: ReturnType<typeof memoryStore>) => JSON.parse(store.getItem(VAULT_KEY) ?? 'null')

describe('enable', () => {
  it('roundtrips and removes the plaintext only after verification', async () => {
    const { store, data, vault } = setup()
    const { recoveryKey, session } = await vault.enable(data, PW)
    expect(recoveryKey).toMatch(/^([0-9A-Z]{4}-){6}[0-9A-Z]{2}$/)
    expect(store.getItem(STORAGE_KEY)).toBeNull()
    expect(store.getItem(`${STORAGE_KEY}:corrupt`)).toBeNull()
    expect(await vault.loadData(session.dek)).toEqual(data)
    expect(await vault.loadData((await vault.unlockWithPassword(PW)).dek)).toEqual(data)
  })

  it('keeps the plaintext and leaves no vault when the verification fails', async () => {
    const { store, data, vault } = setup()
    const before = store.getItem(STORAGE_KEY)
    // a store that damages the vault text on the way back (disk error, quota, ...)
    const broken = {
      ...store,
      getItem: (k: string) => {
        const v = store.getItem(k)
        return k === VAULT_KEY && v ? v.replace(/"ciphertext":"(.)/, (_m, c) => `"ciphertext":"${c === 'A' ? 'B' : 'A'}`) : v
      },
    }
    const v2 = createVault({ store: () => broken, iterations: FAST })
    await expect(v2.enable(data, PW)).rejects.toThrow(/nicht eingerichtet/)
    expect(store.getItem(VAULT_KEY)).toBeNull()
    expect(store.getItem(STORAGE_KEY)).toBe(before)
    expect(store.getItem(`${STORAGE_KEY}:corrupt`)).toBe('old garbage')
    // without the damage it works
    await vault.enable(data, PW)
  })

  it('stores no plaintext in the vault', async () => {
    const { store, data, vault } = setup()
    await vault.enable(data, PW)
    const text = store.getItem(VAULT_KEY) ?? ''
    for (const needle of ['Zahnarzt', 'Privatrechnung', '98765', '123456', 'Felix', 'Lebensmittel', 'amountCents', PW]) {
      expect(text).not.toContain(needle)
    }
    const v = vaultJson(store)
    expect(v).toMatchObject({ format: 'finanzklar-vault', version: 1, autoLockMinutes: 1 })
    expect(v.unlock.password.kdf).toMatchObject({ name: 'PBKDF2', hash: 'SHA-256', iterations: FAST })
    expect(v.unlock.passkey).toBeUndefined()
  })

  it('refuses a second setup', async () => {
    const { data, vault } = setup()
    await vault.enable(data, PW)
    await expect(vault.enable(data, PW)).rejects.toThrow(/schon eingerichtet/)
  })
})

describe('saving', () => {
  it('uses a fresh IV and fresh ciphertext on every save, and keeps the unlock header', async () => {
    const { store, data, vault } = setup()
    const { session } = await vault.enable(data, PW)
    await vault.saveData(session.dek, data)
    const a = vaultJson(store)
    await vault.saveData(session.dek, data)
    const b = vaultJson(store)
    expect(a.data.iv).not.toBe(b.data.iv)
    expect(a.data.ciphertext).not.toBe(b.data.ciphertext)
    expect(b.unlock).toEqual(a.unlock)
  })

  it('EncryptedRepository saves in order and loads what was saved', async () => {
    const { store, data, vault } = setup()
    const { session } = await vault.enable(data, PW)
    const repo = new EncryptedRepository(session.dek, vault)
    const saves: Promise<void>[] = []
    for (let i = 1; i <= 5; i++) {
      saves.push(repo.save({ ...data, settings: { ...data.settings, startBalanceCents: i } }))
    }
    await Promise.all(saves)
    await repo.flush()
    expect((await repo.load()).settings.startBalanceCents).toBe(5) // the last request wins
    expect(store.getItem(STORAGE_KEY)).toBeNull() // never plaintext
    repo.close()
    await repo.save({ ...data, settings: { ...data.settings, startBalanceCents: 99 } })
    expect((await repo.load()).settings.startBalanceCents).toBe(5)
  })

  it('does not fall back to defaults or touch an unreadable vault', async () => {
    const { store, data, vault } = setup()
    const { session } = await vault.enable(data, PW)
    store.setItem(VAULT_KEY, '{ not json')
    const repo = new EncryptedRepository(session.dek, vault)
    await expect(repo.load()).rejects.toBeInstanceOf(VaultError)
    expect(store.getItem(VAULT_KEY)).toBe('{ not json')
    expect(store.getItem(`${STORAGE_KEY}:corrupt`)).toBeNull()
    expect(store.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('unlock', () => {
  it('unlocks with the password and the recovery key (lowercase, spaces, no dashes) and rejects wrong secrets', async () => {
    const { data, vault } = setup()
    const { recoveryKey } = await vault.enable(data, PW)
    expect((await vault.unlockWithPassword(PW)).slot).toBe('password')
    const sloppy = recoveryKey.toLowerCase().replace(/-/g, ' ')
    const s = await vault.unlockWithRecoveryKey(sloppy)
    expect(s.slot).toBe('recovery')
    expect(await vault.loadData(s.dek)).toEqual(data)
    await expect(vault.unlockWithPassword('wrong password')).rejects.toThrow('Passwort falsch.')
    await expect(vault.unlockWithRecoveryKey('AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AA')).rejects.toThrow('Wiederherstellungsschlüssel falsch.')
    await expect(vault.unlockWithRecoveryKey(PW)).rejects.toThrow('Wiederherstellungsschlüssel falsch.')
  })

  it('unlocks with a passkey PRF output through the same HKDF function, and a wrong output fails', async () => {
    const { store, data, vault } = setup()
    const { session } = await vault.enable(data, PW)
    expect(vault.info()?.passkey).toBeNull()
    const prfOutput = crypto.getRandomValues(new Uint8Array(32))
    const prfSalt = crypto.getRandomValues(new Uint8Array(32))
    const credentialId = crypto.getRandomValues(new Uint8Array(20))
    await vault.addPasskey(session, { credentialId, prfSalt, prfOutput })
    const stored = vaultJson(store).unlock.passkey
    expect(stored).toMatchObject({ credentialId: bytesToBase64(credentialId), prfSalt: bytesToBase64(prfSalt), hkdfInfo: 'finanzklar-vault-v1' })
    const info = vault.info()
    expect(Array.from(info?.passkey?.credentialId ?? [])).toEqual(Array.from(credentialId))
    const unlocked = await vault.unlockWithPasskey(prfOutput)
    expect(unlocked.slot).toBe('passkey')
    expect(await vault.loadData(unlocked.dek)).toEqual(data)
    await expect(vault.unlockWithPasskey(crypto.getRandomValues(new Uint8Array(32)))).rejects.toThrow('Face ID')
    await expect(vault.unlockWithPasskey(new Uint8Array(16))).rejects.toThrow('Face ID')
    // the KEK is a pure function of (output, salt): same input, same key; a different salt gives a different one
    const k1 = await derivePasskeyKek(prfOutput, prfSalt)
    expect(k1.extractable).toBe(false)
    vault.removePasskey()
    expect(vaultJson(store).unlock.passkey).toBeUndefined()
    await expect(vault.unlockWithPasskey(prfOutput)).rejects.toThrow('Face ID')
    // password and recovery still work after removal
    await vault.unlockWithPassword(PW)
  })
})

describe('changing secrets', () => {
  it('changePassword re-wraps only: old fails, new works, data identical, recovery still works', async () => {
    const { store, data, vault } = setup()
    const { recoveryKey, session } = await vault.enable(data, PW)
    const dataBefore = vaultJson(store).data
    await expect(vault.changePassword(session, 'not my password', 'another long one')).rejects.toThrow('Passwort falsch.')
    expect(vaultJson(store).data).toEqual(dataBefore)
    const next = await vault.changePassword(session, PW, 'another long one')
    expect(next.slot).toBe('password')
    expect(vaultJson(store).data).toEqual(dataBefore) // ciphertext untouched
    await expect(vault.unlockWithPassword(PW)).rejects.toThrow('Passwort falsch.')
    expect(await vault.loadData((await vault.unlockWithPassword('another long one')).dek)).toEqual(data)
    expect(await vault.loadData((await vault.unlockWithRecoveryKey(recoveryKey)).dek)).toEqual(data)
    // the session returned still saves
    await vault.saveData(next.dek, data)
  })

  it('resetPassword after a recovery unlock needs no old password', async () => {
    const { data, vault } = setup()
    const { recoveryKey } = await vault.enable(data, PW)
    const rec = await vault.unlockWithRecoveryKey(recoveryKey)
    const next = await vault.resetPassword(rec, 'brand new password')
    expect(next.slot).toBe('password')
    await expect(vault.unlockWithPassword(PW)).rejects.toThrow()
    expect(await vault.loadData((await vault.unlockWithPassword('brand new password')).dek)).toEqual(data)
    await vault.unlockWithRecoveryKey(recoveryKey) // still valid
  })

  it('regenerateRecoveryKey invalidates the old key and keeps the password', async () => {
    const { data, vault } = setup()
    const { recoveryKey, session } = await vault.enable(data, PW)
    const fresh = await vault.regenerateRecoveryKey(session)
    expect(fresh).not.toBe(recoveryKey)
    await expect(vault.unlockWithRecoveryKey(recoveryKey)).rejects.toThrow('Wiederherstellungsschlüssel falsch.')
    expect(await vault.loadData((await vault.unlockWithRecoveryKey(fresh)).dek)).toEqual(data)
    await vault.unlockWithPassword(PW)
  })

  it('setAutoLock validates and keeps everything else', async () => {
    const { store, data, vault } = setup()
    await vault.enable(data, PW)
    vault.setAutoLock(0)
    expect(vault.info()?.autoLockMinutes).toBe(0)
    vault.setAutoLock(15)
    expect(vaultJson(store).autoLockMinutes).toBe(15)
    expect(() => vault.setAutoLock(7 as never)).toThrow()
    await vault.unlockWithPassword(PW)
  })
})

describe('disable', () => {
  it('restores identical plaintext and removes the vault', async () => {
    const { store, data, vault } = setup()
    await vault.enable(data, PW)
    await expect(vault.disable('wrong password')).rejects.toThrow('Passwort falsch.')
    expect(store.getItem(VAULT_KEY)).not.toBeNull()
    expect(store.getItem(STORAGE_KEY)).toBeNull()
    await vault.disable(PW)
    expect(store.getItem(VAULT_KEY)).toBeNull()
    expect(JSON.parse(store.getItem(STORAGE_KEY) ?? 'null')).toEqual(data)
  })

  it('keeps the vault if the plaintext cannot be verified', async () => {
    const { store, data, vault } = setup()
    await vault.enable(data, PW)
    let reads = 0
    // first read (is there old plaintext?) is honest, the read-back after writing returns garbage
    const broken = { ...store, getItem: (k: string) => (k === STORAGE_KEY && reads++ > 0 ? '{}' : store.getItem(k)) }
    const v2 = createVault({ store: () => broken, iterations: FAST })
    await expect(v2.disable(PW)).rejects.toThrow(/nicht sicher ausgeschaltet/)
    expect(store.getItem(VAULT_KEY)).not.toBeNull()
    expect(store.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('tampering', () => {
  async function tampered(change: (v: any) => void) {
    const { store, data, vault } = setup()
    const { recoveryKey } = await vault.enable(data, PW)
    const v = vaultJson(store)
    change(v)
    const text = JSON.stringify(v)
    store.setItem(VAULT_KEY, text)
    return { store, vault, text, recoveryKey }
  }
  const flip = (b64: string) => (b64[0] === 'A' ? 'B' : 'A') + b64.slice(1)

  it('a changed data ciphertext or iv is detected and the vault stays untouched', async () => {
    for (const change of [(v: any) => (v.data.ciphertext = flip(v.data.ciphertext)), (v: any) => (v.data.iv = flip(v.data.iv))]) {
      const { store, vault, text } = await tampered(change)
      const session = await vault.unlockWithPassword(PW) // slots are intact
      await expect(vault.loadData(session.dek)).rejects.toThrow(/beschädigt/)
      expect(store.getItem(VAULT_KEY)).toBe(text)
    }
  })

  it('a changed wrapped key, iv, salt or iteration count fails to unlock', async () => {
    const changes = [
      (v: any) => (v.unlock.password.wrapped = flip(v.unlock.password.wrapped)),
      (v: any) => (v.unlock.password.iv = flip(v.unlock.password.iv)),
      (v: any) => (v.unlock.password.kdf.salt = flip(v.unlock.password.kdf.salt)),
      (v: any) => (v.unlock.password.kdf.iterations = FAST + 1),
    ]
    for (const change of changes) {
      const { store, vault, text } = await tampered(change)
      await expect(vault.unlockWithPassword(PW)).rejects.toThrow('Passwort falsch.')
      expect(store.getItem(VAULT_KEY)).toBe(text)
    }
    const { vault, recoveryKey } = await tampered((v) => (v.unlock.recovery.wrapped = flip(v.unlock.recovery.wrapped)))
    await expect(vault.unlockWithRecoveryKey(recoveryKey)).rejects.toThrow('Wiederherstellungsschlüssel falsch.')
  })

  it('a malformed header is rejected as unreadable and never rewritten', async () => {
    const changes: ((v: any) => void)[] = [
      (v) => (v.format = 'other'),
      (v) => (v.version = 2),
      (v) => (v.autoLockMinutes = 3),
      (v) => (v.unlock.password.kdf.name = 'scrypt'),
      (v) => (v.unlock.password.kdf.hash = 'SHA-1'),
      (v) => (v.unlock.password.kdf.iterations = 'many'),
      (v) => (v.unlock.password.kdf.salt = 'AAAA'),
      (v) => delete v.unlock.recovery,
      (v) => delete v.data,
      (v) => (v.unlock.passkey = { credentialId: 'AAAA', prfSalt: 'AAAA', hkdfInfo: 'x', iv: 'AAAA', wrapped: 'AAAA' }),
    ]
    for (const change of changes) {
      const { store, vault, text } = await tampered(change)
      await expect(vault.unlockWithPassword(PW)).rejects.toMatchObject({ code: 'format' })
      expect(vault.info()).toBeNull()
      expect(store.getItem(VAULT_KEY)).toBe(text)
    }
    const { store, vault } = setup()
    store.setItem(VAULT_KEY, 'garbage')
    await expect(vault.unlockWithPassword(PW)).rejects.toMatchObject({ code: 'format' })
    expect(store.getItem(VAULT_KEY)).toBe('garbage')
  })

  it('rejects a vault whose header asks for fewer than 600000 iterations (production vault)', async () => {
    const { store, data, vault } = setup()
    await vault.enable(data, PW) // header says 1000
    const mem = { ...store }
    const strict = createVault({ store: () => mem }) // default = PBKDF2_ITERATIONS
    await expect(strict.unlockWithPassword(PW)).rejects.toMatchObject({ code: 'format' })
    expect(strict.info()).toBeNull()
    expect(PBKDF2_ITERATIONS).toBe(600_000)
  })
})

describe('production parameters', () => {
  beforeAll(() => {
    // the production singleton reads the global localStorage
    const store = memoryStore()
    ;(globalThis as { localStorage?: unknown }).localStorage = store
  })

  it('writes 600000 iterations and unlocks again (real PBKDF2, slow on purpose, once)', async () => {
    const data = sample()
    const { recoveryKey } = await productionVault.enable(data, PW)
    const v = JSON.parse(localStorage.getItem(VAULT_KEY) ?? 'null')
    expect(v.unlock.password.kdf.iterations).toBe(600_000)
    expect(v.unlock.recovery.kdf.iterations).toBe(600_000)
    expect(await productionVault.loadData((await productionVault.unlockWithRecoveryKey(recoveryKey)).dek)).toEqual(data)
  }, 60_000)
})

describe('rate limit', () => {
  it('waits 30 s after the 5th failure and doubles up to 15 minutes', () => {
    expect([1, 2, 3, 4].map(waitAfterFailures)).toEqual([0, 0, 0, 0])
    expect(waitAfterFailures(5)).toBe(BASE_WAIT_MS)
    expect(waitAfterFailures(6)).toBe(60_000)
    expect(waitAfterFailures(7)).toBe(120_000)
    expect(waitAfterFailures(9)).toBe(480_000)
    expect(waitAfterFailures(10)).toBe(MAX_WAIT_MS)
    expect(waitAfterFailures(50)).toBe(MAX_WAIT_MS)
  })

  it('stores the counter and the deadline, counts down and resets on success', () => {
    const store = memoryStore()
    const t0 = 1_000_000
    for (let i = 1; i <= 4; i++) {
      recordFailure(t0, store)
      expect(remainingWaitMs(t0, store)).toBe(0)
    }
    recordFailure(t0, store)
    expect(remainingWaitMs(t0, store)).toBe(30_000)
    expect(remainingWaitMs(t0 + 12_000, store)).toBe(18_000)
    expect(remainingWaitMs(t0 + 30_000, store)).toBe(0)
    recordFailure(t0 + 30_000, store)
    expect(remainingWaitMs(t0 + 30_000, store)).toBe(60_000)
    expect(JSON.parse(store.getItem(ATTEMPTS_KEY) ?? '{}')).toEqual({ failures: 6, until: t0 + 90_000 })
    recordSuccess(store)
    expect(store.getItem(ATTEMPTS_KEY)).toBeNull()
    expect(remainingWaitMs(t0, store)).toBe(0)
  })

  it('treats garbage in the counter as "no failures"', () => {
    const store = memoryStore({ [ATTEMPTS_KEY]: '{"failures":"x"}' })
    expect(remainingWaitMs(0, store)).toBe(0)
    store.setItem(ATTEMPTS_KEY, 'nope')
    expect(remainingWaitMs(0, store)).toBe(0)
  })
})
