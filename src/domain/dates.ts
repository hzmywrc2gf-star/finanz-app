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

const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

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

/** Same day `years` later; 29 February falls back to 28 February: '2024-02-29' -> '2025-02-28'. */
export function addYears(iso: string, years: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const last = parseISODate(monthEnd(`${String(y + years).padStart(4, '0')}-${String(m).padStart(2, '0')}-01`)).getDate()
  return toISODate(new Date(y + years, m - 1, Math.min(d, last)))
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
