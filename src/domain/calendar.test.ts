import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from './types'
import { createDefaultData } from './defaults'
import {
  addMinutes, daySegments, daysBetween, daysWithEvents, defaultTimes, financeEntries, layoutDay, lastDay, minutesOf, monthGrid,
  occurrencesInRange, occurrencesOnDay, recurrenceText, sameDayInMonth, weekdayOf, weekStart,
} from './calendar'

const ev = (p: Partial<CalendarEvent> & { start: string; end: string }): CalendarEvent => ({
  id: 'e', createdAt: 1, title: 'T', allDay: !p.start.includes('T'), ...p,
})
const dates = (events: CalendarEvent[], from: string, to: string) => occurrencesInRange(events, from, to).map((o) => o.date)

describe('helpers', () => {
  it('weekday and week start', () => {
    expect(weekdayOf('2026-11-01')).toBe(6) // Sunday
    expect(weekdayOf('2026-11-02')).toBe(0)
    expect(weekStart('2026-11-01')).toBe('2026-10-26')
  })
  it('daysBetween ignores DST', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })
  it('addMinutes crosses days', () => {
    expect(addMinutes('2026-11-15T23:30', 60)).toBe('2026-11-16T00:30')
    expect(addMinutes('2026-11-15T00:10', -20)).toBe('2026-11-14T23:50')
    expect(minutesOf('2026-11-15T09:05')).toBe(545)
  })
  it('default times', () => {
    expect(defaultTimes('2026-11-15', 9)).toEqual({ start: '2026-11-15T09:00', end: '2026-11-15T10:00' })
    expect(defaultTimes('2026-11-15', 23).end).toBe('2026-11-16T00:00')
  })
  it('sameDayInMonth clamps', () => {
    expect(sameDayInMonth('2026-10-31', '2026-11-01')).toBe('2026-11-30')
    expect(sameDayInMonth('2026-10-15', '2026-11-01')).toBe('2026-11-15')
  })
  it('recurrence text', () => {
    expect(recurrenceText(undefined)).toBe('Nie')
    expect(recurrenceText({ freq: 'weekly', interval: 1 })).toBe('Wöchentlich')
    expect(recurrenceText({ freq: 'weekly', interval: 2 })).toBe('Alle 2 Wochen')
  })
})

describe('monthGrid', () => {
  it('November 2026 starts on Monday 26 October', () => {
    const g = monthGrid('2026-11-01')
    expect(g).toHaveLength(6)
    expect(g.every((w) => w.length === 7)).toBe(true)
    expect(g[0][0]).toEqual({ date: '2026-10-26', inMonth: false })
    expect(g[0][6]).toEqual({ date: '2026-11-01', inMonth: true })
    expect(g[5][6].date).toBe('2026-12-06')
    expect(g.flat().filter((d) => d.inMonth)).toHaveLength(30)
  })
  it('a month starting on Monday has no leading days', () => {
    expect(monthGrid('2026-06-15')[0][0]).toEqual({ date: '2026-06-01', inMonth: true })
  })
})

