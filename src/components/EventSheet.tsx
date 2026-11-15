import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CalendarEvent, EventRecurrence } from '../domain/types'
import { addDays } from '../domain/dates'
import { addMinutes, dateOf, daysBetween, defaultTimes, lastDay, minutesOf, timeOf } from '../domain/calendar'
import { normalizeEventInput } from '../state/actions'
import type { EventInput } from '../state/actions'
import { useFinance } from '../state/FinanceContext'
import { buildEventIcs } from '../lib/ics'
import { downloadFile } from '../lib/download'
import { haptic } from '../lib/haptics'
import { ConfirmDialog } from './ConfirmDialog'
import { Sheet } from './Sheet'
import { Switch } from './Switch'

type RepeatChoice = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom'

const REPEAT_OPTIONS: { value: RepeatChoice; label: string }[] = [
  { value: 'none', label: 'Nie' },
  { value: 'daily', label: 'Täglich' },
  { value: 'weekly', label: 'Wöchentlich' },
  { value: 'biweekly', label: 'Alle 2 Wochen' },
  { value: 'monthly', label: 'Monatlich' },
  { value: 'yearly', label: 'Jährlich' },
]

/** Which entry of the select matches a stored rule; anything else (weekdays, counts, other intervals) is "custom" and kept as it is. */
function repeatChoiceOf(r: EventRecurrence | undefined): RepeatChoice {
  if (!r) return 'none'
  if (r.count !== undefined || r.byWeekday) return 'custom'
  if (r.freq === 'weekly' && r.interval === 2) return 'biweekly'
  if (r.interval !== 1) return 'custom'
  return r.freq
}

function recurrenceFrom(choice: RepeatChoice, until: string | null, existing: EventRecurrence | undefined): EventRecurrence | undefined {
  if (choice === 'none') return undefined
  let rec: EventRecurrence
  if (choice === 'custom' && existing) rec = { ...existing }
  else if (choice === 'biweekly') rec = { freq: 'weekly', interval: 2 }
  else rec = { freq: choice === 'custom' ? 'weekly' : choice, interval: 1 }
  delete rec.until
  if (until) rec.until = until
  return rec
}

export interface EventSheetProps {
  /** Editing: the stored event. */
  event?: CalendarEvent
  /** The occurrence that was tapped (its start day), for "Nur diesen Termin". */
  occurrenceDate?: string
  /** New event: the day, and optionally the hour (tap on an empty slot of the day view). */
  day?: string
  hour?: number
  onClose: () => void
}

