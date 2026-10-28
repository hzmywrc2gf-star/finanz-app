import { describe, expect, it } from 'vitest'
import { accountBalance } from './calc'
import { createDefaultData } from './defaults'
import { balanceHistory, hasHistory } from './history'
import type { AppData, Transaction, Transfer } from './types'

let n = 0
const tx = (p: Partial<Transaction> & Pick<Transaction, 'kind' | 'amountCents' | 'date'>): Transaction => ({
  id: `t${n++}`,
  categoryId: p.kind === 'income' ? 'income-gehalt' : 'expense-lebensmittel',
  account: 'konto',
  createdAt: n,
  ...p,
})
const tr = (direction: Transfer['direction'], amountCents: number, date: string): Transfer => ({
  id: `tr${n++}`, direction, amountCents, date, createdAt: n,
})
const base = (over: Partial<AppData>): AppData => ({
  ...createDefaultData(),
  settings: { startBalanceCents: 100000, startCashCents: 5000 },
  ...over,
})

describe('balanceHistory', () => {
  it('uses month ends as boundaries and the full balance for the current month', () => {
    const data = base({
      transactions: [
        tx({ kind: 'income', amountCents: 10000, date: '2026-08-31' }),
        tx({ kind: 'expense', amountCents: 2500, date: '2026-09-01' }),
        tx({ kind: 'expense', amountCents: 500, date: '2026-09-30' }),
        tx({ kind: 'income', amountCents: 700, date: '2026-10-28' }),
      ],
    })
    const h = balanceHistory(data, '2026-10-28', 3)
    expect(h).toEqual([
      { month: '2026-08', cents: 110000 },
      { month: '2026-09', cents: 107000 },
      { month: '2026-10', cents: 107700 },
    ])
  })

  it('handles transfers and ignores cash bookings', () => {
    const data = base({
      transactions: [
        tx({ kind: 'expense', amountCents: 9999, date: '2026-09-10', account: 'bargeld' }),
        tx({ kind: 'income', amountCents: 1000, date: '2026-09-11' }),
      ],
      transfers: [tr('withdrawal', 4000, '2026-09-15'), tr('deposit', 1500, '2026-10-02')],
    })
    const h = balanceHistory(data, '2026-10-05', 2)
    expect(h.map((p) => p.cents)).toEqual([100000 + 1000 - 4000, 100000 + 1000 - 4000 + 1500])
  })

  it('counts future-dated entries only in the current month, like accountBalance', () => {
    const data = base({ transactions: [tx({ kind: 'expense', amountCents: 300, date: '2026-12-24' })] })
    const h = balanceHistory(data, '2026-10-28', 2)
    expect(h[0].cents).toBe(100000)
    expect(h[1].cents).toBe(99700)
    expect(h[1].cents).toBe(accountBalance(data, 'konto'))
  })

  it('crosses the year boundary', () => {
    const data = base({ transactions: [tx({ kind: 'income', amountCents: 100, date: '2025-12-31' })] })
    const h = balanceHistory(data, '2026-02-10', 4)
    expect(h.map((p) => p.month)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
    expect(h.map((p) => p.cents)).toEqual([100000, 100100, 100100, 100100])
  })

  it('current month equals accountBalance(konto)', () => {
    const data = base({
      transactions: [tx({ kind: 'income', amountCents: 123, date: '2026-01-02' }), tx({ kind: 'expense', amountCents: 45, date: '2026-10-03' })],
      transfers: [tr('withdrawal', 700, '2026-10-04')],
    })
    expect(balanceHistory(data, '2026-10-28').at(-1)!.cents).toBe(accountBalance(data, 'konto'))
  })

  it('reproduces the seed example (Mai … Okt)', () => {
    // 2.400 € start; May +1.602,40 €, Jun +1.463,00 €, Jul +1.706,20 €, Aug +1.565,10 €, Sep +1.377,80 €, Oct +1.514,61 € − 100 € withdrawal
    const monthly: [string, number][] = [['05', 160240], ['06', 146300], ['07', 170620], ['08', 156510], ['09', 137780], ['10', 151461]]
    const data = base({
      settings: { startBalanceCents: 240000, startCashCents: 5000 },
      transactions: monthly.map(([m, c]) => tx({ kind: 'income', amountCents: c, date: `2026-${m}-15` })),
      transfers: [tr('withdrawal', 10000, '2026-10-05')],
    })
    expect(balanceHistory(data, '2026-10-28').map((p) => p.cents)).toEqual([400240, 546540, 717160, 873670, 1011450, 1152911])
  })
})

describe('hasHistory', () => {
  it('is false for fresh data and for entries only in the current month', () => {
    expect(hasHistory(base({}), '2026-10-28')).toBe(false)
    expect(hasHistory(base({ transactions: [tx({ kind: 'income', amountCents: 1, date: '2026-10-01' })] }), '2026-10-28')).toBe(false)
  })
  it('is true once something lies before the current month', () => {
    expect(hasHistory(base({ transfers: [tr('deposit', 1, '2026-09-30')] }), '2026-10-28')).toBe(true)
  })
})
