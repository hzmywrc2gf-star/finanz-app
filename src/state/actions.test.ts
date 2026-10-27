import { describe, expect, it } from 'vitest'
import { createDefaultData } from '../domain/defaults'
import { bookDue } from '../domain/recurring'
import {
  addCategory, addRecurring, addTransaction, deleteCategory, deleteRecurring, deleteTransaction,
  renameCategory, setCategoryBudget, setStartBalance, updateRecurring, updateTransaction,
} from './actions'
import type { RecurringInput } from './actions'

const base = () => createDefaultData()
const meta = { id: 'x1', createdAt: 5 }
const input = { kind: 'expense' as const, amountCents: 1250, date: '2026-10-27', categoryId: 'expense-lebensmittel' }

describe('transactions', () => {
  it('add, update, delete', () => {
    let d = addTransaction(base(), { ...input, note: '  Brot ' }, meta)
    expect(d.transactions).toEqual([{ ...input, id: 'x1', createdAt: 5, note: 'Brot' }])
    d = updateTransaction(d, 'x1', { ...input, amountCents: 999, note: '' })
    expect(d.transactions[0].amountCents).toBe(999)
    expect(d.transactions[0].note).toBeUndefined()
    expect(d.transactions[0].createdAt).toBe(5)
    d = deleteTransaction(d, 'x1')
    expect(d.transactions).toHaveLength(0)
  })
  it('rejects invalid input', () => {
    expect(() => addTransaction(base(), { ...input, amountCents: 0 })).toThrow()
    expect(() => addTransaction(base(), { ...input, categoryId: 'income-gehalt' })).toThrow()
    expect(() => addTransaction(base(), { ...input, date: '2026-13-01' })).toThrow()
  })
  it('sets start balance', () => {
    expect(setStartBalance(base(), 100000).settings.startBalanceCents).toBe(100000)
  })
})

describe('categories', () => {
  it('adds with validation (case-insensitive per kind)', () => {
    const d = addCategory(base(), 'expense', ' Haustier ', 'c1')
    expect(d.categories.find((c) => c.id === 'c1')).toMatchObject({ name: 'Haustier', builtIn: false })
    expect(() => addCategory(d, 'expense', 'haustier')).toThrow(/existiert bereits/)
    expect(() => addCategory(d, 'expense', '   ')).toThrow(/leer/)
    // same name allowed in the other kind
    expect(() => addCategory(d, 'income', 'Haustier')).not.toThrow()
  })
  it('renames, but not Sonstiges, and not to a duplicate', () => {
    const d = addCategory(base(), 'expense', 'Haustier', 'c1')
    expect(renameCategory(d, 'c1', 'Tiere').categories.find((c) => c.id === 'c1')?.name).toBe('Tiere')
    expect(renameCategory(d, 'c1', 'HAUSTIER').categories.find((c) => c.id === 'c1')?.name).toBe('HAUSTIER')
    expect(() => renameCategory(d, 'c1', 'freizeit')).toThrow()
    expect(() => renameCategory(d, 'expense-sonstiges', 'X')).toThrow()
  })
  it('delete reassigns transactions to the same kind\'s Sonstiges', () => {
    let d = addCategory(base(), 'expense', 'Haustier', 'c1')
    d = addTransaction(d, { ...input, categoryId: 'c1' }, meta)
    d = deleteCategory(d, 'c1')
    expect(d.categories.some((c) => c.id === 'c1')).toBe(false)
    expect(d.transactions[0].categoryId).toBe('expense-sonstiges')
    let i = addCategory(base(), 'income', 'Zins', 'c2')
    i = addTransaction(i, { kind: 'income', amountCents: 100, date: '2026-10-27', categoryId: 'c2' }, meta)
    expect(deleteCategory(i, 'c2').transactions[0].categoryId).toBe('income-sonstiges')
  })
  it('cannot delete Sonstiges', () => {
    expect(() => deleteCategory(base(), 'expense-sonstiges')).toThrow()
    expect(() => deleteCategory(base(), 'income-sonstiges')).toThrow()
  })
})

