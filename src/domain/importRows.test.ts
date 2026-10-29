/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { openXlsx } from '../lib/xlsx/read'
import { createDefaultData } from './defaults'
import {
  detectHeader, excelSerialToISO, findCategory, findDuplicates, foldText, guessMapping, headerSignature, newCategoryNames,
  numberToCents, parseAmountText, parseImportDate, parseImportRows,
} from './importRows'
import type { ImportRow } from './importRows'
import type { Transaction } from './types'

describe('parseImportDate', () => {
  it('reads German dates with 4 and 2 digit years', () => {
    expect(parseImportDate('28.10.2026')).toBe('2026-10-28')
    expect(parseImportDate('1.2.2026')).toBe('2026-02-01')
    expect(parseImportDate('28.10.26')).toBe('2026-10-28')
    expect(parseImportDate('28.10.99')).toBe('1999-10-28')
    expect(parseImportDate(' 28.10.2026 14:30 ')).toBe('2026-10-28')
  })
  it('reads ISO dates (with a time part)', () => {
    expect(parseImportDate('2026-10-28')).toBe('2026-10-28')
    expect(parseImportDate('2026-10-28T12:00:00')).toBe('2026-10-28')
    expect(parseImportDate('2026-1-5')).toBe('2026-01-05')
  })
  it('rejects impossible and unknown dates', () => {
    expect(parseImportDate('31.02.2026')).toBeNull()
    expect(parseImportDate('13.13.2026')).toBeNull()
    expect(parseImportDate('gestern')).toBeNull()
    expect(parseImportDate('')).toBeNull()
    expect(parseImportDate(null)).toBeNull()
    expect(parseImportDate('28.10.1800')).toBeNull()
  })
  it('converts Excel serial numbers (1900 system, with the 1900 leap bug)', () => {
    expect(excelSerialToISO(1)).toBe('1900-01-01')
    expect(excelSerialToISO(59)).toBe('1900-02-28')
    expect(excelSerialToISO(60)).toBeNull() // the day that never existed
    expect(excelSerialToISO(61)).toBe('1900-03-01')
    expect(excelSerialToISO(36526)).toBe('2000-01-01')
    expect(excelSerialToISO(46323)).toBe('2026-10-28')
    expect(excelSerialToISO(46323.75)).toBe('2026-10-28')
    expect(excelSerialToISO(0)).toBeNull()
    expect(excelSerialToISO(-3)).toBeNull()
    expect(parseImportDate(46323)).toBe('2026-10-28')
  })
})

describe('parseAmountText', () => {
  const cases: [string, number | null][] = [
    ['-12,30', -1230],
    ['12,30', 1230],
    ['1.234,56', 123456],
    ['-1.234,56', -123456],
    ['1,234.56', 123456],
    ['12.30', 1230],
    ['12.3', 1230],
    ['1.234', 123400],
    ['1.234.567,89', 123456789],
    ['0,5', 50],
    ['5', 500],
    ['−12,30 €', -1230],
    ['12,30 EUR', 1230],
    ['€ 12,30', 1230],
    ['(12,30)', -1230],
    ['12,30-', -1230],
    ['+7,00', 700],
    ['1 234,50', 123450],
    ["1'234.50", 123450],
    ['0,07', 7],
    ['12,305', null],
    ['abc', null],
    ['', null],
    ['1,2,3,4', null],
    ['12-30', null],
    ['1.2.3,45', null],
    ['1,234,567', 123456700],
  ]
  for (const [text, expected] of cases) {
    it(`"${text}" -> ${expected}`, () => expect(parseAmountText(text)).toBe(expected))
  }
  it('rounds number cells to whole cents', () => {
    expect(numberToCents(12.3)).toBe(1230)
    expect(numberToCents(-45.5)).toBe(-4550)
    expect(numberToCents(1229.9999999999998 / 100)).toBe(1230)
    expect(numberToCents(0.1 + 0.2)).toBe(30)
    expect(numberToCents(1e12)).toBeNull()
    expect(numberToCents(NaN)).toBeNull()
  })
})

