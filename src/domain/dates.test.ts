import { describe, expect, it } from 'vitest'
import { addMonths, monthEnd, monthLabel, monthStart, addWeeks, isoWeekNumber, isValidISODate, startOfWeek, todayISO, weekDays, weekLabel } from './dates'

describe('startOfWeek', () => {
  it('handles Sunday, Monday, Wednesday', () => {
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26') // Sunday
    expect(startOfWeek('2026-10-26')).toBe('2026-10-26') // Monday
    expect(startOfWeek('2026-10-28')).toBe('2026-10-26') // Wednesday
  })
  it('crosses year boundary', () => {
    expect(startOfWeek('2026-12-31')).toBe('2026-12-28')
    expect(startOfWeek('2027-01-01')).toBe('2026-12-28')
    expect(startOfWeek('2027-01-04')).toBe('2027-01-04')
  })
})

describe('weeks', () => {
  it('ISO week numbers', () => {
    expect(isoWeekNumber('2026-10-26')).toBe(44)
    expect(isoWeekNumber('2026-12-31')).toBe(53)
    expect(isoWeekNumber('2027-01-01')).toBe(53)
    expect(isoWeekNumber('2027-01-04')).toBe(1)
    expect(isoWeekNumber('2024-12-30')).toBe(1)
  })
  it('addWeeks and weekDays', () => {
    expect(addWeeks('2026-12-28', 1)).toBe('2027-01-04')
    expect(addWeeks('2026-10-26', -1)).toBe('2026-10-19')
    expect(weekDays('2026-12-28')).toEqual([
      '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03',
    ])
  })
  it('label', () => {
    expect(weekLabel('2026-10-26')).toBe('KW 44 · 26.10. – 01.11.2026')
    expect(weekLabel('2026-12-28')).toBe('KW 53 · 28.12. – 03.01.2027')
  })
})

describe('local dates', () => {
  it('todayISO uses local fields', () => {
    expect(todayISO(new Date(2026, 9, 27, 0, 30))).toBe('2026-10-27')
    expect(todayISO(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })
  it('validates', () => {
    expect(isValidISODate('2026-02-29')).toBe(false)
    expect(isValidISODate('2028-02-29')).toBe(true)
    expect(isValidISODate('2026-1-1')).toBe(false)
  })
})

describe('months', () => {
  it('monthStart / monthEnd', () => {
    expect(monthStart('2026-10-27')).toBe('2026-10-01')
    expect(monthEnd('2026-10-27')).toBe('2026-10-31')
    expect(monthEnd('2026-02-10')).toBe('2026-02-28')
    expect(monthEnd('2028-02-10')).toBe('2028-02-29')
    expect(monthEnd('2026-12-01')).toBe('2026-12-31')
  })
  it('addMonths crosses years and returns month starts', () => {
    expect(addMonths('2026-10-27', 1)).toBe('2026-11-01')
    expect(addMonths('2026-12-31', 1)).toBe('2027-01-01')
    expect(addMonths('2027-01-01', -1)).toBe('2026-12-01')
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-01')
    expect(addMonths('2026-10-01', 14)).toBe('2927-12-01'.replace('2927', '2027'))
  })
  it('monthLabel', () => {
    expect(monthLabel('2026-10-01')).toBe('Oktober 2026')
    expect(monthLabel('2027-03-15')).toBe('März 2027')
  })
})
