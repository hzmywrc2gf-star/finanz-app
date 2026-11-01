/**
 * Monthly backup = a snapshot of the encrypted vault, wrapped in a small envelope so the importer can recognise it:
 *
 *   { "format": "finanzklar-vault-backup", "version": 1, "createdAt": "<ISO timestamp>", "vault": { …vault exactly as stored… } }
 *
 * The vault inside is the one from `finanz-app:vault`: the data is AES-GCM encrypted with the data key, the data key is
 * wrapped by the app password, the recovery key and (if set up) the passkey. So the file needs NO extra password: it
 * opens with the app password or the recovery key. It never contains plaintext. The envelope itself is not
 * authenticated (it only carries a label and the date); everything that matters is protected by the vault's own AES-GCM.
 *
 * Restoring never touches the device's own vault: the file is opened through a throw-away in-memory store.
 */
import type { AppData } from '../domain/types'
import { PBKDF2_ITERATIONS, normalizeRecoveryKey } from '../lib/crypto'
import { VAULT_KEY, VaultError, createVault } from './vault'

export const VAULT_BACKUP_FORMAT = 'finanzklar-vault-backup'
export const VAULT_BACKUP_VERSION = 1

export const ERR_BACKUP_UNKNOWN = 'Unbekanntes Dateiformat.'
export const ERR_BACKUP_BROKEN = 'Die Datei ist beschädigt.'
export const ERR_BACKUP_SECRET = 'Passwort oder Schlüssel falsch.'
/** Length of a normalized recovery key (128 bit as Crockford base32). */
const RECOVERY_KEY_CHARS = 26

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export function vaultBackupFileName(today: string): string {
  return `finanzklar-sicherung-${today}.json`
}

/** `vaultText` = `vault.snapshot()`; throws if it is not a vault. */
export function buildVaultBackup(vaultText: string, now: Date = new Date()): string {
  const inner: unknown = JSON.parse(vaultText)
  if (!isObj(inner)) throw new Error(ERR_BACKUP_BROKEN)
  return JSON.stringify({ format: VAULT_BACKUP_FORMAT, version: VAULT_BACKUP_VERSION, createdAt: now.toISOString(), vault: inner })
}

function parseEnvelope(text: string): Record<string, unknown> {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error(ERR_BACKUP_UNKNOWN)
  }
  if (!isObj(raw) || raw.format !== VAULT_BACKUP_FORMAT || raw.version !== VAULT_BACKUP_VERSION) throw new Error(ERR_BACKUP_UNKNOWN)
  const keys = Object.keys(raw).sort().join(',')
  if (keys !== 'createdAt,format,vault,version') throw new Error(ERR_BACKUP_BROKEN)
  if (typeof raw.createdAt !== 'string' || Number.isNaN(Date.parse(raw.createdAt)) || !isObj(raw.vault)) throw new Error(ERR_BACKUP_BROKEN)
  return raw.vault
}

/** Cheap check on the file text (which sheet to open); the real validation happens in `restoreVaultBackup`. */
export function isVaultBackup(text: string): boolean {
  try {
    const raw: unknown = JSON.parse(text)
    return isObj(raw) && raw.format === VAULT_BACKUP_FORMAT
  } catch {
    return false
  }
}

/**
 * Opens a backup file with the app password or, failing that, the recovery key, and returns the data (migrated and
 * strictly validated). `iterations` is the minimum PBKDF2 cost accepted from the file (production: always the default).
 */
export async function restoreVaultBackup(text: string, secret: string, iterations: number = PBKDF2_ITERATIONS): Promise<AppData> {
  const inner = parseEnvelope(text)
  const memory = new Map<string, string>([[VAULT_KEY, JSON.stringify(inner)]])
  const tmp = createVault({
    store: () => ({
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    }),
    iterations,
  })
  try {
    if (tmp.info() === null) throw new Error(ERR_BACKUP_BROKEN)
    let session
    try {
      session = await tmp.unlockWithPassword(secret)
    } catch (e) {
      if (!(e instanceof VaultError) || e.code !== 'secret') throw e
      // a recovery key is 26 characters; anything else cannot match, so skip the second (slow) derivation
      if (normalizeRecoveryKey(secret).length !== RECOVERY_KEY_CHARS) throw e
      session = await tmp.unlockWithRecoveryKey(secret)
    }
    return await tmp.loadData(session.dek)
  } catch (e) {
    if (e instanceof VaultError && e.code === 'secret') throw new Error(ERR_BACKUP_SECRET)
    if (e instanceof Error && [ERR_BACKUP_BROKEN, ERR_BACKUP_UNKNOWN].includes(e.message)) throw e
    throw new Error(ERR_BACKUP_BROKEN)
  }
}
