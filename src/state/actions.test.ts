import { describe, expect, it } from 'vitest'
import { createDefaultData } from '../domain/defaults'
import { bookDue, pendingConfirmations } from '../domain/recurring'
import {
  addCategory, addRecurring, bookNextNow, confirmOccurrence, skipOccurrence, addTransaction, deleteCategory, deleteRecurring, deleteTransaction,
  addTransfer, deleteTransfer, renameCategory, setCategoryBudget, setStartBalance, setStartCash, updateRecurring,
  restoreTransaction, restoreTransfer, setDisplayName, updateTransaction, updateTransfer, importTransactions, undoImport,
  createRecurringFromSuggestion, addInvoice, updateInvoice, deleteInvoice, restoreInvoice, payInvoice, undoPayInvoice,
  changeInvoiceAmount, returnInvoice, snoozeInvoice,
} from './actions'
import { accountBalance } from '../domain/calc'
import { monthSummary } from '../domain/month'
import { budgetAlerts } from '../domain/budget'
import { detectRecurring } from '../domain/recurringDetect'
import type { RecurringSuggestion } from '../domain/recurringDetect'
import type { RecurringInput } from './actions'

const base = () => createDefaultData()
const meta = { id: 'x1', createdAt: 5 }
const input = { kind: 'expense' as const, amountCents: 1250, date: '2026-10-27', categoryId: 'expense-lebensmittel', account: 'konto' as const }

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
    expect(() => addTransaction(base(), { ...input, account: 'tresor' as never })).toThrow(/Konto/)
  })
  it('keeps the account and can move a booking to the cash account', () => {
    let d = addTransaction(base(), { ...input, account: 'bargeld' }, meta)
    expect(d.transactions[0].account).toBe('bargeld')
    d = updateTransaction(d, 'x1', { ...input, account: 'konto' })
    expect(d.transactions[0].account).toBe('konto')
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
    i = addTransaction(i, { kind: 'income', amountCents: 100, date: '2026-10-27', categoryId: 'c2', account: 'konto' }, meta)
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
    interval: 'monthly', dayOfMonth: 1, startDate: '2026-08-01', autoBook: true,
  }
  const today = '2026-10-27'

  it('adds with catch-up and books past occurrences immediately', () => {
    const d = addRecurring(base(), rin, { today, catchUp: true, id: 'r1', now: 7 })
    expect(d.recurring[0]).toEqual({
      id: 'r1', kind: 'expense', amountCents: 80000, categoryId: 'expense-fixkosten', note: 'Miete',
      interval: 'monthly', dayOfMonth: 1, startDate: '2026-08-01', bookedThrough: today, autoBook: true,
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
    d = updateTransaction(d, t.id, { kind: 'expense', amountCents: 79000, date: t.date, categoryId: t.categoryId, account: 'konto' })
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

describe('manual contracts', () => {
  const salary: RecurringInput = {
    kind: 'income', amountCents: 200000, categoryId: 'income-gehalt', note: 'Gehalt',
    interval: 'monthly', dayOfMonth: 25, startDate: '2026-10-01', autoBook: false,
  }
  const booking = { kind: 'income' as const, amountCents: 215000, date: '2026-10-26', categoryId: 'income-gehalt', note: 'Gehalt' }
  const today = '2026-10-27'
  const withRule = (input = salary, startToday = today) => addRecurring(base(), input, { today: startToday, catchUp: true, id: 'r1' })

  it('addRecurring keeps manual rules pending when catching up, "Nur künftige" skips them', () => {
    const d = withRule()
    expect(d.transactions).toEqual([])
    expect(d.recurring[0]).toMatchObject({ autoBook: false, bookedThrough: '2026-09-30' })
    expect(pendingConfirmations(d, today).map((p) => p.date)).toEqual(['2026-10-25'])
    const future = addRecurring(base(), salary, { today, catchUp: false, id: 'r1' })
    expect(future.recurring[0].bookedThrough).toBe(today)
    expect(pendingConfirmations(future, today)).toEqual([])
  })

  it('confirmOccurrence books the edited values with recurringId and moves bookedThrough to the occurrence', () => {
    const d = confirmOccurrence(withRule(), 'r1', '2026-10-25', booking, 42)
    expect(d.transactions).toEqual([
      { id: 'r1:2026-10-25', kind: 'income', amountCents: 215000, date: '2026-10-26', categoryId: 'income-gehalt', note: 'Gehalt', account: 'konto', createdAt: 42, recurringId: 'r1' },
    ])
    expect(d.recurring[0].bookedThrough).toBe('2026-10-25')
    expect(pendingConfirmations(d, today)).toEqual([])
    expect(bookDue(d, today)).toBe(d)
  })
  it('always books to the Konto, even if another account is passed', () => {
    const d = confirmOccurrence(withRule(), 'r1', '2026-10-25', { ...booking, account: 'bargeld' })
    expect(d.transactions[0].account).toBe('konto')
  })
  it('validates the input and leaves the occurrence pending on errors', () => {
    const d = withRule()
    expect(() => confirmOccurrence(d, 'r1', '2026-10-25', { ...booking, amountCents: 0 })).toThrow(/Betrag/)
    expect(() => confirmOccurrence(d, 'r1', '2026-10-25', { ...booking, categoryId: 'expense-fixkosten' })).toThrow(/Kategorie/)
    expect(() => confirmOccurrence(d, 'nope', '2026-10-25', booking)).toThrow(/nicht gefunden/)
    expect(pendingConfirmations(d, today)).toHaveLength(1)
  })

  const twoPending = () => withRule({ ...salary, startDate: '2026-09-01', dayOfMonth: 5 })
  it('only the oldest pending occurrence can be confirmed or skipped', () => {
    const d = twoPending()
    expect(pendingConfirmations(d, today).map((p) => p.date)).toEqual(['2026-09-05', '2026-10-05'])
    expect(() => confirmOccurrence(d, 'r1', '2026-10-05', booking)).toThrow('Bitte zuerst den älteren Termin bestätigen.')
    expect(() => skipOccurrence(d, 'r1', '2026-10-05')).toThrow('Bitte zuerst den älteren Termin bestätigen.')
  })
  it('rejects an occurrence that is already handled', () => {
    const d = skipOccurrence(twoPending(), 'r1', '2026-09-05')
    expect(() => confirmOccurrence(d, 'r1', '2026-09-05', booking)).toThrow(/bereits erledigt/)
    expect(() => skipOccurrence(d, 'r1', '2026-09-05')).toThrow(/bereits erledigt/)
  })
  it('skipOccurrence books nothing and moves bookedThrough; then the next one can be confirmed', () => {
    let d = skipOccurrence(twoPending(), 'r1', '2026-09-05')
    expect(d.transactions).toEqual([])
    expect(d.recurring[0].bookedThrough).toBe('2026-09-05')
    d = confirmOccurrence(d, 'r1', '2026-10-05', { ...booking, date: '2026-10-05' })
    expect(d.transactions.map((t) => [t.id, t.date])).toEqual([['r1:2026-10-05', '2026-10-05']])
    expect(pendingConfirmations(d, today)).toEqual([])
  })

  it('bookNextNow before the due date (salary arrives early): booked today, the 30th is done and not auto-booked', () => {
    const early: RecurringInput = { ...salary, dayOfMonth: 30, startDate: '2026-10-01' }
    let d = withRule(early, '2026-10-28')
    d = { ...d, recurring: [{ ...d.recurring[0], bookedThrough: '2026-10-28' }] }
    expect(pendingConfirmations(d, '2026-10-28')).toEqual([])
    d = bookNextNow(d, 'r1', { ...booking, date: '2026-10-28' }, 1)
    expect(d.transactions).toEqual([
      expect.objectContaining({ id: 'r1:2026-10-30', date: '2026-10-28', amountCents: 215000, recurringId: 'r1', account: 'konto' }),
    ])
    expect(d.recurring[0].bookedThrough).toBe('2026-10-30')
    expect(pendingConfirmations(d, '2026-10-30')).toEqual([])
    expect(bookDue(d, '2026-10-31')).toBe(d)
    expect(pendingConfirmations(d, '2026-11-30').map((p) => p.date)).toEqual(['2026-11-30'])
  })
  it('bookNextNow with a pending occurrence covers exactly that one (the oldest)', () => {
    const d = bookNextNow(twoPending(), 'r1', booking)
    expect(d.recurring[0].bookedThrough).toBe('2026-09-05')
    expect(d.transactions.map((t) => t.id)).toEqual(['r1:2026-09-05'])
    expect(pendingConfirmations(d, today).map((p) => p.date)).toEqual(['2026-10-05'])
  })
  it('bookNextNow also works for automatic rules and keeps them from booking that occurrence again', () => {
    let d = addRecurring(base(), { ...salary, autoBook: true, dayOfMonth: 30 }, { today, catchUp: true, id: 'r1' })
    d = bookNextNow(d, 'r1', { ...booking, date: today })
    expect(d.recurring[0].bookedThrough).toBe('2026-10-30')
    expect(bookDue(d, '2026-10-31').transactions).toHaveLength(1)
    expect(bookDue(d, '2026-11-30').transactions.map((t) => t.date)).toEqual([today, '2026-11-30'])
  })
  it('bookNextNow fails for an ended rule', () => {
    const d = withRule({ ...salary, endDate: '2026-10-25' })
    const done = confirmOccurrence(d, 'r1', '2026-10-25', booking)
    expect(() => bookNextNow(done, 'r1', booking)).toThrow(/beendet/)
  })
  it('updateRecurring toggles autoBook and keeps bookedThrough', () => {
    let d = withRule()
    d = updateRecurring(d, 'r1', { ...salary, autoBook: true })
    expect(d.recurring[0]).toMatchObject({ autoBook: true, bookedThrough: '2026-09-30' })
    expect(bookDue(d, today).transactions.map((t) => t.date)).toEqual(['2026-10-25'])
    d = updateRecurring(bookDue(d, today), 'r1', { ...salary, autoBook: false })
    expect(d.recurring[0]).toMatchObject({ autoBook: false, bookedThrough: today })
  })
  it('is idempotent: confirming twice fails instead of booking twice', () => {
    const d = confirmOccurrence(withRule(), 'r1', '2026-10-25', booking)
    expect(() => confirmOccurrence(d, 'r1', '2026-10-25', booking)).toThrow(/bereits erledigt/)
    expect(d.transactions).toHaveLength(1)
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

describe('transfers and start cash', () => {
  const tin = { direction: 'withdrawal' as const, amountCents: 20000, date: '2026-10-27' }
  it('add, update, delete', () => {
    let d = addTransfer(base(), { ...tin, note: '  Geldautomat ' }, meta)
    expect(d.transfers).toEqual([{ ...tin, id: 'x1', createdAt: 5, note: 'Geldautomat' }])
    d = updateTransfer(d, 'x1', { ...tin, direction: 'deposit', amountCents: 5000, note: '' })
    expect(d.transfers[0]).toEqual({ id: 'x1', createdAt: 5, direction: 'deposit', amountCents: 5000, date: '2026-10-27' })
    d = deleteTransfer(d, 'x1')
    expect(d.transfers).toHaveLength(0)
  })
  it('rejects invalid input with German messages', () => {
    expect(() => addTransfer(base(), { ...tin, amountCents: 0 })).toThrow(/größer als 0/)
    expect(() => addTransfer(base(), { ...tin, amountCents: 1.5 })).toThrow(/größer als 0/)
    expect(() => addTransfer(base(), { ...tin, date: '2026-02-30' })).toThrow(/Datum/)
    expect(() => addTransfer(base(), { ...tin, direction: 'x' as never })).toThrow(/Richtung/)
    expect(() => updateTransfer(base(), 'nope', tin)).toThrow(/nicht gefunden/)
  })
  it('sets the start cash like the start balance', () => {
    expect(setStartCash(base(), 2000).settings).toEqual({ startBalanceCents: 0, startCashCents: 2000 })
    expect(setStartCash(base(), -500).settings.startCashCents).toBe(-500)
    expect(() => setStartCash(base(), 1.5)).toThrow()
  })
})

describe('undo of a delete', () => {
  it('restoreTransaction puts back the exact object', () => {
    const tx = { ...input, id: 'r1', createdAt: 77, recurringId: 'rule-9', account: 'bargeld' as const, note: 'Brot' }
    const withTx = { ...base(), transactions: [tx] }
    const deleted = deleteTransaction(withTx, 'r1')
    expect(deleted.transactions).toHaveLength(0)
    const restored = restoreTransaction(deleted, tx)
    expect(restored.transactions).toEqual([tx])
    expect(restored.transactions[0]).toBe(tx)
    expect(deleted.transactions).toHaveLength(0) // input stays untouched
  })
  it('restoreTransaction rejects an id that already exists', () => {
    const d = addTransaction(base(), input, meta)
    expect(() => restoreTransaction(d, d.transactions[0])).toThrow('Die Buchung existiert bereits.')
  })
  it('restoreTransfer puts back the exact object', () => {
    const tr = { id: 't1', direction: 'withdrawal' as const, amountCents: 5000, date: '2026-10-20', note: 'ATM', createdAt: 42 }
    const deleted = deleteTransfer({ ...base(), transfers: [tr] }, 't1')
    const restored = restoreTransfer(deleted, tr)
    expect(restored.transfers).toEqual([tr])
    expect(restored.transfers[0]).toBe(tr)
  })
  it('restoreTransfer rejects an id that already exists', () => {
    const d = addTransfer(base(), { direction: 'deposit', amountCents: 100, date: '2026-10-27' }, { id: 't2', createdAt: 1 })
    expect(() => restoreTransfer(d, d.transfers[0])).toThrow('Die Umbuchung existiert bereits.')
  })
})

describe('display name', () => {
  it('trims, removes an empty name and limits the length', () => {
    const d = createDefaultData()
    expect(setDisplayName(d, '  Felix ').settings.displayName).toBe('Felix')
    expect(setDisplayName(setDisplayName(d, 'Felix'), '   ').settings).not.toHaveProperty('displayName')
    expect(setDisplayName(d, 'x'.repeat(40)).settings.displayName).toHaveLength(40)
    expect(() => setDisplayName(d, 'x'.repeat(41))).toThrow(/40/)
  })
})

describe('importTransactions', () => {
  const rows = [
    { kind: 'expense' as const, amountCents: 4550, date: '2026-10-01', account: 'konto' as const, categoryName: ' lebensmittel ', note: ' Rewe ' },
    { kind: 'expense' as const, amountCents: 1230, date: '2026-10-05', account: 'bargeld' as const, categoryName: 'Yoga' },
    { kind: 'expense' as const, amountCents: 500, date: '2026-10-06', account: 'konto' as const, categoryName: 'yoga' },
    { kind: 'income' as const, amountCents: 8000, date: '2026-10-07', account: 'konto' as const, categoryName: '' },
  ]
  let n = 0
  const ids = () => `id${++n}`

  it('adds the bookings, creates unknown categories once and keeps file order', () => {
    n = 0
    const res = importTransactions(base(), rows, 1000, ids)
    expect(res.data.transactions).toHaveLength(4)
    expect(res.categoryIds).toEqual(['id2'])
    expect(res.data.categories.find((c) => c.id === 'id2')).toEqual({ id: 'id2', name: 'Yoga', kind: 'expense', builtIn: false })
    expect(res.data.transactions.map((t) => [t.categoryId, t.createdAt, t.account, t.note])).toEqual([
      ['expense-lebensmittel', 1000, 'konto', 'Rewe'],
      ['id2', 1001, 'bargeld', undefined],
      ['id2', 1002, 'konto', undefined],
      ['income-sonstiges', 1003, 'konto', undefined],
    ])
    expect(res.transactionIds).toEqual(res.data.transactions.map((t) => t.id))
    expect(res.data.transactions.every((t) => t.recurringId === undefined)).toBe(true)
  })

  it('is all or nothing', () => {
    const before = base()
    expect(() => importTransactions(before, [rows[0], { ...rows[1], date: '2026-02-30' }])).toThrow('Ungültiges Datum.')
    expect(() => importTransactions(before, [{ ...rows[0], amountCents: 0 }])).toThrow('Der Betrag muss größer als 0 sein.')
    expect(() => importTransactions(before, [])).toThrow('Es gibt nichts einzulesen.')
    expect(before.transactions).toHaveLength(0)
  })

  it('undo removes exactly the imported bookings and the categories created by the import', () => {
    n = 0
    const start = addTransaction(base(), input, meta)
    const res = importTransactions(start, rows, 1000, ids)
    expect(undoImport(res.data, res)).toEqual(start)
  })

  it('undo keeps a created category that is in use by something else by now', () => {
    n = 0
    const res = importTransactions(base(), rows, 1000, ids)
    const used = addTransaction(res.data, { ...input, categoryId: 'id2' }, { id: 'later', createdAt: 9 })
    const undone = undoImport(used, res)
    expect(undone.transactions.map((t) => t.id)).toEqual(['later'])
    expect(undone.categories.some((c) => c.id === 'id2')).toBe(true)
  })
})

describe('createRecurringFromSuggestion', () => {
  const seed = (dates: string[], over: Partial<Parameters<typeof addTransaction>[1]> = {}) => {
    let d = base()
    dates.forEach((date, i) => {
      d = addTransaction(d, { kind: 'income', amountCents: 300000, date, categoryId: 'income-gehalt', account: 'konto', ...over }, { id: `g${i}`, createdAt: i })
    })
    return d
  }
  const monthly = ['2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01']
  const found = (d: ReturnType<typeof base>) => detectRecurring(d, '2026-10-28')[0]

  it('creates the rule, links the bookings and handles the past', () => {
    const d0 = seed(monthly)
    const d1 = createRecurringFromSuggestion(d0, found(d0), { autoBook: true, id: 'r-new' })
    expect(d1.recurring).toEqual([
      { id: 'r-new', kind: 'income', amountCents: 300000, categoryId: 'income-gehalt', interval: 'monthly', dayOfMonth: 1, startDate: '2026-05-01', bookedThrough: '2026-10-01', autoBook: true },
    ])
    expect(d1.transactions.every((t) => t.recurringId === 'r-new')).toBe(true)
    // nothing is booked for the past, nor for the current month again
    expect(bookDue(d1, '2026-10-28').transactions).toStrictEqual(d1.transactions)
    // the next one is booked exactly once when due
    const d2 = bookDue(d1, '2026-11-02', 99)
    expect(d2.transactions).toHaveLength(7)
    expect(d2.transactions[6]).toMatchObject({ date: '2026-11-01', recurringId: 'r-new', amountCents: 300000, account: 'konto' })
    expect(bookDue(d2, '2026-11-20').transactions).toHaveLength(7)
  })

  it('does not book a second time in the month of the last found booking', () => {
    const d0 = seed(['2026-07-31', '2026-08-31', '2026-09-30', '2026-10-28'])
    // paid on the 28th although the rhythm says month end: the 31st is not another payment
    const s = { ...found(seed(['2026-07-31', '2026-08-31', '2026-09-30', '2026-10-31'])), lastDate: '2026-10-28' }
    const d1 = createRecurringFromSuggestion(d0, { ...s, transactionIds: ['g0', 'g1', 'g2', 'g3'] }, { autoBook: true })
    expect(d1.recurring[0].dayOfMonth).toBe(31)
    expect(d1.recurring[0].bookedThrough).toBe('2026-10-31')
    expect(bookDue(d1, '2026-11-15').transactions).toHaveLength(4)
    expect(bookDue(d1, '2026-11-30').transactions[4].date).toBe('2026-11-30')
  })

  it('manual rule: next occurrence waits for a confirmation, nothing for the past', () => {
    const d0 = seed(monthly)
    const d1 = createRecurringFromSuggestion(d0, found(d0), { autoBook: false })
    expect(pendingConfirmations(d1, '2026-10-28')).toEqual([])
    expect(pendingConfirmations(d1, '2026-11-03').map((p) => p.date)).toEqual(['2026-11-01'])
    expect(bookDue(d1, '2026-11-03').transactions).toStrictEqual(d1.transactions)
  })

  it('links only free Konto bookings and keeps them when the rule is deleted', () => {
    const d0 = seed(monthly)
    const s = found(d0)
    const d1 = createRecurringFromSuggestion(d0, s, { autoBook: true, id: 'r1' })
    const d2 = deleteRecurring(d1, 'r1')
    expect(d2.transactions).toHaveLength(6)
    // two bookings were deleted in between, one belongs to another rule: not enough left
    const gone = { ...d0, transactions: d0.transactions.slice(0, 2) }
    expect(() => createRecurringFromSuggestion(gone, s, { autoBook: true })).toThrow('Die passenden Buchungen gibt es nicht mehr.')
    const taken = { ...d0, transactions: d0.transactions.map((t, i) => (i < 4 ? { ...t, recurringId: 'other' } : t)) }
    expect(() => createRecurringFromSuggestion(taken, s, { autoBook: true })).toThrow('Die passenden Buchungen gibt es nicht mehr.')
    // after an undone import nothing is left
    expect(() => createRecurringFromSuggestion(base(), s, { autoBook: true })).toThrow()
  })

  it('refuses a duplicate and invalid input with German errors', () => {
    const d0 = seed(monthly)
    const s = found(d0)
    const d1 = createRecurringFromSuggestion(d0, s, { autoBook: true })
    expect(() => createRecurringFromSuggestion({ ...d1, transactions: d0.transactions }, s, { autoBook: true })).toThrow('Dafür gibt es schon einen Vertrag.')
    expect(() => createRecurringFromSuggestion(d0, { ...s, categoryId: 'expense-sonstiges' }, { autoBook: true })).toThrow('Die Kategorie passt nicht zur Art der Buchung.')
    expect(() => createRecurringFromSuggestion(d0, { ...s, amountCents: 0 }, { autoBook: true })).toThrow('Der Betrag muss größer als 0 sein.')
    expect(() => createRecurringFromSuggestion(d0, { ...s, startDate: 'kaputt' } as RecurringSuggestion, { autoBook: true })).toThrow('Ungültiges Startdatum.')
  })
})

describe('invoices (Kauf auf Rechnung)', () => {
  const inInput = { amountCents: 13980, note: '  Otto ', categoryId: 'expense-kleidung', purchaseDate: '2026-10-20', dueDate: '2026-11-03' }
  const open = () => addInvoice(base(), inInput, 7, 'i1')

  it('adds an invoice that is not a transaction and changes no balance, month or budget', () => {
    const d = open()
    expect(d.invoices).toEqual([{ id: 'i1', createdAt: 7, note: 'Otto', categoryId: 'expense-kleidung', amountCents: 13980, purchaseDate: '2026-10-20', dueDate: '2026-11-03' }])
    expect(d.transactions).toEqual([])
    expect(accountBalance(d, 'konto')).toBe(accountBalance(base(), 'konto'))
    expect(monthSummary(d, '2026-10-01').expenseCents).toBe(0)
    expect(budgetAlerts(d, '2026-10-28')).toEqual([])
  })
  it('allows no merchant and rejects invalid input with German errors', () => {
    expect(addInvoice(base(), { ...inInput, note: '  ' }, 1, 'x').invoices[0]).not.toHaveProperty('note')
    expect(() => addInvoice(base(), { ...inInput, amountCents: 0 })).toThrow('Der Betrag muss größer als 0 sein.')
    expect(() => addInvoice(base(), { ...inInput, amountCents: 1.5 })).toThrow('Betrag')
    expect(() => addInvoice(base(), { ...inInput, dueDate: '2026-10-19' })).toThrow('‚Zahlen bis‘ darf nicht vor dem Kaufdatum liegen.')
    expect(() => addInvoice(base(), { ...inInput, purchaseDate: 'x' })).toThrow('Kaufdatum')
    expect(() => addInvoice(base(), { ...inInput, categoryId: 'income-gehalt' })).toThrow('Ausgaben-Kategorie')
    expect(() => addInvoice(base(), { ...inInput, categoryId: 'nope' })).toThrow('Kategorie existiert nicht')
    expect(() => addInvoice(base(), { ...inInput, note: 'x'.repeat(201) })).toThrow('200')
    expect(addInvoice(base(), { ...inInput, dueDate: '2026-10-20' }, 1, 'x').invoices).toHaveLength(1)
  })
  it('updates fields, keeps createdAt and a snooze unless the pay-by date changes', () => {
    let d = open()
    d = snoozeInvoice(d, 'i1', '2026-10-31')
    const kept = updateInvoice(d, 'i1', { ...inInput, amountCents: 9900, note: 'Zalando' })
    expect(kept.invoices[0]).toMatchObject({ createdAt: 7, amountCents: 9900, note: 'Zalando', snoozedUntil: '2026-11-02' })
    const moved = updateInvoice(d, 'i1', { ...inInput, dueDate: '2026-11-10' })
    expect(moved.invoices[0].snoozedUntil).toBeUndefined()
    expect(() => updateInvoice(d, 'zz', inInput)).toThrow('Die Rechnung wurde nicht gefunden.')
    expect(() => updateInvoice(d, 'i1', { ...inInput, amountCents: -1 })).toThrow()
  })
  it('deletes and restores exactly; unknown ids throw', () => {
    const d = open()
    const gone = deleteInvoice(d, 'i1')
    expect(gone.invoices).toEqual([])
    expect(restoreInvoice(gone, d.invoices[0])).toEqual(d)
    expect(() => restoreInvoice(d, d.invoices[0])).toThrow('existiert bereits')
    expect(() => deleteInvoice(d, 'zz')).toThrow('Die Rechnung wurde nicht gefunden.')
  })
  it('paying removes the invoice and books a Konto expense with the paid date, category and note', () => {
    const d = open()
    const r = payInvoice(d, 'i1', { paidDate: '2026-11-02' }, 50, 'tx9')
    expect(r.data.invoices).toEqual([])
    expect(r.data.transactions).toEqual([
      { id: 'tx9', kind: 'expense', amountCents: 13980, date: '2026-11-02', categoryId: 'expense-kleidung', account: 'konto', note: 'Otto', createdAt: 50 },
    ])
    expect(r.transactionId).toBe('tx9')
    expect(accountBalance(r.data, 'konto')).toBe(-13980)
  })
  it('paying can use another amount; invalid amounts, dates and ids throw', () => {
    const d = open()
    expect(payInvoice(d, 'i1', { paidDate: '2026-11-02', amountCents: 9990 }).data.transactions[0].amountCents).toBe(9990)
    expect(() => payInvoice(d, 'i1', { paidDate: '2026-11-02', amountCents: 0 })).toThrow('Betrag')
    expect(() => payInvoice(d, 'i1', { paidDate: 'x' })).toThrow('Datum')
    expect(() => payInvoice(d, 'zz', { paidDate: '2026-11-02' })).toThrow('nicht gefunden')
    expect(d.invoices).toHaveLength(1)
  })
  it('undoing a payment removes the booking and restores the invoice exactly (with snooze)', () => {
    const snoozed = snoozeInvoice(open(), 'i1', '2026-10-30')
    const inv = snoozed.invoices[0]
    const r = payInvoice(snoozed, 'i1', { paidDate: '2026-11-02' }, 50, 'tx9')
    expect(undoPayInvoice(r.data, inv, r.transactionId)).toEqual(snoozed)
  })
  it('changing the amount keeps the invoice open and its dates, and ends a snooze', () => {
    const d = snoozeInvoice(open(), 'i1', '2026-10-30')
    const c = changeInvoiceAmount(d, 'i1', 9990)
    expect(c.invoices[0]).toEqual({ id: 'i1', createdAt: 7, note: 'Otto', categoryId: 'expense-kleidung', amountCents: 9990, purchaseDate: '2026-10-20', dueDate: '2026-11-03' })
    expect(() => changeInvoiceAmount(d, 'i1', 0)).toThrow('Betrag')
    expect(() => changeInvoiceAmount(d, 'zz', 100)).toThrow('nicht gefunden')
  })
  it('returning removes the invoice and books nothing', () => {
    const r = returnInvoice(open(), 'i1')
    expect(r.invoices).toEqual([])
    expect(r.transactions).toEqual([])
    expect(() => returnInvoice(r, 'i1')).toThrow('nicht gefunden')
  })
  it('snoozing sets the date: 2 days, capped at the pay-by date, +1 once due', () => {
    expect(snoozeInvoice(open(), 'i1', '2026-10-31').invoices[0].snoozedUntil).toBe('2026-11-02')
    expect(snoozeInvoice(open(), 'i1', '2026-11-02').invoices[0].snoozedUntil).toBe('2026-11-03')
    expect(snoozeInvoice(open(), 'i1', '2026-11-03').invoices[0].snoozedUntil).toBe('2026-11-04')
    expect(() => snoozeInvoice(open(), 'zz', '2026-11-03')).toThrow('nicht gefunden')
  })
  it('deleting a category moves its invoices to Sonstiges', () => {
    const d = deleteCategory(addCategory(open(), 'expense', 'Technik', 'tech'), 'tech')
    expect(d.invoices[0].categoryId).toBe('expense-kleidung')
    const e = deleteCategory(addInvoice(addCategory(base(), 'expense', 'Technik', 'tech'), { ...inInput, categoryId: 'tech' }, 1, 'i2'), 'tech')
    expect(e.invoices[0].categoryId).toBe('expense-sonstiges')
  })
})
