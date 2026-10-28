import type { Account, AppData, Category, Interval, Kind, RecurringRule, Transaction, Transfer, TransferDirection } from '../domain/types'
import { FALLBACK_NAME } from '../domain/defaults'
import { addDays, isValidISODate } from '../domain/dates'
import { bookDue, nextOccurrence } from '../domain/recurring'

export interface TransactionInput {
  kind: Kind
  amountCents: number
  date: string
  categoryId: string
  account: Account
  note?: string
}

export interface TransactionMeta {
  id: string
  createdAt: number
}

function cleanNote(note: string | undefined): string | undefined {
  const n = note?.trim()
  return n ? n : undefined
}

function validateTransactionInput(data: AppData, input: TransactionInput): void {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Der Betrag muss größer als 0 sein.')
  }
  if (!isValidISODate(input.date)) throw new Error('Ungültiges Datum.')
  const cat = data.categories.find((c) => c.id === input.categoryId)
  if (!cat) throw new Error('Die Kategorie existiert nicht.')
  if (cat.kind !== input.kind) throw new Error('Die Kategorie passt nicht zur Art der Buchung.')
  if (input.account !== 'konto' && input.account !== 'bargeld') throw new Error('Ungültiges Konto.')
}

export function addTransaction(
  data: AppData,
  input: TransactionInput,
  meta: TransactionMeta = { id: crypto.randomUUID(), createdAt: Date.now() },
): AppData {
  validateTransactionInput(data, input)
  const t: Transaction = {
    id: meta.id,
    kind: input.kind,
    amountCents: input.amountCents,
    date: input.date,
    categoryId: input.categoryId,
    account: input.account,
    createdAt: meta.createdAt,
  }
  const note = cleanNote(input.note)
  if (note) t.note = note
  return { ...data, transactions: [...data.transactions, t] }
}

export function updateTransaction(data: AppData, id: string, input: TransactionInput): AppData {
  validateTransactionInput(data, input)
  const existing = data.transactions.find((t) => t.id === id)
  if (!existing) throw new Error('Die Buchung wurde nicht gefunden.')
  const updated: Transaction = {
    id,
    kind: input.kind,
    amountCents: input.amountCents,
    date: input.date,
    categoryId: input.categoryId,
    account: input.account,
    createdAt: existing.createdAt,
  }
  if (existing.recurringId) updated.recurringId = existing.recurringId
  const note = cleanNote(input.note)
  if (note) updated.note = note
  return { ...data, transactions: data.transactions.map((t) => (t.id === id ? updated : t)) }
}

export function deleteTransaction(data: AppData, id: string): AppData {
  return { ...data, transactions: data.transactions.filter((t) => t.id !== id) }
}

/** Undo of a delete: puts the exact booking back (same id, createdAt, recurringId, account). */
export function restoreTransaction(data: AppData, tx: Transaction): AppData {
  if (data.transactions.some((t) => t.id === tx.id)) throw new Error('Die Buchung existiert bereits.')
  return { ...data, transactions: [...data.transactions, tx] }
}

export function setStartBalance(data: AppData, cents: number): AppData {
  if (!Number.isSafeInteger(cents)) throw new Error('Ungültiger Betrag.')
  return { ...data, settings: { ...data.settings, startBalanceCents: cents } }
}

export function setStartCash(data: AppData, cents: number): AppData {
  if (!Number.isSafeInteger(cents)) throw new Error('Ungültiger Betrag.')
  return { ...data, settings: { ...data.settings, startCashCents: cents } }
}

export interface TransferInput {
  direction: TransferDirection
  amountCents: number
  date: string
  note?: string
}

function validateTransferInput(input: TransferInput): void {
  if (input.direction !== 'withdrawal' && input.direction !== 'deposit') throw new Error('Ungültige Richtung.')
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Der Betrag muss größer als 0 sein.')
  }
  if (!isValidISODate(input.date)) throw new Error('Ungültiges Datum.')
}

