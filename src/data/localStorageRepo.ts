import type { AppData } from '../domain/types'
import { createDefaultData } from '../domain/defaults'
import { validateAppData } from './backup'
import { migrate } from './migrate'
import type { FinanceRepository } from './repository'

// Key stays 'v1' although the data is version 4: renaming it would orphan existing user data.
// The data version lives inside the payload and is upgraded by `migrate`.
export const STORAGE_KEY = 'finanz-app:v1'

export class LocalStorageRepository implements FinanceRepository {
  async load(): Promise<AppData> {
    let text: string | null = null
    try {
      text = localStorage.getItem(STORAGE_KEY)
      if (!text) return createDefaultData()
      return validateAppData(migrate(JSON.parse(text)))
    } catch {
      // keep the unreadable payload around so it is not lost when defaults get saved
      try {
        if (text) localStorage.setItem(`${STORAGE_KEY}:corrupt`, text)
      } catch {
        /* ignore */
      }
      return createDefaultData()
    }
  }

  async save(data: AppData): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}
