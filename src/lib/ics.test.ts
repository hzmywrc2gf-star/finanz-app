import { describe, expect, it } from 'vitest'
import { buildIcs, escapeIcsText, foldIcsLine } from './ics'

const base = { uid: 'abc-123', date: '2026-10-28', summary: 'Rechnung prüfen: Otto 139,80 €', description: 'Zahlen bis 31.10.2026 · in Finanzklar bestätigen', now: new Date(Date.UTC(2026, 9, 25, 7, 5, 9)) }

describe('escapeIcsText', () => {
  it('escapes backslash, semicolon, comma and newlines', () => {
    expect(escapeIcsText('a,b;c\\d\ne\r\nf')).toBe('a\\,b\\;c\\\\d\\ne\\nf')
  })
})

describe('foldIcsLine', () => {
  it('leaves short lines alone', () => {
    expect(foldIcsLine('SUMMARY:kurz')).toBe('SUMMARY:kurz')
  })
  it('folds at 75 octets with a leading space on continuations', () => {
    const lines = foldIcsLine('X:' + 'a'.repeat(200)).split('\r\n')
    expect(lines[0]).toHaveLength(75)
    expect(lines.slice(1).every((l) => l.startsWith(' ') && l.length <= 75)).toBe(true)
    expect(lines.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe('X:' + 'a'.repeat(200))
  })
  it('never splits a multi-byte character and counts octets', () => {
    const text = 'S:' + 'ä€😀'.repeat(30)
    const lines = foldIcsLine(text).split('\r\n')
    const enc = new TextEncoder()
    expect(lines.every((l) => enc.encode(l).length <= 75)).toBe(true)
    expect(lines.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(text)
  })
})

describe('buildIcs', () => {
  const ics = buildIcs(base)
  it('is a CRLF-terminated calendar with one event and an alert', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1)
    expect(ics).toContain('BEGIN:VALARM\r\nACTION:DISPLAY\r\n')
    expect(ics).toContain('TRIGGER:-PT0M\r\n')
  })
  it('puts the reminder at 09:00 local floating time on the date', () => {
    expect(ics).toContain('DTSTART:20261028T090000\r\n')
    expect(ics).toContain('DTEND:20261028T091500\r\n')
  })
  it('stamps UTC from the Date and keeps the uid', () => {
    expect(ics).toContain('DTSTAMP:20261025T070509Z\r\n')
    expect(ics).toContain('UID:abc-123@finanzklar\r\n')
  })
  it('escapes the summary comma', () => {
    expect(ics).toContain('SUMMARY:Rechnung prüfen: Otto 139\\,80 €\r\n')
  })
  it('accepts another time, keeps the end on the same day and omits an empty description', () => {
    const out = buildIcs({ ...base, description: undefined, time: '23:50' })
    expect(out).toContain('DTSTART:20261028T235000\r\n')
    expect(out).not.toContain('DESCRIPTION:Zahlen')
    expect(out).toContain('DTEND:20261028T235900\r\n')
  })
})
