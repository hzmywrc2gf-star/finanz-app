import { describe, expect, it } from 'vitest'
import { createDefaultData } from '../domain/defaults'
import type { AppData } from '../domain/types'
import { exportJSON, parseBackup } from '../data/backup'
import { migrate } from '../data/migrate'
import * as A from './actions'

const TODAY = '2026-11-18'
let seq = 0
const ids = () => `id${++seq}`

function base(): AppData {
  let d = A.addList(createDefaultData(), { name: '  Einkauf ', color: 'sand', icon: 'cart' }, { id: 'L1', createdAt: 1 })
  d = A.addTodo(d, { title: ' Steuererklärung abgeben ', dueDate: '2026-11-20' }, { id: 't1', createdAt: 10 })
  d = A.addTodo(d, { title: 'Milch', listId: 'L1', myDay: TODAY }, { id: 't2', createdAt: 11 })
  return d
}

describe('to-do actions', () => {
  it('adds tasks on top of the list, trims, validates', () => {
    const d = base()
    expect(d.todoLists).toEqual([{ id: 'L1', createdAt: 1, order: 1, name: 'Einkauf', color: 'sand', icon: 'cart' }])
    expect(d.todos.map((t) => [t.id, t.title, t.order])).toEqual([['t1', 'Steuererklärung abgeben', 0], ['t2', 'Milch', -1]])
    expect(d.todos[1]).toMatchObject({ listId: 'L1', myDay: TODAY, done: false, important: false, steps: [] })
    expect(() => A.addTodo(d, { title: '   ' })).toThrow('Bitte einen Titel eingeben.')
    expect(() => A.addTodo(d, { title: 'x'.repeat(256) })).toThrow(/zu lang/)
    expect(() => A.addTodo(d, { title: 'x', listId: 'nope' })).toThrow('Die Liste wurde nicht gefunden.')
    expect(() => A.addTodo(d, { title: 'x', dueDate: '2026-02-30' })).toThrow(/Ungültiges Datum/)
    expect(() => A.addTodo(d, { title: 'x', reminder: '2026-11-18 09:00' })).toThrow(/Erinnerung/)
    expect(() => A.addTodo(d, { title: 'x', recurrence: { freq: 'daily', interval: 0 } })).toThrow(/zwischen 1 und 99/)
    expect(() => A.addTodo(d, { title: 'x', recurrence: { freq: 'daily', interval: 1, byWeekday: [1] } })).toThrow(/Wochentage/)
  })
  it('updates fields, null removes them', () => {
    let d = A.updateTodo(base(), 't1', { title: 'Steuer', note: '  Belege im Ordner ', reminder: '2026-11-19T18:30', recurrence: { freq: 'weekly', interval: 1, byWeekday: [4, 0, 4] } })
    expect(d.todos[0]).toMatchObject({ title: 'Steuer', note: 'Belege im Ordner', reminder: '2026-11-19T18:30', recurrence: { freq: 'weekly', interval: 1, byWeekday: [0, 4] } })
    d = A.updateTodo(d, 't1', { note: '', reminder: null, recurrence: null, dueDate: null, listId: 'L1' })
    expect(d.todos[0]).toEqual({ id: 't1', createdAt: 10, listId: 'L1', title: 'Steuer', done: false, important: false, steps: [], order: 0 })
    expect(() => A.updateTodo(d, 'zz', { title: 'a' })).toThrow('Die Aufgabe wurde nicht gefunden.')
  })
  it('star, „Mein Tag“, toggle and reopen', () => {
    let d = A.toggleImportant(base(), 't1')
    expect(d.todos[0].important).toBe(true)
    d = A.setMyDay(d, 't1', TODAY)
    expect(d.todos[0].myDay).toBe(TODAY)
    d = A.setMyDay(d, 't1', null)
    expect('myDay' in d.todos[0]).toBe(false)
    d = A.toggleTodo(d, 't1', { now: 500, today: TODAY })
    expect(d.todos[0]).toMatchObject({ done: true, completedAt: 500 })
    expect(d.todos).toHaveLength(2)
    d = A.toggleTodo(d, 't1', { now: 600, today: TODAY })
    expect(d.todos[0].done).toBe(false)
    expect('completedAt' in d.todos[0]).toBe(false)
  })
  it('completing a repeating task creates the next one (steps reset), the done one keeps no repetition', () => {
    let d = A.updateTodo(base(), 't1', { recurrence: { freq: 'monthly', interval: 1 }, dueDate: '2026-01-31' })
    d = A.addStep(d, 't1', 'Belege sammeln', 's1')
    d = A.toggleStep(d, 't1', 's1')
    d = A.toggleTodo(d, 't1', { now: 700, today: TODAY, newId: ids })
    const [done, , next] = d.todos
    expect(done).toMatchObject({ id: 't1', done: true, completedAt: 700 })
    expect(done.recurrence).toBeUndefined()
    expect(next).toMatchObject({ title: 'Steuererklärung abgeben', done: false, dueDate: '2026-02-28', recurrence: { freq: 'monthly', interval: 1 } })
    expect(next.steps).toEqual([{ id: expect.any(String), title: 'Belege sammeln', done: false }])
    // reopening the completed one does not add another copy
    d = A.toggleTodo(d, 't1', { now: 800, today: TODAY })
    expect(d.todos).toHaveLength(3)
  })
  it('steps: add, rename, toggle, delete, limits', () => {
    let d = A.addStep(base(), 't1', ' Belege ', 's1')
    d = A.addStep(d, 't1', 'Abschicken', 's2')
    d = A.toggleStep(d, 't1', 's2')
    d = A.updateStep(d, 't1', 's1', 'Belege sortieren')
    expect(d.todos[0].steps).toEqual([{ id: 's1', title: 'Belege sortieren', done: false }, { id: 's2', title: 'Abschicken', done: true }])
    d = A.deleteStep(d, 't1', 's1')
    expect(d.todos[0].steps.map((s) => s.id)).toEqual(['s2'])
    expect(() => A.updateStep(d, 't1', 's2', ' ')).toThrow('Bitte einen Schritt eingeben.')
    expect(() => A.toggleStep(d, 't1', 'zz')).toThrow('Der Schritt wurde nicht gefunden.')
    let many = d
    for (let i = 0; i < 99; i++) many = A.addStep(many, 't1', `S${i}`, `m${i}`)
    expect(() => A.addStep(many, 't1', 'eins zu viel')).toThrow(/Höchstens 100/)
  })
  it('delete and restore a task exactly; a gone list sends it to „Aufgaben“', () => {
    const d = base()
    const t2 = d.todos[1]
    const gone = A.deleteTodo(d, 't2')
    expect(gone.todos.map((t) => t.id)).toEqual(['t1'])
    expect(A.restoreTodo(gone, t2).todos[1]).toBe(t2)
    expect(() => A.restoreTodo(d, t2)).toThrow('Die Aufgabe existiert schon.')
    expect(A.restoreTodo(A.deleteList(gone, 'L1'), t2).todos[1].listId).toBeNull()
  })
  it('lists: validate, rename, update, delete with its tasks, restore', () => {
    let d = base()
    expect(() => A.addList(d, { name: ' ', color: 'sky', icon: 'list' })).toThrow('Bitte einen Namen für die Liste eingeben.')
    expect(() => A.addList(d, { name: 'x'.repeat(61), color: 'sky', icon: 'list' })).toThrow(/höchstens 60/)
    expect(() => A.addList(d, { name: 'x', color: 'red' as never, icon: 'list' })).toThrow('Ungültige Farbe.')
    expect(() => A.addList(d, { name: 'x', color: 'sky', icon: 'rocket' as never })).toThrow('Ungültiges Symbol.')
    d = A.addList(d, { name: 'Arbeit', color: 'sky', icon: 'work' }, { id: 'L2', createdAt: 2 })
    expect(d.todoLists[1].order).toBe(2)
    d = A.renameList(d, 'L1', 'Wocheneinkauf')
    d = A.updateList(d, 'L1', { name: 'Wocheneinkauf', color: 'amber', icon: 'home' })
    expect(d.todoLists[0]).toMatchObject({ name: 'Wocheneinkauf', color: 'amber', icon: 'home' })
    const list = d.todoLists[0]
    const tasks = d.todos.filter((t) => t.listId === 'L1')
    const gone = A.deleteList(d, 'L1')
    expect([gone.todoLists.map((l) => l.id), gone.todos.map((t) => t.id)]).toEqual([['L2'], ['t1']])
    const back = A.restoreList(gone, list, tasks)
    expect(back.todoLists.map((l) => l.id).sort()).toEqual(['L1', 'L2'])
    expect(back.todos.map((t) => t.id).sort()).toEqual(['t1', 't2'])
  })
  it('„Alle Daten löschen“ empties lists and tasks', () => {
    const d = A.resetData(base())
    expect([d.todoLists, d.todos]).toEqual([[], []])
  })
})

