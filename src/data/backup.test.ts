import { describe, expect, it } from 'vitest'
import { createDefaultData } from '../domain/defaults'
import { addRecurring, addTransaction, addTransfer, setCategoryBudget, setStartCash } from '../state/actions'
import { exportJSON, parseBackup } from './backup'

const sample = () =>
  addRecurring(
    addTransfer(
      setStartCash(
        addTransaction(
          addTransaction(
            createDefaultData(),
            { kind: 'income', amountCents: 250000, date: '2026-10-01', categoryId: 'income-gehalt', account: 'konto', note: 'Okt' },
            { id: 'a', createdAt: 1 },
          ),
          { kind: 'expense', amountCents: 4550, date: '2026-10-02', categoryId: 'expense-lebensmittel', account: 'bargeld' },
          { id: 'b', createdAt: 2 },
        ),
        2000,
      ),
      { direction: 'withdrawal', amountCents: 20000, date: '2026-10-03', note: 'Automat' },
      { id: 't1', createdAt: 3 },
    ),
    {
      kind: 'expense', amountCents: 80000, categoryId: 'expense-fixkosten', note: 'Miete', interval: 'monthly',
      dayOfMonth: 1, startDate: '2026-11-01', endDate: '2027-12-31', autoBook: true,
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
    expect(() => parseBackup(mutate((d) => (d.version = 6)))).toThrow(/Version/)
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
  it('exports version 5 with accounts, start cash and transfers', () => {
    const out = JSON.parse(exportJSON(sample()))
    expect(out.version).toBe(5)
    expect(out.settings.startCashCents).toBe(2000)
    expect(out.transactions.map((t: any) => t.account)).toEqual(['konto', 'bargeld'])
    expect(out.transfers).toEqual([{ id: 't1', direction: 'withdrawal', amountCents: 20000, date: '2026-10-03', note: 'Automat', createdAt: 3 }])
  })
  it('validates the account, start cash and transfers strictly', () => {
    const bad = (fn: (d: any) => void, re: RegExp) => expect(() => parseBackup(mutate(fn))).toThrow(re)
    bad((d) => (d.transactions[0].account = 'tresor'), /Konto/)
    bad((d) => delete d.transactions[0].account, /Konto/)
    bad((d) => (d.settings.startCashCents = 1.5), /Bargeld/)
    bad((d) => delete d.settings.startCashCents, /Bargeld/)
    bad((d) => (d.transfers = null), /Umbuchungen/)
    bad((d) => (d.transfers[0].direction = 'sideways'), /Richtung/)
    bad((d) => (d.transfers[0].amountCents = 0), /Betrag/)
    bad((d) => (d.transfers[0].amountCents = 2.5), /Betrag/)
    bad((d) => (d.transfers[0].amountCents = '200'), /Betrag/)
    bad((d) => (d.transfers[0].date = '03.10.2026'), /Datum/)
    bad((d) => (d.transfers[0].date = '2026-02-30'), /Datum/)
    bad((d) => (d.transfers[0].note = 5), /Notiz/)
    bad((d) => (d.transfers[0].createdAt = 'x'), /Erstellungszeitpunkt/)
    bad((d) => (d.transfers[0].id = ''), /ID/)
    bad((d) => d.transfers.push({ ...d.transfers[0] }), /Doppelte/)
    bad((d) => (d.transfers = [5]), /Umbuchung/)
  })
  it('migrates a v1 backup to v2 with empty rules', () => {
    const v1 = { version: 1, settings: { startBalanceCents: 5 }, categories: createDefaultData().categories, transactions: [] }
    const out = parseBackup(JSON.stringify(v1))
    expect(out).toEqual({
      ...v1,
      version: 5,
      settings: { startBalanceCents: 5, startCashCents: 0 },
      recurring: [],
      transfers: [],
    })
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
    bad((r) => delete r.autoBook, /automatisch/)
    bad((r) => (r.autoBook = 'ja'), /automatisch/)
    bad((r) => (r.autoBook = 1), /automatisch/)
    expect(() => parseBackup(mutate((d) => (d.recurring = {})))).toThrow(/Wiederkehrende/)
    expect(() => parseBackup(mutate((d) => d.recurring.push({ ...d.recurring[0] })))).toThrow(/Doppelte/)
  })
  it('allows recurringId pointing to a deleted rule, but only as a string', () => {
    const d = JSON.parse(mutate((x) => (x.transactions[0].recurringId = 'gone')))
    expect(parseBackup(JSON.stringify(d)).transactions[0].recurringId).toBe('gone')
    expect(() => parseBackup(mutate((x) => (x.transactions[0].recurringId = 5)))).toThrow(/Regel/)
  })
  it('migrates a v2 backup up to v5 (everything on the Konto)', () => {
    const v2 = { ...JSON.parse(exportJSON(sample())), version: 2 }
    const out = parseBackup(JSON.stringify(v2))
    expect(out.version).toBe(5)
    expect(out.transactions.every((t) => t.account === 'konto')).toBe(true)
    expect(out.transfers).toEqual([])
    expect(out.settings.startCashCents).toBe(0)
  })
  it('migrates a v3 backup to v4: account konto, no transfers, start cash 0', () => {
    const v3 = JSON.parse(exportJSON(sample()))
    v3.version = 3
    delete v3.transfers
    delete v3.settings.startCashCents
    for (const t of v3.transactions) delete t.account
    const out = parseBackup(JSON.stringify(v3))
    expect(out.version).toBe(5)
    expect(out.settings).toEqual({ startBalanceCents: 0, startCashCents: 0 })
    expect(out.transfers).toEqual([])
    expect(out.transactions.map((t) => [t.id, t.account, t.amountCents])).toEqual([['a', 'konto', 250000], ['b', 'konto', 4550]])
    expect(out.recurring).toEqual(JSON.parse(exportJSON(sample())).recurring)
  })
  it('migrates a v4 backup to v5: every rule gets autoBook = true, the rest stays', () => {
    const v4 = JSON.parse(exportJSON(sample()))
    v4.version = 4
    for (const r of v4.recurring) delete r.autoBook
    const out = parseBackup(JSON.stringify(v4))
    expect(out.version).toBe(5)
    expect(out.recurring.map((r) => [r.id, r.autoBook, r.bookedThrough])).toEqual([['r1', true, '2026-10-31']])
    expect(out).toEqual(sample())
  })
  it('roundtrips a manual rule', () => {
    const d = sample()
    const manual = { ...d, recurring: [{ ...d.recurring[0], autoBook: false }] }
    expect(parseBackup(exportJSON(manual)).recurring[0].autoBook).toBe(false)
  })
  it('migrate leaves broken v3 shapes for the validation to reject', () => {
    expect(() => parseBackup(JSON.stringify({ version: 3, settings: 5, transactions: 'x' }))).toThrow(/Einstellungen/)
  })
  it('roundtrips and validates category budgets', () => {
    const withBudget = setCategoryBudget(sample(), 'expense-lebensmittel', 40000)
    const back = parseBackup(exportJSON(withBudget))
    expect(back).toEqual(withBudget)
    expect(back.categories.find((c) => c.id === 'expense-lebensmittel')?.monthlyBudgetCents).toBe(40000)
    const bad = (value: unknown, id = 'expense-lebensmittel') =>
      mutate((d) => (d.categories.find((c: any) => c.id === id).monthlyBudgetCents = value))
    for (const v of [0, -5, 12.5, '400', null]) expect(() => parseBackup(bad(v))).toThrow(/Budget/)
    expect(() => parseBackup(bad(1000, 'income-gehalt'))).toThrow(/nur für Ausgaben/)
  })
})
