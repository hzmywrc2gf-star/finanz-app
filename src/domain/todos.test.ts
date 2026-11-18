import { describe, expect, it } from 'vitest'
import type { Todo } from './types'
import {
  dueLabel, firstDueDate, isOverdue, myDayTodos, nextDueDate, nextOccurrence, openCount, openCounts, plannedGroup, plannedTodos,
  reminderLabel, splitTodos, stepsLabel, todayTodos, todoRecurrenceLabel, todosByDueDate, viewTodos,
} from './todos'

const T = (over: Partial<Todo> & { id: string }): Todo => ({
  createdAt: 1, listId: null, title: over.id, done: false, important: false, steps: [], order: 0, ...over,
})
const TODAY = '2026-11-18' // Mittwoch

describe('views', () => {
  const data = {
    todoLists: [{ id: 'L', createdAt: 1, name: 'Einkauf', color: 'sand' as const, icon: 'cart' as const, order: 1 }],
    todos: [
      T({ id: 'a', myDay: TODAY, important: true, order: 2 }),
      T({ id: 'b', myDay: '2026-11-17', order: 1 }),
      T({ id: 'c', listId: 'L', dueDate: '2026-11-17', order: 0 }),
      T({ id: 'd', listId: 'L', done: true, completedAt: 50, important: true, dueDate: TODAY }),
      T({ id: 'e', done: true, completedAt: 90 }),
    ],
  }
  it('„Mein Tag“ only holds tasks of today', () => {
    expect(myDayTodos(data, TODAY).map((t) => t.id)).toEqual(['a'])
    expect(myDayTodos(data, '2026-11-19')).toEqual([])
  })
  it('lists, important, planned (only open ones) and counts', () => {
    expect(viewTodos(data, 'important', TODAY).map((t) => t.id)).toEqual(['a', 'd'])
    expect(viewTodos(data, 'tasks', TODAY).map((t) => t.id)).toEqual(['a', 'b', 'e'])
    expect(viewTodos(data, 'L', TODAY).map((t) => t.id)).toEqual(['c', 'd'])
    expect(viewTodos(data, 'planned', TODAY).map((t) => t.id)).toEqual(['c'])
    expect(viewTodos(data, 'gone', TODAY)).toEqual([])
    expect([openCount(data, 'myday', TODAY), openCount(data, 'important', TODAY), openCount(data, 'tasks', TODAY), openCount(data, 'L', TODAY)]).toEqual([1, 1, 2, 1])
    expect(Object.fromEntries(openCounts(data, TODAY))).toEqual({ myday: 1, important: 1, planned: 1, tasks: 2, L: 1 })
  })
  it('sorts open ones by order and completed ones newest first', () => {
    const { open, done } = splitTodos(data.todos)
    expect(open.map((t) => t.id)).toEqual(['c', 'b', 'a'])
    expect(done.map((t) => t.id)).toEqual(['e', 'd'])
  })
})

describe('planned and due labels', () => {
  it('groups by overdue, today, tomorrow, this week, later', () => {
    expect(['2026-11-10', TODAY, '2026-11-19', '2026-11-22', '2026-11-23'].map((d) => plannedGroup(d, TODAY))).toEqual(['overdue', 'today', 'tomorrow', 'week', 'later'])
    const groups = plannedTodos({ todos: [T({ id: 'x', dueDate: '2026-12-01' }), T({ id: 'y', dueDate: '2026-11-01' }), T({ id: 'z', dueDate: TODAY, done: true })] }, TODAY)
    expect(groups.map((g) => [g.name, g.todos.map((t) => t.id)])).toEqual([['Überfällig', ['y']], ['Später', ['x']]])
  })
  it('labels', () => {
    expect(dueLabel(TODAY, TODAY)).toBe('Heute')
    expect(dueLabel('2026-11-19', TODAY)).toBe('Morgen')
    expect(dueLabel('2026-11-19', TODAY).length).toBeGreaterThan(0)
    expect(dueLabel('2026-11-26', TODAY)).toBe('Do., 26. Nov.')
    expect(dueLabel('2027-01-04', TODAY)).toBe('Mo., 4. Jan. 2027')
    expect(dueLabel('2026-11-16', TODAY)).toBe('Überfällig: Mo., 16. Nov.')
    expect(dueLabel('2026-11-17', TODAY)).toBe('Überfällig: Gestern')
    expect(dueLabel('2026-11-16', TODAY, true)).toBe('Mo., 16. Nov.')
    expect(reminderLabel('2026-11-19T09:30', TODAY)).toBe('Morgen, 09:30')
    expect(isOverdue({ done: false, dueDate: '2026-11-17' }, TODAY)).toBe(true)
    expect(isOverdue({ done: true, dueDate: '2026-11-17' }, TODAY)).toBe(false)
    expect(stepsLabel({ steps: [{ id: '1', title: 'a', done: true }, { id: '2', title: 'b', done: false }] })).toBe('1 von 2')
    expect(stepsLabel({ steps: [] })).toBeNull()
  })
  it('recurrence labels', () => {
    expect(todoRecurrenceLabel({ freq: 'daily', interval: 1 })).toBe('Täglich')
    expect(todoRecurrenceLabel({ freq: 'weekly', interval: 1, byWeekday: [0, 1, 2, 3, 4] })).toBe('Wochentags')
    expect(todoRecurrenceLabel({ freq: 'weekly', interval: 2, byWeekday: [0, 3] })).toBe('Alle 2 Wochen: Mo, Do')
    expect(todoRecurrenceLabel({ freq: 'yearly', interval: 3 })).toBe('Alle 3 Jahre')
  })
})

