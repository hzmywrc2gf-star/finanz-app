/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildXlsx, centsToDecimal, columnLetters, excelSerial } from './write'
import { columnIndex, openXlsx } from './read'
import { readZip } from './zip'
import type { WriteSheet } from './types'

const fixture = (name: string) => new Uint8Array(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url)))

describe('xlsx helpers', () => {
  it('maps column letters both ways', () => {
    expect(columnLetters(0)).toBe('A')
    expect(columnLetters(25)).toBe('Z')
    expect(columnLetters(26)).toBe('AA')
    expect(columnLetters(701)).toBe('ZZ')
    expect(columnLetters(702)).toBe('AAA')
    for (const i of [0, 5, 25, 26, 51, 701, 702]) expect(columnIndex(columnLetters(i))).toBe(i)
  })

  it('computes Excel day numbers', () => {
    expect(excelSerial('1900-03-01')).toBe(61)
    expect(excelSerial('2000-01-01')).toBe(36526)
    expect(excelSerial('2026-10-28')).toBe(46323)
  })

  it('formats cents without floats', () => {
    expect(centsToDecimal(0)).toBe('0.00')
    expect(centsToDecimal(5)).toBe('0.05')
    expect(centsToDecimal(-123456)).toBe('-1234.56')
    expect(centsToDecimal(-5)).toBe('-0.05')
  })
})

describe('xlsx write -> read', () => {
  const sheets: WriteSheet[] = [
    {
      name: 'Buchungen',
      widths: [12, 10, 30],
      freezeHeader: true,
      filterRows: 3,
      rows: [
        [
          { t: 'text', v: 'Datum' },
          { t: 'text', v: 'Betrag' },
          { t: 'text', v: 'Notiz' },
        ],
        [{ t: 'date', v: '2026-10-28' }, { t: 'money', v: -1234 }, { t: 'text', v: 'Käse & <Co> "x"\nzweite Zeile' }],
        [null, { t: 'money', v: 5, bold: true }, { t: 'text', v: '  Leerzeichen  ' }],
      ],
    },
    { name: 'Leer', widths: [], rows: [] },
  ]

  it('reads back what was written', async () => {
    const file = await openXlsx(buildXlsx(sheets))
    expect(file.sheetNames).toEqual(['Buchungen', 'Leer'])
    const rows = file.readSheet(0)
    expect(rows[0]).toEqual(['Datum', 'Betrag', 'Notiz'])
    expect(rows[1]).toEqual([46323, -12.34, 'Käse & <Co> "x"\nzweite Zeile'])
    expect(rows[2]).toEqual([null, 0.05, '  Leerzeichen  '])
    expect(file.readSheet(1)).toEqual([])
  })

  it('writes the formats, freeze pane and filter', async () => {
    const parts = await readZip(buildXlsx(sheets))
    const text = (n: string) => new TextDecoder().decode(parts.get(n))
    expect(text('xl/styles.xml')).toContain('dd\\.mm\\.yyyy')
    expect(text('xl/styles.xml')).toContain('#,##0.00\\ &quot;€&quot;')
    expect(text('xl/worksheets/sheet1.xml')).toContain('state="frozen"')
    expect(text('xl/worksheets/sheet1.xml')).toContain('<autoFilter ref="A1:C3"/>')
    expect(text('xl/worksheets/sheet1.xml')).toContain('<v>-12.34</v>')
    expect(text('xl/workbook.xml')).toContain('Buchungen')
  })
})

describe('xlsx read of files from other tools', () => {
  const expected = [
    ['Mein Haushaltsbuch 2026'],
    ['Datum', 'Betrag', 'Kategorie', 'Notiz', 'Art', 'Konto'],
    [46296, -45.5, 'Lebensmittel', 'Wocheneinkauf Rewe'],
  ]

  for (const name of ['haushalt.xlsx', 'haushalt-inline.xlsx']) {
    it(`reads ${name} (deflate, ${name.includes('inline') ? 'inline strings' : 'shared strings'})`, async () => {
      const file = await openXlsx(fixture(name))
      expect(file.sheetNames).toEqual(['Haushalt', 'Anderes'])
      const rows = file.readSheet(0)
      expect(rows.slice(0, 3)).toEqual(expected)
      expect(rows).toHaveLength(9)
      expect(rows[3]).toEqual([46298, 2500, 'Gehalt', 'Oktober'])
      expect(rows[4][3]).toBe('Kurs „Rücken“ & Co')
      expect(rows[4][5]).toBe('Bargeld')
      expect(rows[8]).toEqual(['kein Datum', -5, 'Lebensmittel', 'kaputtes Datum'])
      expect(file.readSheet(1)).toEqual([['x', 'y']])
    })
  }

  it('rejects files that are not workbooks', async () => {
    await expect(openXlsx(new TextEncoder().encode('Datum;Betrag'))).rejects.toThrow('keine gültige Excel-Datei')
  })
})
