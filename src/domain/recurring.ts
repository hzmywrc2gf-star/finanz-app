import type { AppData, Category, Interval, RecurringRule, Transaction } from './types'
import { addDays } from './dates'

const STEP_MONTHS: Record<Interval, number> = { monthly: 1, quarterly: 3, yearly: 12 }

export const INTERVAL_LABELS: Record<Interval, string> = {
  monthly: 'Monatlich',
  quarterly: 'Vierteljährlich',
  yearly: 'Jährlich',
}

const pad = (n: number) => String(n).padStart(2, '0')

function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

/** Months since year 0 for the month of an ISO date. */
function monthIndex(iso: string): number {
  const [y, m] = iso.split('-').map(Number)
  return y * 12 + (m - 1)
}

/** The k-th scheduled date (ignoring start/end), day clamped to the month's length. */
function scheduled(rule: RecurringRule, k: number): string {
  const idx = monthIndex(rule.startDate) + k * STEP_MONTHS[rule.interval]
  const year = Math.floor(idx / 12)
  const month0 = idx % 12
  const day = Math.min(rule.dayOfMonth, daysInMonth(year, month0))
  return `${String(year).padStart(4, '0')}-${pad(month0 + 1)}-${pad(day)}`
}

/** First step that can still lie after `afterExclusive` (one step of slack, callers filter exactly). */
function firstStep(rule: RecurringRule, afterExclusive: string): number {
  const diff = monthIndex(afterExclusive) - monthIndex(rule.startDate)
  return Math.max(0, Math.floor(diff / STEP_MONTHS[rule.interval]) - 1)
}

/** Valid occurrences d with afterExclusive < d <= untilInclusive (also respecting start/end date). */
export function occurrencesBetween(
  rule: RecurringRule,
  afterExclusive: string,
  untilInclusive: string,
): string[] {
  const last = rule.endDate && rule.endDate < untilInclusive ? rule.endDate : untilInclusive
  const out: string[] = []
  for (let k = firstStep(rule, afterExclusive); ; k++) {
    const d = scheduled(rule, k)
    if (d > last) break
    if (d > afterExclusive && d >= rule.startDate) out.push(d)
  }
  return out
}

/** The first valid occurrence after the given date, or null if the rule has ended. */
export function nextOccurrence(rule: RecurringRule, afterExclusive: string): string | null {
  for (let k = firstStep(rule, afterExclusive); ; k++) {
    const d = scheduled(rule, k)
    if (rule.endDate && d > rule.endDate) return null
    if (d > afterExclusive && d >= rule.startDate) return d
  }
}

/**
 * Creates the transactions of all automatic rules' occurrences that became due and moves
 * bookedThrough forward. Rules with autoBook = false are left alone: their occurrences wait as
 * pending confirmations. Idempotent per day; returns the same object if nothing changed.
 * Deleted bookings are not recreated because bookedThrough only moves forward.
 */
export function bookDue(data: AppData, today: string, now: number = Date.now()): AppData {
  const created: Transaction[] = []
  let changed = false
  const recurring = data.recurring.map((rule) => {
    // Always advance to today (not to endDate): extending an ended rule later must not
    // book the occurrences in between retroactively. occurrencesBetween respects endDate.
    if (!rule.autoBook || today <= rule.bookedThrough) return rule
    changed = true
    for (const date of occurrencesBetween(rule, rule.bookedThrough, today)) {
      const t: Transaction = {
        id: `${rule.id}:${date}`,
        kind: rule.kind,
        amountCents: rule.amountCents,
        date,
        categoryId: rule.categoryId,
        account: 'konto',
        createdAt: now,
        recurringId: rule.id,
      }
      if (rule.note) t.note = rule.note
      created.push(t)
    }
    return { ...rule, bookedThrough: today }
  })
  if (!changed) return data
  return { ...data, recurring, transactions: [...data.transactions, ...created] }
}

export interface PendingConfirmation {
  rule: RecurringRule
  date: string
}

/** Occurrences of manual rules in (bookedThrough, today], oldest first, then by title. */
export function pendingConfirmations(data: AppData, today: string): PendingConfirmation[] {
  return data.recurring
    .filter((rule) => !rule.autoBook)
    .flatMap((rule) => occurrencesBetween(rule, rule.bookedThrough, today).map((date) => ({ rule, date })))
    .sort(
      (a, b) =>
        (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) ||
        recurringTitle(a.rule, data.categories).localeCompare(recurringTitle(b.rule, data.categories), 'de'),
    )
}

export interface UpcomingItem {
  rule: RecurringRule
  date: string
}

export interface UpcomingOptions {
  /** Rules with one of these categories are left out (the start page hides Gehalt). */
  excludeCategoryIds?: string[]
}

/** Occurrences in (today, today + days], sorted by date. */
export function upcoming(
  data: AppData,
  today: string,
  days = 7,
  { excludeCategoryIds = [] }: UpcomingOptions = {},
): UpcomingItem[] {
  const until = addDays(today, days)
  return data.recurring
    .filter((rule) => !excludeCategoryIds.includes(rule.categoryId))
    .flatMap((rule) => occurrencesBetween(rule, today, until).map((date) => ({ rule, date })))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** "monatlich am 1." · "vierteljährlich am 15." · "jährlich am 29.02." */
export function recurrenceLabel(rule: Pick<RecurringRule, 'interval' | 'dayOfMonth' | 'startDate'>): string {
  if (rule.interval === 'monthly') return `monatlich am ${rule.dayOfMonth}.`
  if (rule.interval === 'quarterly') return `vierteljährlich am ${rule.dayOfMonth}.`
  return `jährlich am ${pad(rule.dayOfMonth)}.${rule.startDate.slice(5, 7)}.`
}

/** Note, or the category name if there is no note. */
export function recurringTitle(rule: RecurringRule, categories: Category[]): string {
  return rule.note || categories.find((c) => c.id === rule.categoryId)?.name || 'Unbekannt'
}

/** Day of month of an ISO date (default for the rule's day). */
export const dayOfMonthOf = (iso: string) => Number(iso.slice(8, 10))

export interface ContractsSummary {
  /** Rules without end date or ending today or later (income rules included). */
  activeCount: number
  /** Expense rules per month in cents; every rule is rounded to whole cents first. */
  monthlyCents: number
}

/** Monthly share of one rule: monthly ×1, quarterly ÷3, yearly ÷12, rounded to whole cents. */
export function monthlyEquivalentOf(rule: Pick<RecurringRule, 'amountCents' | 'interval'>): number {
  return Math.round(rule.amountCents / STEP_MONTHS[rule.interval])
}

/** Active rules and the monthly equivalent of their expenses. */
export function monthlyEquivalent(rules: RecurringRule[], today: string): ContractsSummary {
  const active = rules.filter((r) => !r.endDate || r.endDate >= today)
  return {
    activeCount: active.length,
    monthlyCents: active.filter((r) => r.kind === 'expense').reduce((sum, r) => sum + monthlyEquivalentOf(r), 0),
  }
}
