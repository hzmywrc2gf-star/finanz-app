import { describe, expect, it } from 'vitest'
import { monthSummary, monthTrend, niceAxisMax } from './month'
import { createDefaultData } from './defaults'
import type { AppData, Transaction } from './types'

let n = 0
const tx = (p: Partial<Transaction> & Pick<Transaction, 'kind' | 'amountCents' | 'date'>): Transaction => ({
  id: `t${n++}`,
  categoryId: p.kind === 'income' ? 'income-gehalt' : 'expense-lebensmittel',
  createdAt: n,
  ...p,
})
const withTx = (transactions: Transaction[]): AppData => ({ ...createDefaultData(), transactions })

describe('monthSummary', () => {
  const data = withTx([
    tx({ kind: 'income', amountCents: 250000, date: '2026-10-01' }),
    tx({ kind: 'expense', amountCents: 80000, date: '2026-10-01', categoryId: 'expense-fixkosten', recurringId: 'r1' }),
    tx({ kind: 'expense', amountCents: 5000, date: '2026-10-31', categoryId: 'expense-lebensmittel' }),
    tx({ kind: 'expense', amountCents: 99999, date: '2026-11-01' }), // next month
    tx({ kind: 'expense', amountCents: 99999, date: '2026-09-30' }), // previous month, counted only there
    tx({ kind: 'income', amountCents: 10000, date: '2026-09-15' }),
    tx({ kind: 'expense', amountCents: 2000, date: '2026-09-02', categoryId: 'expense-fixkosten' }),
  ])

  it('respects month boundaries (31.10. in, 01.11. out)', () => {
    const s = monthSummary(data, '2026-10-27')
    expect(s.transactionCount).toBe(3)
    expect(s.expenseCents).toBe(85000)
    expect(s.incomeCents).toBe(250000)
    expect(monthSummary(data, '2026-11-01').expenseCents).toBe(99999)
  })

  it('computes saldo, savings rate and recurring share', () => {
    const s = monthSummary(data, '2026-10-01')
    expect(s.saldoCents).toBe(165000)
    expect(s.savingsRate).toBe(66)
    expect(s.recurringExpenseCents).toBe(80000)
  })

  it('rounds the savings rate to one decimal', () => {
    const s = monthSummary(withTx([tx({ kind: 'income', amountCents: 300, date: '2026-10-01' }), tx({ kind: 'expense', amountCents: 100, date: '2026-10-02' })]), '2026-10-01')
    expect(s.savingsRate).toBe(66.7)
  })

  it('has no savings rate without income and handles negative saldo', () => {
    const s = monthSummary(withTx([tx({ kind: 'expense', amountCents: 1000, date: '2026-10-05' })]), '2026-10-01')
    expect(s.savingsRate).toBeNull()
    expect(s.saldoCents).toBe(-1000)
    expect(s.recurringExpenseCents).toBe(0)
    const neg = monthSummary(withTx([tx({ kind: 'income', amountCents: 1000, date: '2026-10-01' }), tx({ kind: 'expense', amountCents: 1500, date: '2026-10-05' })]), '2026-10-01')
    expect(neg.saldoCents).toBe(-500)
    expect(neg.savingsRate).toBe(-50)
  })

  it('reports the previous month and per-category prevCents', () => {
    const s = monthSummary(data, '2026-10-01')
    expect(s.previous).toEqual({ incomeCents: 10000, expenseCents: 101999, saldoCents: -91999, transactionCount: 3 })
    expect(s.expenseByCategory.map((c) => [c.name, c.cents, c.percent, c.prevCents])).toEqual([
      ['Fixkosten', 80000, 94.1, 2000],
      ['Lebensmittel', 5000, 5.9, 99999],
    ])
    expect(s.incomeByCategory.map((c) => [c.name, c.cents, c.percent])).toEqual([['Gehalt', 250000, 100]])
  })

  it('uses December → January across the year boundary', () => {
    const d = withTx([
      tx({ kind: 'income', amountCents: 700, date: '2026-12-31' }),
      tx({ kind: 'expense', amountCents: 300, date: '2026-12-01' }),
      tx({ kind: 'expense', amountCents: 50, date: '2027-01-01' }),
    ])
    const s = monthSummary(d, '2027-01-15')
    expect(s.expenseCents).toBe(50)
    expect(s.previous).toEqual({ incomeCents: 700, expenseCents: 300, saldoCents: 400, transactionCount: 2 })
  })

  it('lists the 5 largest expenses, ties newest first', () => {
    const d = withTx([
      tx({ kind: 'expense', amountCents: 100, date: '2026-10-01' }),
      tx({ kind: 'expense', amountCents: 500, date: '2026-10-02', note: 'a' }),
      tx({ kind: 'expense', amountCents: 500, date: '2026-10-09', note: 'b' }),
      tx({ kind: 'expense', amountCents: 900, date: '2026-10-03' }),
      tx({ kind: 'expense', amountCents: 300, date: '2026-10-04' }),
      tx({ kind: 'expense', amountCents: 200, date: '2026-10-05' }),
      tx({ kind: 'income', amountCents: 99999, date: '2026-10-06' }),
    ])
    const top = monthSummary(d, '2026-10-01').topExpenses
    expect(top.map((t) => [t.amountCents, t.note])).toEqual([[900, undefined], [500, 'b'], [500, 'a'], [300, undefined], [200, undefined]])
  })

  it('is empty for a month without bookings', () => {
    const s = monthSummary(withTx([]), '2026-10-01')
    expect(s.transactionCount).toBe(0)
    expect(s.expenseByCategory).toEqual([])
    expect(s.topExpenses).toEqual([])
    expect(s.previous.transactionCount).toBe(0)
  })
})

describe('monthTrend', () => {
  const data = withTx([
    tx({ kind: 'income', amountCents: 1000, date: '2026-12-10' }),
    tx({ kind: 'expense', amountCents: 400, date: '2027-01-31' }),
    tx({ kind: 'expense', amountCents: 100, date: '2027-02-01' }),
  ])
  it('returns 6 months oldest first across a year boundary, zero months included', () => {
    const t = monthTrend(data, '2027-02-20')
    expect(t.map((p) => p.month)).toEqual(['2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01', '2027-01-01', '2027-02-01'])
    expect(t.map((p) => [p.incomeCents, p.expenseCents, p.saldoCents])).toEqual([
      [0, 0, 0], [0, 0, 0], [0, 0, 0], [1000, 0, 1000], [0, 400, -400], [0, 100, -100],
    ])
  })
  it('honours a custom count', () => {
    expect(monthTrend(data, '2027-01-01', 2).map((p) => p.month)).toEqual(['2026-12-01', '2027-01-01'])
  })
})

describe('niceAxisMax', () => {
  it('rounds up to tidy values', () => {
    expect(niceAxisMax(0)).toBe(0)
    expect(niceAxisMax(250000)).toBe(300000)
    expect(niceAxisMax(80000)).toBe(80000)
    expect(niceAxisMax(80001)).toBe(100000)
    expect(niceAxisMax(1)).toBe(1)
    expect(niceAxisMax(7)).toBe(8)
  })
})
