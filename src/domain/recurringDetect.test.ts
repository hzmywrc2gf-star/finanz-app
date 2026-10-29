import { describe, expect, it } from 'vitest'
import { createDefaultData } from './defaults'
import { detectRecurring, hashKey, normalizeNote, similarAmount } from './recurringDetect'
import type { AppData, RecurringRule, Transaction } from './types'

let n = 0
const tx = (date: string, amountCents: number, over: Partial<Transaction> = {}): Transaction => ({
  id: `t${++n}`,
  kind: 'expense',
  amountCents,
  date,
  categoryId: 'expense-freizeit',
  account: 'konto',
  createdAt: n,
  ...over,
})
const dataWith = (transactions: Transaction[], recurring: RecurringRule[] = []): AppData => ({ ...createDefaultData(), transactions, recurring })
const income = (date: string, cents: number, over: Partial<Transaction> = {}) =>
  tx(date, cents, { kind: 'income', categoryId: 'income-gehalt', ...over })
const TODAY = '2026-10-28'

describe('helpers', () => {
  it('normalizes notes', () => {
    expect(normalizeNote(' NETFLIX ')).toBe('netflix')
    expect(normalizeNote('Netflix 10/2026')).toBe('netflix')
    expect(normalizeNote('Müller-Versicherung')).toBe('mullerversicherung')
    expect(normalizeNote('2026')).toBe('')
    expect(normalizeNote(undefined)).toBe('')
  })
  it('similar amounts are within 5 percent, exact integers', () => {
    expect(similarAmount(10500, 10000)).toBe(true)
    expect(similarAmount(10501, 10000)).toBe(false)
    expect(similarAmount(9500, 10000)).toBe(true)
    expect(similarAmount(9499, 10000)).toBe(false)
  })
  it('hash is stable and differs for different input', () => {
    expect(hashKey('a')).toBe(hashKey('a'))
    expect(hashKey('a')).not.toBe(hashKey('b'))
  })
})