export function addTransfer(
  data: AppData,
  input: TransferInput,
  meta: TransactionMeta = { id: crypto.randomUUID(), createdAt: Date.now() },
): AppData {
  validateTransferInput(input)
  const tr: Transfer = {
    id: meta.id,
    direction: input.direction,
    amountCents: input.amountCents,
    date: input.date,
    createdAt: meta.createdAt,
  }
  const note = cleanNote(input.note)
  if (note) tr.note = note
  return { ...data, transfers: [...data.transfers, tr] }
}

export function updateTransfer(data: AppData, id: string, input: TransferInput): AppData {
  validateTransferInput(input)
  const existing = data.transfers.find((t) => t.id === id)
  if (!existing) throw new Error('Die Umbuchung wurde nicht gefunden.')
  const updated: Transfer = {
    id,
    direction: input.direction,
    amountCents: input.amountCents,
    date: input.date,
    createdAt: existing.createdAt,
  }
  const note = cleanNote(input.note)
  if (note) updated.note = note
  return { ...data, transfers: data.transfers.map((t) => (t.id === id ? updated : t)) }
}

export function deleteTransfer(data: AppData, id: string): AppData {
  return { ...data, transfers: data.transfers.filter((t) => t.id !== id) }
}

/** Undo of a delete: puts the exact transfer back. */
export function restoreTransfer(data: AppData, tr: Transfer): AppData {
  if (data.transfers.some((t) => t.id === tr.id)) throw new Error('Die Umbuchung existiert bereits.')
  return { ...data, transfers: [...data.transfers, tr] }
}

function validateCategoryName(
  data: AppData,
  kind: Kind,
  name: string,
  ignoreId?: string,
): string {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Der Name darf nicht leer sein.')
  const lower = trimmed.toLowerCase()
  const dup = data.categories.some(
    (c) => c.kind === kind && c.id !== ignoreId && c.name.toLowerCase() === lower,
  )
  if (dup) throw new Error('Diese Kategorie existiert bereits.')
  return trimmed
}

export function addCategory(
  data: AppData,
  kind: Kind,
  name: string,
  id: string = crypto.randomUUID(),
): AppData {
  const trimmed = validateCategoryName(data, kind, name)
  const cat: Category = { id, name: trimmed, kind, builtIn: false }
  return { ...data, categories: [...data.categories, cat] }
}

export function renameCategory(data: AppData, id: string, name: string): AppData {
  const cat = data.categories.find((c) => c.id === id)
  if (!cat) throw new Error('Die Kategorie wurde nicht gefunden.')
  if (cat.builtIn) throw new Error(`„${FALLBACK_NAME}“ kann nicht umbenannt werden.`)
  const trimmed = validateCategoryName(data, cat.kind, name, id)
  return {
    ...data,
    categories: data.categories.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
  }
}

/** cents = null removes the budget. Only expense categories can have one. */
export function setCategoryBudget(data: AppData, id: string, cents: number | null): AppData {
  const cat = data.categories.find((c) => c.id === id)
  if (!cat) throw new Error('Die Kategorie wurde nicht gefunden.')
  if (cat.kind !== 'expense') throw new Error('Budgets gibt es nur für Ausgaben-Kategorien.')
  if (cents !== null && (!Number.isSafeInteger(cents) || cents <= 0)) {
    throw new Error('Das Budget muss größer als 0 sein.')
  }
  return {
    ...data,
    categories: data.categories.map((c) => {
      if (c.id !== id) return c
      const { monthlyBudgetCents: _old, ...rest } = c
      return cents === null ? rest : { ...rest, monthlyBudgetCents: cents }
    }),
  }
}

/** Number of transactions that use a category. */
export function countTransactionsInCategory(data: AppData, id: string): number {
  return data.transactions.filter((t) => t.categoryId === id).length
}

