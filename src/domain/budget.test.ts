import { describe, expect, it } from 'vitest'
import { createDefaultData } from './defaults'
import { budgetAlerts, budgetStatus, monthBudgets } from './budget'
import { addCategory, addTransaction, addTransfer, setCategoryBudget } from '../state/actions'
import type { TransactionInput } from '../state/actions'
import type { AppData } from './types'

let n = 0
const tx = (d: AppData, date: string, amountCents: number, categoryId = 'expense-lebensmittel', kind: 'expense' | 'income' = 'expense', account: 'konto' | 'bargeld' = 'konto') =>
  addTransaction(d, { kind, amountCents, date, categoryId, account } as TransactionInput, { id: `t${++n}`, createdAt: n })

const withBudget = (cents = 40000, id = 'expense-lebensmittel') => setCategoryBudget(createDefaultData(), id, cents)
const item = (d: AppData, month = '2026-10-01', id = 'expense-lebensmittel') =>
  monthBudgets(d, month).items.find((i) => i.categoryId === id)!

describe('monthBudgets: month boundaries', () => {
  const d = tx(tx(tx(tx(withBudget(), '2026-09-30', 100), '2026-10-01', 200), '2026-10-31', 400), '2026-11-01', 800)
  it('counts 2026-10-31 in October and 2026-11-01 in November', () => {
    expect(item(d, '2026-10-27').spentCents).toBe(600)
    expect(item(d, '2026-11-15').spentCents).toBe(800)
    expect(item(d, '2026-09-01').spentCents).toBe(100)
  })
  it('handles December → January', () => {
    const y = tx(tx(withBudget(), '2026-12-31', 300), '2027-01-01', 500)
    expect(item(y, '2026-12-01').spentCents).toBe(300)
    expect(item(y, '2027-01-01').spentCents).toBe(500)
  })
})

describe('monthBudgets: spent', () => {
  it('only counts expenses of that category; income is ignored', () => {
    let d = withBudget()
    d = tx(d, '2026-10-05', 1000)
    d = tx(d, '2026-10-06', 2500, 'expense-freizeit')
    d = tx(d, '2026-10-07', 99900, 'income-gehalt', 'income')
    const i = item(d)
    expect(i.spentCents).toBe(1000)
    expect(i.remainingCents).toBe(39000)
    expect(i.name).toBe('Lebensmittel')
  })
  it('counts recurring-generated bookings but not planned future occurrences', () => {
    let d = withBudget()
    d = { ...d, transactions: [{ id: 'r', kind: 'expense', amountCents: 700, date: '2026-10-01', categoryId: 'expense-lebensmittel', account: 'konto', createdAt: 1, recurringId: 'rule' }] }
    d = {
      ...d,
      recurring: [{ id: 'rule', kind: 'expense', amountCents: 700, categoryId: 'expense-lebensmittel', interval: 'monthly', dayOfMonth: 30, startDate: '2026-10-01', bookedThrough: '2026-10-01', autoBook: true }],
    }
    expect(item(d).spentCents).toBe(700)
  })
})

describe('status thresholds', () => {
  it.each([
    [31999, 'ok'],
    [32000, 'warn'], // exactly 80 %
    [32001, 'warn'],
    [40000, 'warn'], // exactly 100 %
    [40001, 'over'], // 100 % + 1 cent
  ] as const)('spent %i of 40000 → %s', (spent, status) => {
    expect(budgetStatus(spent, 40000)).toBe(status)
    expect(item(tx(withBudget(), '2026-10-02', spent)).status).toBe(status)
  })
  it('is exact for budgets where float percent would be inexact', () => {
    expect(budgetStatus(79, 99)).toBe('ok') // 79,8 %
    expect(budgetStatus(80, 99)).toBe('warn') // 80,8 %
    expect(budgetStatus(7, 10)).toBe('ok')
    expect(budgetStatus(8, 10)).toBe('warn')
    expect(budgetStatus(11, 10)).toBe('over')
  })
  it('percent has one decimal; remaining may be negative', () => {
    const i = item(tx(withBudget(), '2026-10-02', 45000))
    expect(i.percent).toBe(112.5)
    expect(i.remainingCents).toBe(-5000)
    expect(item(tx(withBudget(), '2026-10-02', 36800)).percent).toBe(92)
    expect(item(tx(withBudget(300), '2026-10-02', 100)).percent).toBe(33.3)
  })
})

