export type Kind = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  kind: Kind
  builtIn: boolean
  /** Monthly budget in positive integer cents; only on expense categories, absent = no budget. */
  monthlyBudgetCents?: number
}

/** Where the money lives: bank account or cash. */
export type Account = 'konto' | 'bargeld'

export interface Transaction {
  id: string
  kind: Kind
  /** Positive integer amount in cents. */
  amountCents: number
  /** Local calendar date, 'YYYY-MM-DD'. */
  date: string
  categoryId: string
  note?: string
  /** Account the booking belongs to (recurring bookings always use 'konto'). */
  account: Account
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
  /** true: booked automatically when due; false: waits on the start page for a confirmation. */
  autoBook: boolean
}

/** withdrawal = Abhebung (Konto → Bargeld), deposit = Einzahlung (Bargeld → Konto). */
export type TransferDirection = 'withdrawal' | 'deposit'

/** Moves money between the accounts; neither income nor expense. */
export interface Transfer {
  id: string
  direction: TransferDirection
  /** Positive integer amount in cents. */
  amountCents: number
  /** Local calendar date, 'YYYY-MM-DD'. */
  date: string
  note?: string
  createdAt: number
}

export interface Settings {
  startBalanceCents: number
  /** Cash on hand at the start, integer cents. */
  startCashCents: number
  /**
   * Name for the greeting after unlocking, trimmed, at most 40 characters; absent = none.
   * Later (with sync) the name will come from the login instead.
   */
  displayName?: string
}

/**
 * A purchase on account (Kauf auf Rechnung): an expense from the Konto that is not paid yet.
 * Open invoices are not transactions; they only count once paid (`payInvoice`).
 */
export interface Invoice {
  id: string
  createdAt: number
  /** Merchant (Händler), trimmed, at most 200 characters; absent = none. */
  note?: string
  /** Expense category. */
  categoryId: string
  /** Positive integer amount in cents. */
  amountCents: number
  /** Local calendar date of the purchase, 'YYYY-MM-DD'. */
  purchaseDate: string
  /** Pay-by date, not before the purchase date. */
  dueDate: string
  /** "Später": the reminder stays hidden until this date (inclusive end of the snooze). */
  snoozedUntil?: string
}

export interface AppData {
  version: 7
  settings: Settings
  categories: Category[]
  transactions: Transaction[]
  recurring: RecurringRule[]
  transfers: Transfer[]
  invoices: Invoice[]
}
