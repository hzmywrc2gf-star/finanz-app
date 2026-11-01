import { createContext, useContext } from 'react'
import type { AutoLockMinutes } from '../data/vault'
import type { AppData } from '../domain/types'

/** What the setup screen and the settings need from the app lock (the lock screen has its own controls). The lock cannot be turned off. */
export interface LockApi {
  enabled: boolean
  autoLockMinutes: AutoLockMinutes
  hasPasskey: boolean
  /** Rough guess whether Face ID could work here (checked once; PRF itself is only known after registering). */
  passkeyLikely: boolean
  /** Turns the lock on with the data currently shown; `recoveryKey` was already shown to the user. */
  enable(data: AppData, password: string, recoveryKey: string): Promise<void>
  changePassword(oldPassword: string, newPassword: string): Promise<void>
  /** Returns the new key; the old one stops working. */
  regenerateRecoveryKey(): Promise<string>
  addPasskey(): Promise<void>
  removePasskey(): void
  setAutoLock(minutes: AutoLockMinutes): void
  lockNow(): void
  /**
   * The monthly backup as a file: a snapshot of the encrypted vault (see data/vaultBackup.ts), no plaintext. Waits for
   * pending saves first, so it is async: build it BEFORE the tap (see hooks/useVaultBackup.ts), then share on the tap.
   */
  createVaultBackup(): Promise<File>
}

export const LockContext = createContext<LockApi | null>(null)

export function useLock(): LockApi {
  const ctx = useContext(LockContext)
  if (!ctx) throw new Error('useLock muss innerhalb von LockProvider verwendet werden.')
  return ctx
}
