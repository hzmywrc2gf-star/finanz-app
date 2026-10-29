import { describe, expect, it } from 'vitest'
import { createDefaultData } from '../domain/defaults'
import { bookDue, pendingConfirmations } from '../domain/recurring'
import {
  addCategory, addRecurring, bookNextNow, confirmOccurrence, skipOccurrence, addTransaction, deleteCategory, deleteRecurring, deleteTransaction,
  addTransfer, deleteTransfer, renameCategory, setCategoryBudget, setStartBalance, setStartCash, updateRecurring,
  restoreTransaction, restoreTransfer, setDisplayName, updateTransaction, updateTransfer, importTransactions, undoImport,
} from './actions'
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
