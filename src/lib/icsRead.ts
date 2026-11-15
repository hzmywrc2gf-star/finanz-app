import type { CalendarEvent, EventRecurrence } from '../domain/types'
import { addDays, isValidISODate } from '../domain/dates'
import { addMinutes, daysBetween } from '../domain/calendar'

/*
 * iCalendar (RFC 5545) reader for the events of an exported calendar. Pure, no libraries.
 *
 * Conversion: every time is turned into the wall-clock time of the device (or of `localZone` in tests):
 * - UTC ('...Z') and TZID=Europe/Berlin style times are converted with Intl (named zones only; Windows names such as
 *   "W. Europe Standard Time" are unknown to Intl and are read as floating local time),
 * - floating times and all-day dates are taken as they are.
 * A repeating event is stored as its first occurrence in local time plus a rule, so a series whose zone differs from the device's
 * keeps the converted wall-clock time of the first occurrence on every date (a zone with a different DST rhythm drifts by an hour in the other half-year).
 *
 * Supported repeat rules: FREQ DAILY/WEEKLY/MONTHLY/YEARLY, INTERVAL, COUNT, UNTIL, BYDAY with plain weekdays on WEEKLY, and
 * BYMONTHDAY/BYMONTH equal to the start. Everything else (BYSETPOS, ordinals like 2MO, lists of month days, HOURLY, ...) is
 * imported as the first occurrence only and counted as "simplified".
 * Single changed occurrences (RECURRENCE-ID) become separate events (importUid = UID#day) and the replaced date is added to the
 * series' exdates; a cancelled one only adds the exdate.
 */

export interface ParsedIcs {
  /** Events ready to be stored (id/createdAt are added by the import action). */
  events: Omit<CalendarEvent, 'id' | 'createdAt'>[]
  /** Events with STATUS:CANCELLED (and cancelled single occurrences), not imported. */
  cancelled: number
  /** Imported events whose repeat rule was reduced to the first occurrence. */
  simplified: number
  /** Events that could not be read (no valid start date). */
  invalid: number
  /** Changed single occurrences of repeating events (imported as separate events, included in `events`). */
  overrides: number
}

export const ERR_NOT_ICS = 'Das ist keine Kalender-Datei.'

/** True if the text (after a BOM and whitespace) starts with BEGIN:VCALENDAR: the content decides, not the file name. */
export function looksLikeIcs(text: string): boolean {
  return /^\s*BEGIN:VCALENDAR/i.test(text.replace(/^﻿/, ''))
}

interface Prop {
  name: string
  params: Record<string, string>
  value: string
}

/** Joins folded lines (a line starting with space or tab continues the previous one). */
export function unfold(text: string): string[] {
  const out: string[] = []
  for (const raw of text.replace(/^﻿/, '').split(/\r\n|\n|\r/)) {
    if ((raw.startsWith(' ') || raw.startsWith('\t')) && out.length > 0) out[out.length - 1] += raw.slice(1)
    else out.push(raw)
  }
  return out.filter((l) => l !== '')
}

/** Splits at the first `sep` outside of double quotes. */
function splitOutsideQuotes(s: string, sep: string): [string, string] | null {
  let quoted = false
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"') quoted = !quoted
    else if (s[i] === sep && !quoted) return [s.slice(0, i), s.slice(i + 1)]
  }
  return null
}

function parseLine(line: string): Prop | null {
  const parts = splitOutsideQuotes(line, ':')
  if (!parts) return null
  const [head, value] = parts
  const params: Record<string, string> = {}
  let rest = head
  const first = splitOutsideQuotes(rest, ';')
  const name = (first ? first[0] : rest).toUpperCase()
  rest = first ? first[1] : ''
  while (rest) {
    const next = splitOutsideQuotes(rest, ';')
    const seg = next ? next[0] : rest
    rest = next ? next[1] : ''
    const eq = seg.indexOf('=')
    if (eq > 0) params[seg.slice(0, eq).toUpperCase()] = seg.slice(eq + 1).replace(/^"|"$/g, '')
  }
  return { name, params, value }
}

