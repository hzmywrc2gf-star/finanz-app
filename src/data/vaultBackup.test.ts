import { describe, expect, it } from 'vitest'
import { createDefaultData } from '../domain/defaults'
import type { AppData } from '../domain/types'
import { STORAGE_KEY } from './localStorageRepo'
import { VAULT_KEY, createVault } from './vault'
import { buildVaultBackup, isVaultBackup, restoreVaultBackup, vaultBackupFileName } from './vaultBackup'

const FAST = 1000
const PW = 'correct horse battery'

function memoryStore() {
  const map = new Map<string, string>()
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

async function makeBackup(data: AppData = sample()) {
  const store = memoryStore()
  const vault = createVault({ store: () => store, iterations: FAST })
  const { recoveryKey } = await vault.enable(data, PW)
  const file = buildVaultBackup(vault.snapshot(), new Date('2026-11-01T08:00:00Z'))
  return { store, vault, file, recoveryKey, data }
}

describe('vault backup file', () => {
  it('wraps the stored vault unchanged and contains no plaintext', async () => {
    const { store, file } = await makeBackup()
    const env = JSON.parse(file)
    expect(env).toMatchObject({ format: 'finanzklar-vault-backup', version: 1, createdAt: '2026-11-01T08:00:00.000Z' })
    expect(env.vault).toEqual(JSON.parse(store.getItem(VAULT_KEY) ?? ''))
    for (const needle of ['Zahnarzt', 'Privatrechnung', '98765', '123456', PW]) expect(file).not.toContain(needle)
  })

  it('names the file by date and is recognised', async () => {
    const { file } = await makeBackup()
    expect(vaultBackupFileName('2026-11-01')).toBe('finanzklar-sicherung-2026-11-01.json')
    expect(isVaultBackup(file)).toBe(true)
    expect(isVaultBackup('{"format":"finanzklar-encrypted"}')).toBe(false)
    expect(isVaultBackup('kein json')).toBe(false)
  })

  it('snapshot refuses a missing or broken vault', () => {
    const store = memoryStore()
    const vault = createVault({ store: () => store, iterations: FAST })
    expect(() => vault.snapshot()).toThrow()
    store.setItem(VAULT_KEY, '{"format":"x"}')
    expect(() => vault.snapshot()).toThrow()
  })
})

describe('restore', () => {
  it('opens with the password', async () => {
    const { file, data } = await makeBackup()
    expect(await restoreVaultBackup(file, PW, FAST)).toEqual(data)
  })

  it('opens with the recovery key (any spelling)', async () => {
    const { file, data, recoveryKey } = await makeBackup()
    expect(await restoreVaultBackup(file, recoveryKey, FAST)).toEqual(data)
    expect(await restoreVaultBackup(file, ` ${recoveryKey.toLowerCase().replace(/-/g, ' ')} `, FAST)).toEqual(data)
  })

  it('rejects a wrong secret', async () => {
    const { file } = await makeBackup()
    await expect(restoreVaultBackup(file, 'falsches passwort', FAST)).rejects.toThrow('Passwort oder Schlüssel falsch.')
    await expect(restoreVaultBackup(file, '0000-0000-0000-0000-0000-0000-00', FAST)).rejects.toThrow('Passwort oder Schlüssel falsch.')
  })

  it('does not touch the device vault or plaintext', async () => {
    const { store, file } = await makeBackup()
    const before = store.getItem(VAULT_KEY)
    await restoreVaultBackup(file, PW, FAST)
    expect(store.getItem(VAULT_KEY)).toBe(before)
    expect(store.getItem(STORAGE_KEY)).toBeNull()
  })

  it('rejects unknown, broken and tampered files', async () => {
    const { file } = await makeBackup()
    const env = JSON.parse(file)
    const run = (o: unknown) => restoreVaultBackup(JSON.stringify(o), PW, FAST)
    await expect(restoreVaultBackup('kein json', PW, FAST)).rejects.toThrow('Unbekanntes Dateiformat.')
    await expect(run({ ...env, format: 'anders' })).rejects.toThrow('Unbekanntes Dateiformat.')
    await expect(run({ ...env, version: 2 })).rejects.toThrow('Unbekanntes Dateiformat.')
    await expect(run({ ...env, extra: 1 })).rejects.toThrow('Die Datei ist beschädigt.')
    await expect(run({ ...env, createdAt: 'gestern' })).rejects.toThrow('Die Datei ist beschädigt.')
    await expect(run({ ...env, vault: 'x' })).rejects.toThrow('Die Datei ist beschädigt.')
    await expect(run({ ...env, vault: { ...env.vault, format: 'x' } })).rejects.toThrow('Die Datei ist beschädigt.')
    // flipped ciphertext: the data no longer authenticates
    const ct: string = env.vault.data.ciphertext
    const flipped = (ct[0] === 'A' ? 'B' : 'A') + ct.slice(1)
    await expect(run({ ...env, vault: { ...env.vault, data: { ...env.vault.data, ciphertext: flipped } } })).rejects.toThrow('Die Datei ist beschädigt.')
    // flipped wrapped key: looks like a wrong secret
    const w: string = env.vault.unlock.password.wrapped
    const bad = (w[0] === 'A' ? 'B' : 'A') + w.slice(1)
    await expect(run({ ...env, vault: { ...env.vault, unlock: { ...env.vault.unlock, password: { ...env.vault.unlock.password, wrapped: bad } } } })).rejects.toThrow(
      'Passwort oder Schlüssel falsch.',
    )
  })

  it('refuses a file with a cheaper key derivation than production', async () => {
    const { file } = await makeBackup()
    await expect(restoreVaultBackup(file, PW)).rejects.toThrow('Die Datei ist beschädigt.')
  })

  it('migrates data of an older version stored inside the vault', async () => {
    const store = memoryStore()
    const vault = createVault({ store: () => store, iterations: FAST })
    const { recoveryKey, session } = await vault.enable(sample(), PW)
    // v6 data: same as v7 but without invoices
    const old = JSON.parse(JSON.stringify(sample())) as Record<string, unknown>
    old.version = 6
    delete old.invoices
    await vault.saveData(session.dek, old as unknown as AppData)
    const file = buildVaultBackup(vault.snapshot())
    const restored = await restoreVaultBackup(file, recoveryKey, FAST)
    expect(restored.version).toBe(7)
    expect(restored.invoices).toEqual([])
    expect(restored.transactions).toHaveLength(1)
  })
})
