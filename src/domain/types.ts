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

export type EventFreq = 'daily' | 'weekly' | 'monthly' | 'yearly'

/** Repeat rule of a calendar event (a subset of iCalendar RRULE). */
export interface EventRecurrence {
  freq: EventFreq
  /** Every n-th day/week/month/year, 1–99. */
  interval: number
  /** Last day on which an occurrence may start (inclusive), 'YYYY-MM-DD'. */
  until?: string
  /** Total number of occurrences (1–1000); `until` and `count` can both be set, the earlier end wins. */
  count?: number
  /** Weekly only: weekdays with Monday = 0 … Sunday = 6; absent = the weekday of the start. */
  byWeekday?: number[]
}

/**
 * A calendar entry (Termin). Times are local wall-clock strings without a time zone, so an event stays at
 * "09:00" when the device changes its zone: all-day events use 'YYYY-MM-DD' (`end` inclusive), timed events
 * 'YYYY-MM-DDTHH:mm' (`end` after `start`). Never derived with `toISOString()`.
 */
export interface CalendarEvent {
  id: string
  createdAt: number
  /** Trimmed, 1–200 characters. */
  title: string
  allDay: boolean
  start: string
  end: string
  /** At most 200 characters; absent = none. */
  location?: string
  /** At most 2000 characters; absent = none. */
  notes?: string
  recurrence?: EventRecurrence
  /** Start dates ('YYYY-MM-DD') of single occurrences of a repeating event that were deleted. */
  exdates?: string[]
  /** UID of an imported .ics event (at most 300 characters); used to skip it on a second import. */
  importUid?: string
}

export interface AppData {
  version: 8
  settings: Settings
  categories: Category[]
  transactions: Transaction[]
  recurring: RecurringRule[]
  transfers: Transfer[]
  invoices: Invoice[]
  events: CalendarEvent[]
}