/** Reverses TEXT escaping: \n \N -> line break, \, \; \\ . */
export function unescapeIcsText(v: string): string {
  return v.replace(/\\([nN,;\\])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c))
}

// ---------------------------------------------------------------------------------------------------------- time zones

const formatters = new Map<string, Intl.DateTimeFormat>()

function zoneFormatter(zone: string): Intl.DateTimeFormat | null {
  const cached = formatters.get(zone)
  if (cached) return cached
  try {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    formatters.set(zone, f)
    return f
  } catch {
    return null // unknown zone name
  }
}

/** Offset of a zone from UTC at an instant, in ms (positive east of Greenwich). */
function zoneOffset(f: Intl.DateTimeFormat, ms: number): number {
  const p: Record<string, number> = {}
  for (const part of f.formatToParts(new Date(ms))) if (part.type !== 'literal') p[part.type] = Number(part.value)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000
}

/** The instant (UTC ms) at which the wall clock of `zone` shows the given time. Gaps (spring forward) resolve to the later offset. */
export function wallClockToInstant(zone: string, y: number, mo: number, d: number, h: number, mi: number): number | null {
  const f = zoneFormatter(zone)
  if (!f) return null
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const first = guess - zoneOffset(f, guess)
  const second = guess - zoneOffset(f, first)
  return second
}

const p2 = (n: number) => String(n).padStart(2, '0')

/** Local 'YYYY-MM-DDTHH:mm' of an instant, in `localZone` (default: the device's zone). */
export function instantToLocal(ms: number, localZone?: string): string {
  if (localZone) {
    const f = zoneFormatter(localZone)
    if (f) {
      const p: Record<string, string> = {}
      for (const part of f.formatToParts(new Date(ms))) p[part.type] = part.value
      return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
    }
  }
  const d = new Date(ms)
  return `${String(d.getFullYear()).padStart(4, '0')}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`
}

interface IcsTime {
  allDay: boolean
  /** all-day: 'YYYY-MM-DD'; timed: local 'YYYY-MM-DDTHH:mm' */
  local: string
  /** The date as written in the file (before any zone conversion). */
  written: string
}

/** DATE ('20261024') or DATE-TIME ('20261024T090000', with optional Z / TZID) -> local value, or null if unreadable. */
function parseTime(prop: Prop, localZone?: string): IcsTime | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(prop.value.trim())
  if (!m) return null
  const [, y, mo, d, h, mi, , z] = m
  const date = `${y}-${mo}-${d}`
  if (!isValidISODate(date)) return null
  if (h === undefined || prop.params.VALUE === 'DATE') return { allDay: true, local: date, written: date }
  if (Number(h) > 23 || Number(mi) > 59) return null
  const written = `${date}T${h}:${mi}`
  let ms: number | null = null
  if (z) ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi))
  else if (prop.params.TZID) ms = wallClockToInstant(prop.params.TZID, Number(y), Number(mo), Number(d), Number(h), Number(mi))
  // floating time (or an unknown zone name): taken as local time
  return { allDay: false, local: ms === null ? written : instantToLocal(ms, localZone), written }
}

function parseDuration(v: string): { days: number; minutes: number } | null {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v.trim())
  if (!m || v.trim().length < 2) return null
  const sign = m[1] === '-' ? -1 : 1
  const days = Number(m[2] ?? 0) * 7 + Number(m[3] ?? 0)
  const minutes = Number(m[4] ?? 0) * 60 + Number(m[5] ?? 0)
  return { days: sign * days, minutes: sign * minutes }
}

// ------------------------------------------------------------------------------------------------------------ RRULE

const BYDAY: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 }

