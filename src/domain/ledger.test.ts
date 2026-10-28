import { describe, expect, it } from 'vitest'
import { createDefaultData } from './defaults'
import { groupByMonth, ledgerEntries } from './ledger'
import type { LedgerEntry } from './ledger'
import type { AppData, Transaction, Transfer } from './types'

const tx = (p: Partial<Transaction> & Pick<Transaction, 'id' | 'date' | 'amountCents'>): Transaction => ({
  kind: 'expense',
  categoryId: 'expense-lebensmittel',
  account: 'konto',
  createdAt: 1,
  ...p,
})
const tr = (p: Partial<Transfer> & Pick<Transfer, 'id' | 'date'>): Transfer => ({
  direction: 'withdrawal',
  amountCents: 20000,
  createdAt: 1,
  ...p,
})

const data: AppData = {
  ...createDefaultData(),
  transactions: [
    tx({ id: 'a', date: '2026-09-30', amountCents: 4599, note: 'Wocheneinkauf' }),
    tx({ id: 'b', date: '2026-10-02', amountCents: 80000, categoryId: 'expense-fixkosten', note: 'Miete' }),
    tx({ id: 'c', date: '2026-10-20', amountCents: 2000, categoryId: 'expense-freizeit', note: 'Kino' }),
    tx({ id: 'd', date: '2026-10-20', amountCents: 4550, account: 'bargeld', createdAt: 5 }),
  ],
  transfers: [tr({ id: 'w', date: '2026-10-20', createdAt: 3, note: 'Geldautomat' }), tr({ id: 'e', date: '2026-10-21', direction: 'deposit', amountCents: 5000 })],
}
const ids = (entries: LedgerEntry[]) => entries.map((e) => (e.type === 'transaction' ? e.transaction.id : e.transfer.id))

describe('ledgerEntries', () => {
  it('lists bookings and transfers together, newest first (date, then createdAt)', () => {
    expect(ids(ledgerEntries(data))).toEqual(['e', 'd', 'w', 'c', 'b', 'a'])
  })
  it('cash view: cash bookings plus all transfers', () => {
    expect(ids(ledgerEntries(data, { account: 'bargeld' }))).toEqual(['e', 'd', 'w'])
  })
  it('searches note, category name and amount, case-insensitively', () => {
    expect(ids(ledgerEntries(data, { query: 'kino' }))).toEqual(['c'])
    expect(ids(ledgerEntries(data, { query: '  KINO ' }))).toEqual(['c'])
    expect(ids(ledgerEntries(data, { query: 'fixkosten' }))).toEqual(['b'])
    expect(ids(ledgerEntries(data, { query: '800' }))).toEqual(['b'])
    expect(ids(ledgerEntries(data, { query: '45,99' }))).toEqual(['a'])
    expect(ids(ledgerEntries(data, { query: '45' }))).toEqual(['d', 'a'])
    expect(ids(ledgerEntries(data, { query: '45,99 €' }))).toEqual(['a'])
    expect(ids(ledgerEntries(data, { query: 'zzz' }))).toEqual([])
  })
  it('finds transfers by label, note and amount', () => {
    expect(ids(ledgerEntries(data, { query: 'abhebung' }))).toEqual(['w'])
    expect(ids(ledgerEntries(data, { query: 'einzahlung' }))).toEqual(['e'])
    expect(ids(ledgerEntries(data, { query: 'geldautomat' }))).toEqual(['w'])
    expect(ids(ledgerEntries(data, { query: '200,00' }))).toEqual(['w'])
  })
})

describe('groupByMonth', () => {
  it('groups sorted entries by calendar month', () => {
    const groups = groupByMonth(ledgerEntries(data))
    expect(groups.map((g) => [g.month, g.entries.length])).toEqual([['2026-10-01', 5], ['2026-09-01', 1]])
    expect(groupByMonth([])).toEqual([])
  })
})
