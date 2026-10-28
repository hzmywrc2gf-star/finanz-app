import type { AppData } from '../domain/types'
import { decryptJSON, encryptJSON, isEncryptedEnvelope } from '../lib/crypto'

/** Backup text encrypted with the password (see `encryptJSON` for the file format). */
export function exportEncrypted(data: AppData, password: string): Promise<string> {
  return encryptJSON(data, password)
}

export const isEncryptedBackup = isEncryptedEnvelope

/**
 * Turns the text of a backup file into the plain JSON text that `parseBackup` validates.
 * Plain files pass through unchanged; encrypted ones need the password (without it: an error).
 */
export async function decodeBackupFile(text: string, password?: string): Promise<string> {
  if (!isEncryptedEnvelope(text)) return text
  if (password === undefined) throw new Error('Für dieses Backup ist ein Passwort nötig.')
  return JSON.stringify(await decryptJSON(text, password))
}