describe('to-do data in backups (v9)', () => {
  it('migrates v8 to v9 with empty lists and tasks', () => {
    const v8 = { ...JSON.parse(exportJSON(createDefaultData())), version: 8 }
    delete v8.todoLists
    delete v8.todos
    expect(migrate(v8)).toMatchObject({ version: 9, todoLists: [], todos: [] })
    expect(parseBackup(JSON.stringify(v8))).toEqual(createDefaultData())
  })
  it('roundtrips lists and tasks with all fields', () => {
    let d = A.updateTodo(base(), 't1', { recurrence: { freq: 'weekly', interval: 2, byWeekday: [0] }, reminder: '2026-11-19T18:30', note: 'Ordner', important: true })
    d = A.addStep(d, 't1', 'Belege', 's1')
    d = A.toggleTodo(d, 't2', { now: 900, today: TODAY })
    expect(parseBackup(exportJSON(d))).toEqual(d)
  })
  it('rejects invalid lists and tasks', () => {
    const json = (fn: (d: any) => void) => {
      const d = JSON.parse(exportJSON(A.addStep(base(), 't1', 'Belege', 's1')))
      fn(d)
      return JSON.stringify(d)
    }
    const bad = (fn: (d: any) => void, re: RegExp) => expect(() => parseBackup(json(fn))).toThrow(re)
    bad((d) => delete d.todos, /Aufgaben fehlen/)
    bad((d) => (d.todoLists = {}), /Listen fehlen/)
    bad((d) => (d.todoLists[0].name = ''), /Namen/)
    bad((d) => (d.todoLists[0].name = ' Einkauf'), /Namen/)
    bad((d) => (d.todoLists[0].color = 'red'), /Farbe/)
    bad((d) => (d.todoLists[0].icon = 'rocket'), /Symbol/)
    bad((d) => d.todoLists.push({ ...d.todoLists[0] }), /Doppelte Listen-ID/)
    bad((d) => (d.todos[0].title = ''), /Titel/)
    bad((d) => (d.todos[0].title = 'x'.repeat(256)), /Titel/)
    bad((d) => (d.todos[0].listId = 'nope'), /unbekannte Liste/)
    bad((d) => (d.todos[0].listId = undefined), /unbekannte Liste/)
    bad((d) => (d.todos[0].done = 'ja'), /erledigt/)
    bad((d) => (d.todos[0].completedAt = 5), /Erledigt-Zeitpunkt/)
    bad((d) => (d.todos[0].important = 1), /wichtig/)
    bad((d) => (d.todos[0].dueDate = '20.11.2026'), /Datum/)
    bad((d) => (d.todos[0].myDay = '2026-02-30'), /Datum/)
    bad((d) => (d.todos[0].reminder = '2026-11-19T25:00'), /Erinnerung/)
    bad((d) => (d.todos[0].recurrence = { freq: 'hourly', interval: 1 }), /Rhythmus/)
    bad((d) => (d.todos[0].recurrence = { freq: 'daily', interval: 100 }), /Abstand/)
    bad((d) => (d.todos[0].recurrence = { freq: 'monthly', interval: 1, byWeekday: [1] }), /Wochentage/)
    bad((d) => (d.todos[0].steps = null), /Schritte/)
    bad((d) => (d.todos[0].steps[0].title = ''), /Schritt/)
    bad((d) => d.todos[0].steps.push({ ...d.todos[0].steps[0] }), /Schritt hat keine gültige ID/)
    bad((d) => (d.todos[0].note = 'x'.repeat(5001)), /Notiz/)
    bad((d) => (d.todos[0].order = 'a'), /Reihenfolge/)
    bad((d) => d.todos.push({ ...d.todos[0] }), /Doppelte Aufgaben-ID/)
  })
})