export function deleteCategory(data: AppData, id: string): AppData {
  const cat = data.categories.find((c) => c.id === id)
  if (!cat) throw new Error('Die Kategorie wurde nicht gefunden.')
  if (cat.builtIn) throw new Error(`„${FALLBACK_NAME}“ kann nicht gelöscht werden.`)
  const fallback = data.categories.find((c) => c.kind === cat.kind && c.builtIn)
  if (!fallback) throw new Error(`Die Kategorie „${FALLBACK_NAME}“ fehlt.`)
  return {
    ...data,
    categories: data.categories.filter((c) => c.id !== id),
    transactions: data.transactions.map((t) =>
      t.categoryId === id ? { ...t, categoryId: fallback.id } : t,
    ),
    recurring: data.recurring.map((r) =>
      r.categoryId === id ? { ...r, categoryId: fallback.id } : r,
    ),
  }
}

/** Number of recurring rules that use a category. */
export function countRecurringInCategory(data: AppData, id: string): number {
  return data.recurring.filter((r) => r.categoryId === id).length
}

export interface RecurringInput {
  kind: Kind
  amountCents: number
  categoryId: string
  note?: string
  interval: Interval
  dayOfMonth: number
  startDate: string
  endDate?: string
  /** false: occurrences wait for a confirmation instead of being booked automatically. */
  autoBook: boolean
}

function validateRecurringInput(data: AppData, input: RecurringInput): void {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Der Betrag muss größer als 0 sein.')
  }
  const cat = data.categories.find((c) => c.id === input.categoryId)
  if (!cat) throw new Error('Die Kategorie existiert nicht.')
  if (cat.kind !== input.kind) throw new Error('Die Kategorie passt nicht zur Art der Buchung.')
  if (!['monthly', 'quarterly', 'yearly'].includes(input.interval)) throw new Error('Ungültiger Rhythmus.')
  if (!Number.isInteger(input.dayOfMonth) || input.dayOfMonth < 1 || input.dayOfMonth > 31) {
    throw new Error('Der Tag im Monat muss zwischen 1 und 31 liegen.')
  }
  if (typeof input.autoBook !== 'boolean') throw new Error('Ungültige Angabe zum automatischen Buchen.')
  if (!isValidISODate(input.startDate)) throw new Error('Ungültiges Startdatum.')
  if (input.endDate !== undefined) {
    if (!isValidISODate(input.endDate)) throw new Error('Ungültiges Enddatum.')
    if (input.endDate < input.startDate) throw new Error('Das Enddatum darf nicht vor dem Startdatum liegen.')
  }
}

function ruleFields(input: RecurringInput): Omit<RecurringRule, 'id' | 'bookedThrough'> {
  const fields: Omit<RecurringRule, 'id' | 'bookedThrough'> = {
    kind: input.kind,
    amountCents: input.amountCents,
    categoryId: input.categoryId,
    interval: input.interval,
    dayOfMonth: input.dayOfMonth,
    startDate: input.startDate,
    autoBook: input.autoBook,
  }
  const note = cleanNote(input.note)
  if (note) fields.note = note
  if (input.endDate) fields.endDate = input.endDate
  return fields
}

export interface AddRecurringOptions {
  today: string
  /**
   * true: book occurrences since startDate that lie in the past (manual rules: show them as
   * pending confirmations); false: skip them.
   */
  catchUp: boolean
  id?: string
  now?: number
}

export function addRecurring(data: AppData, input: RecurringInput, opts: AddRecurringOptions): AppData {
  validateRecurringInput(data, input)
  const before = addDays(input.startDate, -1)
  const rule: RecurringRule = {
    id: opts.id ?? crypto.randomUUID(),
    ...ruleFields(input),
    bookedThrough: opts.catchUp || before > opts.today ? before : opts.today,
  }
  return bookDue({ ...data, recurring: [...data.recurring, rule] }, opts.today, opts.now)
}

/**
 * Changes apply to future occurrences only: bookedThrough and existing bookings stay as they are.
 * Switching a manual rule to automatic books its pending occurrences on the next bookDue.
 */
