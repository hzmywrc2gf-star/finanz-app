import { describe, expect, it } from 'vitest'
import { backupDue } from './backupReminder'

describe('backupDue', () => {
  it('is due when there was never a backup', () => {
    expect(backupDue('2026-11-01', null, null, true)).toBe(true)
  })

  it('is not due in the month of the last backup', () => {
    expect(backupDue('2026-11-01', '2026-11-01', null, true)).toBe(false)
    expect(backupDue('2026-11-30', '2026-11-02', null, true)).toBe(false)
  })

  it('is due from the 1st of the next month on, also later in that month', () => {
    expect(backupDue('2026-11-01', '2026-10-31', null, true)).toBe(true)
    expect(backupDue('2026-10-31', '2026-10-01', null, true)).toBe(false)
    expect(backupDue('2026-11-17', '2026-10-05', null, true)).toBe(true)
  })

  it('crosses the year boundary', () => {
    expect(backupDue('2027-01-01', '2026-12-31', null, true)).toBe(true)
    expect(backupDue('2026-12-31', '2026-12-01', null, true)).toBe(false)
  })

  it('is not due when the last backup lies in a later month (clock set back)', () => {
    expect(backupDue('2026-10-15', '2026-11-02', null, true)).toBe(false)
  })

  it('is hidden while snoozed and shown again on the snooze date', () => {
    expect(backupDue('2026-11-01', '2026-10-05', '2026-11-02', true)).toBe(false)
    expect(backupDue('2026-11-02', '2026-10-05', '2026-11-02', true)).toBe(true)
    expect(backupDue('2026-11-03', '2026-10-05', '2026-11-02', true)).toBe(true)
  })

  it('is never due when switched off', () => {
    expect(backupDue('2026-11-01', null, null, false)).toBe(false)
    expect(backupDue('2026-11-01', '2026-01-01', '2026-10-01', false)).toBe(false)
  })
})
