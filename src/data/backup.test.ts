import { describe, expect, it } from 'vitest'
import { createDefaultData } from '../domain/defaults'
import { addRecurring, addTransaction } from '../state/actions'
import { exportJSON, parseBackup } from './backup'

const sample = () =>
  addRecurring(
    addTransaction(
      createDefaultData(),
      { kind: 'income', amountCents: 250000, date: '2026-10-01', categoryId: 'income-gehalt', note: 'Okt' },
      { id: 'a', createdAt: 1 },
    ),
    {
      kind: 'expense', amountCents: 80000, categoryId: 'expense-fixkosten', note: 'Miete', interval: 'monthly',
      dayOfMonth: 1, startDate: '2026-11-01', endDate: '2027-12-31',
    },
    { today: '2026-10-27', catchUp: true, id: 'r1' },
  )

const mutate = (fn: (d: any) => void) => {
  const d = JSON.parse(exportJSON(sample()))
  fn(d)
  return JSON.stringify(d)
}

describe('backup', () => {
  it('roundtrips', () => {
    const d = sample()
    expect(parseBackup(exportJSON(d))).toEqual(d)
  })
  it('rejects invalid input with German errors', () => {
    expect(() => parseBackup('nope')).toThrow(/JSON/)
    expect(() => parseBackup('[]')).toThrow(/Ungültige Sicherungsdatei/)
    expect(() => parseBackup(mutate((d) => (d.version = 3)))).toThrow(/Version/)
    expect(() => parseBackup(mutate((d) => (d.transactions = {})))).toThrow(/Buchungen/)
    expect(() => parseBackup(mutate((d) => (d.categories = null)))).toThrow(/Kategorien/)
    expect(() => parseBackup(mutate((d) => (d.settings.startBalanceCents = 1.5)))).toThrow()
    expect(() => parseBackup(mutate((d) => (d.transactions[0].amountCents = 12.5)))).toThrow(/Betrag/)
    expect(() => parseBackup(mutate((d) => (d.transactions[0].amountCents = 0)))).toThrow(/Betrag/)
    expect(() => parseBackup(mutate((d) => (d.transactions[0].amountCents = '5')))).toThrow(/Betrag/)
    expect(() => parseBackup(mutate((d) => (d.transactions[0].date = '01.10.2026')))).toThrow(/Datum/)
    expect(() => parseBackup(mutate((d) => (d.transactions[0].categoryId = 'zzz')))).toThrow(/Kategorie/)
    expect(() => parseBackup(mutate((d) => (d.transactions[0].kind = 'expense')))).toThrow(/stimmen nicht/)
    expect(() => parseBackup(mutate((d) => (d.transactions[0].kind = 'x')))).toThrow(/Art/)
    expect(() => parseBackup(mutate((d) => (d.categories = d.categories.filter((c: any) => c.id !== 'expense-sonstiges'))))).toThrow(/Sonstiges/)
  })
  it('exports version 2', () => {
    expect(JSON.parse(exportJSON(sample())).version).toBe(2)
  })
  it('migrates a v1 backup to v2 with empty rules', () => {
    const v1 = { version: 1, settings: { startBalanceCents: 5 }, categories: createDefaultData().categories, transactions: [] }
    const out = parseBackup(JSON.stringify(v1))
    expect(out).toEqual({ ...v1, version: 2, recurring: [] })
  })
  it('validates recurring rules strictly', () => {
    const bad = (fn: (r: any) => void, re: RegExp) =>
      expect(() => parseBackup(mutate((d) => fn(d.recurring[0])))).toThrow(re)
    bad((r) => (r.amountCents = 1.5), /Betrag/)
    bad((r) => (r.amountCents = 0), /Betrag/)
    bad((r) => (r.interval = 'weekly'), /Rhythmus/)
    bad((r) => (r.dayOfMonth = 0), /Tag im Monat/)
    bad((r) => (r.dayOfMonth = 32), /Tag im Monat/)
    bad((r) => (r.dayOfMonth = 1.5), /Tag im Monat/)
    bad((r) => (r.startDate = '01.11.2026'), /Startdatum/)
    bad((r) => (r.endDate = '2027-02-30'), /Enddatum/)
    bad((r) => (r.endDate = '2026-10-31'), /vor dem Startdatum/)
    bad((r) => (r.bookedThrough = 'x'), /Buchungsstand/)
    bad((r) => (r.categoryId = 'zzz'), /Kategorie/)
    bad((r) => (r.categoryId = 'income-gehalt'), /stimmen nicht/)
    bad((r) => (r.kind = 'x'), /Art/)
    bad((r) => (r.note = 5), /Notiz/)
    expect(() => parseBackup(mutate((d) => (d.recurring = {})))).toThrow(/Wiederkehrende/)
    expect(() => parseBackup(mutate((d) => d.recurring.push({ ...d.recurring[0] })))).toThrow(/Doppelte/)
  })
  it('allows recurringId pointing to a deleted rule, but only as a string', () => {
    const d = JSON.parse(mutate((x) => (x.transactions[0].recurringId = 'gone')))
    expect(parseBackup(JSON.stringify(d)).transactions[0].recurringId).toBe('gone')
    expect(() => parseBackup(mutate((x) => (x.transactions[0].recurringId = 5)))).toThrow(/Regel/)
  })
})
