import { describe, expect, it } from 'vitest'
import { createDefaultData } from './defaults'
import { ALL_TIME, buildExportSheets, countExportRows, exportFileName, resolveExportRange } from './exportSheet'
import type { WriteCell } from '../lib/xlsx/types'
import type { AppData } from './types'

function sample(): AppData {
  const d = createDefaultData()
  const tx = (id: string, kind: 'income' | 'expense', amountCents: number, date: string, categoryId: string, account: 'konto' | 'bargeld', createdAt: number, note?: string) => ({
    id, kind, amountCents, date, categoryId, account, createdAt, ...(note ? { note } : {}),
  })
  return {
    ...d,
    transactions: [
      tx('a', 'income', 300000, '2026-09-15', 'income-gehalt', 'konto', 1),
      tx('b', 'expense', 4550, '2026-10-01', 'expense-lebensmittel', 'konto', 2, 'Rewe'),
      tx('c', 'expense', 1230, '2026-10-05', 'expense-lebensmittel', 'bargeld', 3),
      tx('e', 'income', 8000, '2026-10-28', 'income-nebeneinkünfte', 'konto', 5),
      tx('f', 'expense', 2000, '2026-11-02', 'expense-freizeit', 'konto', 6),
    ],
    transfers: [{ id: 'g', direction: 'withdrawal', amountCents: 5000, date: '2026-10-10', note: 'Abhebung', createdAt: 4 }],
  }
}

const text = (c: WriteCell) => (c && c.t === 'text' ? c.v : c && c.t === 'date' ? c.v : c && c.t === 'money' ? c.v : null)
const plain = (rows: WriteCell[][]) => rows.map((r) => r.map(text))

describe('resolveExportRange', () => {
  it('all, this year and custom', () => {
    expect(resolveExportRange('all', '2026-10-28')).toBe(ALL_TIME)
    expect(resolveExportRange('year', '2026-10-28')).toEqual({ from: '2026-01-01', to: '2026-12-31' })
    expect(resolveExportRange('custom', '2026-10-28', { from: '2026-10-01', to: '2026-10-31' })).toEqual({ from: '2026-10-01', to: '2026-10-31' })
  })
  it('validates custom input in German', () => {
    expect(() => resolveExportRange('custom', 'x', { from: '', to: '2026-10-31' })).toThrow('Bitte Von- und Bis-Datum angeben.')
    expect(() => resolveExportRange('custom', 'x', { from: '2026-02-30', to: '2026-10-31' })).toThrow('Ungültiges Datum.')
    expect(() => resolveExportRange('custom', 'x', { from: '2026-11-01', to: '2026-10-31' })).toThrow('Das Von-Datum darf nicht nach dem Bis-Datum liegen.')
  })
  it('names the file by date', () => expect(exportFileName('2026-10-28')).toBe('finanzklar-export-2026-10-28.xlsx'))
})

describe('buildExportSheets', () => {
  it('lists bookings and transfers oldest first with signed amounts', () => {
    const [bookings] = buildExportSheets(sample(), ALL_TIME)
    expect(bookings.name).toBe('Buchungen')
    expect(plain(bookings.rows)).toEqual([
      ['Datum', 'Art', 'Konto', 'Kategorie', 'Notiz', 'Betrag'],
      ['2026-09-15', 'Einnahme', 'Konto', 'Gehalt', null, 300000],
      ['2026-10-01', 'Ausgabe', 'Konto', 'Lebensmittel', 'Rewe', -4550],
      ['2026-10-05', 'Ausgabe', 'Bargeld', 'Lebensmittel', null, -1230],
      ['2026-10-10', 'Umbuchung', 'Konto → Bargeld', null, 'Abhebung', 5000],
      ['2026-10-28', 'Einnahme', 'Konto', 'Nebeneinkünfte', null, 8000],
      ['2026-11-02', 'Ausgabe', 'Konto', 'Freizeit', null, -2000],
    ])
    expect(bookings.filterRows).toBe(7)
    expect(bookings.freezeHeader).toBe(true)
  })

  it('sums months and categories from transactions only (integer cents)', () => {
    const [, months] = buildExportSheets(sample(), ALL_TIME)
    expect(plain(months.rows)).toEqual([
      ['Monat', 'Einnahmen', 'Ausgaben', 'Saldo'],
      ['September 2026', 300000, 0, 300000],
      ['Oktober 2026', 8000, 5780, 2220], // 45,50 + 12,30 = 57,80; the transfer is not an expense
      ['November 2026', 0, 2000, -2000],
      ['Gesamt', 308000, 7780, 300220],
      [],
      ['Summen je Kategorie'],
      ['Kategorie', 'Art', 'Summe'],
      ['Lebensmittel', 'Ausgabe', 5780],
      ['Freizeit', 'Ausgabe', 2000],
      ['Gehalt', 'Einnahme', 300000],
      ['Nebeneinkünfte', 'Einnahme', 8000],
    ])
  })

  it('limits everything to the range', () => {
    const range = { from: '2026-10-05', to: '2026-10-31' }
    const [bookings, months] = buildExportSheets(sample(), range)
    expect(bookings.rows).toHaveLength(1 + 3)
    expect(countExportRows(sample(), range)).toBe(3)
    expect(plain(months.rows).slice(0, 3)).toEqual([
      ['Monat', 'Einnahmen', 'Ausgaben', 'Saldo'],
      ['Oktober 2026', 8000, 1230, 6770], // the 01.10. booking lies before the range
      ['Gesamt', 8000, 1230, 6770],
    ])
  })

  it('fills months without bookings with zeros', () => {
    const d = sample()
    d.transactions = [d.transactions[0], d.transactions[4]]
    const [, months] = buildExportSheets(d, ALL_TIME)
    expect(plain(months.rows).slice(1, 4)).toEqual([
      ['September 2026', 300000, 0, 300000],
      ['Oktober 2026', 0, 0, 0],
      ['November 2026', 0, 2000, -2000],
    ])
  })

  it('handles an empty range', () => {
    const [bookings, months] = buildExportSheets(createDefaultData(), ALL_TIME)
    expect(bookings.rows).toHaveLength(1)
    expect(plain(months.rows)[1]).toEqual(['Gesamt', 0, 0, 0])
  })
})
