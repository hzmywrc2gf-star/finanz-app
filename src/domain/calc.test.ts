import { describe, expect, it } from 'vitest'
import { compareTransactionsDesc, currentBalance } from './calc'
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

describe('compareTransactionsDesc', () => {
  it('sorts date desc, then createdAt desc', () => {
    const a = tx({ kind: 'expense', amountCents: 1, date: '2026-10-26', createdAt: 1 })
    const b = tx({ kind: 'expense', amountCents: 2, date: '2026-10-26', createdAt: 2 })
    const c = tx({ kind: 'expense', amountCents: 3, date: '2026-10-28', createdAt: 0 })
    expect([a, b, c].sort(compareTransactionsDesc)).toEqual([c, b, a])
  })
})
