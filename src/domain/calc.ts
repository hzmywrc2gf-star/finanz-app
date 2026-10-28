import type { Account, AppData, Category, Transaction } from './types'

/**
 * Balance of one account. Transfers move money between the accounts:
 * a withdrawal lowers the Konto and raises the cash, a deposit does the opposite.
 */
export function accountBalance(data: AppData, account: Account): number {
  let sum = account === 'konto' ? data.settings.startBalanceCents : data.settings.startCashCents
  for (const t of data.transactions) {
    if (t.account === account) sum += t.kind === 'income' ? t.amountCents : -t.amountCents
  }
  for (const tr of data.transfers) {
    const toCash = tr.direction === 'withdrawal'
    sum += toCash === (account === 'bargeld') ? tr.amountCents : -tr.amountCents
  }
  return sum
}

/** Konto + Bargeld. */
export function totalBalance(data: AppData): number {
  return accountBalance(data, 'konto') + accountBalance(data, 'bargeld')
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

/** Totals and per-category sums for the inclusive date range [from, to] (used by the month summary). */
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
