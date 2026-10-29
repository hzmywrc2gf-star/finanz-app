import { describe, expect, it } from 'vitest'
import type { Invoice } from '../domain/types'
import { invoiceIcs, invoiceIcsFileName } from './invoiceCalendar'

const inv: Invoice = { id: 'i1', createdAt: 1, note: 'Otto', categoryId: 'expense-kleidung', amountCents: 13980, purchaseDate: '2026-10-20', dueDate: '2026-11-03' }

describe('invoiceIcs', () => {
  const ics = invoiceIcs(inv, 'Otto', new Date(Date.UTC(2026, 9, 25, 7, 0, 0)))
  it('reminds 3 days before the pay-by date', () => {
    expect(ics).toContain('DTSTART:20261031T090000\r\n')
    expect(invoiceIcsFileName(inv)).toBe('rechnung-2026-10-31.ics')
  })
  it('names merchant and amount (plain space, comma escaped) and the pay-by date', () => {
    expect(ics).toContain('SUMMARY:Rechnung prüfen: Otto 139\\,80 €\r\n')
    expect(ics).toContain('DESCRIPTION:Zahlen bis 03.11.2026 · in Finanzklar bestätigen\r\n')
  })
  it('uses the invoice id as stable uid', () => {
    expect(ics).toContain('UID:i1@finanzklar\r\n')
  })
})
