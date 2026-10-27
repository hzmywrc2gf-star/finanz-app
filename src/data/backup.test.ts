import { describe, expect, it } from 'vitest'
import { createDefaultData } from '../domain/defaults'
import { addTransaction } from '../state/actions'
import { exportJSON, parseBackup } from './backup'

const sample = () =>
  addTransaction(
    createDefaultData(),
    { kind: 'income', amountCents: 250000, date: '2026-10-01', categoryId: 'income-gehalt', note: 'Okt' },
    { id: 'a', createdAt: 1 },
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
    expect(() => parseBackup(mutate((d) => (d.version = 2)))).toThrow(/Version/)
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
})
