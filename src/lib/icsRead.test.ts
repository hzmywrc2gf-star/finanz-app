import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { occurrencesInRange } from '../domain/calendar'
import type { CalendarEvent } from '../domain/types'
import { ERR_NOT_ICS, instantToLocal, looksLikeIcs, parseIcs, unescapeIcsText, unfold, wallClockToInstant } from './icsRead'

const mac = readFileSync('e2e/fixtures/kalender-mac.ics', 'utf8')
const google = readFileSync('src/lib/__fixtures__/google.ics', 'utf8')
const BERLIN = { localZone: 'Europe/Berlin' }
const wrap = (body: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}\r\nEND:VCALENDAR\r\n`
const one = (body: string, opts = BERLIN) => parseIcs(wrap(`BEGIN:VEVENT\r\nUID:u1\r\n${body}\r\nEND:VEVENT`), opts)
const asEvents = (p: ReturnType<typeof parseIcs>): CalendarEvent[] => p.events.map((e, i) => ({ id: `e${i}`, createdAt: 0, ...e }))

describe('content detection', () => {
  it('accepts calendars regardless of file name, BOM or leading blank lines', () => {
    expect(looksLikeIcs('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(looksLikeIcs('﻿  \r\nbegin:vcalendar\r\n')).toBe(true)
    expect(looksLikeIcs(mac)).toBe(true)
  })
  it('rejects everything else', () => {
    expect(looksLikeIcs('Datum;Betrag\n1;2')).toBe(false)
    expect(looksLikeIcs('')).toBe(false)
    expect(looksLikeIcs('x BEGIN:VCALENDAR')).toBe(false)
    expect(ERR_NOT_ICS).toBe('Das ist keine Kalender-Datei.')
  })
})

describe('text handling', () => {
  it('unfolds lines', () => {
    expect(unfold('A:1\r\n 23\r\n\t4\r\nB:2')).toEqual(['A:1234', 'B:2'])
  })
  it('unescapes text', () => {
    expect(unescapeIcsText('a\\, b\\; c\\nd \\\\ e')).toBe('a, b; c\nd \\ e')
  })
})

describe('time zones', () => {
  it('converts Berlin wall time to an instant across DST', () => {
    expect(new Date(wallClockToInstant('Europe/Berlin', 2026, 7, 1, 12, 0)!).toISOString()).toBe('2026-07-01T10:00:00.000Z')
    expect(new Date(wallClockToInstant('Europe/Berlin', 2026, 12, 1, 12, 0)!).toISOString()).toBe('2026-12-01T11:00:00.000Z')
  })
  it('handles the spring-forward gap and the fall-back hour', () => {
    // 2026-03-29 02:30 does not exist in Berlin: it resolves to 03:30 CEST (01:30Z)
    expect(instantToLocal(wallClockToInstant('Europe/Berlin', 2026, 3, 29, 2, 30)!, 'Europe/Berlin')).toBe('2026-03-29T03:30')
    // 2026-10-25 03:00 exists once (CET)
    expect(new Date(wallClockToInstant('Europe/Berlin', 2026, 10, 25, 3, 0)!).toISOString()).toBe('2026-10-25T02:00:00.000Z')
  })
  it('unknown zone names are read as floating time', () => {
    const p = one('DTSTART;TZID=W. Europe Standard Time:20261115T090000\r\nDTEND;TZID=W. Europe Standard Time:20261115T100000')
    expect(p.events[0]).toMatchObject({ start: '2026-11-15T09:00', end: '2026-11-15T10:00' })
  })
  it('UTC to another local zone', () => {
    const p = one('DTSTART:20261115T230000Z\r\nDTEND:20261116T000000Z', { localZone: 'Europe/Berlin' })
    expect(p.events[0]).toMatchObject({ start: '2026-11-16T00:00', end: '2026-11-16T01:00' })
    const q = one('DTSTART:20261115T230000Z\r\nDTEND:20261116T000000Z', { localZone: 'America/New_York' })
    expect(q.events[0]).toMatchObject({ start: '2026-11-15T18:00', end: '2026-11-15T19:00' })
  })
})

describe('single events', () => {
  it('all-day: DTEND is exclusive', () => {
    expect(one('DTSTART;VALUE=DATE:20261221\r\nDTEND;VALUE=DATE:20261229').events[0]).toMatchObject({ allDay: true, start: '2026-12-21', end: '2026-12-28' })
    expect(one('DTSTART;VALUE=DATE:20261221\r\nDTEND;VALUE=DATE:20261222').events[0].end).toBe('2026-12-21')
    expect(one('DTSTART;VALUE=DATE:20261221').events[0].end).toBe('2026-12-21')
    expect(one('DTSTART;VALUE=DATE:20261221\r\nDURATION:P3D').events[0].end).toBe('2026-12-23')
  })
  it('timed with DURATION, and instants get one hour', () => {
    expect(one('DTSTART:20261115T100000\r\nDURATION:PT90M').events[0].end).toBe('2026-11-15T11:30')
    expect(one('DTSTART:20261115T100000\r\nDURATION:PT1H30M').events[0].end).toBe('2026-11-15T11:30')
    expect(one('DTSTART:20261115T100000').events[0].end).toBe('2026-11-15T11:00')
    expect(one('DTSTART:20261115T100000\r\nDTEND:20261115T100000').events[0].end).toBe('2026-11-15T11:00')
  })
  it('title, location, notes and the uid', () => {
    const p = one('DTSTART:20261115T100000\r\nSUMMARY:Essen\\, Trinken\r\nLOCATION:Café\\; Bar\r\nDESCRIPTION:Zeile 1\\nZeile 2')
    expect(p.events[0]).toMatchObject({ title: 'Essen, Trinken', location: 'Café; Bar', notes: 'Zeile 1\nZeile 2', importUid: 'u1' })
    expect(one('DTSTART:20261115T100000').events[0].title).toBe('(Ohne Titel)')
  })
  it('skips cancelled and unreadable events', () => {
    expect(one('DTSTART:20261115T100000\r\nSTATUS:CANCELLED')).toMatchObject({ cancelled: 1, events: [] })
    expect(one('SUMMARY:x')).toMatchObject({ invalid: 1, events: [] })
    expect(one('DTSTART:2026-11-15')).toMatchObject({ invalid: 1 })
    expect(one('DTSTART:20261315')).toMatchObject({ invalid: 1 })
  })
  it('ignores VTODO and alarms', () => {
    const p = parseIcs(wrap('BEGIN:VTODO\r\nSUMMARY:Aufgabe\r\nDTSTART:20261115T100000\r\nEND:VTODO\r\nBEGIN:VEVENT\r\nDTSTART:20261115T100000\r\nSUMMARY:Echt\r\nBEGIN:VALARM\r\nSUMMARY:Alarm\r\nTRIGGER:-PT5M\r\nEND:VALARM\r\nEND:VEVENT'), BERLIN)
    expect(p.events.map((e) => e.title)).toEqual(['Echt'])
  })
  it('parses quoted parameters containing colons', () => {
    const p = one('DTSTART;TZID="Europe/Berlin":20261115T100000\r\nSUMMARY;LANGUAGE=de:Mit: Doppelpunkt')
    expect(p.events[0]).toMatchObject({ title: 'Mit: Doppelpunkt', start: '2026-11-15T10:00' })
  })
})

describe('repeat rules', () => {
  const rule = (r: string, start = 'DTSTART:20261102T100000') => one(`${start}\r\nRRULE:${r}`)
  it('daily, weekly, monthly, yearly with interval, count and until', () => {
    expect(rule('FREQ=DAILY;INTERVAL=2;COUNT=5').events[0].recurrence).toEqual({ freq: 'daily', interval: 2, count: 5 })
    expect(rule('FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261231T225959Z').events[0].recurrence).toEqual({ freq: 'weekly', interval: 1, until: '2026-12-31', byWeekday: [0, 2] })
    expect(rule('FREQ=MONTHLY;BYMONTHDAY=2').events[0].recurrence).toEqual({ freq: 'monthly', interval: 1 })
    expect(rule('FREQ=YEARLY;BYMONTH=11').events[0].recurrence).toEqual({ freq: 'yearly', interval: 1 })
  })
  it('unsupported parts reduce to the first occurrence and are counted', () => {
    for (const r of ['FREQ=MONTHLY;BYDAY=1TH', 'FREQ=MONTHLY;BYSETPOS=-1;BYDAY=MO,TU,WE,TH,FR', 'FREQ=MONTHLY;BYMONTHDAY=1,15', 'FREQ=HOURLY', 'FREQ=WEEKLY;BYDAY=2MO', 'FREQ=YEARLY;BYMONTH=3,4', 'FREQ=DAILY;COUNT=5000', 'FREQ=WEEKLY;INTERVAL=200']) {
      const p = rule(r)
      expect(p.events[0].recurrence, r).toBeUndefined()
      expect(p.simplified, r).toBe(1)
    }
  })
  it('weekdays shift with a start that crosses midnight in the local zone', () => {
    // Monday 23:30 UTC = Tuesday 00:30 in Berlin
    const p = one('DTSTART:20261102T233000Z\r\nDTEND:20261103T003000Z\r\nRRULE:FREQ=WEEKLY;BYDAY=MO,FR')
    expect(p.events[0].start).toBe('2026-11-03T00:30')
    expect(p.events[0].recurrence?.byWeekday).toEqual([1, 5])
  })
  it('exdates are converted to local days', () => {
    const p = one('DTSTART;TZID=Europe/Berlin:20261102T100000\r\nRRULE:FREQ=DAILY;COUNT=5\r\nEXDATE;TZID=Europe/Berlin:20261103T100000,20261104T100000\r\nEXDATE:20261105T090000Z')
    expect(p.events[0].exdates).toEqual(['2026-11-03', '2026-11-04', '2026-11-05'])
  })
})

describe('macOS export fixture', () => {
  const p = parseIcs(mac, BERLIN)
  const evs = asEvents(p)
  it('counts', () => {
    expect({ events: p.events.length, cancelled: p.cancelled, simplified: p.simplified, invalid: p.invalid, overrides: p.overrides }).toEqual({
      events: 8, cancelled: 1, simplified: 1, invalid: 0, overrides: 1,
    })
  })
  it('yearly all-day birthday', () => {
    const b = evs.find((e) => e.title === 'Geburtstag Anna')!
    expect(b).toMatchObject({ allDay: true, start: '1992-11-20', end: '1992-11-20', recurrence: { freq: 'yearly', interval: 1 } })
    expect(occurrencesInRange([b], '2026-11-01', '2026-11-30').map((o) => o.date)).toEqual(['2026-11-20'])
  })
  it('weekly meeting with exdate and a moved occurrence', () => {
    const m = evs.find((e) => e.title === 'Team-Meeting')!
    expect(m).toMatchObject({ start: '2026-11-02T10:00', end: '2026-11-02T11:00', location: 'Büro, Raum 4', recurrence: { freq: 'weekly', byWeekday: [0, 2] } })
    expect(m.notes).toBe('Agenda: Planung; Budget und Urlaub.\nBitte Unterlagen mitbringen.')
    expect(m.exdates).toEqual(['2026-11-11', '2026-11-16'])
    const days = occurrencesInRange(evs, '2026-11-01', '2026-11-22').filter((o) => o.event.title.startsWith('Team')).map((o) => o.start)
    expect(days).toEqual(['2026-11-02T10:00', '2026-11-04T10:00', '2026-11-09T10:00', '2026-11-16T14:00', '2026-11-18T10:00'])
    expect(evs.find((e) => e.title === 'Team-Meeting (verschoben)')!.importUid).toBe('TEAM-MEETING-77@example.local#2026-11-16')
  })
  it('UTC call becomes 14:00 Berlin time', () => {
    expect(evs.find((e) => e.title.startsWith('Telefonat'))).toMatchObject({ start: '2026-11-17T14:00', end: '2026-11-17T15:00' })
  })
  it('New York call right after the European DST change', () => {
    // 26 Oct: Berlin is on CET already, New York still on EDT -> 5 hours apart
    expect(evs.find((e) => e.title === 'Call New York')).toMatchObject({ start: '2026-10-26T14:00', end: '2026-10-26T15:00' })
    const q = asEvents(parseIcs(mac, { localZone: 'America/New_York' })).find((e) => e.title === 'Call New York')!
    expect(q.start).toBe('2026-10-26T09:00')
  })
  it('multi-day vacation, simplified monthly rule, floating monthly series', () => {
    expect(evs.find((e) => e.title === 'Urlaub')).toMatchObject({ allDay: true, start: '2026-12-21', end: '2026-12-28', location: 'Südtirol' })
    expect(evs.find((e) => e.title === 'Stammtisch')!.recurrence).toBeUndefined()
    const k = evs.find((e) => e.title.startsWith('Kontoauszug'))!
    expect(occurrencesInRange([k], '2026-11-01', '2027-03-31').map((o) => o.date)).toEqual(['2026-11-15', '2026-12-15', '2027-01-15'])
  })
  it('the cancelled event is not imported', () => {
    expect(evs.some((e) => e.title === 'Zahnarzt')).toBe(false)
  })
})

describe('Google export fixture', () => {
  const p = parseIcs(google, BERLIN)
  it('UTC times become local times', () => {
    expect(p.events[0]).toMatchObject({ title: 'Sprechstunde', start: '2026-11-18T09:00', end: '2026-11-18T10:00', importUid: 'abc123@google.com' })
    expect(p.events[0].location).toBeUndefined()
    expect(p.events[0].notes).toBeUndefined()
  })
  it('weekly all-day with UNTIL in UTC', () => {
    const e = asEvents(p)[1]
    expect(e.recurrence).toEqual({ freq: 'weekly', interval: 1, until: '2026-12-22', byWeekday: [1] })
    expect(occurrencesInRange([e], '2026-12-01', '2026-12-31').map((o) => o.date)).toEqual(['2026-12-01', '2026-12-08', '2026-12-15', '2026-12-22'])
  })
})
