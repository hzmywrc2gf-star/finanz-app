import type { AppData } from '../domain/types'
import { createDefaultData } from '../domain/defaults'
import { validateAppData } from './backup'
import type { FinanceRepository } from './repository'

export const STORAGE_KEY = 'finanz-app:v1'

export class LocalStorageRepository implements FinanceRepository {
  async load(): Promise<AppData> {
    let text: string | null = null
    try {
      text = localStorage.getItem(STORAGE_KEY)
      if (!text) return createDefaultData()
      return validateAppData(JSON.parse(text))
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