describe('header detection', () => {
  it('folds case, umlauts and punctuation', () => {
    expect(foldText('Verwendungszweck')).toBe('verwendungszweck')
    expect(foldText('  Währung (EUR) ')).toBe('wahrungeur')
    expect(foldText('BUCHUNGSTAG')).toBe('buchungstag')
  })
  it('maps synonyms to fields', () => {
    expect(guessMapping(['Buchungstag', 'Verwendungszweck', 'Betrag (EUR)', 'Zahlungsart', 'Typ', 'Category'])).toEqual({
      date: 0, note: 1, amount: 2, account: 3, type: 4, category: 5,
    })
    expect(guessMapping(['Kontonummer', 'Datum'])).toEqual({ date: 1 })
  })
  it('finds the header row below a preamble and needs two hits', () => {
    const rows = [['Mein Haushalt'], [], ['Datum', 'Betrag', 'Notiz'], ['01.10.2026', '5', 'x']]
    expect(detectHeader(rows)).toEqual({ headerRow: 2, mapping: { date: 0, amount: 1, note: 2 } })
    expect(detectHeader([['Datum', 'foo'], ['a', 'b']])).toBeNull()
    expect(detectHeader([])).toBeNull()
  })
  it('builds a stable signature', () => {
    expect(headerSignature(['Datum', ' Betrag (EUR)', '', ''])).toBe('datum|betrageur')
  })
})

describe('parseImportRows', () => {
  const mapping = { date: 0, amount: 1, category: 2, note: 3 }
  it('reads rows, signs decide the kind, errors carry reasons', () => {
    const rows = [
      ['Datum', 'Betrag', 'Kategorie', 'Notiz'],
      ['01.10.2026', '-45,50', 'Lebensmittel', '  Rewe  '],
      [46298, 2500, 'Gehalt', null],
      ['kein Datum', '-5', '', ''],
      ['03.10.2026', '', '', ''],
      ['03.10.2026', 'abc', '', ''],
      ['03.10.2026', '0,00', '', ''],
      ['04.10.2026', -0.1 - 0.2, '', 'x'.repeat(250)],
    ]
    const { rows: ok, errors } = parseImportRows(rows, 0, mapping)
    expect(ok).toHaveLength(3)
    expect(ok[0]).toEqual({ line: 2, date: '2026-10-01', kind: 'expense', amountCents: 4550, categoryName: 'Lebensmittel', note: 'Rewe', account: 'konto' })
    expect(ok[1]).toEqual({ line: 3, date: '2026-10-03', kind: 'income', amountCents: 250000, categoryName: 'Gehalt', account: 'konto' })
    expect(ok[2].amountCents).toBe(30)
    expect(ok[2].note).toHaveLength(200)
    expect(errors).toEqual([
      { line: 4, reason: 'Datum „kein Datum“ nicht lesbar.' },
      { line: 5, reason: 'Betrag fehlt.' },
      { line: 6, reason: 'Betrag „abc“ nicht lesbar.' },
      { line: 7, reason: 'Betrag ist 0.' },
    ])
  })
  it('uses the Art and Konto columns', () => {
    const rows = [
      ['d', 'b', 'a', 'k'],
      ['01.10.2026', '80', 'Einnahme', 'Bar'],
      ['01.10.2026', '-20', 'Ausgabe', 'Karte'],
      ['01.10.2026', '10', '', 'Cash'],
      ['01.10.2026', '-10', '', ''],
      ['01.10.2026', '10', 'weiß nicht', ''],
      ['01.10.2026', '10', 'A', 'Schließfach'],
    ]
    const { rows: ok, errors } = parseImportRows(rows, 0, { date: 0, amount: 1, type: 2, account: 3 })
    expect(ok.map((r) => [r.kind, r.amountCents, r.account])).toEqual([
      ['income', 8000, 'bargeld'],
      ['expense', 2000, 'konto'],
      ['income', 1000, 'bargeld'],
      ['expense', 1000, 'konto'],
    ])
    expect(errors.map((e) => e.reason)).toEqual([
      'Art „weiß nicht“ nicht erkannt (Einnahme oder Ausgabe).',
      'Konto „Schließfach“ nicht erkannt (Konto oder Bargeld).',
    ])
  })
  it('returns nothing without date and amount columns', () => {
    expect(parseImportRows([['a'], ['b']], 0, { date: 0 })).toEqual({ rows: [], errors: [] })
  })
  it('reads the openpyxl/LibreOffice fixture end to end', async () => {
    const file = await openXlsx(new Uint8Array(readFileSync(new URL('../lib/xlsx/__fixtures__/haushalt.xlsx', import.meta.url))))
    const rows = file.readSheet(0)
    const head = detectHeader(rows)
    expect(head).toEqual({ headerRow: 1, mapping: { date: 0, amount: 1, category: 2, note: 3, type: 4, account: 5 } })
    const { rows: ok, errors } = parseImportRows(rows, head!.headerRow, head!.mapping)
    expect(ok.map((r) => [r.date, r.kind, r.amountCents, r.categoryName, r.account])).toEqual([
      ['2026-10-01', 'expense', 4550, 'Lebensmittel', 'konto'],
      ['2026-10-03', 'income', 250000, 'Gehalt', 'konto'],
      ['2026-10-05', 'expense', 1230, 'Yoga', 'bargeld'],
      ['2026-10-07', 'income', 8000, 'Nebeneinkünfte', 'konto'],
      ['2026-10-12', 'expense', 123456, 'Sonstiges', 'konto'],
    ])
    expect(errors.map((e) => e.reason)).toEqual(['Betrag ist 0.', 'Datum „kein Datum“ nicht lesbar.'])
  })
})