describe('monthBudgets: total and lists', () => {
  it('total only covers budgeted categories; items keep category order', () => {
    let d = setCategoryBudget(setCategoryBudget(createDefaultData(), 'expense-freizeit', 10000), 'expense-lebensmittel', 40000)
    d = tx(d, '2026-10-02', 30000)
    d = tx(d, '2026-10-03', 5000, 'expense-freizeit')
    d = tx(d, '2026-10-04', 70000, 'expense-fixkosten') // unbudgeted, not part of the total
    const r = monthBudgets(d, '2026-10-01')
    expect(r.items.map((i) => i.categoryId)).toEqual(['expense-lebensmittel', 'expense-freizeit'])
    expect(r.total).toEqual({ budgetCents: 50000, spentCents: 35000, remainingCents: 15000, percent: 70, status: 'ok' })
  })
  it('lists unbudgeted categories with spending, highest first', () => {
    let d = addCategory(createDefaultData(), 'expense', 'Haustier', 'c1')
    d = setCategoryBudget(d, 'expense-lebensmittel', 40000)
    d = tx(d, '2026-10-02', 1000, 'expense-mobilität')
    d = tx(d, '2026-10-02', 3000, 'c1')
    d = tx(d, '2026-10-02', 500, 'expense-lebensmittel')
    d = tx(d, '2026-11-02', 9000, 'expense-freizeit') // other month
    expect(monthBudgets(d, '2026-10-01').unbudgeted).toEqual([
      { categoryId: 'c1', name: 'Haustier', spentCents: 3000 },
      { categoryId: 'expense-mobilität', name: 'Mobilität', spentCents: 1000 },
    ])
  })
  it('no budgets: empty items and zero total', () => {
    const r = monthBudgets(createDefaultData(), '2026-10-01')
    expect(r.items).toEqual([])
    expect(r.total).toEqual({ budgetCents: 0, spentCents: 0, remainingCents: 0, percent: 0, status: 'ok' })
  })
})

describe('budgetAlerts', () => {
  it('returns warn/over items of the current month, highest percent first', () => {
    let d = setCategoryBudget(setCategoryBudget(setCategoryBudget(createDefaultData(), 'expense-lebensmittel', 40000), 'expense-freizeit', 10000), 'expense-kleidung', 10000)
    d = tx(d, '2026-10-02', 36800) // 92 %
    d = tx(d, '2026-10-02', 11250, 'expense-freizeit') // 112,5 %
    d = tx(d, '2026-10-02', 7999, 'expense-kleidung') // ok
    d = tx(d, '2026-09-02', 99999, 'expense-kleidung') // last month
    const a = budgetAlerts(d, '2026-10-27')
    expect(a.map((i) => [i.name, i.status, i.percent])).toEqual([
      ['Freizeit', 'over', 112.5],
      ['Lebensmittel', 'warn', 92],
    ])
    expect(budgetAlerts(d, '2026-11-02')).toEqual([])
  })
})

describe('cash bookings and transfers in budgets', () => {
  it('counts cash expenses against the category budget, transfers never', () => {
    let d = tx(tx(withBudget(), '2026-10-05', 5000), '2026-10-06', 4550, 'expense-lebensmittel', 'expense', 'bargeld')
    d = addTransfer(d, { direction: 'withdrawal', amountCents: 20000, date: '2026-10-06' }, { id: 'w', createdAt: 1 })
    d = addTransfer(d, { direction: 'deposit', amountCents: 5000, date: '2026-10-07' }, { id: 'd', createdAt: 2 })
    const i = item(d)
    expect(i.spentCents).toBe(9550)
    expect(i.remainingCents).toBe(30450)
    expect(monthBudgets(d, '2026-10-01').total.spentCents).toBe(9550)
    expect(monthBudgets(d, '2026-10-01').unbudgeted).toEqual([])
  })
})