describe('repetition', () => {
  it('daily, weekly, weekdays and intervals', () => {
    expect(nextDueDate({ freq: 'daily', interval: 3 }, TODAY)).toBe('2026-11-21')
    expect(nextDueDate({ freq: 'weekly', interval: 2 }, TODAY)).toBe('2026-12-02')
    // Mi → nächster Wochentag in derselben Woche (Fr), dann Mo der übernächsten Woche bei Abstand 2
    expect(nextDueDate({ freq: 'weekly', interval: 2, byWeekday: [0, 4] }, TODAY)).toBe('2026-11-20')
    expect(nextDueDate({ freq: 'weekly', interval: 2, byWeekday: [0, 4] }, '2026-11-20')).toBe('2026-11-30')
    // Wochentags: Freitag → Montag
    expect(nextDueDate({ freq: 'weekly', interval: 1, byWeekday: [0, 1, 2, 3, 4] }, '2026-11-20')).toBe('2026-11-23')
  })
  it('month end: days 29–31 fall back to the last day, the last day keeps counting as 31', () => {
    const m = { freq: 'monthly' as const, interval: 1 }
    expect(nextDueDate(m, '2026-01-31')).toBe('2026-02-28')
    expect(nextDueDate(m, '2026-02-28')).toBe('2026-03-31')
    expect(nextDueDate(m, '2026-01-30')).toBe('2026-02-28')
    expect(nextDueDate(m, '2026-03-15')).toBe('2026-04-15')
    expect(nextDueDate({ freq: 'monthly', interval: 3 }, '2026-11-30')).toBe('2027-02-28')
    expect(nextDueDate({ freq: 'yearly', interval: 1 }, '2028-02-29')).toBe('2029-02-28')
    expect(nextDueDate({ freq: 'yearly', interval: 1 }, '2026-06-01')).toBe('2027-06-01')
  })
  it('the next copy: new due date, steps reset, reminder moves along, „Mein Tag“ not carried over', () => {
    let n = 0
    const meta = { id: 'new', createdAt: 99, stepId: () => `s${++n}` }
    const todo = T({
      id: 'old', title: 'Müll rausbringen', important: true, myDay: TODAY, dueDate: TODAY, reminder: '2026-11-18T07:30', note: 'gelbe Tonne',
      recurrence: { freq: 'weekly', interval: 1 }, steps: [{ id: 'x', title: 'Tonne raus', done: true }], listId: 'L', order: 4,
    })
    expect(nextOccurrence(todo, TODAY, meta)).toEqual({
      id: 'new', createdAt: 99, listId: 'L', title: 'Müll rausbringen', done: false, important: true, dueDate: '2026-11-25',
      reminder: '2026-11-25T07:30', note: 'gelbe Tonne', recurrence: { freq: 'weekly', interval: 1 }, steps: [{ id: 's1', title: 'Tonne raus', done: false }], order: 4,
    })
    // ohne Fälligkeit ab heute
    expect(nextOccurrence(T({ id: 'o', recurrence: { freq: 'daily', interval: 1 } }), TODAY, meta)?.dueDate).toBe('2026-11-19')
    expect(nextOccurrence(T({ id: 'o' }), TODAY, meta)).toBeNull()
  })
  it('first due date of weekday rules', () => {
    expect(firstDueDate({ freq: 'daily', interval: 1 }, TODAY)).toBe(TODAY)
    expect(firstDueDate({ freq: 'weekly', interval: 1, byWeekday: [5, 6] }, TODAY)).toBe('2026-11-21')
    expect(firstDueDate({ freq: 'weekly', interval: 1, byWeekday: [2] }, TODAY)).toBe(TODAY)
  })
})

describe('start card and calendar', () => {
  const todos = [
    T({ id: 'my', myDay: TODAY, order: 0 }),
    T({ id: 'today', dueDate: TODAY, order: 5 }),
    T({ id: 'old', dueDate: '2026-11-10', order: 9 }),
    T({ id: 'older', dueDate: '2026-11-01', order: 9 }),
    T({ id: 'later', dueDate: '2026-11-20' }),
    T({ id: 'done', dueDate: TODAY, done: true, completedAt: 1 }),
  ]
  it('today: overdue first, then due today, then „Mein Tag“', () => {
    expect(todayTodos({ todos }, TODAY).map((t) => t.id)).toEqual(['older', 'old', 'today', 'my'])
  })
  it('open tasks by due date', () => {
    const map = todosByDueDate({ todos }, '2026-11-15', '2026-11-30')
    expect([...map.keys()].sort()).toEqual([TODAY, '2026-11-20'])
    expect(map.get(TODAY)?.map((t) => t.id)).toEqual(['today'])
  })
})
