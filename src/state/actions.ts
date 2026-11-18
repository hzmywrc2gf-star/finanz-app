import type { Account, AppData, CalendarEvent, Category, EventRecurrence, Interval, Invoice, Kind, RecurringRule, Todo, TodoColor, TodoIcon, TodoList, TodoRecurrence, Transaction, Transfer, TransferDirection } from '../domain/types'
import { TODO_COLORS, TODO_ICONS, TODO_LIMITS, nextOccurrence as nextTodoOccurrence } from '../domain/todos'
import { FALLBACK_NAME, createDefaultData } from '../domain/defaults'
import { addDays, isValidISODate } from '../domain/dates'
import { bookDue, nextOccurrence } from '../domain/recurring'
import { MIN_COUNT, coveredByRule } from '../domain/recurringDetect'
import type { RecurringSuggestion } from '../domain/recurringDetect'
import { findCategory } from '../domain/importRows'
import { snoozeDate } from '../domain/invoices'
import { dateOf, isLocalDateTime, splitImportedEvents } from '../domain/calendar'
import { validateEvents } from '../data/backup'

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

/** Trimmed, at most 40 characters; empty removes the name. */
export function setDisplayName(data: AppData, name: string): AppData {
  const trimmed = name.trim()
  if (trimmed.length > 40) throw new Error('Der Name darf höchstens 40 Zeichen haben.')
  const settings = { startBalanceCents: data.settings.startBalanceCents, startCashCents: data.settings.startCashCents }
  return { ...data, settings: trimmed ? { ...settings, displayName: trimmed } : settings }
}

/**
 * "Alle Daten löschen": a fresh start like a new installation (no bookings, transfers, contracts, invoices or events, the
 * default categories without budgets, start balances 0). Only the name stays. Lock, theme and other device settings are
 * not part of AppData and stay untouched as well.
 */
