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
  /** Percent of the week's expense total, rounded to one decimal. */
  percent: number
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
  const weekEnd = addDays(weekStart, 6)
  const inWeek = transactions
    .filter((t) => t.date >= weekStart && t.date <= weekEnd)
    .sort(compareTransactionsDesc)

  let incomeCents = 0
  let expenseCents = 0
  const sums = new Map<string, number>()
  for (const t of inWeek) {
    if (t.kind === 'income') {
      incomeCents += t.amountCents
    } else {
      expenseCents += t.amountCents
      sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amountCents)
    }
  }

  const names = new Map(categories.map((c) => [c.id, c.name]))
  const byCategory: CategorySum[] = [...sums.entries()]
    .map(([categoryId, cents]) => ({
      categoryId,
      name: names.get(categoryId) ?? 'Unbekannt',
      cents,
      percent: expenseCents > 0 ? Math.round((cents / expenseCents) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.cents - a.cents || a.name.localeCompare(b.name, 'de'))

  return {
    incomeCents,
    expenseCents,
    saldoCents: incomeCents - expenseCents,
    byCategory,
    transactions: inWeek,
  }
}
