const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today in the user's local time zone (never via toISOString). */
export function todayISO(now: Date = new Date()): string {
  return toISODate(now)
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = parseISODate(s)
  return toISODate(d) === s
}

/** Parses 'YYYY-MM-DD' as a local date at midnight. */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Monday of the week containing the given date. */
export function startOfWeek(iso: string): string {
  const d = parseISODate(iso)
  const offset = (d.getDay() + 6) % 7 // Mon=0 ... Sun=6
  return addDays(iso, -offset)
}

export function addWeeks(iso: string, weeks: number): string {
  return addDays(iso, weeks * 7)
}

/** The 7 ISO dates Monday..Sunday for a week start. */
export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** ISO 8601 week number and week-year. */
export function isoWeek(iso: string): { week: number; year: number } {
  const d = parseISODate(iso)
  // Thursday of this week decides the year
  const thursday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const year = thursday.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const jan4Monday = new Date(year, 0, 4 - ((jan4.getDay() + 6) % 7))
  const week = Math.round((thursday.getTime() - jan4Monday.getTime()) / (7 * 86400000)) + 1
  return { week, year }
}

export function isoWeekNumber(iso: string): number {
  return isoWeek(iso).week
}

/** '2026-10-26' -> '26.10.' */
export function formatDayMonth(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}.${m}.`
}

/** '2026-10-26' -> '26.10.2026' */
export function formatDateDE(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/** "KW 44 · 26.10. – 01.11.2026" */
export function weekLabel(weekStart: string): string {
  const end = addDays(weekStart, 6)
  const { week } = isoWeek(weekStart)
  return `KW ${week} · ${formatDayMonth(weekStart)} – ${formatDateDE(end)}`
}

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export function weekdayName(iso: string): string {
  return WEEKDAYS[parseISODate(iso).getDay()]
}

/** "Mo, 26.10." */
export function formatShortDay(iso: string): string {
  return `${WEEKDAYS_SHORT[parseISODate(iso).getDay()]}, ${formatDayMonth(iso)}`
}

/** First day of the month containing the date: '2026-10-27' -> '2026-10-01'. */
export function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

/** Moves a month start by whole months (any date works, the result is a month start). */
export function addMonths(iso: string, months: number): string {
  const d = parseISODate(monthStart(iso))
  d.setMonth(d.getMonth() + months)
  return toISODate(d)
}

/** Last day of the month containing the date: '2026-02-10' -> '2026-02-28'. */
export function monthEnd(iso: string): string {
  return addDays(addMonths(iso, 1), -1)
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

/** "Oktober 2026" */
export function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

/** "Okt" (for chart axes; "Mai" stays "Mai"). */
export function monthShort(iso: string): string {
  const m = Number(iso.split('-')[1])
  return MONTHS_SHORT[m - 1]
}
