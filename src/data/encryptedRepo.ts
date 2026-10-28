import type { AppData } from '../domain/types'
import type { FinanceRepository } from './repository'
import { vault as defaultVault } from './vault'
import type { Vault } from './vault'

/**
 * Repository for the unlocked app lock: holds only the in-memory data key. Never writes plaintext; an unreadable vault
 * makes `load` fail (the UI shows an error) instead of falling back to defaults, so the stored vault is never replaced.
 */
export class EncryptedRepository implements FinanceRepository {
  private dek: CryptoKey
  private vault: Vault
  /** Saves run strictly one after the other, so an older (slower) encryption can never overwrite a newer one. */
  private queue: Promise<void> = Promise.resolve()
  private closed = false

  constructor(dek: CryptoKey, vault: Vault = defaultVault) {
    this.dek = dek
    this.vault = vault
  }

  load(): Promise<AppData> {
    return this.vault.loadData(this.dek)
  }

  save(data: AppData): Promise<void> {
    const run = this.queue.then(() => (this.closed ? undefined : this.vault.saveData(this.dek, data)))
    this.queue = run.catch(() => undefined) // a failed save must not block the following ones
    return run
  }

  /** Resolves when every save requested so far is written (before locking or switching the repository). */
  flush(): Promise<void> {
    return this.queue
  }

  /** Later saves become no-ops (after locking or turning the lock off the vault is not ours to write anymore). */
  close(): void {
    this.closed = true
  }
}
