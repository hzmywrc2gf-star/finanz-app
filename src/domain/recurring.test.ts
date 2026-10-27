import { describe, expect, it } from 'vitest'
import { createDefaultData } from './defaults'
import type { AppData, RecurringRule } from './types'
import {
  bookDue, nextOccurrence, occurrencesBetween, recurrenceLabel, recurringTitle, upcoming,
} from './recurring'

const rule = (over: Partial<RecurringRule> = {}): RecurringRule => ({
  id: 'r1',
  kind: 'expense',
  amountCents: 80000,
  categoryId: 'expense-fixkosten',
  interval: 'monthly',
  dayOfMonth: 1,
  startDate: '2026-08-01',
  bookedThrough: '2026-07-31',
  ...over,
})
const withRules = (...recurring: RecurringRule[]): AppData => ({ ...createDefaultData(), recurring })

describe('occurrencesBetween', () => {
  it('clamps day 31 to shorter months', () => {
    const r = rule({ dayOfMonth: 31, startDate: '2026-01-15' })
    expect(occurrencesBetween(r, '2026-01-01', '2026-05-01')).toEqual([
      '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30',
    ])
  })
  it('handles Feb 29 in leap years (day 30 and 31 too)', () => {
    const r = rule({ dayOfMonth: 30, startDate: '2028-01-01' })
    expect(occurrencesBetween(r, '2028-01-31', '2028-03-31')).toEqual(['2028-02-29', '2028-03-30'])
    const r2 = rule({ dayOfMonth: 29, startDate: '2027-01-01' })
    expect(occurrencesBetween(r2, '2027-01-31', '2027-03-31')).toEqual(['2027-02-28', '2027-03-29'])
  })
  it('quarterly across the year boundary', () => {
    const r = rule({ interval: 'quarterly', dayOfMonth: 15, startDate: '2026-11-10' })
    expect(occurrencesBetween(r, '2026-01-01', '2027-12-31')).toEqual([
      '2026-11-15', '2027-02-15', '2027-05-15', '2027-08-15', '2027-11-15',
    ])
  })
  it('yearly day 29 on a Feb anchor', () => {
    const r = rule({ interval: 'yearly', dayOfMonth: 29, startDate: '2028-02-01' })
    expect(occurrencesBetween(r, '2027-01-01', '2030-12-31')).toEqual(['2028-02-29', '2029-02-28', '2030-02-28'])
  })
  it('skips occurrences before startDate in the anchor month', () => {
    const r = rule({ dayOfMonth: 1, startDate: '2026-01-15' })
    expect(occurrencesBetween(r, '2025-01-01', '2026-03-01')).toEqual(['2026-02-01', '2026-03-01'])
  })
  it('respects endDate inclusively and the exclusive/inclusive bounds', () => {
    const r = rule({ endDate: '2026-10-01' })
    expect(occurrencesBetween(r, '2026-08-01', '2027-01-01')).toEqual(['2026-09-01', '2026-10-01'])
    expect(occurrencesBetween(r, '2026-07-31', '2026-08-01')).toEqual(['2026-08-01'])
    expect(occurrencesBetween(r, '2026-10-01', '2026-12-01')).toEqual([])
  })
  it('works far from the start date', () => {
    const r = rule({ dayOfMonth: 31, startDate: '2020-01-31' })
    expect(occurrencesBetween(r, '2026-10-01', '2026-12-31')).toEqual(['2026-10-31', '2026-11-30', '2026-12-31'])
  })
})

describe('nextOccurrence', () => {
  it('finds the next date or null after the end', () => {
    const r = rule({ endDate: '2026-10-01' })
    expect(nextOccurrence(r, '2026-08-01')).toBe('2026-09-01')
    expect(nextOccurrence(r, '2026-10-01')).toBeNull()
    expect(nextOccurrence(rule(), '2026-05-01')).toBe('2026-08-01')
    expect(nextOccurrence(rule({ interval: 'quarterly', dayOfMonth: 15, startDate: '2026-11-10' }), '2026-11-15')).toBe('2027-02-15')
  })
})