describe('occurrencesInRange', () => {
  it('single timed event', () => {
    const e = ev({ start: '2026-11-16T09:00', end: '2026-11-16T10:00' })
    expect(dates([e], '2026-11-01', '2026-11-30')).toEqual(['2026-11-16'])
    expect(dates([e], '2026-11-17', '2026-11-30')).toEqual([])
  })
  it('multi-day all-day event appears on each day, once in the list', () => {
    const e = ev({ start: '2026-12-24', end: '2026-12-27' })
    expect(dates([e], '2026-12-26', '2026-12-30')).toEqual(['2026-12-24'])
    const occs = occurrencesInRange([e], '2026-12-01', '2026-12-31')
    expect(occurrencesOnDay(occs, '2026-12-26')).toHaveLength(1)
    expect(occurrencesOnDay(occs, '2026-12-28')).toHaveLength(0)
    expect([...daysWithEvents(occs, '2026-12-01', '2026-12-31')]).toEqual(['2026-12-24', '2026-12-25', '2026-12-26', '2026-12-27'])
  })
  it('timed event ending at midnight does not touch the next day', () => {
    const e = ev({ start: '2026-11-15T22:00', end: '2026-11-16T00:00' })
    const [o] = occurrencesInRange([e], '2026-11-15', '2026-11-16')
    expect(lastDay(o)).toBe('2026-11-15')
    expect(occurrencesInRange([e], '2026-11-16', '2026-11-16')).toHaveLength(0)
  })
  it('daily with interval, until, count and exdates', () => {
    const base = { start: '2026-11-01T08:00', end: '2026-11-01T09:00' }
    expect(dates([ev({ ...base, recurrence: { freq: 'daily', interval: 2, until: '2026-11-07' } })], '2026-11-01', '2026-11-30')).toEqual(['2026-11-01', '2026-11-03', '2026-11-05', '2026-11-07'])
    expect(dates([ev({ ...base, recurrence: { freq: 'daily', interval: 1, count: 3 } })], '2026-11-01', '2026-11-30')).toEqual(['2026-11-01', '2026-11-02', '2026-11-03'])
    // exdates still count towards count
    expect(dates([ev({ ...base, recurrence: { freq: 'daily', interval: 1, count: 3 }, exdates: ['2026-11-02'] })], '2026-11-01', '2026-11-30')).toEqual(['2026-11-01', '2026-11-03'])
  })
  it('daily far in the past is fast-forwarded', () => {
    const e = ev({ start: '2020-01-01T08:00', end: '2020-01-01T09:00', recurrence: { freq: 'daily', interval: 3 } })
    const d = dates([e], '2026-11-10', '2026-11-20')
    expect(d.length).toBeGreaterThan(2)
    expect(d.every((x) => daysBetween('2020-01-01', x) % 3 === 0)).toBe(true)
  })
  it('weekly on Monday and Wednesday', () => {
    const e = ev({ start: '2026-11-02T10:00', end: '2026-11-02T11:00', recurrence: { freq: 'weekly', interval: 1, byWeekday: [0, 2] } })
    expect(dates([e], '2026-11-01', '2026-11-15')).toEqual(['2026-11-02', '2026-11-04', '2026-11-09', '2026-11-11'])
  })
  it('weekly starting mid-week skips earlier weekdays of the first week', () => {
    const e = ev({ start: '2026-11-04T10:00', end: '2026-11-04T11:00', recurrence: { freq: 'weekly', interval: 1, byWeekday: [0, 2] } })
    expect(dates([e], '2026-11-01', '2026-11-12')).toEqual(['2026-11-04', '2026-11-09', '2026-11-11'])
  })
  it('every 2 weeks, default weekday of the start', () => {
    const e = ev({ start: '2026-11-05T10:00', end: '2026-11-05T11:00', recurrence: { freq: 'weekly', interval: 2 } })
    expect(dates([e], '2026-11-01', '2026-12-10')).toEqual(['2026-11-05', '2026-11-19', '2026-12-03'])
  })
  it('weekly count counts every weekday', () => {
    const e = ev({ start: '2026-11-02T10:00', end: '2026-11-02T11:00', recurrence: { freq: 'weekly', interval: 1, byWeekday: [0, 2], count: 3 } })
    expect(dates([e], '2026-11-01', '2026-12-31')).toEqual(['2026-11-02', '2026-11-04', '2026-11-09'])
  })
  it('monthly keeps the day and skips months without it', () => {
    const e = ev({ start: '2026-01-31T10:00', end: '2026-01-31T11:00', recurrence: { freq: 'monthly', interval: 1 } })
    expect(dates([e], '2026-01-01', '2026-06-30')).toEqual(['2026-01-31', '2026-03-31', '2026-05-31'])
    const c = ev({ start: '2026-01-31T10:00', end: '2026-01-31T11:00', recurrence: { freq: 'monthly', interval: 1, count: 3 } })
    expect(dates([c], '2026-01-01', '2026-12-31')).toEqual(['2026-01-31', '2026-03-31', '2026-05-31'])
  })
  it('monthly every 3 months across a year end', () => {
    const e = ev({ start: '2026-11-15', end: '2026-11-15', recurrence: { freq: 'monthly', interval: 3 } })
    expect(dates([e], '2026-11-01', '2027-12-31')).toEqual(['2026-11-15', '2027-02-15', '2027-05-15', '2027-08-15', '2027-11-15'])
  })
  it('yearly: birthday, and 29 February only in leap years', () => {
    const b = ev({ start: '1990-03-05', end: '1990-03-05', recurrence: { freq: 'yearly', interval: 1 } })
    expect(dates([b], '2026-03-01', '2027-03-31')).toEqual(['2026-03-05', '2027-03-05'])
    const l = ev({ start: '2024-02-29', end: '2024-02-29', recurrence: { freq: 'yearly', interval: 1 } })
    expect(dates([l], '2024-01-01', '2029-01-01')).toEqual(['2024-02-29', '2028-02-29'])
  })
  it('a repeating multi-day event shows while its span touches the range', () => {
    const e = ev({ start: '2026-11-02', end: '2026-11-04', recurrence: { freq: 'weekly', interval: 1 } })
    expect(dates([e], '2026-11-10', '2026-11-10')).toEqual(['2026-11-09'])
    const o = occurrencesInRange([e], '2026-11-10', '2026-11-10')[0]
    expect(o.end).toBe('2026-11-11')
  })
  it('keeps the wall-clock time across DST changes', () => {
    const e = ev({ start: '2026-10-24T09:00', end: '2026-10-24T10:00', recurrence: { freq: 'daily', interval: 1 } })
    const occs = occurrencesInRange([e], '2026-10-24', '2026-10-27')
    expect(occs.map((o) => o.start)).toEqual(['2026-10-24T09:00', '2026-10-25T09:00', '2026-10-26T09:00', '2026-10-27T09:00'])
  })
  it('never explodes on absurd rules', () => {
    const e = ev({ start: '2026-01-01T09:00', end: '2026-01-01T10:00', recurrence: { freq: 'daily', interval: 1 } })
    const occs = occurrencesInRange([e], '2026-01-01', '9999-12-31')
    expect(occs.length).toBeLessThanOrEqual(5000)
  })
  it('sorts all-day before timed on a day', () => {
    const a = ev({ id: 'a', title: 'Zeit', start: '2026-11-15T08:00', end: '2026-11-15T09:00' })
    const b = ev({ id: 'b', title: 'Ganz', start: '2026-11-15', end: '2026-11-15' })
    expect(occurrencesInRange([a, b], '2026-11-15', '2026-11-15').map((o) => o.event.id)).toEqual(['b', 'a'])
  })
})

