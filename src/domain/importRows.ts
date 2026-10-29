import type { RawCell } from '../lib/xlsx/types'
import { FALLBACK_NAME } from './defaults'
import { isValidISODate } from './dates'
import type { Account, Category, Kind, Transaction } from './types'

/** Longest note / category name taken over (the same limits as the input fields in the app). */
export const MAX_NOTE_LENGTH = 200
export const MAX_CATEGORY_LENGTH = 40

export type ImportField = 'date' | 'amount' | 'type' | 'category' | 'note' | 'account'

export const IMPORT_FIELDS: { field: ImportField; label: string; required: boolean }[] = [
  { field: 'date', label: 'Datum', required: true },
  { field: 'amount', label: 'Betrag', required: true },
  { field: 'type', label: 'Art', required: false },
  { field: 'category', label: 'Kategorie', required: false },
  { field: 'note', label: 'Notiz', required: false },
  { field: 'account', label: 'Konto', required: false },
]

/** Field -> 0-based column index; a missing field is not used. */
export type ColumnMapping = Partial<Record<ImportField, number>>

/** Lower case, without umlaut accents, spaces and punctuation: 'Betrag (EUR)' -> 'betrageur'. */
export function foldText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '')
}

const SYNONYMS: Record<ImportField, string[]> = {
  date: ['datum', 'buchungstag', 'buchungsdatum', 'date'],
  amount: ['betrag', 'umsatz', 'amount', 'summe', 'wert'],
  type: ['art', 'typ', 'type'],
  category: ['kategorie', 'category'],
  note: ['notiz', 'beschreibung', 'verwendungszweck', 'text', 'buchungstext', 'bemerkung'],
  account: ['konto', 'zahlungsart'],
}

/** Headers that may carry a suffix: 'Betrag (EUR)', 'Datum der Buchung' (but not 'Kontonummer'). */
const PREFIX_OK = new Set(['datum', 'betrag', 'umsatz', 'kategorie', 'buchungsdatum', 'buchungstag'])

function matchesField(folded: string, field: ImportField): boolean {
  return SYNONYMS[field].some((syn) => folded === syn || (PREFIX_OK.has(syn) && folded.startsWith(syn)))
}

export function cellToString(cell: RawCell | undefined): string {
  if (cell === null || cell === undefined) return ''
  if (typeof cell === 'boolean') return cell ? 'WAHR' : 'FALSCH'
  return String(cell).trim()
}

/** Recognises columns by their header names (each field takes the first matching column). */
export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const taken = new Set<number>()
  headers.forEach((h, col) => {
    const folded = foldText(h)
    if (!folded) return
    for (const { field } of IMPORT_FIELDS) {
      if (mapping[field] !== undefined || taken.has(col)) continue
      if (matchesField(folded, field)) {
        mapping[field] = col
        taken.add(col)
        break
      }
    }
  })
  return mapping
}

export interface HeaderGuess {
  /** Index of the header row in the rows. */
  headerRow: number
  mapping: ColumnMapping
}

/** The first row (within the first 20) with at least two recognised headers; null if there is none. */
export function detectHeader(rows: RawCell[][]): HeaderGuess | null {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const mapping = guessMapping(rows[i].map(cellToString))
    if (Object.keys(mapping).length >= 2) return { headerRow: i, mapping }
  }
  return null
}

/** Identifies a column layout for remembering the mapping: the folded header names. */
export function headerSignature(headers: string[]): string {
  const folded = headers.map(foldText)
  while (folded.length && !folded[folded.length - 1]) folded.pop()
  return folded.join('|')
}

// ---------- dates ----------

function isoFromParts(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 2100) return null
  const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return isValidISODate(iso) ? iso : null
}

/**
 * Excel day number (1900 date system) -> 'YYYY-MM-DD'. Excel counts a non-existent 29.02.1900 (serial 60),
 * so serials from 61 on are days after 1899-12-30; serial 60 is rejected.
 */
export function excelSerialToISO(serial: number): string | null {
  if (!Number.isFinite(serial)) return null
  const day = Math.floor(serial)
  if (day < 1 || day === 60 || day > 73_050) return null
  const ms = Date.UTC(1899, 11, day < 60 ? 31 : 30) + day * 86_400_000
  const d = new Date(ms)
  return isoFromParts(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

/** Dates as Excel serial numbers, TT.MM.JJJJ, TT.MM.JJ or JJJJ-MM-TT (a time of day is ignored). Null = not readable. */
export function parseImportDate(cell: RawCell | undefined): string | null {
  if (typeof cell === 'number') return excelSerialToISO(cell)
  const s = cellToString(cell)
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s)
  if (m) return isoFromParts(Number(m[1]), Number(m[2]), Number(m[3]))
  m = /^(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})(?:[,\s].*)?$/.exec(s)
  if (m) {
    let y = Number(m[3])
    if (m[3].length === 2) y += y < 70 ? 2000 : 1900
    return isoFromParts(y, Number(m[2]), Number(m[1]))
  }
  return null
}