describe('detectRecurring', () => {
  const gehalt = () =>
    ['2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01'].map((d) => income(d, 300000))

  it('finds a monthly salary on the 1st (income)', () => {
    const txs = gehalt()
    const [s] = detectRecurring(dataWith(txs), TODAY)
    expect(s).toMatchObject({
      kind: 'income', categoryId: 'income-gehalt', amountCents: 300000, interval: 'monthly', dayOfMonth: 1,
      startDate: '2026-05-01', lastDate: '2026-10-01', count: 6,
    })
    expect(s.note).toBeUndefined()
    expect(s.transactionIds).toEqual(txs.map((t) => t.id))
    expect(detectRecurring(dataWith(txs), TODAY)).toHaveLength(1)
  })

  it('merges note variants of one subscription', () => {
    const txs = [
      tx('2026-07-15', 1299, { note: 'Netflix' }), tx('2026-08-15', 1299, { note: 'NETFLIX ' }),
      tx('2026-09-15', 1299, { note: 'netflix 09/2026' }), tx('2026-10-15', 1299, { note: ' Netflix' }),
    ]
    const found = detectRecurring(dataWith(txs), TODAY)
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({ note: 'Netflix', dayOfMonth: 15, count: 4, interval: 'monthly' })
  })

  it('tolerates a few days of shift and takes the most frequent day', () => {
    const txs = ['2026-06-01', '2026-07-01', '2026-08-03', '2026-09-01', '2026-10-02'].map((d) => tx(d, 85000, { note: 'Miete' }))
    const [s] = detectRecurring(dataWith(txs), TODAY)
    expect(s.dayOfMonth).toBe(1)
    expect(s.count).toBe(5)
  })

  it('does not accept a shift beyond the window', () => {
    const txs = ['2026-06-01', '2026-07-01', '2026-08-10', '2026-09-01'].map((d) => tx(d, 85000, { note: 'Miete' }))
    expect(detectRecurring(dataWith(txs), TODAY)).toEqual([])
  })

  it('ties on the day go to the latest', () => {
    const txs = ['2026-07-01', '2026-08-02', '2026-09-01', '2026-10-02'].map((d) => tx(d, 5000, { note: 'Strom' }))
    expect(detectRecurring(dataWith(txs), TODAY)[0].dayOfMonth).toBe(2)
  })

  it('amounts within 5 percent form one pattern, the latest amount is used', () => {
    const amounts = [9000, 9300, 8800, 9100, 9400]
    const txs = amounts.map((a, i) => tx(`2026-${String(i + 6).padStart(2, '0')}-10`, a, { note: 'Strom' }))
    const [s] = detectRecurring(dataWith(txs), TODAY)
    expect(s.amountCents).toBe(9400)
    expect(s.count).toBe(5)
  })

  it('splits amount outliers off', () => {
    const txs = [
      ...['2026-07-05', '2026-08-05', '2026-09-05', '2026-10-05'].map((d) => tx(d, 4000, { note: 'Fitness' })),
      tx('2026-09-20', 25000, { note: 'Fitness' }),
    ]
    const found = detectRecurring(dataWith(txs), TODAY)
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({ amountCents: 4000, count: 4 })
    expect(found[0].transactionIds).not.toContain(txs[4].id)
  })

  it('month-end subscription gives day 31', () => {
    const txs = ['2026-07-31', '2026-08-31', '2026-09-30', '2026-10-31'].map((d) => tx(d, 2000, { note: 'Cloud' }))
    expect(detectRecurring(dataWith(txs), TODAY)[0].dayOfMonth).toBe(31)
    const feb = ['2026-11-30', '2026-12-31', '2027-01-31', '2027-02-28'].map((d) => tx(d, 2000, { note: 'Cloud' }))
    expect(detectRecurring(dataWith(feb), '2027-03-02')[0].dayOfMonth).toBe(31)
  })

  it('finds a quarterly insurance', () => {
    const txs = ['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15'].map((d) => tx(d, 12000, { note: 'KFZ-Versicherung' }))
    const [s] = detectRecurring(dataWith(txs), TODAY)
    expect(s).toMatchObject({ interval: 'quarterly', dayOfMonth: 15, count: 4 })
  })

  it('needs three quarters but only two years for yearly', () => {
    const two = ['2026-03-01', '2026-06-01'].map((d) => tx(d, 12000, { note: 'Haftpflicht' }))
    expect(detectRecurring(dataWith(two), TODAY)).toEqual([])
    const yearly = ['2025-10-20', '2026-10-20'].map((d) => tx(d, 6000, { note: 'Domain' }))
    const [s] = detectRecurring(dataWith(yearly), TODAY)
    expect(s).toMatchObject({ interval: 'yearly', dayOfMonth: 20, count: 2, startDate: '2025-10-20' })
  })

  it('does not suggest an ended subscription', () => {
    const txs = ['2026-03-05', '2026-04-05', '2026-05-05', '2026-06-05'].map((d) => tx(d, 999, { note: 'Altes Abo' }))
    expect(detectRecurring(dataWith(txs), TODAY)).toEqual([])
  })

  it('is still active a few days after the due date, not later', () => {
    const txs = ['2026-07-01', '2026-08-01', '2026-09-01'].map((d) => tx(d, 999, { note: 'Abo' }))
    expect(detectRecurring(dataWith(txs), '2026-10-04')).toHaveLength(1)
    expect(detectRecurring(dataWith(txs), '2026-10-05')).toHaveLength(0)
  })

  it('does not suggest irregular groceries', () => {
    const txs = [
      tx('2026-09-02', 4210, { categoryId: 'expense-lebensmittel' }), tx('2026-09-09', 1875, { categoryId: 'expense-lebensmittel' }),
      tx('2026-09-17', 6320, { categoryId: 'expense-lebensmittel' }), tx('2026-10-03', 2990, { categoryId: 'expense-lebensmittel' }),
      tx('2026-10-12', 5110, { categoryId: 'expense-lebensmittel' }), tx('2026-10-25', 3340, { categoryId: 'expense-lebensmittel' }),
    ]
    expect(detectRecurring(dataWith(txs), TODAY)).toEqual([])
  })

  it('requires consecutive months and one booking per month', () => {
    const gap = ['2026-06-10', '2026-07-10', '2026-09-10', '2026-10-10'].map((d) => tx(d, 1000, { note: 'Lücke' }))
    expect(detectRecurring(dataWith(gap), TODAY)).toEqual([])
    const twice = ['2026-08-10', '2026-09-10', '2026-09-12', '2026-10-10'].map((d) => tx(d, 1000, { note: 'Doppelt' }))
    expect(detectRecurring(dataWith(twice), TODAY)).toEqual([])
  })

  it('uses the newest run after an older break', () => {
    const txs = ['2026-01-10', '2026-02-10', '2026-05-10', '2026-06-10', '2026-07-10', '2026-08-10', '2026-09-10', '2026-10-10'].map(
      (d) => tx(d, 1000, { note: 'Pause' }),
    )
    const [s] = detectRecurring(dataWith(txs), TODAY)
    expect(s).toMatchObject({ count: 6, startDate: '2026-05-10' })
  })

  it('different notes in one category are separate suggestions', () => {
    const mk = (note: string) => ['2026-08-03', '2026-09-03', '2026-10-03'].map((d) => tx(d, 999, { note }))
    const found = detectRecurring(dataWith([...mk('Spotify'), ...mk('Netflix')]), TODAY)
    expect(found.map((s) => s.note).sort()).toEqual(['Netflix', 'Spotify'])
    expect(new Set(found.map((s) => s.key)).size).toBe(2)
  })

  it('without a note the category is the identity', () => {
    const a = ['2026-08-03', '2026-09-03', '2026-10-03'].map((d) => tx(d, 999))
    const b = ['2026-08-04', '2026-09-04', '2026-10-04'].map((d) => tx(d, 5000, { categoryId: 'expense-fixkosten' }))
    expect(detectRecurring(dataWith([...a, ...b]), TODAY)).toHaveLength(2)
  })

  it('ignores Bargeld and bookings already linked to an existing rule', () => {
    const cash = ['2026-08-03', '2026-09-03', '2026-10-03'].map((d) => tx(d, 999, { note: 'Bar', account: 'bargeld' }))
    expect(detectRecurring(dataWith(cash), TODAY)).toEqual([])
    const rule: RecurringRule = {
      id: 'r1', kind: 'expense', amountCents: 5000, categoryId: 'expense-fixkosten', interval: 'monthly',
      dayOfMonth: 7, startDate: '2026-01-07', bookedThrough: '2026-10-07', autoBook: true,
    }
    const linked = ['2026-08-07', '2026-09-07', '2026-10-07'].map((d) => tx(d, 5000, { categoryId: 'expense-fixkosten', recurringId: 'r1' }))
    expect(detectRecurring(dataWith(linked, [rule]), TODAY)).toEqual([])
    // the rule was deleted: its bookings are a pattern again
    expect(detectRecurring(dataWith(linked), TODAY)).toHaveLength(1)
  })

  it('skips patterns an existing Vertrag covers', () => {
    const rule: RecurringRule = {
      id: 'r1', kind: 'income', amountCents: 302000, categoryId: 'income-gehalt', interval: 'monthly',
      dayOfMonth: 1, startDate: '2026-01-01', bookedThrough: '2026-10-01', autoBook: true,
    }
    expect(detectRecurring(dataWith(gehalt(), [rule]), TODAY)).toEqual([])
    expect(detectRecurring(dataWith(gehalt(), [{ ...rule, amountCents: 400000 }]), TODAY)).toHaveLength(1)
    expect(detectRecurring(dataWith(gehalt(), [{ ...rule, interval: 'quarterly' }]), TODAY)).toHaveLength(1)
    expect(detectRecurring(dataWith(gehalt(), [{ ...rule, note: 'Firma A' }]), TODAY)).toEqual([])
    const named = gehalt().map((t) => ({ ...t, note: 'Firma B' }))
    expect(detectRecurring(dataWith(named, [{ ...rule, note: 'Firma A' }]), TODAY)).toHaveLength(1)
  })

  it('leaves dismissed keys out', () => {
    const txs = gehalt()
    const [s] = detectRecurring(dataWith(txs), TODAY)
    expect(detectRecurring(dataWith(txs), TODAY, [s.key])).toEqual([])
    expect(detectRecurring(dataWith(txs), TODAY, new Set([s.key]))).toEqual([])
    // the key does not depend on the amount
    const raised = txs.map((t) => ({ ...t, amountCents: 310000 }))
    expect(detectRecurring(dataWith(raised), TODAY)[0].key).toBe(s.key)
  })

  it('sorts income first, then by amount', () => {
    const mk = (note: string, cents: number) => ['2026-08-03', '2026-09-03', '2026-10-03'].map((d) => tx(d, cents, { note }))
    const found = detectRecurring(dataWith([...mk('Klein', 500), ...mk('Groß', 90000), ...gehalt()]), TODAY)
    expect(found.map((s) => s.kind)).toEqual(['income', 'expense', 'expense'])
    expect(found.slice(1).map((s) => s.note)).toEqual(['Groß', 'Klein'])
  })

  it('finds nothing in empty data', () => {
    expect(detectRecurring(createDefaultData(), TODAY)).toEqual([])
  })
})
