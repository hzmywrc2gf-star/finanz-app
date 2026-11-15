import type { AppData, CalendarEvent, EventRecurrence, Kind } from './types'
import { addDays, isValidISODate, monthStart, parseISODate, toISODate } from './dates'
import { occurrencesBetween, recurringTitle } from './recurring'
import { invoiceTitle } from './invoices'

/*
 * Calendar logic (pure, local wall-clock strings; no time zones, never toISOString).
 *
 * Repeat rules (subset of RFC 5545, same results as Apple Calendar for these):
 * - daily:   every `interval` days.
 * - weekly:  every `interval` weeks on `byWeekday` (Monday = 0); without it on the weekday of the start. Weeks start on Monday.
 * - monthly: the same day of the month as the start. Months that lack that day are SKIPPED (the 31st happens in
 *            Jan, Mar, May, Jul, Aug, Oct, Dec only), they do not move to the last day. A skipped month does not count.
 * - yearly:  the same month and day; 29 February only happens in leap years.
 * - `until` (inclusive, compared with the occurrence's start day) and `count` (total number, exdates still count) end the series; the
 *   earlier end wins. `exdates` remove single occurrences by their start day.
 * - Expansion is capped (`MAX_OCCURRENCES`, `MAX_STEPS`) so a damaged rule cannot freeze the app.
 */

/** At most this many occurrences are returned by one expansion. */
export const MAX_OCCURRENCES = 5000
/** At most this many candidate dates are visited per event (skipped months and weeks included). */
const MAX_STEPS = 20000

const MINUTES_PER_DAY = 1440

