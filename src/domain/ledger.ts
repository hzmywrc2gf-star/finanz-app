import type { Account, AppData, Transaction, Transfer, TransferDirection } from './types'
import { monthStart } from './dates'
import { centsToInputString, formatCents } from './money'

export const TRANSFER_LABELS: Record<TransferDirection, string> = {
  withdrawal: 'Abhebung',
  deposit: 'Einzahlung',
}

/** A booking or a transfer, as shown together in the start page lists. */
export type LedgerEntry =
  | { type: 'transaction'; date: string; createdAt: number; transaction: Transaction }
  | { type: 'transfer'; date: string; createdAt: number; transfer: Transfer }

export interface LedgerMonth {
  /** First day of the month, 'YYYY-MM-01'. */
  month: string
  /** Newest first. */
  entries: LedgerEntry[]
}

const normalize = (s: string) => s.replace(/ /g, ' ').toLowerCase()

/** Text searched for an amount: "1.234,56 €" and the plain input form "1234,56". */
const amountText = (cents: number) => `${formatCents(cents)} ${centsToInputString(cents)}`

function matches(entry: LedgerEntry, query: string, categoryNames: Map<string, string>): boolean {
  const parts =
    entry.type === 'transaction'
      ? [entry.transaction.note, categoryNames.get(entry.transaction.categoryId), amountText(entry.transaction.amountCents)]
      : [entry.transfer.note, TRANSFER_LABELS[entry.transfer.direction], amountText(entry.transfer.amountCents)]
  return normalize(parts.filter(Boolean).join(' ')).includes(query)
}

export interface LedgerOptions {
  /** 'bargeld': only cash bookings (plus all transfers, they touch the cash). */
  account?: Account
  /** Case-insensitive search in note, category name and amount. */
  query?: string
}

/** Bookings and transfers, newest first (date desc, then createdAt desc). */
export function ledgerEntries(data: AppData, { account, query }: LedgerOptions = {}): LedgerEntry[] {
  const names = new Map(data.categories.map((c) => [c.id, c.name]))
  const q = normalize(query ?? '').trim()
  const all: LedgerEntry[] = [
    ...data.transactions
      .filter((t) => !account || t.account === account)
      .map((transaction): LedgerEntry => ({ type: 'transaction', date: transaction.date, createdAt: transaction.createdAt, transaction })),
    ...data.transfers.map((transfer): LedgerEntry => ({ type: 'transfer', date: transfer.date, createdAt: transfer.createdAt, transfer })),
  ]
  return all
    .filter((e) => !q || matches(e, q, names))
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : b.createdAt - a.createdAt))
}

/** Groups already sorted entries by calendar month, keeping the order. */
export function groupByMonth(entries: LedgerEntry[]): LedgerMonth[] {
  const out: LedgerMonth[] = []
  for (const e of entries) {
    const month = monthStart(e.date)
    const last = out[out.length - 1]
    if (last && last.month === month) last.entries.push(e)
    else out.push({ month, entries: [e] })
  }
  return out
}
