import type { AppData } from '../domain/types'

/** Async on purpose, so a database / sync backend can replace local storage later. */
export interface FinanceRepository {
  load(): Promise<AppData>
  save(data: AppData): Promise<void>
}
