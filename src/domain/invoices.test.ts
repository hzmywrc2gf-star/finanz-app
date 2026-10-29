import { describe, expect, it } from 'vitest'
import { createDefaultData } from './defaults'
import type { AppData, Invoice } from './types'
import { defaultDueDate, dueText, invoiceTitle, dueInvoices, invoiceReminderDate, isOverdue, openInvoicesTotal, snoozeDate, sortInvoices } from './invoices'

const inv = (over: Partial<Invoice> = {}): Invoice => ({
  id: 'i1',
  createdAt: 1,
  note: 'Otto',
  categoryId: 'expense-kleidung',
  amountCents: 5000,
  purchaseDate: '2026-10-01',
  dueDate: '2026-10-31',
  ...over,
})
const withInvoices = (...invoices: Invoice[]): AppData => ({ ...createDefaultData(), invoices })

describe('dates', () => {
  it('reminds 3 days before the pay-by date, across month and year ends', () => {
    expect(invoiceReminderDate({ dueDate: '2026-10-31' })).toBe('2026-10-28')
    expect(invoiceReminderDate({ dueDate: '2026-11-02' })).toBe('2026-10-30')
    expect(invoiceReminderDate({ dueDate: '2027-01-01' })).toBe('2026-12-29')
  })
  it('default pay-by is 14 days after the purchase', () => {
    expect(defaultDueDate('2026-10-20')).toBe('2026-11-03')
    expect(defaultDueDate('2026-12-25')).toBe('2027-01-08')
  })
  it('overdue only after the pay-by date', () => {
    expect(isOverdue({ dueDate: '2026-10-31' }, '2026-10-31')).toBe(false)
    expect(isOverdue({ dueDate: '2026-10-31' }, '2026-11-01')).toBe(true)
  })
})

describe('dueInvoices', () => {
  const d = withInvoices(inv())
  it('appears exactly from the reminder date', () => {
    expect(dueInvoices(d, '2026-10-27')).toEqual([])
    expect(dueInvoices(d, '2026-10-28')).toHaveLength(1)
    expect(dueInvoices(d, '2026-11-20')).toHaveLength(1)
  })
  it('hides a snoozed invoice until the snooze date, then shows it again', () => {
    const s = withInvoices(inv({ snoozedUntil: '2026-10-30' }))
    expect(dueInvoices(s, '2026-10-29')).toEqual([])
    expect(dueInvoices(s, '2026-10-30')).toHaveLength(1)
  })
  it('sorts by pay-by date, then merchant', () => {
    const list = withInvoices(
      inv({ id: 'c', note: 'Zalando', dueDate: '2026-10-30' }),
      inv({ id: 'b', note: 'Otto', dueDate: '2026-10-30' }),
      inv({ id: 'a', note: 'Zeit', dueDate: '2026-10-29' }),
    )
    expect(dueInvoices(list, '2026-10-30').map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(sortInvoices(list.invoices).map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })
  it('does not touch the data', () => {
    const before = JSON.stringify(d)
    dueInvoices(d, '2026-10-30')
    expect(JSON.stringify(d)).toBe(before)
  })
})

describe('openInvoicesTotal', () => {
  it('sums all open invoices in integer cents, snoozed or not yet due included', () => {
    expect(openInvoicesTotal(createDefaultData())).toBe(0)
    expect(openInvoicesTotal(withInvoices(inv({ amountCents: 10 }), inv({ id: 'i2', amountCents: 13970, snoozedUntil: '2026-12-01' })))).toBe(13980)
  })
})

describe('snoozeDate', () => {
  it('two days, but not past the pay-by date', () => {
    expect(snoozeDate({ dueDate: '2026-10-31' }, '2026-10-28')).toBe('2026-10-30')
    expect(snoozeDate({ dueDate: '2026-10-31' }, '2026-10-29')).toBe('2026-10-31')
    expect(snoozeDate({ dueDate: '2026-10-31' }, '2026-10-30')).toBe('2026-10-31')
  })
  it('on or after the pay-by date: one day', () => {
    expect(snoozeDate({ dueDate: '2026-10-31' }, '2026-10-31')).toBe('2026-11-01')
    expect(snoozeDate({ dueDate: '2026-10-31' }, '2026-11-05')).toBe('2026-11-06')
  })
})

describe('texts', () => {
  it('shows the pay-by date, then "überfällig seit" the day after', () => {
    expect(dueText({ dueDate: '2026-11-03' }, '2026-11-03')).toBe('zahlen bis 03.11.')
    expect(dueText({ dueDate: '2026-11-03' }, '2026-11-04')).toBe('überfällig seit 03.11.')
  })
  it('titles by merchant, else category', () => {
    const cats = createDefaultData().categories
    expect(invoiceTitle(inv(), cats)).toBe('Otto')
    expect(invoiceTitle(inv({ note: undefined }), cats)).toBe('Kleidung')
    expect(invoiceTitle(inv({ note: undefined, categoryId: 'gone' }), cats)).toBe('Rechnung')
  })
})
