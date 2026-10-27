import type { AppData, Category, Transaction } from './types'
import { addDays } from './dates'

export function currentBalance(data: AppData): number {
  let sum = data.settings.startBalanceCents
  for (const t of data.transactions) {
    sum += t.kind === 'income' ? t.amountCents : -t.amountCents
  }
  return sum
}

/** Newest first: date desc, then createdAt desc. */
export function compareTransactionsDesc(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return b.createdAt - a.createdAt
}

export interface CategorySum {
  categoryId: string
  name: string
  cents: number
  /** Percent of the period's total of the same kind, rounded to one decimal. */
  percent: number
}

export interface RangeTotals {
  incomeCents: number
  expenseCents: number
  expenseByCategory: CategorySum[]
  incomeByCategory: CategorySum[]
  /** Newest first. */
  transactions: Transaction[]
}

function categorySums(
  sums: Map<string, number>,
  total: number,
  names: Map<string, string>,
): CategorySum[] {
  return [...sums.entries()]
    .map(([categoryId, cents]) => ({
      categoryId,
      name: names.get(categoryId) ?? 'Unbekannt',
      cents,
      percent: total > 0 ? Math.round((cents / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.cents - a.cents || a.name.localeCompare(b.name, 'de'))
}

/** Totals and per-category sums for the inclusive date range [from, to] (shared by week and month). */
export function summarizeRange(
  transactions: Transaction[],
  categories: Category[],
  from: string,
  to: string,
): RangeTotals {
  const inRange = transactions
    .filter((t) => t.date >= from && t.date <= to)
    .sort(compareTransactionsDesc)

  let incomeCents = 0
  let expenseCents = 0
  const expenseSums = new Map<string, number>()
  const incomeSums = new Map<string, number>()
  for (const t of inRange) {
    const sums = t.kind === 'income' ? incomeSums : expenseSums
    if (t.kind === 'income') incomeCents += t.amountCents
    else expenseCents += t.amountCents
    sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amountCents)
  }

  const names = new Map(categories.map((c) => [c.id, c.name]))
  return {
    incomeCents,
    expenseCents,
    expenseByCategory: categorySums(expenseSums, expenseCents, names),
    incomeByCategory: categorySums(incomeSums, incomeCents, names),
    transactions: inRange,
  }
}

export interface WeekSummary {
  incomeCents: number
  expenseCents: number
  saldoCents: number
  byCategory: CategorySum[]
  transactions: Transaction[]
}

export function weekSummary(
  transactions: Transaction[],
  categories: Category[],
  weekStart: string,
): WeekSummary {
  const r = summarizeRange(transactions, categories, weekStart, addDays(weekStart, 6))
  return {
    incomeCents: r.incomeCents,
    expenseCents: r.expenseCents,
    saldoCents: r.incomeCents - r.expenseCents,
    byCategory: r.expenseByCategory,
    transactions: r.transactions,
  }
}