describe('day layout', () => {
  const day = '2026-11-15'
  const mk = (id: string, s: string, e: string) => ev({ id, title: id, start: `${day}T${s}`, end: `${day}T${e}` })
  const layout = (events: CalendarEvent[]) => layoutDay(daySegments(occurrencesInRange(events, day, day), day))
  it('non-overlapping events take the full width', () => {
    const p = layout([mk('a', '09:00', '10:00'), mk('b', '10:00', '11:00')])
    expect(p.map((x) => [x.column, x.columns])).toEqual([[0, 1], [0, 1]])
  })
  it('two overlapping events share two columns', () => {
    const p = layout([mk('a', '09:00', '11:00'), mk('b', '10:00', '12:00')])
    expect(p.map((x) => [x.segment.occ.event.id, x.column, x.columns])).toEqual([['a', 0, 2], ['b', 1, 2]])
  })
  it('a freed column is reused inside the same group', () => {
    const p = layout([mk('a', '09:00', '12:00'), mk('b', '09:30', '10:00'), mk('c', '10:30', '11:00')])
    const by = Object.fromEntries(p.map((x) => [x.segment.occ.event.id, [x.column, x.columns]]))
    expect(by).toEqual({ a: [0, 2], b: [1, 2], c: [1, 2] })
  })
  it('short events count as 30 minutes for overlap', () => {
    const p = layout([mk('a', '09:00', '09:05'), mk('b', '09:15', '09:45')])
    expect(p.map((x) => x.columns)).toEqual([2, 2])
  })
  it('all-day events are not placed; multi-day timed clips to the day', () => {
    const allDay = ev({ id: 'x', start: day, end: day })
    const multi = ev({ id: 'm', start: '2026-11-14T22:00', end: '2026-11-16T07:00' })
    const segs = daySegments(occurrencesInRange([allDay, multi], day, day), day)
    expect(segs[0].allDay).toBe(true)
    const m = segs.find((s) => s.occ.event.id === 'm')!
    expect([m.startMin, m.endMin, m.fromBefore, m.toAfter]).toEqual([0, 1440, true, true])
    expect(layoutDay(segs)).toHaveLength(1)
  })
})

describe('financeEntries', () => {
  it('lists contract dates and invoice due dates in range', () => {
    const d = createDefaultData()
    d.recurring.push({
      id: 'r1', kind: 'expense', amountCents: 80000, categoryId: 'expense-fixkosten', note: 'Miete', interval: 'monthly',
      dayOfMonth: 1, startDate: '2026-01-01', bookedThrough: '2026-11-01', autoBook: true,
    })
    d.recurring.push({
      id: 'r2', kind: 'income', amountCents: 250000, categoryId: 'income-gehalt', interval: 'monthly',
      dayOfMonth: 28, startDate: '2026-01-28', bookedThrough: '2026-10-28', autoBook: true,
    })
    d.invoices.push({ id: 'i1', createdAt: 1, note: 'Otto', categoryId: 'expense-kleidung', amountCents: 13980, purchaseDate: '2026-11-01', dueDate: '2026-11-15' })
    const out = financeEntries(d, '2026-11-01', '2026-12-01')
    expect(out.map((e) => [e.date, e.title, e.flow])).toEqual([
      ['2026-11-01', 'Miete', 'expense'],
      ['2026-11-15', 'Zahlen bis: Otto', 'expense'],
      ['2026-11-28', 'Gehalt', 'income'],
      ['2026-12-01', 'Miete', 'expense'],
    ])
    expect(financeEntries(d, '2026-11-02', '2026-11-14')).toEqual([])
  })
  it('respects the end date of a contract', () => {
    const d = createDefaultData()
    d.recurring.push({
      id: 'r1', kind: 'expense', amountCents: 100, categoryId: 'expense-fixkosten', interval: 'monthly', dayOfMonth: 1,
      startDate: '2026-01-01', endDate: '2026-11-30', bookedThrough: '2026-11-01', autoBook: true,
    })
    expect(financeEntries(d, '2026-12-01', '2026-12-31')).toEqual([])
  })
})
