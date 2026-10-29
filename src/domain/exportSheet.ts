import type { WriteCell, WriteSheet } from '../lib/xlsx/types'
import { addMonths, isValidISODate, monthLabel, monthStart } from './dates'
import { summarizeRange } from './calc'
import type { AppData } from './types'

export type ExportMode = 'all' | 'year' | 'custom'

export interface ExportRange {
  /** Inclusive 'YYYY-MM-DD'. */
  from: string
  to: string
}

/** Widest possible range (ISO dates compare as strings). */
export const ALL_TIME: ExportRange = { from: '0000-01-01', to: '9999-12-31' }

/** The date range of an export; throws German errors for bad "Zeitraum" input. */
export function resolveExportRange(mode: ExportMode, today: string, custom?: { from: string; to: string }): ExportRange {
  if (mode === 'all') return ALL_TIME
  if (mode === 'year') {
    const y = today.slice(0, 4)
    return { from: `${y}-01-01`, to: `${y}-12-31` }
  }
  const from = custom?.from ?? ''
  const to = custom?.to ?? ''
  if (!from || !to) throw new Error('Bitte Von- und Bis-Datum angeben.')
  if (!isValidISODate(from) || !isValidISODate(to)) throw new Error('Ungültiges Datum.')
  if (from > to) throw new Error('Das Von-Datum darf nicht nach dem Bis-Datum liegen.')
  return { from, to }
}

export function exportFileName(today: string): string {
  return `finanzklar-export-${today}.xlsx`
}

const text = (v: string, bold = false): WriteCell => ({ t: 'text', v, ...(bold ? { bold: true } : {}) })
const money = (v: number, bold = false): WriteCell => ({ t: 'money', v, ...(bold ? { bold: true } : {}) })

interface Line {
  date: string
  createdAt: number
  cells: WriteCell[]
}

/**
 * Rows of the sheet "Buchungen", oldest first. Amounts are signed cents: income +, expense −.
 * A transfer is neither income nor expense: it appears as its own row "Umbuchung" ("Konto → Bargeld")
 * with the moved amount as a positive number, so filter on "Art" before summing the column.
 */
function bookingLines(data: AppData, range: ExportRange): Line[] {
  const names = new Map(data.categories.map((c) => [c.id, c.name]))
  const lines: Line[] = []
  for (const t of data.transactions) {
    if (t.date < range.from || t.date > range.to) continue
    lines.push({
      date: t.date,
      createdAt: t.createdAt,
      cells: [
        { t: 'date', v: t.date },
        text(t.kind === 'income' ? 'Einnahme' : 'Ausgabe'),
        text(t.account === 'bargeld' ? 'Bargeld' : 'Konto'),
        text(names.get(t.categoryId) ?? 'Unbekannt'),
        t.note ? text(t.note) : null,
        money(t.kind === 'income' ? t.amountCents : -t.amountCents),
      ],
    })
  }
  for (const tr of data.transfers) {
    if (tr.date < range.from || tr.date > range.to) continue
    lines.push({
      date: tr.date,
      createdAt: tr.createdAt,
      cells: [
        { t: 'date', v: tr.date },
        text('Umbuchung'),
        text(tr.direction === 'withdrawal' ? 'Konto → Bargeld' : 'Bargeld → Konto'),
        null,
        tr.note ? text(tr.note) : null,
        money(tr.amountCents),
      ],
    })
  }
  return lines.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt))
}

/** Number of bookings and transfers an export of the range contains. */
export function countExportRows(data: AppData, range: ExportRange): number {
  return bookingLines(data, range).length
}

/** Rows of "Monate": per month income, expense, balance (only `transactions`), totals, then sums per category. */
function monthRows(data: AppData, range: ExportRange): WriteCell[][] {
  const inRange = data.transactions.filter((t) => t.date >= range.from && t.date <= range.to)
  const perMonth = new Map<string, { income: number; expense: number }>()
  let first = ''
  let last = ''
  for (const t of inRange) {
    const m = monthStart(t.date)
    const sum = perMonth.get(m) ?? { income: 0, expense: 0 }
    if (t.kind === 'income') sum.income += t.amountCents
    else sum.expense += t.amountCents
    perMonth.set(m, sum)
    if (!first || m < first) first = m
    if (!last || m > last) last = m
  }

  const rows: WriteCell[][] = [[text('Monat'), text('Einnahmen'), text('Ausgaben'), text('Saldo')]]
  let income = 0
  let expense = 0
  for (let m = first; first && m <= last; m = addMonths(m, 1)) {
    const sum = perMonth.get(m) ?? { income: 0, expense: 0 }
    income += sum.income
    expense += sum.expense
    rows.push([text(monthLabel(m)), money(sum.income), money(sum.expense), money(sum.income - sum.expense)])
  }
  rows.push([text('Gesamt', true), money(income, true), money(expense, true), money(income - expense, true)])

  const totals = summarizeRange(data.transactions, data.categories, range.from, range.to)
  rows.push([], [text('Summen je Kategorie', true)], [text('Kategorie', true), text('Art', true), text('Summe', true)])
  for (const s of totals.expenseByCategory) rows.push([text(s.name), text('Ausgabe'), money(s.cents)])
  for (const s of totals.incomeByCategory) rows.push([text(s.name), text('Einnahme'), money(s.cents)])
  return rows
}

/** The workbook for the range: "Buchungen" and "Monate". */
export function buildExportSheets(data: AppData, range: ExportRange): WriteSheet[] {
  const lines = bookingLines(data, range)
  const header = ['Datum', 'Art', 'Konto', 'Kategorie', 'Notiz', 'Betrag'].map((h) => text(h))
  return [
    {
      name: 'Buchungen',
      widths: [12, 12, 18, 22, 40, 14],
      freezeHeader: true,
      filterRows: lines.length + 1,
      rows: [header, ...lines.map((l) => l.cells)],
    },
    { name: 'Monate', widths: [24, 16, 16, 16], freezeHeader: true, rows: monthRows(data, range) },
  ]
}

