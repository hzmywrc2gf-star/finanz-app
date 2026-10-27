export type Kind = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  kind: Kind
  builtIn: boolean
  /** Monthly budget in positive integer cents; only on expense categories, absent = no budget. */
  monthlyBudgetCents?: number
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
  /** Set on bookings generated from a recurring rule (the rule may be deleted later). */
  recurringId?: string
}

export type Interval = 'monthly' | 'quarterly' | 'yearly'

export interface RecurringRule {
  id: string
  kind: Kind
  /** Positive integer amount in cents. */
  amountCents: number
  categoryId: string
  note?: string
  interval: Interval
  /** 1–31; in shorter months the last day of the month is used. */
  dayOfMonth: number
  /** 'YYYY-MM-DD'; its month is the anchor for quarterly/yearly rhythms. */
  startDate: string
  /** Inclusive, optional. */
  endDate?: string
  /** Occurrences on or before this date are already handled (booked or skipped). */
  bookedThrough: string
}

export interface Settings {
  startBalanceCents: number
}

export interface AppData {
  version: 3
  settings: Settings
  categories: Category[]
  transactions: Transaction[]
  recurring: RecurringRule[]
}