describe('bookDue', () => {
  it('catches up after a long pause', () => {
    const d = withRules(rule({ bookedThrough: '2026-08-01' }))
    const out = bookDue(d, '2026-10-27', 100)
    expect(out.transactions.map((t) => t.date)).toEqual(['2026-09-01', '2026-10-01'])
    expect(out.transactions[0]).toMatchObject({
      kind: 'expense', amountCents: 80000, categoryId: 'expense-fixkosten', recurringId: 'r1', createdAt: 100,
    })
    expect(new Set(out.transactions.map((t) => t.id)).size).toBe(2)
    expect(out.recurring[0].bookedThrough).toBe('2026-10-27')
  })
  it('copies the note and is idempotent (same reference)', () => {
    const once = bookDue(withRules(rule({ note: 'Miete' })), '2026-10-27')
    expect(once.transactions).toHaveLength(3)
    expect(once.transactions[0].note).toBe('Miete')
    expect(bookDue(once, '2026-10-27')).toBe(once)
  })
  it('does not book future occurrences and never moves bookedThrough backwards', () => {
    const d = withRules(rule({ startDate: '2026-11-01', bookedThrough: '2026-10-31' }))
    expect(bookDue(d, '2026-10-27')).toBe(d)
    expect(bookDue(d, '2026-11-01').transactions.map((t) => t.date)).toEqual(['2026-11-01'])
  })
  it('stops at endDate', () => {
    const d = withRules(rule({ endDate: '2026-09-15' }))
    const out = bookDue(d, '2026-12-01')
    expect(out.transactions.map((t) => t.date)).toEqual(['2026-08-01', '2026-09-01'])
    expect(out.recurring[0].bookedThrough).toBe('2026-12-01')
    expect(bookDue(out, '2027-03-01').transactions).toHaveLength(2)
  })
  it('extending an ended rule does not book the gap retroactively', () => {
    const ended = bookDue(withRules(rule({ endDate: '2026-09-15' })), '2026-12-01')
    const extended = { ...ended, recurring: [{ ...ended.recurring[0], endDate: undefined }] }
    expect(bookDue(extended, '2026-12-01')).toBe(extended)
    expect(bookDue(extended, '2027-01-01').transactions.map((t) => t.date).slice(2)).toEqual(['2027-01-01'])
  })
  it('does not resurrect a deleted generated transaction', () => {
    const once = bookDue(withRules(rule()), '2026-10-27')
    const without = { ...once, transactions: once.transactions.filter((t) => t.date !== '2026-09-01') }
    const next = bookDue(without, '2026-11-02')
    expect(next.transactions.map((t) => t.date)).toEqual(['2026-08-01', '2026-10-01', '2026-11-01'])
  })
  it('books once per day across a date rollover', () => {
    let d = bookDue(withRules(rule({ bookedThrough: '2026-10-01' })), '2026-10-31')
    expect(d.transactions).toHaveLength(0)
    d = bookDue(d, '2026-11-01')
    d = bookDue(d, '2026-11-01')
    expect(d.transactions.map((t) => t.date)).toEqual(['2026-11-01'])
  })
})

describe('upcoming', () => {
  it('lists the next 7 days sorted, excluding today', () => {
    const a = rule({ id: 'a', dayOfMonth: 2, startDate: '2026-01-01', bookedThrough: '2026-10-27' })
    const b = rule({ id: 'b', dayOfMonth: 28, startDate: '2026-01-01', bookedThrough: '2026-10-27' })
    const c = rule({ id: 'c', dayOfMonth: 27, startDate: '2026-01-01', bookedThrough: '2026-10-27' })
    const out = upcoming(withRules(a, b, c), '2026-10-27')
    expect(out.map((u) => [u.rule.id, u.date])).toEqual([['b', '2026-10-28'], ['a', '2026-11-02']])
    expect(upcoming(withRules(a, b), '2026-10-27', 1).map((u) => u.date)).toEqual(['2026-10-28'])
  })
})

describe('labels', () => {
  it('describes the rhythm', () => {
    expect(recurrenceLabel(rule())).toBe('monatlich am 1.')
    expect(recurrenceLabel(rule({ interval: 'quarterly', dayOfMonth: 15 }))).toBe('vierteljährlich am 15.')
    expect(recurrenceLabel(rule({ interval: 'yearly', dayOfMonth: 29, startDate: '2028-02-01' }))).toBe('jährlich am 29.02.')
    expect(recurrenceLabel(rule({ interval: 'yearly', dayOfMonth: 5, startDate: '2026-11-01' }))).toBe('jährlich am 05.11.')
  })
  it('uses the note or the category name as title', () => {
    const cats = createDefaultData().categories
    expect(recurringTitle(rule({ note: 'Miete' }), cats)).toBe('Miete')
    expect(recurringTitle(rule(), cats)).toBe('Fixkosten')
  })
})
