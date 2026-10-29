/** Minimal iCalendar (RFC 5545) writer for a single reminder event. Pure; the download itself lives in `download.ts`. */

export interface IcsReminder {
  /** Stable id, so adding the same entry twice replaces instead of duplicating (e.g. the invoice id). */
  uid: string
  /** Local day of the reminder, 'YYYY-MM-DD'. */
  date: string
  /** Local time of the event and its alert, 'HH:MM'. Default 09:00. */
  time?: string
  summary: string
  description?: string
  /** Creation instant for DTSTAMP (UTC). Default now. */
  now?: Date
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

/** Escapes TEXT values: backslash, semicolon, comma and line breaks. */
export function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * Folds a content line at 75 octets (UTF-8, never inside a character): continuation lines start with one space,
 * which counts toward their 75. Lines are joined with CRLF.
 */
export function foldIcsLine(line: string): string {
  const enc = new TextEncoder()
  const parts: string[] = []
  let current = ''
  let size = 0
  for (const ch of line) {
    const n = enc.encode(ch).length
    // the first line holds 75 octets, continuation lines 74 plus the leading space
    if (size + n > (parts.length === 0 ? 75 : 74)) {
      parts.push(current)
      current = ''
      size = 0
    }
    current += ch
    size += n
  }
  parts.push(current)
  return parts.join('\r\n ')
}

/** '2026-10-28' + '09:00' -> '20261028T090000' (floating local time). */
function localStamp(date: string, time: string): string {
  const [y, m, d] = date.split('-')
  const [hh, mm] = time.split(':')
  return `${y}${m}${d}T${hh}${mm}00`
}

/** UTC stamp from the Date's own UTC fields: '20261028T071500Z'. */
function utcStamp(d: Date): string {
  return `${pad(d.getUTCFullYear(), 4)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

/** A calendar file with one 15-minute event at `time` on `date` (floating local time) and a display alert at its start. */
export function buildIcs(r: IcsReminder): string {
  const time = r.time ?? '09:00'
  const [hh, mm] = time.split(':').map(Number)
  // 15 minutes, but never past midnight (the end must stay on the same day)
  const endMinutes = Math.min(hh * 60 + mm + 15, 23 * 60 + 59)
  const end = `${pad(Math.floor(endMinutes / 60))}:${pad(endMinutes % 60)}`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Finanzklar//Rechnung//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(r.uid)}@finanzklar`,
    `DTSTAMP:${utcStamp(r.now ?? new Date())}`,
    `DTSTART:${localStamp(r.date, time)}`,
    `DTEND:${localStamp(r.date, end)}`,
    `SUMMARY:${escapeIcsText(r.summary)}`,
    ...(r.description ? [`DESCRIPTION:${escapeIcsText(r.description)}`] : []),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(r.summary)}`,
    'TRIGGER:-PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(foldIcsLine).join('\r\n') + '\r\n'
}
