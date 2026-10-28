import { describe, expect, it } from 'vitest'
import { addDays, addMonths, isValidISODate, monthEnd, monthLabel, monthShort, monthStart, todayISO } from './dates'

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

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
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
  it('monthShort', () => {
    expect(monthShort('2026-10-27')).toBe('Okt')
    expect(monthShort('2026-05-01')).toBe('Mai')
    expect(monthShort('2026-03-01')).toBe('Mär')
  })
  it('monthLabel', () => {
    expect(monthLabel('2026-10-01')).toBe('Oktober 2026')
    expect(monthLabel('2027-03-15')).toBe('März 2027')
  })
})
