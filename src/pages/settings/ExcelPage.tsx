import { memo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { monthStart, todayISO } from '../../domain/dates'
import { detectRecurring } from '../../domain/recurringDetect'
import { buildExportSheets, countExportRows, exportFileName, resolveExportRange } from '../../domain/exportSheet'
import type { ExportMode, ExportRange } from '../../domain/exportSheet'
import { decodeText, parseCsvText } from '../../lib/csv'
import { downloadFile } from '../../lib/download'
import { haptic } from '../../lib/haptics'
import { getDismissedKeys } from '../../lib/recurringDismissed'
import { openXlsx } from '../../lib/xlsx/read'
import { XLSX_MIME, buildXlsx } from '../../lib/xlsx/write'
import { useFinance } from '../../state/FinanceContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ImportSheet } from '../../components/ImportSheet'
import type { ImportSource } from '../../components/ImportSheet'
import { RecurringSuggestions } from '../../components/RecurringSuggestions'
import { SaveError } from '../../components/SaveError'
import { SegmentedControl } from '../../components/SegmentedControl'
import { SubPageHeader } from '../../components/SubPageHeader'

const MAX_FILE_BYTES = 10 * 1024 * 1024

const MODES: { value: ExportMode; label: string }[] = [
  { value: 'all', label: 'Alles' },
  { value: 'year', label: 'Dieses Jahr' },
  { value: 'custom', label: 'Zeitraum' },
]

type Message = { ok: boolean; text: string } | null

const isZip = (b: Uint8Array) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b
const isOldExcel = (b: Uint8Array) => b.length > 4 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0

/** Reads a chosen file as a table source (.xlsx by content, everything else as delimited text). */
async function readSource(file: File): Promise<ImportSource> {
  if (file.size > MAX_FILE_BYTES) throw new Error('Die Datei ist zu groß (höchstens 10 MB).')
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (isOldExcel(bytes)) throw new Error('Alte .xls-Dateien werden nicht unterstützt. Bitte als .xlsx oder .csv speichern.')
  if (isZip(bytes)) {
    const xlsx = await openXlsx(bytes)
    return { fileName: file.name, sheetNames: xlsx.sheetNames, readSheet: (i) => xlsx.readSheet(i) }
  }
  const rows = parseCsvText(decodeText(bytes).text)
  return { fileName: file.name, sheetNames: [], readSheet: () => rows }
}

/** Settings > Excel & CSV: export bookings as .xlsx, import own lists from .xlsx or .csv. */
export const ExcelPage = memo(function ExcelPage({ onBack }: { onBack: () => void }) {
  const { data, saveError } = useFinance()
  const [mode, setMode] = useState<ExportMode>('all')
  const [from, setFrom] = useState(() => monthStart(todayISO()))
  const [to, setTo] = useState(() => todayISO())
  const [exportMsg, setExportMsg] = useState<Message>(null)
  const [confirmExport, setConfirmExport] = useState(false)
  const [importMsg, setImportMsg] = useState<Message>(null)
  const [reading, setReading] = useState(false)
  const [source, setSource] = useState<ImportSource | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // after an import: the ids of the new bookings (waiting for the data to arrive) / the suggestions sheet limited to them
  const [afterImport, setAfterImport] = useState<string[] | null>(null)
  const [suggestIds, setSuggestIds] = useState<string[] | null>(null)

  // Adjusted during render (no effect): the new data arrives in the same update as the ids.
  if (afterImport) {
    const wanted = new Set(afterImport)
    const found = detectRecurring(data, todayISO(), getDismissedKeys()).some((s) => s.transactionIds.some((id) => wanted.has(id)))
    setAfterImport(null)
    if (found) setSuggestIds(afterImport)
  }

  let range: ExportRange | null = null
  let rangeError: string | null = null
  try {
    range = resolveExportRange(mode, todayISO(), { from, to })
  } catch (e) {
    rangeError = e instanceof Error ? e.message : 'Ungültiger Zeitraum.'
  }
  const rowCount = range ? countExportRows(data, range) : 0

  function startExport() {
    if (!range) return
    setExportMsg(null)
    setConfirmExport(true)
  }

  function doExport() {
    setConfirmExport(false)
    try {
      const r = resolveExportRange(mode, todayISO(), { from, to })
      const name = exportFileName(todayISO())
      downloadFile(name, buildXlsx(buildExportSheets(data, r)) as BlobPart, XLSX_MIME)
      haptic()
      setExportMsg({ ok: true, text: `Export erstellt (${plural(countExportRows(data, r), 'Zeile', 'Zeilen')}): ${name}` })
    } catch (e) {
      setExportMsg({ ok: false, text: e instanceof Error ? e.message : 'Export fehlgeschlagen.' })
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportMsg(null)
    setReading(true)
    try {
      const src = await readSource(file)
      if (src.readSheet(0).length === 0 && src.sheetNames.length <= 1) throw new Error('In der Datei wurden keine Zeilen gefunden.')
      setSource(src)
    } catch (err) {
      setImportMsg({ ok: false, text: err instanceof Error ? err.message : 'Die Datei konnte nicht gelesen werden.' })
    } finally {
      setReading(false)
    }
  }

  return (
    <>
      <SubPageHeader title="Excel & CSV" parent="Einstellungen" onBack={onBack} />
      <SaveError message={saveError} />

      <div className="section-title">Exportieren</div>
      <div className="card" style={{ padding: 12 }}>
        <SegmentedControl<ExportMode> label="Zeitraum" options={MODES} value={mode} onChange={(m) => { setMode(m); setExportMsg(null) }} />
      </div>
      {mode === 'custom' && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="field">
            <label htmlFor="ex-from">Von</label>
            <input id="ex-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setExportMsg(null) }} />
          </div>
          <div className="field">
            <label htmlFor="ex-to">Bis</label>
            <input id="ex-to" type="date" value={to} onChange={(e) => { setTo(e.target.value); setExportMsg(null) }} />
          </div>
        </div>
      )}
      {rangeError && (
        <div className="error" role="alert">
          {rangeError}
        </div>
      )}
      <button className="btn" type="button" disabled={!range} onClick={startExport}>
        Als Excel-Datei exportieren
      </button>
      {exportMsg && (
        <div className={exportMsg.ok ? 'success' : 'error'} role={exportMsg.ok ? 'status' : 'alert'}>
          {exportMsg.text}
        </div>
      )}
      <div className="footnote">
        {range ? `${plural(rowCount, 'Buchung oder Umbuchung', 'Buchungen und Umbuchungen')} in diesem Zeitraum. ` : ''}
        Die .xlsx-Datei enthält die Tabellen „Buchungen“ und „Monate“ (Summen je Monat und Kategorie).
      </div>

      <div className="section-title">Importieren</div>
      <button className="btn secondary" style={{ background: 'var(--card)' }} type="button" disabled={reading} aria-busy={reading} onClick={() => fileRef.current?.click()}>
        {reading ? 'Wird gelesen …' : 'Excel- oder CSV-Datei wählen'}
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={onFile} />
      {importMsg && (
        <div className={importMsg.ok ? 'success' : 'error'} role={importMsg.ok ? 'status' : 'alert'}>
          {importMsg.text}
        </div>
      )}
      <div className="footnote">
        Erkannt werden Spalten wie Datum, Betrag, Kategorie, Notiz, Art und Konto. Vor dem Einlesen siehst du eine Vorschau; unbekannte Kategorien
        werden neu angelegt, schon vorhandene Buchungen sind abgewählt.
      </div>

      {confirmExport && (
        <ConfirmDialog
          title="Unverschlüsselt exportieren?"
          message="Die Excel-Datei ist nicht verschlüsselt und für jeden lesbar, der sie öffnet (z. B. in iCloud oder als Mail-Anhang). Trotzdem exportieren?"
          confirmLabel="Unverschlüsselt exportieren"
          danger
          onCancel={() => setConfirmExport(false)}
          onConfirm={doExport}
        />
      )}
      {source && (
        <ImportSheet
          source={source}
          onClose={() => setSource(null)}
          onImported={(count, ids) => {
            setImportMsg({ ok: true, text: `${plural(count, 'Buchung', 'Buchungen')} importiert.` })
            setAfterImport(ids)
          }}
        />
      )}
      {suggestIds && <RecurringSuggestions importedIds={suggestIds} onClose={() => setSuggestIds(null)} />}
    </>
  )
})

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