/** "Neuer Termin" / "Termin bearbeiten". */
export function EventSheet({ event, occurrenceDate, day, hour, onClose }: EventSheetProps) {
  const { addEvent, updateEvent, deleteEvent, deleteOccurrence } = useFinance()
  const initial = (() => {
    if (event) return { start: event.start, end: event.end }
    const d = day as string
    return hour === undefined ? { start: `${d}T09:00`, end: `${d}T10:00` } : defaultTimes(d, hour)
  })()
  const [title, setTitle] = useState(event?.title ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [allDay, setAllDay] = useState(event?.allDay ?? false)
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [choice, setChoice] = useState<RepeatChoice>(repeatChoiceOf(event?.recurrence))
  const [hasUntil, setHasUntil] = useState(Boolean(event?.recurrence?.until))
  const [until, setUntil] = useState(event?.recurrence?.until ?? '')
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const startDate = dateOf(start)
  const endDate = dateOf(end)
  const repeating = choice !== 'none'

  const input = (): EventInput => ({
    title,
    allDay,
    start,
    end,
    location,
    notes,
    recurrence: recurrenceFrom(choice, repeating && hasUntil ? until || null : null, event?.recurrence),
  })

  /** Start moves, the end moves with it (the duration stays). */
  function changeStart(next: string) {
    if (!next) return
    if (allDay) {
      setEnd(addDays(next, daysBetween(startDate, endDate)))
      setStart(next)
    } else {
      const length = Math.max(daysBetween(startDate, endDate) * 1440 + minutesOf(end) - minutesOf(start), 15)
      setStart(next)
      setEnd(addMinutes(next, length))
    }
  }
  const setStartDate = (d: string) => changeStart(allDay ? d : `${d}T${timeOf(start)}`)
  const setStartTime = (t: string) => t && changeStart(`${startDate}T${t}`)
  const setEndDate = (d: string) => d && setEnd(allDay ? d : `${d}T${timeOf(end)}`)
  const setEndTime = (t: string) => t && setEnd(`${endDate}T${t}`)

  function toggleAllDay(on: boolean) {
    setAllDay(on)
    if (on) {
      setStart(startDate)
      setEnd(lastDay({ start, end, allDay: false }))
    } else {
      const t = defaultTimes(startDate, 9)
      const spanDays = daysBetween(startDate, endDate)
      setStart(t.start)
      setEnd(spanDays > 0 ? `${addDays(startDate, spanDays)}T10:00` : t.end)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    try {
      if (repeating && hasUntil && !until) throw new Error('Bitte ein Datum für das Ende der Wiederholung wählen.')
      if (event) updateEvent(event.id, input())
      else addEvent(input())
      haptic()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  function exportIcs() {
    try {
      const clean = normalizeEventInput(input())
      const ev: CalendarEvent = { id: event?.id ?? crypto.randomUUID(), createdAt: event?.createdAt ?? Date.now(), ...clean }
      if (event?.exdates) ev.exdates = event.exdates
      if (event?.importUid) ev.importUid = event.importUid
      downloadFile(`termin-${dateOf(ev.start)}.ics`, buildEventIcs(ev), 'text/calendar;charset=utf-8')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Die Datei konnte nicht erstellt werden.')
    }
  }

  const sheetTitle = event ? 'Termin bearbeiten' : 'Neuer Termin'
  return (
    <Sheet title={sheetTitle} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="card">
          <div className="field">
            <label htmlFor="ev-title">Titel</label>
            <input id="ev-title" placeholder="Titel" value={title} maxLength={200} autoComplete="off" autoFocus={!event} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ev-loc">Ort</label>
            <input id="ev-loc" placeholder="Optional" value={location} maxLength={200} autoComplete="off" onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
        <div className="card ev-labels" style={{ marginTop: 16 }}>
          <div className="field switch-row">
            <label htmlFor="ev-allday">Ganztägig</label>
            <Switch id="ev-allday" checked={allDay} onChange={toggleAllDay} />
          </div>
          <div className="field">
            <label htmlFor="ev-start-d">Beginn</label>
            <div className="field-pair">
              <input id="ev-start-d" type="date" aria-label="Beginn Datum" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              {!allDay && <input id="ev-start-t" type="time" aria-label="Beginn Uhrzeit" value={timeOf(start)} onChange={(e) => setStartTime(e.target.value)} />}
            </div>
          </div>
          <div className="field">
            <label htmlFor="ev-end-d">Ende</label>
            <div className="field-pair">
              <input id="ev-end-d" type="date" aria-label="Ende Datum" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              {!allDay && <input id="ev-end-t" type="time" aria-label="Ende Uhrzeit" value={timeOf(end)} onChange={(e) => setEndTime(e.target.value)} />}
            </div>
          </div>
          <div className="field">
            <label htmlFor="ev-repeat">Wiederholen</label>
            <select id="ev-repeat" value={choice} onChange={(e) => setChoice(e.target.value as RepeatChoice)}>
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              {choice === 'custom' && <option value="custom">Benutzerdefiniert</option>}
            </select>
          </div>
          {repeating && (
            <>
              <div className="field switch-row">
                <label htmlFor="ev-until-on">Wiederholung endet</label>
                <Switch
                  id="ev-until-on"
                  checked={hasUntil}
                  onChange={(on) => {
                    setHasUntil(on)
                    if (on && !until) setUntil(addDays(startDate, 365))
                  }}
                />
              </div>
              {hasUntil && (
                <div className="field">
                  <label htmlFor="ev-until">Am</label>
                  <input id="ev-until" type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
                </div>
              )}
            </>
          )}
        </div>
        {event?.recurrence && <div className="footnote">Änderungen gelten für alle Termine dieser Serie.</div>}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="field field-notes">
            <label htmlFor="ev-notes" className="sr-only">Notiz</label>
            <textarea id="ev-notes" placeholder="Notiz" rows={3} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit">
          Sichern
        </button>
        <button className="btn secondary ev-apple" type="button" onClick={exportIcs}>
          In den Apple-Kalender übernehmen
        </button>
        <div className="footnote">Lädt eine Kalenderdatei, die du in Kalender öffnest.</div>
        {event && (
          <button className="btn danger" type="button" onClick={() => setConfirmDelete(true)}>
            Termin löschen
          </button>
        )}
      </form>
      {confirmDelete && event && (
        <ConfirmDialog
          title="Termin löschen?"
          message={event.recurrence ? 'Dieser Termin wiederholt sich. Direkt danach kannst du das noch rückgängig machen.' : 'Direkt danach kannst du das noch rückgängig machen.'}
          confirmLabel={event.recurrence ? 'Alle Termine' : 'Löschen'}
          secondaryLabel={event.recurrence && occurrenceDate ? 'Nur diesen Termin' : undefined}
          onSecondary={() => {
            haptic()
            deleteOccurrence(event.id, occurrenceDate as string)
            onClose()
          }}
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            haptic()
            deleteEvent(event.id)
            onClose()
          }}
        />
      )}
    </Sheet>
  )
}