// ---------- amounts ----------

/**
 * Amount text -> signed integer cents, without floating point. Understands '-12,30', '1.234,56', '1,234.56', '12.30',
 * '−12,30 €', '(12,30)', '12,30-', 'EUR 5'. A single ',' is the decimal mark; a single '.' is one unless exactly three
 * digits follow a 1-3 digit number ('1.234' = 1234). More than two decimals are rejected, not rounded. Null = not readable.
 */
export function parseAmountText(raw: string): number | null {
  let s = raw.replace(/[\s  '’]/g, '')
  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1)
  }
  s = s.replace(/[−–—]/g, '-').replace(/€|eur(?:o)?/gi, '')
  const lead = /^[+-]/.exec(s)
  if (lead) {
    if (lead[0] === '-') negative = !negative
    s = s.slice(1)
  }
  if (s.endsWith('-') || s.endsWith('+')) {
    if (s.endsWith('-')) negative = !negative
    s = s.slice(0, -1)
  }
  if (!/^(?:\d[\d.,]*|[.,]\d+)$/.test(s)) return null

  const dots = s.split('.').length - 1
  const commas = s.split(',').length - 1
  let decimalMark: '.' | ',' | null = null
  if (dots && commas) {
    decimalMark = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ','
    if ((decimalMark === '.' ? dots : commas) > 1) return null
  } else if (commas === 1) decimalMark = ','
  else if (dots === 1) {
    const [intPart, frac] = s.split('.')
    const thousands = frac.length === 3 && intPart.length >= 1 && intPart.length <= 3 && intPart !== '0'
    decimalMark = thousands ? null : '.'
  }
  let intDigits = s
  let frac = ''
  if (decimalMark) {
    const at = s.lastIndexOf(decimalMark)
    intDigits = s.slice(0, at)
    frac = s.slice(at + 1)
  }
  if (/[.,]/.test(intDigits) && !/^\d{1,3}(?:[.,]\d{3})+$/.test(intDigits)) return null // thousands groups of exactly three
  intDigits = intDigits.replace(/[.,]/g, '')
  if (frac.length > 2 || !/^\d*$/.test(frac) || !/^\d*$/.test(intDigits)) return null
  if (intDigits.length > 12) return null
  const cents = Number(intDigits || '0') * 100 + Number(frac.padEnd(2, '0') || '0')
  return negative ? -cents : cents
}

/**
 * Number cells -> signed cents. Excel stores amounts as binary floating point, so the value is rounded to whole cents
 * (12.3 -> 1230); 15 significant digits first remove noise like 1229.9999999999998.
 */
export function numberToCents(x: number): number | null {
  if (!Number.isFinite(x) || Math.abs(x) >= 1e10) return null
  const cents = Math.round(Number((x * 100).toPrecision(15)))
  return cents === 0 ? 0 : cents
}

// ---------- rows ----------

export interface ImportRow {
  /** Position among the rows read from the file (1-based, empty rows skipped). */
  line: number
  date: string
  kind: Kind
  amountCents: number
  /** Empty = Sonstiges of the kind. */
  categoryName: string
  note?: string
  account: Account
}

export interface ImportRowError {
  line: number
  reason: string
}

export interface ParsedRows {
  rows: ImportRow[]
  errors: ImportRowError[]
}

const INCOME_WORDS = new Set(['einnahme', 'einnahmen', 'income', 'e', 'ein', 'haben', 'plus', 'gutschrift'])
const EXPENSE_WORDS = new Set(['ausgabe', 'ausgaben', 'expense', 'a', 'aus', 'soll', 'minus', 'lastschrift'])

function parseKind(cell: RawCell | undefined): Kind | null | undefined {
  const raw = cellToString(cell)
  if (!raw) return undefined // empty: the sign of the amount decides
  if (raw === '+') return 'income'
  if (raw === '-' || raw === '−') return 'expense'
  const word = foldText(raw)
  if (INCOME_WORDS.has(word)) return 'income'
  if (EXPENSE_WORDS.has(word)) return 'expense'
  return null
}

const KONTO_WORDS = new Set(['konto', 'bank', 'karte', 'giro', 'girokonto', 'ec', 'kreditkarte', 'ueberweisung', 'lastschrift'].map(foldText))
const CASH_WORDS = new Set(['bargeld', 'bar', 'cash', 'barzahlung'])

