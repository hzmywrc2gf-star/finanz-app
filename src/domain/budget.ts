import type { AppData } from './types'
import { monthEnd, monthStart } from './dates'

export type BudgetStatus = 'ok' | 'warn' | 'over'

export interface BudgetItem {
  categoryId: string
  name: string
  budgetCents: number
  spentCents: number
  /** budget − spent; negative when over budget. */
  remainingCents: number
  /** spent / budget in percent, rounded to one decimal. */
  percent: number
  status: BudgetStatus
}

export interface BudgetTotal {
  budgetCents: number
  spentCents: number
  remainingCents: number
  percent: number
  status: BudgetStatus
}

export interface UnbudgetedSpending {
  categoryId: string
  name: string
  spentCents: number
}

export interface MonthBudgets {
  items: BudgetItem[]
  /** Over the budgeted categories only. */
  total: BudgetTotal
  /** Expense categories without budget that have spending in the month, highest first. */
  unbudgeted: UnbudgetedSpending[]
}

/** Exact integer comparison, no float rounding at the thresholds: below 80 % ok, up to 100 % warn, beyond over. */
export function budgetStatus(spentCents: number, budgetCents: number): BudgetStatus {
  if (spentCents > budgetCents) return 'over'
  if (spentCents * 100 >= budgetCents * 80) return 'warn'
  return 'ok'
}

function percentOf(spentCents: number, budgetCents: number): number {
  return budgetCents > 0 ? Math.round((spentCents * 1000) / budgetCents) / 10 : 0
}

/** Booked expenses per category within the calendar month of `month` (planned occurrences do not count). */
export function monthBudgets(data: AppData, month: string): MonthBudgets {
  const from = monthStart(month)
  const to = monthEnd(month)
  const spent = new Map<string, number>()
  for (const t of data.transactions) {
    if (t.kind !== 'expense' || t.date < from || t.date > to) continue
    spent.set(t.categoryId, (spent.get(t.categoryId) ?? 0) + t.amountCents)
  }

  const items: BudgetItem[] = []
  const unbudgeted: UnbudgetedSpending[] = []
  let budgetSum = 0
  let spentSum = 0
  for (const c of data.categories) {
    if (c.kind !== 'expense') continue
    const spentCents = spent.get(c.id) ?? 0
    if (c.monthlyBudgetCents === undefined) {
      if (spentCents > 0) unbudgeted.push({ categoryId: c.id, name: c.name, spentCents })
      continue
    }
    const budgetCents = c.monthlyBudgetCents
    budgetSum += budgetCents
    spentSum += spentCents
    items.push({
      categoryId: c.id,
      name: c.name,
      budgetCents,
      spentCents,
      remainingCents: budgetCents - spentCents,
      percent: percentOf(spentCents, budgetCents),
      status: budgetStatus(spentCents, budgetCents),
    })
  }
  unbudgeted.sort((a, b) => b.spentCents - a.spentCents || a.name.localeCompare(b.name, 'de'))

  return {
    items,
    total: {
      budgetCents: budgetSum,
      spentCents: spentSum,
      remainingCents: budgetSum - spentSum,
      percent: percentOf(spentSum, budgetSum),
      status: budgetSum > 0 ? budgetStatus(spentSum, budgetSum) : 'ok',
    },
    unbudgeted,
  }
}

/** Budgets of the current month that are nearly used up (warn) or exceeded (over), most used first. */
export function budgetAlerts(data: AppData, today: string): BudgetItem[] {
  return monthBudgets(data, today)
    .items.filter((i) => i.status !== 'ok')
    .sort((a, b) => b.percent - a.percent)
}
