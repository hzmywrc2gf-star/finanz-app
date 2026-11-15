import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { dateOf, recurrenceText, splitImportedEvents, timeOf } from '../domain/calendar'
import { formatShortDay } from '../domain/dates'
import { ERR_TOO_BIG, MAX_FILE_BYTES } from '../lib/fileLimit'
import { decodeText } from '../lib/csv'
import { haptic } from '../lib/haptics'
import { ERR_NOT_ICS, looksLikeIcs, parseIcs } from '../lib/icsRead'
import type { ParsedIcs } from '../lib/icsRead'
import { useFinance } from '../state/FinanceContext'
import { Sheet } from './Sheet'

/** Rows shown in the preview list; the rest is imported as well (the counts cover everything). */
const MAX_LIST = 50

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Reads a chosen file: the content decides (BEGIN:VCALENDAR), not the name, because Safari may save a link's download without an extension. */
async function readCalendar(file: File): Promise<ParsedIcs> {
  if (file.size > MAX_FILE_BYTES) throw new Error(ERR_TOO_BIG)
  const text = decodeText(new Uint8Array(await file.arrayBuffer())).text
  if (!looksLikeIcs(text)) throw new Error(ERR_NOT_ICS)
  return parseIcs(text)
}

/** "Kalender importieren": step-by-step help for Mac and for iPhone/iPad alone, and the file chooser. */
export function CalendarImportSheet({ onClose }: { onClose: () => void }) {
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedIcs | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setReading(true)
    setError(null)
    try {
      setParsed(await readCalendar(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Die Datei konnte nicht gelesen werden.')
    } finally {
      setReading(false)
    }
  }

  return (
    <>
      <Sheet title="Kalender importieren" onClose={onClose}>
        <section className="card card-pad cal-help" aria-label="Mit dem Mac">
          <h3>Mit dem Mac</h3>
          <ol>
            <li>Kalender-App öffnen und den Kalender in der Seitenleiste auswählen.</li>
            <li>Ablage → Exportieren → Exportieren …</li>
            <li>In iCloud Drive sichern.</li>
            <li>Auf iPhone oder iPad hier „Datei wählen“ tippen.</li>
          </ol>
        </section>
        <section className="card card-pad cal-help" aria-label="Nur mit iPhone oder iPad">
          <h3>Nur mit iPhone oder iPad</h3>
          <ol>
            <li>Kalender-App öffnen, unten „Kalender“ tippen und beim Kalender auf ⓘ gehen.</li>
            <li>„Öffentlicher Kalender“ einschalten, „Link teilen“, dann „Kopieren“.</li>
            <li>Den Link in Safari einfügen und vorne „webcal://“ durch „https://“ ersetzen.</li>
            <li>Safari lädt die Datei: „In Dateien sichern“.</li>
            <li>Hier „Datei wählen“ tippen.</li>
          </ol>
          <p className="cal-warning" role="note">
            Danach „Öffentlicher Kalender“ wieder ausschalten – sonst kann jeder mit dem Link deine Termine sehen.
          </p>
        </section>
        <button className="btn" type="button" disabled={reading} aria-busy={reading} onClick={() => fileRef.current?.click()}>
          {reading ? 'Wird gelesen …' : 'Datei wählen'}
        </button>
        <input ref={fileRef} type="file" hidden data-testid="calendar-file" onChange={onFile} />
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="footnote">
          Der Import ist eine einmalige Übernahme: Änderungen im Apple-Kalender kommen nicht automatisch nach. Ein erneuter Import überspringt, was schon da ist.
          Deine Termine liegen nur auf diesem Gerät.
        </div>
      </Sheet>
      {parsed && <EventImportPreview parsed={parsed} onCancel={() => setParsed(null)} onDone={onClose} />}
    </>
  )
}

/** "Termine importieren": what the file holds, what is new, and a sample, before anything is written. */
function EventImportPreview({ parsed, onCancel, onDone }: { parsed: ParsedIcs; onCancel: () => void; onDone: () => void }) {
  const { data, importEvents } = useFinance()
  const { fresh, duplicates } = splitImportedEvents(data.events, parsed.events)
  const [error, setError] = useState<string | null>(null)

  function run() {
    try {
      importEvents(parsed.events)
      haptic()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der Import ist fehlgeschlagen.')
    }
  }

  const stats = [
    plural(fresh.length, 'neuer Termin', 'neue Termine'),
    duplicates.length > 0 ? `${duplicates.length} schon vorhanden` : null,
    parsed.simplified > 0 ? `${parsed.simplified} vereinfacht` : null,
    parsed.cancelled > 0 ? `${parsed.cancelled} abgesagt (übersprungen)` : null,
    parsed.invalid > 0 ? `${parsed.invalid} nicht lesbar` : null,
  ].filter(Boolean)

  return (
    <Sheet title="Termine importieren" onClose={onCancel}>
      <div className="card card-pad" role="status" data-testid="import-summary">
        {stats.join(' · ')}
      </div>
      {parsed.simplified > 0 && (
        <div className="footnote">Vereinfacht: Wiederholungen mit besonderen Regeln (z. B. „jeden ersten Donnerstag“) werden nur als erster Termin übernommen.</div>
      )}
      {fresh.length > 0 && (
        <ul className="card cal-preview" aria-label="Vorschau">
          {fresh.slice(0, MAX_LIST).map((e, i) => (
            <li key={i}>
              <span className="cal-prev-when num">
                {formatShortDay(dateOf(e.start))}
                {!e.allDay && ` ${timeOf(e.start)}`}
              </span>
              <span className="cal-prev-title">{e.title}</span>
              {e.recurrence && <span className="cal-prev-rep">{recurrenceText(e.recurrence)}</span>}
            </li>
          ))}
        </ul>
      )}
      {fresh.length > MAX_LIST && <div className="footnote">… und {fresh.length - MAX_LIST} weitere.</div>}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <button className="btn" type="button" disabled={fresh.length === 0} onClick={run}>
        Importieren ({fresh.length})
      </button>
    </Sheet>
  )
}