describe('categories and duplicates', () => {
  const cats = createDefaultData().categories
  it('finds categories case-insensitively per kind; empty means Sonstiges', () => {
    expect(findCategory(cats, 'expense', ' lebensmittel ')?.id).toBe('expense-lebensmittel')
    expect(findCategory(cats, 'income', 'Lebensmittel')).toBeUndefined()
    expect(findCategory(cats, 'income', '')?.id).toBe('income-sonstiges')
  })
  it('lists new categories once, in order', () => {
    const rows = [
      { kind: 'expense' as const, categoryName: 'Yoga' },
      { kind: 'expense' as const, categoryName: ' yoga' },
      { kind: 'income' as const, categoryName: 'Yoga' },
      { kind: 'expense' as const, categoryName: 'Gehalt' },
      { kind: 'expense' as const, categoryName: '' },
      { kind: 'expense' as const, categoryName: 'Lebensmittel' },
    ]
    expect(newCategoryNames(cats, rows)).toEqual([
      { kind: 'expense', name: 'Yoga' },
      { kind: 'income', name: 'Yoga' },
      { kind: 'expense', name: 'Gehalt' },
    ])
  })
  const tx = (o: Partial<Transaction>): Transaction => ({
    id: Math.random().toString(), kind: 'expense', amountCents: 1000, date: '2026-10-01', categoryId: 'expense-sonstiges', account: 'konto', createdAt: 1, ...o,
  })
  const row = (o: Partial<ImportRow>): ImportRow => ({ line: 1, date: '2026-10-01', kind: 'expense', amountCents: 1000, categoryName: '', account: 'konto', ...o })
  it('flags rows with the same kind, amount, date and account (note ignored)', () => {
    const existing = [tx({ note: 'anders' })]
    expect(findDuplicates([row({ note: 'egal' })], existing)).toEqual([true])
    expect(findDuplicates([row({ kind: 'income' })], existing)).toEqual([false])
    expect(findDuplicates([row({ amountCents: 1001 })], existing)).toEqual([false])
    expect(findDuplicates([row({ date: '2026-10-02' })], existing)).toEqual([false])
    expect(findDuplicates([row({ account: 'bargeld' })], existing)).toEqual([false])
  })
  it('lets each existing booking cover only one row', () => {
    expect(findDuplicates([row({}), row({}), row({})], [tx({}), tx({})])).toEqual([true, true, false])
  })
})
