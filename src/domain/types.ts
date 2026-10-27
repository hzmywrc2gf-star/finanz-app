export type Kind = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  kind: Kind
  builtIn: boolean
}

export interface Transaction {
  id: string
  kind: Kind
  /** Positive integer amount in cents. */
  amountCents: number
  /** Local calendar date, 'YYYY-MM-DD'. */
  date: string
  categoryId: string
  note?: string
  createdAt: number
}

export interface Settings {
  startBalanceCents: number
}

export interface AppData {
  version: 1
  settings: Settings
  categories: Category[]
  transactions: Transaction[]
}
