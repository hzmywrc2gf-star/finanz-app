import type { AppData, Category, Kind, Transaction } from '../domain/types'
import { FALLBACK_NAME } from '../domain/defaults'
import { isValidISODate } from '../domain/dates'

export interface TransactionInput {
  kind: Kind
  amountCents: number
  date: string
  categoryId: string
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
    createdAt: existing.createdAt,
  }
  const note = cleanNote(input.note)
  if (note) updated.note = note
  return { ...data, transactions: data.transactions.map((t) => (t.id === id ? updated : t)) }
}

export function deleteTransaction(data: AppData, id: string): AppData {
  return { ...data, transactions: data.transactions.filter((t) => t.id !== id) }
}

export function setStartBalance(data: AppData, cents: number): AppData {
  if (!Number.isSafeInteger(cents)) throw new Error('Ungültiger Betrag.')
  return { ...data, settings: { ...data.settings, startBalanceCents: cents } }
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
  }
}
