import { useMemo, useState } from 'react'
import { formatShortDay, todayISO } from '../domain/dates'
import { formatSigned } from '../domain/money'
import {
  IMPORT_FIELDS, cellToString, detectHeader, findDuplicates, guessMapping, headerSignature, newCategoryNames, parseImportRows,
} from '../domain/importRows'
import type { ColumnMapping, ImportField } from '../domain/importRows'
import { haptic } from '../lib/haptics'
import { getSavedMapping, saveMapping } from '../lib/importMapping'
import { columnLetters } from '../lib/xlsx/write'
import type { RawCell } from '../lib/xlsx/types'
import { useFinance } from '../state/FinanceContext'
import { Sheet } from './Sheet'

/** A table file that was read: .csv gives one table, .xlsx one per worksheet (read on demand). */
export interface ImportSource {
  fileName: string
  /** Empty for .csv. */
  sheetNames: string[]
  readSheet(index: number): RawCell[][]
}

/** Rows shown in the list (the rest is still imported; the summary counts everything). */
const MAX_LIST = 300
const MAX_ERRORS = 50

function initialMapping(rows: RawCell[][]): { headerRow: number; mapping: ColumnMapping } {
  const guess = detectHeader(rows)
  const headerRow = guess?.headerRow ?? 0
  const headers = (rows[headerRow] ?? []).map(cellToString)
  const saved = getSavedMapping(headerSignature(headers))
  const mapping = saved && Object.values(saved).every((col) => col < headers.length) ? saved : (guess?.mapping ?? guessMapping(headers))
  return { headerRow, mapping }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "Import prüfen": column mapping, summary and the rows to pick from before anything is written. */
export function ImportSheet({ source, onClose, onImported }: { source: ImportSource; onClose: () => void; onImported: (count: number, ids: string[]) => void }) {
  const { data, importTransactions } = useFinance()
  const [sheetIndex, setSheetIndex] = useState(0)
  const rows = useMemo(() => source.readSheet(sheetIndex), [source, sheetIndex])
  const [start, setStart] = useState(() => initialMapping(rows))
  const [overrides, setOverrides] = useState<Map<number, boolean>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [thisYear] = useState(() => todayISO().slice(0, 4))
  const { headerRow, mapping } = start

  const headers = useMemo(() => (rows[headerRow] ?? []).map(cellToString), [rows, headerRow])
  const columns = useMemo(() => {
    const width = Math.max(headers.length, ...rows.slice(headerRow, headerRow + 30).map((r) => r.length))
    return Array.from({ length: width }, (_, i) => ({ index: i, label: `${columnLetters(i)} · ${headers[i] || 'ohne Titel'}` }))
  }, [rows, headers, headerRow])

  const parsed = useMemo(() => parseImportRows(rows, headerRow, mapping), [rows, headerRow, mapping])
  const duplicates = useMemo(() => findDuplicates(parsed.rows, data.transactions), [parsed.rows, data.transactions])

  const picked = useMemo(() => parsed.rows.filter((r, i) => overrides.get(r.line) ?? !duplicates[i]), [parsed.rows, duplicates, overrides])
  const newCategories = useMemo(() => newCategoryNames(data.categories, picked), [data.categories, picked])
  const skippedDuplicates = parsed.rows.filter((r, i) => duplicates[i] && !(overrides.get(r.line) ?? false)).length
  const deselected = parsed.rows.length - picked.length - skippedDuplicates
  const ready = mapping.date !== undefined && mapping.amount !== undefined

  function setField(field: ImportField, value: string) {
    const next = { ...mapping }
    if (value === '') delete next[field]
    else next[field] = Number(value)
    setStart({ headerRow, mapping: next })
    setOverrides(new Map())
    setError(null)
  }

  function changeSheet(value: string) {
    const i = Number(value)
    setSheetIndex(i)
    setStart(initialMapping(source.readSheet(i)))
    setOverrides(new Map())
    setError(null)
  }

  function submit() {
    if (picked.length === 0) return
    try {
      const ids = importTransactions(
        picked.map((r) => ({ kind: r.kind, amountCents: r.amountCents, date: r.date, account: r.account, categoryName: r.categoryName, note: r.note })),
      )
      saveMapping(headerSignature(headers), mapping)
      haptic()
      onImported(ids.length, ids)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Einlesen fehlgeschlagen.')
    }
  }

  const summary = [
    plural(picked.length, 'Buchung wird eingelesen', 'Buchungen werden eingelesen'),
    skippedDuplicates > 0 ? `${skippedDuplicates} übersprungen (schon vorhanden)` : null,
    deselected > 0 ? `${deselected} abgewählt` : null,
    parsed.errors.length > 0 ? plural(parsed.errors.length, 'Fehler', 'Fehler') : null,
    newCategories.length > 0 ? `${plural(newCategories.length, 'neue Kategorie', 'neue Kategorien')}: ${newCategories.map((c) => c.name).join(', ')}` : null,
  ].filter(Boolean)

  return (
    <Sheet title="Import prüfen" onClose={onClose}>
      <div className="footnote import-file">{source.fileName}</div>

      {source.sheetNames.length > 1 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="field">
            <label htmlFor="imp-sheet">Tabelle</label>
            <select id="imp-sheet" value={sheetIndex} onChange={(e) => changeSheet(e.target.value)}>
              {source.sheetNames.map((name, i) => (
                <option key={name + i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="section-title">Spalten zuordnen</div>
      <div className="card">
        {IMPORT_FIELDS.map(({ field, label, required }) => (
          <div className="field" key={field}>
            <label htmlFor={`imp-${field}`}>{label}</label>
            <select id={`imp-${field}`} value={mapping[field] ?? ''} onChange={(e) => setField(field, e.target.value)}>
              <option value="">{required ? '— bitte wählen —' : '— nicht verwenden —'}</option>
              {columns.map((c) => (
                <option key={c.index} value={c.index}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {ready ? (
        <div className="card import-summary" role="status">
          {summary.join(' · ')}
        </div>
      ) : (
        <div className="error" role="alert">
          Bitte wähle Spalten für Datum und Betrag.
        </div>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <button className="btn" type="button" disabled={picked.length === 0} onClick={submit}>
        {picked.length > 0 ? `Einlesen (${picked.length})` : 'Einlesen'}
      </button>

      {parsed.rows.length > 0 && (
        <>
          <div className="section-title">Buchungen</div>
          <ul className="list card">
            {parsed.rows.slice(0, MAX_LIST).map((r, i) => {
              const checked = overrides.get(r.line) ?? !duplicates[i]
              const category = r.categoryName || 'Sonstiges'
              return (
                <li key={r.line}>
                  <label className="row import-row">
                    <input
                      type="checkbox"
                      className="import-check"
                      checked={checked}
                      onChange={(e) => setOverrides(new Map(overrides).set(r.line, e.target.checked))}
                    />
                    <span className="row-main">
                      <span className="row-title" style={{ display: 'block' }}>
                        {category}
                        {r.account === 'bargeld' && (
                          <>
                            {' '}
                            <span className="badge">Bar</span>
                          </>
                        )}
                      </span>
                      <span className="row-sub" style={{ display: 'block' }}>
                        {formatShortDay(r.date)}
                        {r.date.slice(0, 4) !== thisYear ? ` ${r.date.slice(0, 4)}` : ''}
                        {r.note ? ` · ${r.note}` : ''}
                      </span>
                      {duplicates[i] && <span className="import-dup">schon vorhanden?</span>}
                    </span>
                    <span className={`row-amount num ${r.kind === 'income' ? 'income-text' : 'expense-text'}`}>{formatSigned(r.amountCents, r.kind)}</span>
                  </label>
                </li>
              )
            })}
          </ul>
          {parsed.rows.length > MAX_LIST && (
            <div className="footnote">… und {parsed.rows.length - MAX_LIST} weitere Buchungen (werden mit eingelesen, soweit nicht schon vorhanden).</div>
          )}
        </>
      )}

      {parsed.errors.length > 0 && (
        <>
          <div className="section-title">Nicht lesbar ({parsed.errors.length})</div>
          <ul className="list card">
            {parsed.errors.slice(0, MAX_ERRORS).map((e) => (
              <li key={e.line} className="row-static import-error">
                <span className="row-main">
                  <span className="row-title" style={{ display: 'block' }}>
                    Zeile {e.line}
                  </span>
                  <span className="row-sub" style={{ display: 'block', whiteSpace: 'normal' }}>
                    {e.reason}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {parsed.errors.length > MAX_ERRORS && <div className="footnote">… und {parsed.errors.length - MAX_ERRORS} weitere Zeilen.</div>}
          <div className="footnote">Diese Zeilen werden übersprungen.</div>
        </>
      )}
    </Sheet>
  )
}
