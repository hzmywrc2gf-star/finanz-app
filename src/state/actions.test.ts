import { describe, expect, it } from 'vitest'
import { createDefaultData } from '../domain/defaults'
import {
  addCategory, addTransaction, deleteCategory, deleteTransaction, renameCategory, setStartBalance,
  updateTransaction,
} from './actions'

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