describe('recurring', () => {
  const rin: RecurringInput = {
    kind: 'expense', amountCents: 80000, categoryId: 'expense-fixkosten', note: ' Miete ',
    interval: 'monthly', dayOfMonth: 1, startDate: '2026-08-01',
  }
  const today = '2026-10-27'

  it('adds with catch-up and books past occurrences immediately', () => {
    const d = addRecurring(base(), rin, { today, catchUp: true, id: 'r1', now: 7 })
    expect(d.recurring[0]).toEqual({
      id: 'r1', kind: 'expense', amountCents: 80000, categoryId: 'expense-fixkosten', note: 'Miete',
      interval: 'monthly', dayOfMonth: 1, startDate: '2026-08-01', bookedThrough: today,
    })
    expect(d.transactions.map((t) => t.date)).toEqual(['2026-08-01', '2026-09-01', '2026-10-01'])
    expect(d.transactions.every((t) => t.recurringId === 'r1' && t.note === 'Miete')).toBe(true)
  })
  it('without catch-up skips past occurrences but still books future ones', () => {
    let d = addRecurring(base(), rin, { today, catchUp: false, id: 'r1' })
    expect(d.transactions).toHaveLength(0)
    expect(d.recurring[0].bookedThrough).toBe(today)
    d = bookDue(d, '2026-11-01')
    expect(d.transactions.map((t) => t.date)).toEqual(['2026-11-01'])
  })
  it('a future start is booked when due, with or without catch-up', () => {
    for (const catchUp of [true, false]) {
      let d = addRecurring(base(), { ...rin, startDate: '2026-11-15', dayOfMonth: 15 }, { today, catchUp, id: 'r1' })
      expect(d.recurring[0].bookedThrough).toBe('2026-11-14')
      expect(d.transactions).toHaveLength(0)
      d = bookDue(d, '2026-11-15')
      expect(d.transactions.map((t) => t.date)).toEqual(['2026-11-15'])
    }
  })
  it('validates input', () => {
    const add = (over: Partial<RecurringInput>) => addRecurring(base(), { ...rin, ...over }, { today, catchUp: true })
    expect(() => add({ amountCents: 0 })).toThrow(/Betrag/)
    expect(() => add({ categoryId: 'income-gehalt' })).toThrow(/Kategorie/)
    expect(() => add({ categoryId: 'zzz' })).toThrow(/Kategorie/)
    expect(() => add({ dayOfMonth: 0 })).toThrow(/Tag/)
    expect(() => add({ dayOfMonth: 32 })).toThrow(/Tag/)
    expect(() => add({ dayOfMonth: 1.5 })).toThrow(/Tag/)
    expect(() => add({ startDate: '2026-02-30' })).toThrow(/Startdatum/)
    expect(() => add({ endDate: '2026-07-31' })).toThrow(/Enddatum/)
    expect(() => add({ endDate: '2026-08-01' })).not.toThrow()
  })
  it('update changes future only; delete keeps bookings', () => {
    let d = addRecurring(base(), rin, { today, catchUp: true, id: 'r1' })
    d = updateRecurring(d, 'r1', { ...rin, amountCents: 85000, note: '' })
    expect(d.recurring[0]).toMatchObject({ amountCents: 85000, bookedThrough: today })
    expect(d.recurring[0].note).toBeUndefined()
    expect(d.transactions.map((t) => t.amountCents)).toEqual([80000, 80000, 80000])
    expect(bookDue(d, '2026-11-01').transactions.at(-1)?.amountCents).toBe(85000)
    expect(() => updateRecurring(d, 'nope', rin)).toThrow(/nicht gefunden/)
    d = deleteRecurring(d, 'r1')
    expect(d.recurring).toHaveLength(0)
    expect(d.transactions).toHaveLength(3)
    expect(bookDue(d, '2026-12-01')).toBe(d)
  })
  it('editing a generated transaction keeps its recurringId', () => {
    let d = addRecurring(base(), rin, { today, catchUp: true, id: 'r1' })
    const t = d.transactions[0]
    d = updateTransaction(d, t.id, { kind: 'expense', amountCents: 79000, date: t.date, categoryId: t.categoryId })
    expect(d.transactions[0]).toMatchObject({ amountCents: 79000, recurringId: 'r1' })
  })
  it('deleteCategory reassigns rules to Sonstiges of the same kind', () => {
    let d = addCategory(base(), 'expense', 'Haustier', 'c1')
    d = addCategory(d, 'income', 'Zins', 'c2')
    d = addRecurring(d, { ...rin, categoryId: 'c1', startDate: '2026-11-01' }, { today, catchUp: true, id: 'r1' })
    d = addRecurring(d, { ...rin, kind: 'income', categoryId: 'c2', startDate: '2026-11-01' }, { today, catchUp: true, id: 'r2' })
    d = deleteCategory(deleteCategory(d, 'c1'), 'c2')
    expect(d.recurring.map((r) => r.categoryId)).toEqual(['expense-sonstiges', 'income-sonstiges'])
  })
})

describe('category budgets', () => {
  const budget = (d: ReturnType<typeof base>, id = 'expense-lebensmittel') =>
    d.categories.find((c) => c.id === id)?.monthlyBudgetCents
  it('sets, replaces and removes a budget', () => {
    let d = setCategoryBudget(base(), 'expense-lebensmittel', 40000)
    expect(budget(d)).toBe(40000)
    d = setCategoryBudget(d, 'expense-lebensmittel', 50000)
    expect(budget(d)).toBe(50000)
    d = setCategoryBudget(d, 'expense-lebensmittel', null)
    expect('monthlyBudgetCents' in d.categories.find((c) => c.id === 'expense-lebensmittel')!).toBe(false)
  })
  it('rejects unknown, income categories and invalid amounts', () => {
    expect(() => setCategoryBudget(base(), 'zzz', 100)).toThrow(/nicht gefunden/)
    expect(() => setCategoryBudget(base(), 'income-gehalt', 100)).toThrow('Budgets gibt es nur für Ausgaben-Kategorien.')
    expect(() => setCategoryBudget(base(), 'income-gehalt', null)).toThrow(/nur für Ausgaben/)
    for (const c of [0, -1, 1.5, NaN]) expect(() => setCategoryBudget(base(), 'expense-lebensmittel', c)).toThrow(/größer als 0/)
  })
  it('allows a budget on Sonstiges and drops it with a deleted category', () => {
    expect(budget(setCategoryBudget(base(), 'expense-sonstiges', 100), 'expense-sonstiges')).toBe(100)
    let d = addCategory(base(), 'expense', 'Haustier', 'c1')
    d = deleteCategory(setCategoryBudget(d, 'c1', 5000), 'c1')
    expect(d.categories.some((c) => c.id === 'c1')).toBe(false)
    expect(d.categories.every((c) => c.monthlyBudgetCents === undefined)).toBe(true)
  })
  it('keeps the budget when renaming', () => {
    let d = addCategory(base(), 'expense', 'Haustier', 'c1')
    d = renameCategory(setCategoryBudget(d, 'c1', 5000), 'c1', 'Tiere')
    expect(budget(d, 'c1')).toBe(5000)
  })
})