export function updateRecurring(data: AppData, id: string, input: RecurringInput): AppData {
  validateRecurringInput(data, input)
  const existing = data.recurring.find((r) => r.id === id)
  if (!existing) throw new Error('Die wiederkehrende Buchung wurde nicht gefunden.')
  const updated: RecurringRule = { id, ...ruleFields(input), bookedThrough: existing.bookedThrough }
  return { ...data, recurring: data.recurring.map((r) => (r.id === id ? updated : r)) }
}

/** Already booked transactions stay. */
export function deleteRecurring(data: AppData, id: string): AppData {
  return { ...data, recurring: data.recurring.filter((r) => r.id !== id) }
}

/** What the user confirms or edits when a contract is booked; contracts always book to the Konto. */
export type ContractBookingInput = Omit<TransactionInput, 'account'> & { account?: Account }

function findRule(data: AppData, id: string): RecurringRule {
  const rule = data.recurring.find((r) => r.id === id)
  if (!rule) throw new Error('Die wiederkehrende Buchung wurde nicht gefunden.')
  return rule
}

/** Only the oldest unhandled occurrence can be confirmed or skipped, so bookedThrough never leaves gaps. */
function requireOldestPending(rule: RecurringRule, occurrenceDate: string): void {
  const oldest = nextOccurrence(rule, rule.bookedThrough)
  if (oldest === null || occurrenceDate < oldest) throw new Error('Dieser Termin ist bereits erledigt.')
  if (occurrenceDate > oldest) throw new Error('Bitte zuerst den älteren Termin bestätigen.')
}

/** Books the (possibly edited) input as the rule's occurrence and marks the occurrence as handled. */
function bookOccurrence(
  data: AppData,
  rule: RecurringRule,
  occurrenceDate: string,
  input: ContractBookingInput,
  now: number,
): AppData {
  const full: TransactionInput = { ...input, account: 'konto' }
  validateTransactionInput(data, full)
  const t: Transaction = {
    id: `${rule.id}:${occurrenceDate}`,
    kind: full.kind,
    amountCents: full.amountCents,
    date: full.date,
    categoryId: full.categoryId,
    account: 'konto',
    createdAt: now,
    recurringId: rule.id,
  }
  const note = cleanNote(full.note)
  if (note) t.note = note
  return {
    ...data,
    transactions: [...data.transactions, t],
    recurring: data.recurring.map((r) => (r.id === rule.id ? { ...r, bookedThrough: occurrenceDate } : r)),
  }
}

/** Confirms the oldest pending occurrence with the given (possibly edited) amount, date, category and note. */
export function confirmOccurrence(
  data: AppData,
  ruleId: string,
  occurrenceDate: string,
  input: ContractBookingInput,
  now: number = Date.now(),
): AppData {
  const rule = findRule(data, ruleId)
  requireOldestPending(rule, occurrenceDate)
  return bookOccurrence(data, rule, occurrenceDate, input, now)
}

/** Marks the oldest pending occurrence as handled without booking anything. */
export function skipOccurrence(data: AppData, ruleId: string, occurrenceDate: string): AppData {
  const rule = findRule(data, ruleId)
  requireOldestPending(rule, occurrenceDate)
  return {
    ...data,
    recurring: data.recurring.map((r) => (r.id === ruleId ? { ...r, bookedThrough: occurrenceDate } : r)),
  }
}

/**
 * "Jetzt buchen": handles the next unhandled occurrence now (the oldest pending one, or the next
 * one in the future, e.g. salary that arrives early). The booking date comes from the input.
 */
export function bookNextNow(data: AppData, ruleId: string, input: ContractBookingInput, now: number = Date.now()): AppData {
  const rule = findRule(data, ruleId)
  const next = nextOccurrence(rule, rule.bookedThrough)
  if (next === null) throw new Error('Dieser Vertrag ist beendet, es gibt keinen weiteren Termin.')
  return bookOccurrence(data, rule, next, input, now)
}