export function resetData(data: AppData): AppData {
  const fresh = createDefaultData()
  const name = data.settings.displayName
  return name ? { ...fresh, settings: { ...fresh.settings, displayName: name } } : fresh
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
    invoices: data.invoices.map((inv) =>
      inv.categoryId === id ? { ...inv, categoryId: fallback.id } : inv,
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

/**
 * Turns a found pattern (`detectRecurring`) into a Vertrag. The suggestion's own bookings are linked to it
 * (recurringId) when they still exist as free Konto bookings; if fewer than the pattern needs are left (e.g. the
 * import was undone) or a Vertrag already covers it, this throws. The past counts as handled: bookedThrough is the
 * last found booking, or the rule's date in that month if that is later (a salary found on the 28th with day 31 must
 * not be booked again on the 31st). The next occurrence is booked (autoBook) or asked for when it is due.
 */
export function createRecurringFromSuggestion(
  data: AppData,
  suggestion: RecurringSuggestion,
  opts: { autoBook: boolean; id?: string },
): AppData {
  const input: RecurringInput = {
    kind: suggestion.kind,
    amountCents: suggestion.amountCents,
    categoryId: suggestion.categoryId,
    note: suggestion.note,
    interval: suggestion.interval,
    dayOfMonth: suggestion.dayOfMonth,
    startDate: suggestion.startDate,
    autoBook: opts.autoBook,
  }
  validateRecurringInput(data, input)
  if (!isValidISODate(suggestion.lastDate) || suggestion.lastDate < suggestion.startDate) throw new Error('Ungültiges Datum.')
  const wanted = new Set(suggestion.transactionIds)
  const free = data.transactions.filter(
    (t) => wanted.has(t.id) && !t.recurringId && t.account === 'konto' && t.kind === suggestion.kind,
  )
  if (free.length < MIN_COUNT[suggestion.interval]) throw new Error('Die passenden Buchungen gibt es nicht mehr.')
  if (coveredByRule({ ...suggestion, note: input.note }, data.recurring)) throw new Error('Dafür gibt es schon einen Vertrag.')
  const id = opts.id ?? crypto.randomUUID()
  const draft: RecurringRule = { id, ...ruleFields(input), bookedThrough: suggestion.lastDate }
  const inMonth = nextOccurrence(draft, addDays(`${suggestion.lastDate.slice(0, 7)}-01`, -1))
  if (inMonth && inMonth.slice(0, 7) === suggestion.lastDate.slice(0, 7) && inMonth > suggestion.lastDate) draft.bookedThrough = inMonth
  const linked = new Set(free.map((t) => t.id))
  return {
    ...data,
    recurring: [...data.recurring, draft],
    transactions: data.transactions.map((t) => (linked.has(t.id) ? { ...t, recurringId: id } : t)),
  }
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

/** One booking read from a file: the category comes by name (matched case-insensitively, created if new, empty = Sonstiges). */
export interface ImportBooking {
  kind: Kind
  amountCents: number
  date: string
  account: Account
  categoryName: string
  note?: string
}

export interface ImportResult {
  data: AppData
  /** Ids of the new bookings and of the categories this import created (what `undoImport` removes). */
  transactionIds: string[]
  categoryIds: string[]
}

/**
 * Adds many bookings at once (file import). All or nothing: the first invalid row throws and nothing changes.
 * New bookings get fresh ids and consecutive createdAt values (file order), no recurringId.
 */
export function importTransactions(
  data: AppData,
  bookings: ImportBooking[],
  now: number = Date.now(),
  newId: () => string = () => crypto.randomUUID(),
): ImportResult {
  if (bookings.length === 0) throw new Error('Es gibt nichts einzulesen.')
  const categories = [...data.categories]
  const categoryIds: string[] = []
  const transactions: Transaction[] = []
  const transactionIds: string[] = []
  bookings.forEach((b, i) => {
    let cat = findCategory(categories, b.kind, b.categoryName)
    if (!cat) {
      const name = b.categoryName.trim()
      if (!name) throw new Error(`Die Kategorie „${FALLBACK_NAME}“ fehlt.`)
      cat = { id: newId(), name, kind: b.kind, builtIn: false }
      categories.push(cat)
      categoryIds.push(cat.id)
    }
    const input: TransactionInput = {
      kind: b.kind,
      amountCents: b.amountCents,
      date: b.date,
      categoryId: cat.id,
      account: b.account,
    }
    validateTransactionInput({ ...data, categories }, input)
    const t: Transaction = { id: newId(), ...input, createdAt: now + i }
    const note = cleanNote(b.note)
    if (note) t.note = note
    transactions.push(t)
    transactionIds.push(t.id)
  })
  return {
    data: { ...data, categories, transactions: [...data.transactions, ...transactions] },
    transactionIds,
    categoryIds,
  }
}

/**
 * Undo of an import: removes exactly the imported bookings and the categories the import created,
 * unless something else uses such a category by now (it then stays).
 */
export function undoImport(data: AppData, result: Pick<ImportResult, 'transactionIds' | 'categoryIds'>): AppData {
  const removed = new Set(result.transactionIds)
  const transactions = data.transactions.filter((t) => !removed.has(t.id))
  const used = new Set([...transactions.map((t) => t.categoryId), ...data.recurring.map((r) => r.categoryId)])
  const drop = new Set(result.categoryIds.filter((id) => !used.has(id)))
  return { ...data, transactions, categories: data.categories.filter((c) => !drop.has(c.id)) }
}

export interface InvoiceInput {
  amountCents: number
  /** Merchant, optional. */
  note?: string
  categoryId: string
  purchaseDate: string
  dueDate: string
}

function validateInvoiceInput(data: AppData, input: InvoiceInput): void {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Der Betrag muss größer als 0 sein.')
  }
  if (!isValidISODate(input.purchaseDate)) throw new Error('Ungültiges Kaufdatum.')
  if (!isValidISODate(input.dueDate)) throw new Error('Ungültiges Datum bei ‚Zahlen bis‘.')
  if (input.dueDate < input.purchaseDate) throw new Error('‚Zahlen bis‘ darf nicht vor dem Kaufdatum liegen.')
  const cat = data.categories.find((c) => c.id === input.categoryId)
  if (!cat) throw new Error('Die Kategorie existiert nicht.')
  if (cat.kind !== 'expense') throw new Error('Rechnungen brauchen eine Ausgaben-Kategorie.')
  if ((input.note?.trim().length ?? 0) > 200) throw new Error('Die Notiz darf höchstens 200 Zeichen haben.')
}

function findInvoice(data: AppData, id: string): Invoice {
  const inv = data.invoices.find((i) => i.id === id)
  if (!inv) throw new Error('Die Rechnung wurde nicht gefunden.')
  return inv
}

/** A purchase on account: stays out of the books (balance, budgets, month) until `payInvoice`. */
export function addInvoice(
  data: AppData,
  input: InvoiceInput,
  now: number = Date.now(),
  id: string = crypto.randomUUID(),
): AppData {
  validateInvoiceInput(data, input)
  const inv: Invoice = {
    id,
    createdAt: now,
    categoryId: input.categoryId,
    amountCents: input.amountCents,
    purchaseDate: input.purchaseDate,
    dueDate: input.dueDate,
  }
  const note = cleanNote(input.note)
  if (note) inv.note = note
  return { ...data, invoices: [...data.invoices, inv] }
}

/** Replaces the editable fields; a changed pay-by date or amount ends a snooze (the reminder is re-evaluated). */
export function updateInvoice(data: AppData, id: string, input: InvoiceInput): AppData {
  validateInvoiceInput(data, input)
  const existing = findInvoice(data, id)
  const updated: Invoice = {
    id,
    createdAt: existing.createdAt,
    categoryId: input.categoryId,
    amountCents: input.amountCents,
    purchaseDate: input.purchaseDate,
    dueDate: input.dueDate,
  }
  const note = cleanNote(input.note)
  if (note) updated.note = note
  if (existing.snoozedUntil && input.dueDate === existing.dueDate) updated.snoozedUntil = existing.snoozedUntil
  return { ...data, invoices: data.invoices.map((i) => (i.id === id ? updated : i)) }
}

export function deleteInvoice(data: AppData, id: string): AppData {
  findInvoice(data, id)
  return { ...data, invoices: data.invoices.filter((i) => i.id !== id) }
}

/** Undo of a removal: puts the exact invoice back (same id, createdAt, snooze). */
export function restoreInvoice(data: AppData, inv: Invoice): AppData {
  if (data.invoices.some((i) => i.id === inv.id)) throw new Error('Die Rechnung existiert bereits.')
  return { ...data, invoices: [...data.invoices, inv] }
}

export interface PayInvoiceResult {
  data: AppData
  /** Id of the expense booked for the payment (what the undo removes). */
  transactionId: string
}

/**
 * Pays an invoice: it disappears and a normal expense on the Konto is booked on `paidDate` with the paid amount
 * (default: the invoice's amount), the invoice's category and note.
 */
export function payInvoice(
  data: AppData,
  id: string,
  opts: { paidDate: string; amountCents?: number },
  now: number = Date.now(),
  newId: string = crypto.randomUUID(),
): PayInvoiceResult {
  const inv = findInvoice(data, id)
  const input: TransactionInput = {
    kind: 'expense',
    amountCents: opts.amountCents ?? inv.amountCents,
    date: opts.paidDate,
    categoryId: inv.categoryId,
    account: 'konto',
    note: inv.note,
  }
  validateTransactionInput(data, input)
  const without: AppData = { ...data, invoices: data.invoices.filter((i) => i.id !== id) }
  return { data: addTransaction(without, input, { id: newId, createdAt: now }), transactionId: newId }
}

/** Undo of a payment: removes the booked expense and puts the invoice back exactly as it was. */
export function undoPayInvoice(data: AppData, inv: Invoice, transactionId: string): AppData {
  return restoreInvoice(deleteTransaction(data, transactionId), inv)
}

/** Partial return: the invoice stays open with the new (lower or changed) amount; a snooze ends. */
export function changeInvoiceAmount(data: AppData, id: string, amountCents: number): AppData {
  const inv = findInvoice(data, id)
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new Error('Der Betrag muss größer als 0 sein.')
  const { snoozedUntil: _snooze, ...rest } = inv
  return { ...data, invoices: data.invoices.map((i) => (i.id === id ? { ...rest, amountCents } : i)) }
}

/** "Komplett zurückgeschickt": the invoice is gone and nothing is booked. */
export function returnInvoice(data: AppData, id: string): AppData {
  return deleteInvoice(data, id)
}

/** "Später": hides the reminder until `snoozeDate` (2 days, at most to "Zahlen bis"). */
export function snoozeInvoice(data: AppData, id: string, today: string): AppData {
  const inv = findInvoice(data, id)
  const snoozedUntil = snoozeDate(inv, today)
  return { ...data, invoices: data.invoices.map((i) => (i.id === id ? { ...inv, snoozedUntil } : i)) }
}

// ---------------------------------------------------------------------------------------------------- Kalender

export interface EventInput {
  title: string
  allDay: boolean
  /** all-day: 'YYYY-MM-DD'; timed: 'YYYY-MM-DDTHH:mm' */
  start: string
  end: string
  location?: string
  notes?: string
  recurrence?: EventRecurrence
}

/** Trims and validates the form values of an event (German errors); the result lacks only id and createdAt. */
export function normalizeEventInput(input: EventInput): Omit<CalendarEvent, 'id' | 'createdAt'> {
  const title = input.title.trim()
  if (!title) throw new Error('Bitte einen Titel eingeben.')
  if (title.length > 200) throw new Error('Der Titel ist zu lang (höchstens 200 Zeichen).')
  const location = input.location?.trim()
  if (location && location.length > 200) throw new Error('Der Ort ist zu lang (höchstens 200 Zeichen).')
  const notes = input.notes?.trim()
  if (notes && notes.length > 2000) throw new Error('Die Notiz ist zu lang (höchstens 2000 Zeichen).')
  if (input.allDay) {
    if (!isValidISODate(input.start) || !isValidISODate(input.end)) throw new Error('Ungültiges Datum.')
    if (input.end < input.start) throw new Error('Das Ende darf nicht vor dem Beginn liegen.')
  } else {
    if (!isLocalDateTime(input.start) || !isLocalDateTime(input.end)) throw new Error('Ungültiges Datum oder ungültige Uhrzeit.')
    if (input.end <= input.start) throw new Error('Das Ende muss nach dem Beginn liegen.')
  }
  const ev: Omit<CalendarEvent, 'id' | 'createdAt'> = { title, allDay: input.allDay, start: input.start, end: input.end }
  if (location) ev.location = location
  if (notes) ev.notes = notes
  const r = input.recurrence
  if (r) {
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(r.freq)) throw new Error('Ungültige Wiederholung.')
    if (!Number.isInteger(r.interval) || r.interval < 1 || r.interval > 99) throw new Error('Der Abstand der Wiederholung muss zwischen 1 und 99 liegen.')
    if (r.until !== undefined && !isValidISODate(r.until)) throw new Error('Ungültiges Datum für das Ende der Wiederholung.')
    if (r.until !== undefined && r.until < dateOf(input.start)) throw new Error('Die Wiederholung darf nicht vor dem Beginn enden.')
    if (r.count !== undefined && (!Number.isInteger(r.count) || r.count < 1 || r.count > 1000)) throw new Error('Die Anzahl der Wiederholungen muss zwischen 1 und 1000 liegen.')
    const rec: EventRecurrence = { freq: r.freq, interval: r.interval }
    if (r.until !== undefined) rec.until = r.until
    if (r.count !== undefined) rec.count = r.count
    if (r.freq === 'weekly' && r.byWeekday?.length) rec.byWeekday = [...new Set(r.byWeekday)].sort((a, b) => a - b)
    ev.recurrence = rec
  }
  return ev
}

export function addEvent(data: AppData, input: EventInput, meta: { id: string; createdAt: number } = { id: crypto.randomUUID(), createdAt: Date.now() }): AppData {
  const ev: CalendarEvent = { id: meta.id, createdAt: meta.createdAt, ...normalizeEventInput(input) }
  return { ...data, events: [...data.events, ev] }
}

export function updateEvent(data: AppData, id: string, input: EventInput): AppData {
  const existing = data.events.find((e) => e.id === id)
  if (!existing) throw new Error('Der Termin wurde nicht gefunden.')
  const clean = normalizeEventInput(input)
  const updated: CalendarEvent = { id, createdAt: existing.createdAt, ...clean }
  // skipped dates only make sense while the series still starts on the same day
  if (existing.exdates?.length && clean.recurrence && dateOf(clean.start) === dateOf(existing.start)) updated.exdates = existing.exdates
  if (existing.importUid) updated.importUid = existing.importUid
  return { ...data, events: data.events.map((e) => (e.id === id ? updated : e)) }
}

export function deleteEvent(data: AppData, id: string): AppData {
  return { ...data, events: data.events.filter((e) => e.id !== id) }
}

/** Puts back exactly the deleted event (undo); throws if its id exists again. */
export function restoreEvent(data: AppData, ev: CalendarEvent): AppData {
  if (data.events.some((e) => e.id === ev.id)) throw new Error('Der Termin existiert schon.')
  return { ...data, events: [...data.events, ev] }
}

/** "Nur diesen Termin" of a repeating event: skips the occurrence that starts on `date`. */
export function deleteOccurrence(data: AppData, id: string, date: string): AppData {
  const existing = data.events.find((e) => e.id === id)
  if (!existing) throw new Error('Der Termin wurde nicht gefunden.')
  if (!existing.recurrence) throw new Error('Dieser Termin wiederholt sich nicht.')
  if (!isValidISODate(date)) throw new Error('Ungültiges Datum.')
  const exdates = [...new Set([...(existing.exdates ?? []), date])].sort()
  return { ...data, events: data.events.map((e) => (e.id === id ? { ...e, exdates } : e)) }
}

/** Undo of `deleteOccurrence`. */
export function restoreOccurrence(data: AppData, id: string, date: string): AppData {
  const existing = data.events.find((e) => e.id === id)
  if (!existing) throw new Error('Der Termin wurde nicht gefunden.')
  const exdates = (existing.exdates ?? []).filter((d) => d !== date)
  const { exdates: _old, ...rest } = existing
  return { ...data, events: data.events.map((e) => (e.id === id ? (exdates.length ? { ...rest, exdates } : rest) : e)) }
}

export interface ImportEventsResult {
  data: AppData
  eventIds: string[]
}

/** Adds imported events (all or nothing); ones already present (same importUid and start) are skipped. */
export function importEvents(
  data: AppData,
  incoming: Omit<CalendarEvent, 'id' | 'createdAt'>[],
  now: number = Date.now(),
  newId: () => string = () => crypto.randomUUID(),
): ImportEventsResult {
  const { fresh } = splitImportedEvents(data.events, incoming)
  const added: CalendarEvent[] = fresh.map((e, i) => ({ id: newId(), createdAt: now + i, ...e }))
  const events = validateEvents([...data.events, ...added] as unknown[])
  return { data: { ...data, events }, eventIds: added.map((e) => e.id) }
}

export function undoImportEvents(data: AppData, eventIds: string[]): AppData {
  const removed = new Set(eventIds)
  return { ...data, events: data.events.filter((e) => !removed.has(e.id)) }
}

// ---------------------------------------------------------------------------------------------------- To-do

export interface TodoInput {
  title: string
  /** null/absent = the built-in list „Aufgaben“. */
  listId?: string | null
  important?: boolean
  myDay?: string
  dueDate?: string
  reminder?: string
  recurrence?: TodoRecurrence
  note?: string
}

/** Changes of a task; `null` removes an optional field. */
export interface TodoPatch {
  title?: string
  listId?: string | null
  important?: boolean
  myDay?: string | null
  dueDate?: string | null
  reminder?: string | null
  recurrence?: TodoRecurrence | null
  note?: string | null
}

export interface TodoListInput {
  name: string
  color: TodoColor
  icon: TodoIcon
}

const newMeta = () => ({ id: crypto.randomUUID(), createdAt: Date.now() })

function cleanTodoTitle(title: string, what = 'Titel'): string {
  const t = title.trim()
  if (!t) throw new Error(what === 'Titel' ? 'Bitte einen Titel eingeben.' : 'Bitte einen Schritt eingeben.')
  if (t.length > TODO_LIMITS.title) throw new Error(`Der ${what} ist zu lang (höchstens ${TODO_LIMITS.title} Zeichen).`)
  return t
}

function cleanTodoRecurrence(r: TodoRecurrence): TodoRecurrence {
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(r.freq)) throw new Error('Ungültige Wiederholung.')
  if (!Number.isInteger(r.interval) || r.interval < 1 || r.interval > 99) throw new Error('Der Abstand der Wiederholung muss zwischen 1 und 99 liegen.')
  const out: TodoRecurrence = { freq: r.freq, interval: r.interval }
  if (r.byWeekday?.length) {
    if (r.freq !== 'weekly') throw new Error('Wochentage gibt es nur bei wöchentlicher Wiederholung.')
    if (r.byWeekday.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error('Ungültiger Wochentag.')
    out.byWeekday = [...new Set(r.byWeekday)].sort((a, b) => a - b)
  }
  return out
}

function checkTodoDate(v: string, what: string): string {
  if (!isValidISODate(v)) throw new Error(`Ungültiges Datum (${what}).`)
  return v
}

function requireList(data: AppData, listId: string | null): string | null {
  if (listId !== null && !data.todoLists.some((l) => l.id === listId)) throw new Error('Die Liste wurde nicht gefunden.')
  return listId
}

function findTodo(data: AppData, id: string): Todo {
  const todo = data.todos.find((t) => t.id === id)
  if (!todo) throw new Error('Die Aufgabe wurde nicht gefunden.')
  return todo
}

const replaceTodo = (data: AppData, todo: Todo): AppData => ({ ...data, todos: data.todos.map((t) => (t.id === todo.id ? todo : t)) })

/** Applies a patch to a task (validated, German errors); fields set to null are removed. */
function patchTodo(data: AppData, todo: Todo, patch: TodoPatch): Todo {
  const next: Todo = { ...todo }
  if (patch.title !== undefined) next.title = cleanTodoTitle(patch.title)
  if (patch.listId !== undefined) next.listId = requireList(data, patch.listId)
  if (patch.important !== undefined) next.important = patch.important
  if (patch.myDay !== undefined) {
    if (patch.myDay === null) delete next.myDay
    else next.myDay = checkTodoDate(patch.myDay, 'Mein Tag')
  }
  if (patch.dueDate !== undefined) {
    if (patch.dueDate === null) delete next.dueDate
    else next.dueDate = checkTodoDate(patch.dueDate, 'Fälligkeit')
  }
  if (patch.reminder !== undefined) {
    if (patch.reminder === null) delete next.reminder
    else if (!isLocalDateTime(patch.reminder)) throw new Error('Ungültige Erinnerung (Datum und Uhrzeit).')
    else next.reminder = patch.reminder
  }
  if (patch.recurrence !== undefined) {
    if (patch.recurrence === null) delete next.recurrence
    else next.recurrence = cleanTodoRecurrence(patch.recurrence)
  }
  if (patch.note !== undefined) {
    const note = patch.note?.trim() ?? ''
    if (note.length > TODO_LIMITS.note) throw new Error(`Die Notiz ist zu lang (höchstens ${TODO_LIMITS.note} Zeichen).`)
    if (note) next.note = note
    else delete next.note
  }
  return next
}

/** New task at the top of its list (smallest order). */
export function addTodo(data: AppData, input: TodoInput, meta: { id: string; createdAt: number } = newMeta()): AppData {
  if (data.todos.some((t) => t.id === meta.id)) throw new Error('Die Aufgabe existiert schon.')
  const order = data.todos.reduce((min, t) => Math.min(min, t.order), 1) - 1
  const base: Todo = { id: meta.id, createdAt: meta.createdAt, listId: null, title: '', done: false, important: false, steps: [], order }
  const todo = patchTodo(data, base, {
    title: input.title,
    listId: input.listId ?? null,
    important: input.important ?? false,
    myDay: input.myDay,
    dueDate: input.dueDate,
    reminder: input.reminder,
    recurrence: input.recurrence,
    note: input.note,
  })
  return { ...data, todos: [...data.todos, todo] }
}

export function updateTodo(data: AppData, id: string, patch: TodoPatch): AppData {
  return replaceTodo(data, patchTodo(data, findTodo(data, id), patch))
}

/**
 * Ticks a task off or opens it again. Completing a repeating task also creates its next open copy (next due date, steps reset);
 * the completed one keeps no repetition, so opening it again does not create a second copy.
 */
export function toggleTodo(
  data: AppData,
  id: string,
  opts: { now: number; today: string; newId?: () => string },
): AppData {
  const todo = findTodo(data, id)
  if (todo.done) {
    const { completedAt: _c, ...open } = todo
    return replaceTodo(data, { ...open, done: false })
  }
  const newId = opts.newId ?? (() => crypto.randomUUID())
  const { recurrence, ...rest } = todo
  const completed: Todo = { ...rest, done: true, completedAt: opts.now }
  const next = recurrence ? nextTodoOccurrence(todo, opts.today, { id: newId(), createdAt: opts.now, stepId: newId }) : null
  const updated = replaceTodo(data, completed)
  return next ? { ...updated, todos: [...updated.todos, next] } : updated
}

export function toggleImportant(data: AppData, id: string): AppData {
  const todo = findTodo(data, id)
  return replaceTodo(data, { ...todo, important: !todo.important })
}

/** „Zu ‚Mein Tag‘ hinzufügen“ (day = today) / removing it (null). */
export function setMyDay(data: AppData, id: string, day: string | null): AppData {
  return updateTodo(data, id, { myDay: day })
}

export function deleteTodo(data: AppData, id: string): AppData {
  return { ...data, todos: data.todos.filter((t) => t.id !== id) }
}

/** Puts back exactly the deleted task (undo); its list may be gone meanwhile, then it lands in „Aufgaben“. */
export function restoreTodo(data: AppData, todo: Todo): AppData {
  if (data.todos.some((t) => t.id === todo.id)) throw new Error('Die Aufgabe existiert schon.')
  const keep = todo.listId === null || data.todoLists.some((l) => l.id === todo.listId)
  return { ...data, todos: [...data.todos, keep ? todo : { ...todo, listId: null }] }
}

export function addStep(data: AppData, todoId: string, title: string, stepId: string = crypto.randomUUID()): AppData {
  const todo = findTodo(data, todoId)
  if (todo.steps.length >= TODO_LIMITS.steps) throw new Error(`Höchstens ${TODO_LIMITS.steps} Schritte je Aufgabe.`)
  return replaceTodo(data, { ...todo, steps: [...todo.steps, { id: stepId, title: cleanTodoTitle(title, 'Schritt'), done: false }] })
}

function changeStep(data: AppData, todoId: string, stepId: string, fn: (s: Todo['steps'][number]) => Todo['steps'][number] | null): AppData {
  const todo = findTodo(data, todoId)
  if (!todo.steps.some((s) => s.id === stepId)) throw new Error('Der Schritt wurde nicht gefunden.')
  const steps = todo.steps.flatMap((s) => {
    if (s.id !== stepId) return [s]
    const n = fn(s)
    return n ? [n] : []
  })
  return replaceTodo(data, { ...todo, steps })
}

export const toggleStep = (data: AppData, todoId: string, stepId: string): AppData => changeStep(data, todoId, stepId, (s) => ({ ...s, done: !s.done }))
export const updateStep = (data: AppData, todoId: string, stepId: string, title: string): AppData =>
  changeStep(data, todoId, stepId, (s) => ({ ...s, title: cleanTodoTitle(title, 'Schritt') }))
export const deleteStep = (data: AppData, todoId: string, stepId: string): AppData => changeStep(data, todoId, stepId, () => null)

function cleanListInput(input: TodoListInput): TodoListInput {
  const name = input.name.trim()
  if (!name) throw new Error('Bitte einen Namen für die Liste eingeben.')
  if (name.length > TODO_LIMITS.listName) throw new Error(`Der Name ist zu lang (höchstens ${TODO_LIMITS.listName} Zeichen).`)
  if (!(TODO_COLORS as readonly string[]).includes(input.color)) throw new Error('Ungültige Farbe.')
  if (!(TODO_ICONS as readonly string[]).includes(input.icon)) throw new Error('Ungültiges Symbol.')
  return { name, color: input.color, icon: input.icon }
}

/** New own list at the end of „Meine Listen“. */
export function addList(data: AppData, input: TodoListInput, meta: { id: string; createdAt: number } = newMeta()): AppData {
  const order = data.todoLists.reduce((max, l) => Math.max(max, l.order), 0) + 1
  return { ...data, todoLists: [...data.todoLists, { id: meta.id, createdAt: meta.createdAt, order, ...cleanListInput(input) }] }
}

/** Name, colour and symbol of a list. */
export function updateList(data: AppData, id: string, input: TodoListInput): AppData {
  if (!data.todoLists.some((l) => l.id === id)) throw new Error('Die Liste wurde nicht gefunden.')
  const clean = cleanListInput(input)
  return { ...data, todoLists: data.todoLists.map((l) => (l.id === id ? { ...l, ...clean } : l)) }
}

export function renameList(data: AppData, id: string, name: string): AppData {
  const list = data.todoLists.find((l) => l.id === id)
  if (!list) throw new Error('Die Liste wurde nicht gefunden.')
  return updateList(data, id, { name, color: list.color, icon: list.icon })
}

/** Deletes a list together with its tasks (the UI asks first; undo via `restoreList`). */
export function deleteList(data: AppData, id: string): AppData {
  return { ...data, todoLists: data.todoLists.filter((l) => l.id !== id), todos: data.todos.filter((t) => t.listId !== id) }
}

/** Undo of `deleteList`: the list and exactly its tasks come back. */
export function restoreList(data: AppData, list: TodoList, todos: Todo[]): AppData {
  if (data.todoLists.some((l) => l.id === list.id)) throw new Error('Die Liste existiert schon.')
  const ids = new Set(data.todos.map((t) => t.id))
  return { ...data, todoLists: [...data.todoLists, list], todos: [...data.todos, ...todos.filter((t) => !ids.has(t.id))] }
}
