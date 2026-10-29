/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { decodeText, detectDelimiter, parseCsv, parseCsvText } from './csv'

describe('parseCsv', () => {
  it('handles quotes, escaped quotes and line breaks inside fields', () => {
    const text = 'a;b;c\r\n"x;1";"sagt ""hi""";"zwei\nZeilen"\r\n'
    expect(parseCsv(text, ';')).toEqual([
      ['a', 'b', 'c'],
      ['x;1', 'sagt "hi"', 'zwei\nZeilen'],
    ])
  })

  it('keeps empty cells, supports \\r and a missing final newline, drops blank lines', () => {
    expect(parseCsv('a,,c\r\r1,2,3', ',')).toEqual([
      ['a', '', 'c'],
      ['1', '2', '3'],
    ])
    expect(parseCsv('a;b;\n;;\n', ';')).toEqual([
      ['a', 'b', ''],
      ['', '', ''],
    ])
  })

  it('respects the row limit', () => {
    expect(parseCsv('1\n2\n3\n4', ';', 2)).toEqual([['1'], ['2']])
  })
})

describe('detectDelimiter', () => {
  it('detects semicolon, tab and comma', () => {
    expect(detectDelimiter('Datum;Betrag\n01.10.2026;-1,50\n02.10.2026;2,00')).toBe(';')
    expect(detectDelimiter('Datum\tBetrag\n01.10.2026\t-1,50')).toBe('\t')
    expect(detectDelimiter('Date,Amount\n2026-10-01,-1.50\n2026-10-02,2.00')).toBe(',')
  })

  it('ignores delimiters inside quotes and a preamble line', () => {
    expect(detectDelimiter('Export vom 01.10.2026\nDatum;Notiz;Betrag\n01.10.;"a, b, c";-1,50\n02.10.;"d, e";2,00')).toBe(';')
  })
})

describe('decodeText', () => {
  it('decodes UTF-8 with and without BOM', () => {
    const bytes = new TextEncoder().encode('Käse €')
    expect(decodeText(bytes)).toEqual({ text: 'Käse €', encoding: 'utf-8' })
    const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...bytes])
    expect(decodeText(bom)).toEqual({ text: 'Käse €', encoding: 'utf-8' })
  })

  it('falls back to windows-1252 for invalid UTF-8', () => {
    const bytes = new Uint8Array(readFileSync(new URL('./xlsx/__fixtures__/haushalt-latin1.csv', import.meta.url)))
    const { text, encoding } = decodeText(bytes)
    expect(encoding).toBe('windows-1252')
    expect(text).toContain('Käse für Müller')
    expect(text).toContain('Überweisung €')
    const rows = parseCsvText(text)
    expect(rows[2]).toEqual(['03.10.2026', '2.500,00', 'gehalt'.replace('g', 'G'), 'Überweisung €'])
  })

  it('decodes UTF-16 with BOM', () => {
    const le = new Uint8Array([0xff, 0xfe, 0x41, 0x00, 0xe4, 0x00])
    expect(decodeText(le).text).toBe('Aä')
  })
})