export const dateOf = (s: string): string => s.slice(0, 10)
export const timeOf = (s: string): string => s.slice(11, 16)
/** Minutes after midnight of 'YYYY-MM-DDTHH:mm' (or of 'HH:mm'). */
export function minutesOf(s: string): number {
  const t = s.length > 5 ? s.slice(11, 16) : s
  return Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
}
const pad = (n: number) => String(n).padStart(2, '0')
/** 750 -> '12:30' */
export const timeFromMinutes = (m: number): string => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`

/** Whole days from a to b (b - a), DST-proof (both read as UTC midnights). */
export function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.slice(0, 10).split('-').map(Number)
  const [yb, mb, db] = b.slice(0, 10).split('-').map(Number)
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000)
}

/** Monday = 0 … Sunday = 6. */
export function weekdayOf(iso: string): number {
  return (parseISODate(iso.slice(0, 10)).getDay() + 6) % 7
}

/** The Monday on or before the date. */
export function weekStart(iso: string): string {
  return addDays(iso.slice(0, 10), -weekdayOf(iso))
}

export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
export const WEEKDAY_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

const daysInMonth = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate()

export interface GridDay {
  date: string
  inMonth: boolean
}

/** The month as 6 weeks of 7 days, Monday first, with the days of the neighbouring months around it. */
export function monthGrid(month: string): GridDay[][] {
  const first = monthStart(month)
  const start = weekStart(first)
  const prefix = first.slice(0, 7)
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, w * 7 + d)
      return { date, inMonth: date.startsWith(prefix) }
    }),
  )
}

/** One concrete appearance of an event (a single event, or one date of a repeating one). */
export interface Occurrence {
  /** `${event.id}@${start day}`: unique and stable. */
  key: string
  event: CalendarEvent
  /** Start day, 'YYYY-MM-DD' (the day an `exdates` entry refers to). */
  date: string
  /** Full start/end (all-day: dates only, end inclusive). */
  start: string
  end: string
  allDay: boolean
}

/** Last day an occurrence shows on: a timed event ending exactly at 00:00 of a later day does not touch that day. */
export function lastDay(o: Pick<Occurrence, 'start' | 'end' | 'allDay'>): string {
  const endDay = dateOf(o.end)
  if (!o.allDay && endDay > dateOf(o.start) && timeOf(o.end) === '00:00') return addDays(endDay, -1)
  return endDay
}

/** The days an event spans after its first (end day - start day). */
function spanDays(e: CalendarEvent): number {
  return daysBetween(e.start, e.end)
}

function makeOccurrence(e: CalendarEvent, date: string): Occurrence {
  const span = spanDays(e)
  if (e.allDay) {
    return { key: `${e.id}@${date}`, event: e, date, start: date, end: addDays(date, span), allDay: true }
  }
  return {
    key: `${e.id}@${date}`,
    event: e,
    date,
    start: `${date}T${timeOf(e.start)}`,
    end: `${addDays(date, span)}T${timeOf(e.end)}`,
    allDay: false,
  }
}

/**
 * Start days of a repeating event in ascending order, beginning at the event's own start, honouring until/count
 * (not exdates). `skipBefore` allows jumping ahead (daily/weekly without count) when only later days matter.
 */
function* generateDates(start: string, rule: EventRecurrence, skipBefore: string | null): Generator<string> {
  const { freq, interval, until, count } = rule
  let produced = 0
  let steps = 0
  const emit = (date: string): 'ok' | 'stop' => {
    if (until && date > until) return 'stop'
    return 'ok'
  }
  if (freq === 'daily') {
    let k = 0
    if (skipBefore && count === undefined) k = Math.max(0, Math.floor(daysBetween(start, skipBefore) / interval) - 1)
    for (; steps < MAX_STEPS; k++, steps++) {
      const date = addDays(start, k * interval)
      if (emit(date) === 'stop') return
      if (count !== undefined && produced >= count) return
      produced++
      yield date
    }
    return
  }
  if (freq === 'weekly') {
    const days = rule.byWeekday?.length ? [...rule.byWeekday].sort((a, b) => a - b) : [weekdayOf(start)]
    const base = weekStart(start)
    let k = 0
    if (skipBefore && count === undefined) k = Math.max(0, Math.floor(daysBetween(base, skipBefore) / 7 / interval) - 1)
    for (; steps < MAX_STEPS; k++, steps++) {
      const monday = addDays(base, k * interval * 7)
      for (const wd of days) {
        const date = addDays(monday, wd)
        if (date < start) continue
        if (emit(date) === 'stop') return
        if (count !== undefined && produced >= count) return
        produced++
        yield date
      }
      if (until && monday > until) return
    }
    return
  }
  const [sy, sm, sd] = start.split('-').map(Number)
  if (freq === 'monthly') {
    for (let k = 0; steps < MAX_STEPS; k++, steps++) {
      const idx = sy * 12 + (sm - 1) + k * interval
      const y = Math.floor(idx / 12)
      const m0 = idx % 12
      const first = `${String(y).padStart(4, '0')}-${pad(m0 + 1)}-01`
      if (until && first > until) return
      if (sd > daysInMonth(y, m0)) continue // the month lacks that day: skipped, not counted
      const date = `${String(y).padStart(4, '0')}-${pad(m0 + 1)}-${pad(sd)}`
      if (emit(date) === 'stop') return
      if (count !== undefined && produced >= count) return
      produced++
      yield date
    }
    return
  }
  // yearly
  for (let k = 0; steps < MAX_STEPS; k++, steps++) {
    const y = sy + k * interval
    if (y > 9999) return
    if (until && `${String(y).padStart(4, '0')}-01-01` > until) return
    if (sd > daysInMonth(y, sm - 1)) continue // 29 February in a non-leap year
    const date = `${String(y).padStart(4, '0')}-${pad(sm)}-${pad(sd)}`
    if (emit(date) === 'stop') return
    if (count !== undefined && produced >= count) return
    produced++
    yield date
  }
}

/**
 * All occurrences that touch the days from..to (inclusive 'YYYY-MM-DD'), sorted by start (all-day first on a day, then time, then title).
 * Multi-day events appear once (with their full span) as long as one of their days is in range.
 */
export function occurrencesInRange(events: readonly CalendarEvent[], from: string, to: string): Occurrence[] {
  const out: Occurrence[] = []
  for (const e of events) {
    if (out.length >= MAX_OCCURRENCES) break
    const span = spanDays(e)
    const startDay = dateOf(e.start)
    if (!e.recurrence) {
      const o = makeOccurrence(e, startDay)
      if (o.date <= to && lastDay(o) >= from) out.push(o)
      continue
    }
    const skipBefore = addDays(from, -span - 1)
    const ex = e.exdates ? new Set(e.exdates) : null
    for (const date of generateDates(startDay, e.recurrence, skipBefore)) {
      if (date > to) break
      if (ex?.has(date)) continue
      const o = makeOccurrence(e, date)
      if (lastDay(o) < from) continue
      out.push(o)
      if (out.length >= MAX_OCCURRENCES) break
    }
  }
  return out.sort(compareOccurrences)
}

export function compareOccurrences(a: Occurrence, b: Occurrence): number {
  return (
    (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) ||
    Number(b.allDay) - Number(a.allDay) ||
    (a.start < b.start ? -1 : a.start > b.start ? 1 : 0) ||
    a.event.title.localeCompare(b.event.title, 'de')
  )
}

/** Occurrences touching one day. */
export function occurrencesOnDay(occs: readonly Occurrence[], day: string): Occurrence[] {
  return occs.filter((o) => o.date <= day && lastDay(o) >= day)
}

/** How an occurrence looks on one day of its span. */
export interface DaySegment {
  occ: Occurrence
  /** Shown in the all-day lane (all-day events). */
  allDay: boolean
  /** Minutes after midnight, clipped to this day (0..1440). */
  startMin: number
  endMin: number
  /** The event started on an earlier day / goes on the next day. */
  fromBefore: boolean
  toAfter: boolean
}

export function segmentOf(occ: Occurrence, day: string): DaySegment {
  if (occ.allDay) {
    return { occ, allDay: true, startMin: 0, endMin: MINUTES_PER_DAY, fromBefore: occ.date < day, toAfter: occ.end > day }
  }
  const startDay = dateOf(occ.start)
  const endDay = dateOf(occ.end)
  const startMin = startDay < day ? 0 : minutesOf(occ.start)
  const endMin = endDay > day ? MINUTES_PER_DAY : minutesOf(occ.end)
  return { occ, allDay: false, startMin, endMin, fromBefore: startDay < day, toAfter: endDay > day }
}

/** Segments of a day, all-day ones first, then by start time. */
export function daySegments(occs: readonly Occurrence[], day: string): DaySegment[] {
  return occurrencesOnDay(occs, day)
    .map((o) => segmentOf(o, day))
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.startMin - b.startMin || b.endMin - a.endMin || a.occ.event.title.localeCompare(b.occ.event.title, 'de'))
}

/** Shortest height (in minutes) an entry takes in the timeline, so short events stay tappable and do not overlap by accident. */
export const MIN_VISIBLE_MINUTES = 30

export interface PlacedSegment {
  segment: DaySegment
  /** Column within its overlap group, 0-based. */
  column: number
  /** Number of columns of the group: the entry is 1/columns wide. */
  columns: number
  /** Visible end (at least MIN_VISIBLE_MINUTES after the start, at most midnight). */
  endMin: number
}

/**
 * Apple-style timeline layout: entries that overlap in time share a group, each group is split into as many equal columns as
 * entries overlap at most, and every entry takes the first free column. All-day segments are not placed (separate lane).
 */
export function layoutDay(segments: readonly DaySegment[]): PlacedSegment[] {
  const timed = segments
    .filter((s) => !s.allDay)
    .map((segment) => ({ segment, endMin: Math.min(MINUTES_PER_DAY, Math.max(segment.endMin, segment.startMin + MIN_VISIBLE_MINUTES)) }))
    .sort((a, b) => a.segment.startMin - b.segment.startMin || b.endMin - a.endMin)
  const placed: PlacedSegment[] = []
  let group: PlacedSegment[] = []
  let groupEnd = -1
  let colEnds: number[] = []
  const flush = () => {
    for (const p of group) p.columns = colEnds.length
    placed.push(...group)
    group = []
    colEnds = []
  }
  for (const t of timed) {
    if (group.length > 0 && t.segment.startMin >= groupEnd) flush()
    let column = colEnds.findIndex((end) => end <= t.segment.startMin)
    if (column === -1) {
      column = colEnds.length
      colEnds.push(t.endMin)
    } else colEnds[column] = t.endMin
    group.push({ segment: t.segment, column, columns: 1, endMin: t.endMin })
    groupEnd = Math.max(groupEnd, t.endMin)
  }
  if (group.length > 0) flush()
  return placed
}

/** Days of a month that have at least one own event or finance entry: used for the dots in the month grid. */
export function daysWithEvents(occs: readonly Occurrence[], from: string, to: string): Set<string> {
  const days = new Set<string>()
  for (const o of occs) {
    const last = lastDay(o)
    for (let d = o.date < from ? from : o.date; d <= last && d <= to; d = addDays(d, 1)) days.add(d)
  }
  return days
}

export type FinanceEntryType = 'contract' | 'invoice'

/** A read-only entry derived from the finance data (not stored): a Vertrag that is due or an invoice's "Zahlen bis". */
export interface FinanceEntry {
  key: string
  type: FinanceEntryType
  date: string
  title: string
  amountCents: number
  /** income = money in (green amount), expense = money out (red amount). */
  flow: Kind
  /** rule id (contract) or invoice id. */
  refId: string
}

/** Scheduled Vertrag dates and open invoices' due dates within from..to (inclusive), sorted by day, invoices first, then title. */
export function financeEntries(data: AppData, from: string, to: string): FinanceEntry[] {
  const out: FinanceEntry[] = []
  for (const rule of data.recurring) {
    for (const date of occurrencesBetween(rule, addDays(from, -1), to)) {
      out.push({
        key: `rule:${rule.id}:${date}`,
        type: 'contract',
        date,
        title: recurringTitle(rule, data.categories),
        amountCents: rule.amountCents,
        flow: rule.kind,
        refId: rule.id,
      })
    }
  }
  for (const inv of data.invoices) {
    if (inv.dueDate < from || inv.dueDate > to) continue
    out.push({
      key: `inv:${inv.id}`,
      type: 'invoice',
      date: inv.dueDate,
      title: `Zahlen bis: ${invoiceTitle(inv, data.categories)}`,
      amountCents: inv.amountCents,
      flow: 'expense',
      refId: inv.id,
    })
  }
  return out.sort(
    (a, b) =>
      (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) ||
      (a.type === b.type ? 0 : a.type === 'invoice' ? -1 : 1) ||
      a.title.localeCompare(b.title, 'de'),
  )
}

/** Start/end for a new event: today's `hour`:00 for one hour (never past midnight). */
export function defaultTimes(day: string, hour: number): { start: string; end: string } {
  const h = Math.min(Math.max(hour, 0), 23)
  const start = `${day}T${pad(h)}:00`
  const end = h === 23 ? `${addDays(day, 1)}T00:00` : `${day}T${pad(h + 1)}:00`
  return { start, end }
}

/** Moves a local date-time by whole minutes (handles day changes; DST-free because it is wall-clock arithmetic). */
export function addMinutes(dt: string, minutes: number): string {
  const total = minutesOf(dt) + minutes
  const dayShift = Math.floor(total / MINUTES_PER_DAY)
  const rest = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return `${addDays(dateOf(dt), dayShift)}T${timeFromMinutes(rest)}`
}

/** True for 'YYYY-MM-DDTHH:mm'. */
export function isLocalDateTime(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return false
  return isValidISODate(v.slice(0, 10)) && Number(v.slice(11, 13)) < 24 && Number(v.slice(14, 16)) < 60
}

/** Key under which an imported event is remembered: its file UID plus start (a changed single occurrence has its own UID#day). */
const importKey = (e: Pick<CalendarEvent, 'importUid' | 'start'>) => `${e.importUid}|${e.start}`

/** Splits imported events into new ones and ones that already exist (same importUid and start; events without UID are always new). */
export function splitImportedEvents<T extends Omit<CalendarEvent, 'id' | 'createdAt'>>(
  existing: readonly Pick<CalendarEvent, 'importUid' | 'start'>[],
  incoming: readonly T[],
): { fresh: T[]; duplicates: T[] } {
  const seen = new Set(existing.filter((e) => e.importUid).map(importKey))
  const fresh: T[] = []
  const duplicates: T[] = []
  for (const e of incoming) {
    if (e.importUid && seen.has(importKey(e))) duplicates.push(e)
    else {
      fresh.push(e)
      if (e.importUid) seen.add(importKey(e))
    }
  }
  return { fresh, duplicates }
}

/** Short German text of the repeat rule, for lists: "Wöchentlich", "Alle 2 Wochen", "Täglich". */
export function recurrenceText(r: EventRecurrence | undefined): string {
  if (!r) return 'Nie'
  const names = { daily: ['Täglich', 'Tage'], weekly: ['Wöchentlich', 'Wochen'], monthly: ['Monatlich', 'Monate'], yearly: ['Jährlich', 'Jahre'] } as const
  const [single, plural] = names[r.freq]
  if (r.interval === 1) return single
  return `Alle ${r.interval} ${plural}`
}

/** A day inside another month: same day number if possible, else the last day ('2026-10-31' + 1 month = '2026-11-30'). */
export function sameDayInMonth(iso: string, month: string): string {
  const d = Number(iso.slice(8, 10))
  const first = monthStart(month)
  const last = daysInMonth(Number(first.slice(0, 4)), Number(first.slice(5, 7)) - 1)
  return toISODate(new Date(Number(first.slice(0, 4)), Number(first.slice(5, 7)) - 1, Math.min(d, last)))
}

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

/** "Montag, 16. November" */
export function longDayLabel(iso: string): string {
  return `${WEEKDAY_LONG[weekdayOf(iso)]}, ${Number(iso.slice(8, 10))}. ${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]}`
}

/** "16. November" */
export function dayMonthLabel(iso: string): string {
  return `${Number(iso.slice(8, 10))}. ${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]}`
}

/** The time column of a list row: "ganztägig", "09:00 – 10:30", "ab 22:00", "bis 07:00". */
export function timeText(seg: DaySegment): string {
  if (seg.allDay || (seg.fromBefore && seg.toAfter)) return 'ganztägig'
  if (seg.fromBefore) return `bis ${timeFromMinutes(seg.endMin)}`
  if (seg.toAfter) return `ab ${timeFromMinutes(seg.startMin)}`
  return `${timeFromMinutes(seg.startMin)} – ${timeFromMinutes(seg.endMin)}`
}

/** Occurrences grouped by each day they touch (limited to from..to): the month grid reads titles and dots from it. */
export function occurrencesByDay(occs: readonly Occurrence[], from: string, to: string): Map<string, Occurrence[]> {
  const map = new Map<string, Occurrence[]>()
  for (const o of occs) {
    const last = lastDay(o)
    for (let d = o.date < from ? from : o.date; d <= last && d <= to; d = addDays(d, 1)) {
      const list = map.get(d)
      if (list) list.push(o)
      else map.set(d, [o])
    }
  }
  return map
}
