import { describe, expect, it } from 'vitest'
import { currentBalance, weekSummary } from './calc'
import { createDefaultData } from './defaults'
import type { AppData, Transaction } from './types'

let n = 0
const tx = (p: Partial<Transaction> & Pick<Transaction, 'kind' | 'amountCents' | 'date'>): Transaction => ({
  id: `t${n++}`,
  categoryId: p.kind === 'income' ? 'income-gehalt' : 'expense-lebensmittel',
  createdAt: n,
  ...p,
})

describe('currentBalance', () => {
  it('computes the example', () => {
    const data: AppData = {
      ...createDefaultData(),
      settings: { startBalanceCents: 100000 },
      transactions: [
        tx({ kind: 'income', amountCents: 250000, date: '2026-10-01' }),
        tx({ kind: 'expense', amountCents: 4599, date: '2026-10-02' }),
        tx({ kind: 'expense', amountCents: 1201, date: '2026-10-03' }),
        tx({ kind: 'expense', amountCents: 80000, date: '2026-10-04' }),
      ],
    }
    expect(currentBalance(data)).toBe(264200)
  })
})

describe('weekSummary', () => {
  const cats = createDefaultData().categories
  const txs = [
    tx({ kind: 'expense', amountCents: 2000, date: '2026-10-26', categoryId: 'expense-lebensmittel' }),
    tx({ kind: 'expense', amountCents: 1000, date: '2026-11-01', categoryId: 'expense-freizeit' }),
    tx({ kind: 'income', amountCents: 5000, date: '2026-10-28' }),
    tx({ kind: 'expense', amountCents: 9999, date: '2026-11-02' }), // next week
    tx({ kind: 'expense', amountCents: 9999, date: '2026-10-25' }), // previous week
  ]
  it('sums, percentages and sorting', () => {
    const s = weekSummary(txs, cats, '2026-10-26')
    expect(s.expenseCents).toBe(3000)
    expect(s.incomeCents).toBe(5000)
    expect(s.saldoCents).toBe(2000)
    expect(s.byCategory.map((c) => [c.name, c.cents, c.percent])).toEqual([
      ['Lebensmittel', 2000, 66.7],
      ['Freizeit', 1000, 33.3],
    ])
    expect(s.transactions.map((t) => t.date)).toEqual(['2026-11-01', '2026-10-28', '2026-10-26'])
  })
  it('sorts same-day by createdAt desc and handles empty week', () => {
    const a = tx({ kind: 'expense', amountCents: 1, date: '2026-10-26', createdAt: 1 })
    const b = tx({ kind: 'expense', amountCents: 2, date: '2026-10-26', createdAt: 2 })
    expect(weekSummary([a, b], cats, '2026-10-26').transactions[0]).toBe(b)
    const e = weekSummary([], cats, '2026-10-26')
    expect(e.byCategory).toEqual([])
    expect(e.saldoCents).toBe(0)
  })
})
