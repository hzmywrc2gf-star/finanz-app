import { describe, expect, it } from 'vitest'
import { accountBalance, compareTransactionsDesc, totalBalance } from './calc'
import { createDefaultData } from './defaults'
import type { AppData, Transaction, Transfer } from './types'

let n = 0
const tx = (p: Partial<Transaction> & Pick<Transaction, 'kind' | 'amountCents' | 'date'>): Transaction => ({
  id: `t${n++}`,
  categoryId: p.kind === 'income' ? 'income-gehalt' : 'expense-lebensmittel',
  account: 'konto',
  createdAt: n,
  ...p,
})

describe('accountBalance (Konto)', () => {
  it('computes the example', () => {
    const data: AppData = {
      ...createDefaultData(),
      settings: { startBalanceCents: 100000, startCashCents: 0 },
      transactions: [
        tx({ kind: 'income', amountCents: 250000, date: '2026-10-01' }),
        tx({ kind: 'expense', amountCents: 4599, date: '2026-10-02' }),
        tx({ kind: 'expense', amountCents: 1201, date: '2026-10-03' }),
        tx({ kind: 'expense', amountCents: 80000, date: '2026-10-04' }),
      ],
    }
    expect(accountBalance(data, 'konto')).toBe(264200)
    expect(accountBalance(data, 'bargeld')).toBe(0)
  })
})

describe('accountBalance with cash and transfers', () => {
  const transfer = (direction: Transfer['direction'], amountCents: number): Transfer => ({
    id: `tr${n++}`, direction, amountCents, date: '2026-10-10', createdAt: n,
  })
  const data: AppData = {
    ...createDefaultData(),
    settings: { startBalanceCents: 100000, startCashCents: 2000 },
    transactions: [
      tx({ kind: 'income', amountCents: 250000, date: '2026-10-01' }),
      tx({ kind: 'expense', amountCents: 80000, date: '2026-10-04' }),
      tx({ kind: 'expense', amountCents: 4550, date: '2026-10-06', account: 'bargeld' }),
    ],
    transfers: [transfer('withdrawal', 20000), transfer('deposit', 5000)],
  }
  it('computes the example: Konto 2.550,00, Bargeld 124,50, Gesamt 2.674,50', () => {
    expect(accountBalance(data, 'konto')).toBe(255000) // 1.000 + 2.500 − 800 − 200 + 50
    expect(accountBalance(data, 'bargeld')).toBe(12450) // 20 + 200 − 45,50 − 50
    expect(totalBalance(data)).toBe(267450)
  })
  it('transfers leave the total unchanged and cash income counts for the cash only', () => {
    const noTransfers = { ...data, transfers: [] }
    expect(totalBalance(noTransfers)).toBe(totalBalance(data))
    const more = { ...data, transactions: [...data.transactions, tx({ kind: 'income', amountCents: 1000, date: '2026-10-07', account: 'bargeld' })] }
    expect(accountBalance(more, 'konto')).toBe(255000)
    expect(accountBalance(more, 'bargeld')).toBe(13450)
  })
  it('cash can go negative', () => {
    expect(accountBalance({ ...data, transfers: [] }, 'bargeld')).toBe(-2550)
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