/** Result of reading an RRULE: the rule, or `simplified` when something in it is not supported. */
function parseRrule(
  value: string,
  start: IcsTime,
  localZone: string | undefined,
  weekdayShift: number,
): { rule?: EventRecurrence; simplified: boolean } {
  const parts: Record<string, string> = {}
  for (const seg of value.split(';')) {
    const eq = seg.indexOf('=')
    if (eq > 0) parts[seg.slice(0, eq).toUpperCase()] = seg.slice(eq + 1)
  }
  const freqMap: Record<string, EventRecurrence['freq']> = { DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly', YEARLY: 'yearly' }
  const freq = freqMap[(parts.FREQ ?? '').toUpperCase()]
  if (!freq) return { simplified: true }
  const known = new Set(['FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'BYDAY', 'BYMONTHDAY', 'BYMONTH', 'WKST'])
  if (Object.keys(parts).some((k) => !known.has(k))) return { simplified: true }
  const interval = parts.INTERVAL === undefined ? 1 : Number(parts.INTERVAL)
  if (!Number.isInteger(interval) || interval < 1 || interval > 99) return { simplified: true }
  const rule: EventRecurrence = { freq, interval }
  if (parts.COUNT !== undefined) {
    const count = Number(parts.COUNT)
    if (!Number.isInteger(count) || count < 1 || count > 1000) return { simplified: true }
    rule.count = count
  }
  if (parts.UNTIL !== undefined) {
    const until = parseTime({ name: 'UNTIL', params: {}, value: parts.UNTIL }, localZone)
    if (!until) return { simplified: true }
    rule.until = until.local.slice(0, 10)
  }
  const startDay = start.local.slice(0, 10)
  if (parts.BYDAY !== undefined) {
    if (freq !== 'weekly') return { simplified: true }
    const days = parts.BYDAY.split(',').map((t) => BYDAY[t.trim().toUpperCase()])
    if (days.length === 0 || days.some((d) => d === undefined)) return { simplified: true } // ordinals such as 2MO are not in the table
    // the start moved across midnight when it was converted: the weekdays move with it
    const shifted = [...new Set(days.map((d) => (((d + weekdayShift) % 7) + 7) % 7))].sort((a, b) => a - b)
    rule.byWeekday = shifted
  }
  if (parts.BYMONTHDAY !== undefined) {
    // only the day the event starts on is supported (what the start already says)
    const ok = (freq === 'monthly' || freq === 'yearly') && !parts.BYMONTHDAY.includes(',') && Number(parts.BYMONTHDAY) === Number(startDay.slice(8, 10))
    if (!ok) return { simplified: true }
  }
  if (parts.BYMONTH !== undefined) {
    if (freq !== 'yearly' || parts.BYMONTH.includes(',') || Number(parts.BYMONTH) !== Number(startDay.slice(5, 7))) return { simplified: true }
  }
  return { rule, simplified: false }
}

// ------------------------------------------------------------------------------------------------------------ events

interface RawEvent {
  props: Prop[]
}

function get(ev: RawEvent, name: string): Prop | undefined {
  return ev.props.find((p) => p.name === name)
}

function cut(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s
}

export interface ParseOptions {
  /** Time zone the local times are expressed in (tests); default the device's zone. */
  localZone?: string
}

export function parseIcs(text: string, options: ParseOptions = {}): ParsedIcs {
  const { localZone } = options
  const raws: RawEvent[] = []
  let current: RawEvent | null = null
  let skipDepth = 0 // nested components inside a VEVENT (VALARM)
  for (const line of unfold(text)) {
    const upper = line.toUpperCase()
    if (upper === 'BEGIN:VEVENT') {
      current = { props: [] }
      skipDepth = 0
    } else if (upper === 'END:VEVENT') {
      if (current) raws.push(current)
      current = null
    } else if (current) {
      if (upper.startsWith('BEGIN:')) skipDepth++
      else if (upper.startsWith('END:')) skipDepth = Math.max(0, skipDepth - 1)
      else if (skipDepth === 0) {
        const p = parseLine(line)
        if (p) current.props.push(p)
      }
    }
  }

  const result: ParsedIcs = { events: [], cancelled: 0, simplified: 0, invalid: 0, overrides: 0 }
  const masters = new Map<string, Omit<CalendarEvent, 'id' | 'createdAt'>>()
  const pendingExdates: { uid: string; day: string }[] = []

  for (const raw of raws) {
    const uid = get(raw, 'UID')?.value.trim() ?? ''
    const status = get(raw, 'STATUS')?.value.trim().toUpperCase()
    const recId = get(raw, 'RECURRENCE-ID')
    const recDay = recId ? parseTime(recId, localZone)?.local.slice(0, 10) : undefined
    if (status === 'CANCELLED') {
      result.cancelled++
      if (uid && recDay) pendingExdates.push({ uid, day: recDay })
      continue
    }
    const dtstart = get(raw, 'DTSTART')
    const start = dtstart ? parseTime(dtstart, localZone) : null
    if (!start) {
      result.invalid++
      continue
    }
    // end
    let allDay = start.allDay
    let startLocal = start.local
    let endLocal: string
    const dtend = get(raw, 'DTEND')
    const duration = get(raw, 'DURATION')
    const end = dtend ? parseTime(dtend, localZone) : null
    if (allDay) {
      if (end) endLocal = addDays(end.local.slice(0, 10), -1) // DTEND is exclusive
      else if (duration && parseDuration(duration.value)) endLocal = addDays(start.local, Math.max(Math.ceil(parseDuration(duration.value)!.days + parseDuration(duration.value)!.minutes / 1440), 1) - 1)
      else endLocal = start.local
      if (endLocal < startLocal) endLocal = startLocal
    } else {
      if (end) {
        endLocal = end.allDay ? `${end.local}T00:00` : end.local
      } else if (duration && parseDuration(duration.value)) {
        const d = parseDuration(duration.value)!
        endLocal = addMinutes(`${addDays(startLocal.slice(0, 10), d.days)}T${startLocal.slice(11)}`, d.minutes)
      } else endLocal = startLocal
      if (endLocal <= startLocal) endLocal = addMinutes(startLocal, 60) // an instant: shown as one hour
    }
    if (allDay && startLocal.length !== 10) allDay = false
    const title = cut(unescapeIcsText(get(raw, 'SUMMARY')?.value ?? '').trim(), 200) || '(Ohne Titel)'
    const ev: Omit<CalendarEvent, 'id' | 'createdAt'> = { title, allDay, start: startLocal, end: endLocal }
    const location = cut(unescapeIcsText(get(raw, 'LOCATION')?.value ?? '').trim(), 200)
    if (location) ev.location = location
    const notes = cut(unescapeIcsText(get(raw, 'DESCRIPTION')?.value ?? '').trim(), 2000)
    if (notes) ev.notes = notes

    if (recId) {
      // a changed single occurrence: its own event, and the series skips that date
      if (uid) ev.importUid = cut(uid, 280) + '#' + (recDay ?? startLocal.slice(0, 10))
      if (uid && recDay) pendingExdates.push({ uid, day: recDay })
      result.overrides++
      result.events.push(ev)
      continue
    }
    if (uid) ev.importUid = cut(uid, 300)

    const rrule = get(raw, 'RRULE')
    if (rrule) {
      const shift = daysBetween(start.written.slice(0, 10), startLocal.slice(0, 10))
      const { rule, simplified } = parseRrule(rrule.value, start, localZone, shift)
      if (rule) {
        ev.recurrence = rule
        const ex: string[] = []
        for (const p of raw.props.filter((q) => q.name === 'EXDATE')) {
          for (const v of p.value.split(',')) {
            const t = parseTime({ ...p, value: v }, localZone)
            if (t) ex.push(t.local.slice(0, 10))
          }
        }
        if (ex.length) ev.exdates = [...new Set(ex)].sort()
      } else if (simplified) result.simplified++
    }
    if (uid) masters.set(uid, ev)
    result.events.push(ev)
  }

  for (const { uid, day } of pendingExdates) {
    const m = masters.get(uid)
    if (m?.recurrence && !(m.exdates ?? []).includes(day)) m.exdates = [...(m.exdates ?? []), day].sort()
  }
  return result
}