function parseAccount(cell: RawCell | undefined): Account | null | undefined {
  const word = foldText(cellToString(cell))
  if (!word) return undefined
  if (CASH_WORDS.has(word)) return 'bargeld'
  if (KONTO_WORDS.has(word)) return 'konto'
  return null
}

function show(cell: RawCell | undefined): string {
  const s = cellToString(cell)
  return s.length > 30 ? `${s.slice(0, 30)}…` : s
}

/**
 * Turns the rows below the header into bookings. Without an "Art" column the sign decides (negative = Ausgabe);
 * with one the amount counts as absolute. Rows that cannot be read become errors with a German reason.
 */
export function parseImportRows(rows: RawCell[][], headerRow: number, mapping: ColumnMapping): ParsedRows {
  const out: ParsedRows = { rows: [], errors: [] }
  if (mapping.date === undefined || mapping.amount === undefined) return out
  const at = (row: RawCell[], field: ImportField): RawCell | undefined =>
    mapping[field] === undefined ? undefined : row[mapping[field] as number]
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i]
    const line = i + 1
    const fail = (reason: string) => out.errors.push({ line, reason })

    const dateCell = at(row, 'date')
    const date = parseImportDate(dateCell)
    if (!date) {
      fail(cellToString(dateCell) ? `Datum „${show(dateCell)}“ nicht lesbar.` : 'Datum fehlt.')
      continue
    }
    const amountCell = at(row, 'amount')
    let cents: number | null
    if (typeof amountCell === 'number') cents = numberToCents(amountCell)
    else if (cellToString(amountCell) === '') {
      fail('Betrag fehlt.')
      continue
    } else cents = parseAmountText(cellToString(amountCell))
    if (cents === null) {
      fail(`Betrag „${show(amountCell)}“ nicht lesbar.`)
      continue
    }
    if (cents === 0) {
      fail('Betrag ist 0.')
      continue
    }
    const typed = mapping.type === undefined ? undefined : parseKind(at(row, 'type'))
    if (typed === null) {
      fail(`Art „${show(at(row, 'type'))}“ nicht erkannt (Einnahme oder Ausgabe).`)
      continue
    }
    const kind: Kind = typed ?? (cents < 0 ? 'expense' : 'income')
    const accountCell = at(row, 'account')
    const account = parseAccount(accountCell)
    if (account === null) {
      fail(`Konto „${show(accountCell)}“ nicht erkannt (Konto oder Bargeld).`)
      continue
    }
    const note = cellToString(at(row, 'note')).slice(0, MAX_NOTE_LENGTH).trim()
    out.rows.push({
      line,
      date,
      kind,
      amountCents: Math.abs(cents),
      categoryName: cellToString(at(row, 'category')).slice(0, MAX_CATEGORY_LENGTH).trim(),
      ...(note ? { note } : {}),
      account: account ?? 'konto',
    })
  }
  return out
}

// ---------- categories and duplicates ----------

const categoryKey = (name: string) => name.trim().toLowerCase()

/** The existing category a name refers to (same kind, case-insensitive); an empty name means Sonstiges. */
export function findCategory(categories: Category[], kind: Kind, name: string): Category | undefined {
  const key = categoryKey(name || FALLBACK_NAME)
  return categories.find((c) => c.kind === kind && categoryKey(c.name) === key)
}

/** Categories that do not exist yet, in order of first appearance (one entry per kind and name). */
export function newCategoryNames(categories: Category[], rows: Pick<ImportRow, 'kind' | 'categoryName'>[]): { kind: Kind; name: string }[] {
  const seen = new Set<string>()
  const out: { kind: Kind; name: string }[] = []
  for (const r of rows) {
    if (!r.categoryName || findCategory(categories, r.kind, r.categoryName)) continue
    const key = `${r.kind}|${categoryKey(r.categoryName)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ kind: r.kind, name: r.categoryName })
  }
  return out
}

const duplicateKey = (kind: Kind, amountCents: number, date: string, account: Account) => `${kind}|${amountCents}|${date}|${account}`

/**
 * "Schon vorhanden?": a row counts as a duplicate when an existing booking has the same kind, amount, date and account
 * (the note is ignored). Each existing booking covers only one row, so two equal rows in the file against one existing
 * booking flag only the first.
 */
export function findDuplicates(rows: ImportRow[], existing: Transaction[]): boolean[] {
  const available = new Map<string, number>()
  for (const t of existing) {
    const key = duplicateKey(t.kind, t.amountCents, t.date, t.account)
    available.set(key, (available.get(key) ?? 0) + 1)
  }
  return rows.map((r) => {
    const key = duplicateKey(r.kind, r.amountCents, r.date, r.account)
    const left = available.get(key) ?? 0
    if (left <= 0) return false
    available.set(key, left - 1)
    return true
  })
}
