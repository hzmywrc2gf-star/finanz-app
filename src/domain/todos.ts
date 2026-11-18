import type { AppData, Todo, TodoColor, TodoIcon, TodoList, TodoRecurrence } from './types'
import { addDays, parseISODate, toISODate } from './dates'
import { daysBetween, longDayLabel, weekStart, weekdayOf } from './calendar'

/**
 * To-do list (built like a well-known phone to-do app, in Finanzklar's own look): the smart lists „Mein Tag“, „Wichtig“,
 * „Geplant“ and „Aufgaben“ (tasks without an own list), own lists, steps, notes, repetition and a reminder for the calendar.
 * Pure functions only; dates are local 'YYYY-MM-DD' strings.
 */

export const TODO_COLORS = ['lav', 'sky', 'mist', 'sand', 'slate', 'amber', 'violet'] as const satisfies readonly TodoColor[]
export const TODO_ICONS = ['list', 'cart', 'home', 'work', 'heart', 'gift', 'travel', 'book'] as const satisfies readonly TodoIcon[]
export const TODO_LIMITS = { listName: 60, title: 255, steps: 100, note: 5000 } as const

export const TODO_COLOR_NAMES: Record<TodoColor, string> = {
  lav: 'Lavendel', sky: 'Himmel', mist: 'Nebel', sand: 'Sand', slate: 'Schiefer', amber: 'Bernstein', violet: 'Veilchen',
}
export const TODO_ICON_NAMES: Record<TodoIcon, string> = {
  list: 'Liste', cart: 'Einkauf', home: 'Zuhause', work: 'Arbeit', heart: 'Herz', gift: 'Geschenk', travel: 'Reise', book: 'Buch',
}

/** The smart lists; any other view id is the id of an own list. */
export type SmartListId = 'myday' | 'important' | 'planned' | 'tasks'
export type TodoViewId = SmartListId | (string & {})
export const SMART_LISTS: readonly { id: SmartListId; name: string }[] = [
  { id: 'myday', name: 'Mein Tag' },
  { id: 'important', name: 'Wichtig' },
  { id: 'planned', name: 'Geplant' },
  { id: 'tasks', name: 'Aufgaben' },
]
export const isSmartList = (view: string): view is SmartListId => SMART_LISTS.some((s) => s.id === view)
/** Name of the built-in list for tasks without an own list. */
export const DEFAULT_LIST_NAME = 'Aufgaben'

/** Open tasks: by their own order, newer first on a tie. */
export function compareOpen(a: Todo, b: Todo): number {
  return a.order - b.order || b.createdAt - a.createdAt
}
/** Completed tasks: most recently completed first. */
export function compareDone(a: Todo, b: Todo): number {
  return (b.completedAt ?? 0) - (a.completedAt ?? 0) || b.createdAt - a.createdAt
}

/** Splits into the open tasks (in order) and the completed ones (newest completion first). */
export function splitTodos(todos: readonly Todo[]): { open: Todo[]; done: Todo[] } {
  return {
    open: todos.filter((t) => !t.done).sort(compareOpen),
    done: todos.filter((t) => t.done).sort(compareDone),
  }
}

/** „Mein Tag“: tasks planned for today (a task added on another day is gone the next day, like a fresh day planner). */
export function myDayTodos(data: Pick<AppData, 'todos'>, today: string): Todo[] {
  return data.todos.filter((t) => t.myDay === today)
}
export function importantTodos(data: Pick<AppData, 'todos'>): Todo[] {
  return data.todos.filter((t) => t.important)
}
/** Tasks of one list; null = „Aufgaben“. */
export function listTodos(data: Pick<AppData, 'todos'>, listId: string | null): Todo[] {
  return data.todos.filter((t) => t.listId === listId)
}

export type PlannedGroupId = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later'
export const PLANNED_GROUP_NAMES: Record<PlannedGroupId, string> = {
  overdue: 'Überfällig', today: 'Heute', tomorrow: 'Morgen', week: 'Diese Woche', later: 'Später',
}

/** The group of a due date relative to today („Diese Woche“ = after tomorrow up to Sunday). */
export function plannedGroup(due: string, today: string): PlannedGroupId {
  if (due < today) return 'overdue'
  if (due === today) return 'today'
  if (due === addDays(today, 1)) return 'tomorrow'
  if (due <= addDays(weekStart(today), 6)) return 'week'
  return 'later'
}

/** „Geplant“: open tasks with a due date, grouped (Überfällig, Heute, Morgen, Diese Woche, Später), empty groups left out. */
export function plannedTodos(data: Pick<AppData, 'todos'>, today: string): { id: PlannedGroupId; name: string; todos: Todo[] }[] {
  const open = data.todos.filter((t) => !t.done && t.dueDate).sort((a, b) => (a.dueDate as string).localeCompare(b.dueDate as string) || compareOpen(a, b))
  const order: PlannedGroupId[] = ['overdue', 'today', 'tomorrow', 'week', 'later']
  return order
    .map((id) => ({ id, name: PLANNED_GROUP_NAMES[id], todos: open.filter((t) => plannedGroup(t.dueDate as string, today) === id) }))
    .filter((g) => g.todos.length > 0)
}

/** The tasks of a view (both open and completed; „Geplant“ only open ones). Unknown list id = none. */
export function viewTodos(data: Pick<AppData, 'todos' | 'todoLists'>, view: TodoViewId, today: string): Todo[] {
  switch (view) {
    case 'myday':
      return myDayTodos(data, today)
    case 'important':
      return importantTodos(data)
    case 'planned':
      return data.todos.filter((t) => !t.done && t.dueDate)
    case 'tasks':
      return listTodos(data, null)
    default:
      return data.todoLists.some((l) => l.id === view) ? listTodos(data, view) : []
  }
}

/** Number of open tasks of a view (the counter on the right of the overview rows). */
export function openCount(data: Pick<AppData, 'todos' | 'todoLists'>, view: TodoViewId, today: string): number {
  return viewTodos(data, view, today).filter((t) => !t.done).length
}

/** Open counts of every view at once (one pass for the overview). */
export function openCounts(data: Pick<AppData, 'todos'>, today: string): Map<string, number> {
  const counts = new Map<string, number>()
  const inc = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1)
  for (const t of data.todos) {
    if (t.done) continue
    if (t.myDay === today) inc('myday')
    if (t.important) inc('important')
    if (t.dueDate) inc('planned')
    inc(t.listId ?? 'tasks')
  }
  return counts
}

export function isOverdue(todo: Pick<Todo, 'done' | 'dueDate'>, today: string): boolean {
  return !todo.done && !!todo.dueDate && todo.dueDate < today
}

const MONTHS_SHORT = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.']
const WEEKDAYS_SHORT = ['Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.', 'So.']

/** "Mi., 19. Nov." (with the year when it is not the year of `today`). */
export function shortDateLabel(iso: string, today: string): string {
  const base = `${WEEKDAYS_SHORT[weekdayOf(iso)]}, ${Number(iso.slice(8, 10))}. ${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]}`
  return iso.slice(0, 4) === today.slice(0, 4) ? base : `${base} ${iso.slice(0, 4)}`
}

/** "Heute", "Morgen", "Gestern", "Mi., 19. Nov." */
export function dayWord(iso: string, today: string): string {
  if (iso === today) return 'Heute'
  if (iso === addDays(today, 1)) return 'Morgen'
  if (iso === addDays(today, -1)) return 'Gestern'
  return shortDateLabel(iso, today)
}

/** Label of a due date: "Heute", "Morgen", "Mi., 19. Nov.", overdue (open) tasks "Überfällig: Mo., 16. Nov.". */
export function dueLabel(due: string, today: string, done = false): string {
  if (!done && due < today) return `Überfällig: ${dayWord(due, today)}`
  return dayWord(due, today)
}

/** "Heute, 09:00" / "Mi., 19. Nov., 09:00" */
export function reminderLabel(reminder: string, today: string): string {
  return `${dayWord(reminder.slice(0, 10), today)}, ${reminder.slice(11, 16)}`
}

/** "Mittwoch, 18. November" (subtitle of „Mein Tag“). */
export const myDayDate = (today: string): string => longDayLabel(today)

const WEEKDAY_CODES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const WORKDAYS = [0, 1, 2, 3, 4]

export const isWorkdays = (r: TodoRecurrence): boolean =>
  r.freq === 'weekly' && r.interval === 1 && !!r.byWeekday && r.byWeekday.length === 5 && WORKDAYS.every((d, i) => r.byWeekday?.[i] === d)

/** "Täglich", "Wochentags", "Wöchentlich", "Alle 2 Wochen: Mo, Do", "Monatlich", "Alle 3 Jahre". */
export function todoRecurrenceLabel(r: TodoRecurrence): string {
  if (isWorkdays(r)) return 'Wochentags'
  const names = { daily: ['Täglich', 'Tage'], weekly: ['Wöchentlich', 'Wochen'], monthly: ['Monatlich', 'Monate'], yearly: ['Jährlich', 'Jahre'] } as const
  const [single, plural] = names[r.freq]
  const base = r.interval === 1 ? single : `Alle ${r.interval} ${plural}`
  return r.byWeekday?.length ? `${base}: ${r.byWeekday.map((d) => WEEKDAY_CODES[d]).join(', ')}` : base
}

const daysIn = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate()

/**
 * Same day `months` later. The last day of a month counts as day 31 (31.01. → 28.02. → 31.03.), days 29–31 fall back to the
 * last day of shorter months (like contracts), so a task "on the last day" does not drift to the 28th.
 */
function addMonthsKeepEnd(iso: string, months: number): string {
  const d = parseISODate(iso)
  const y = d.getFullYear()
  const m0 = d.getMonth()
  const day = d.getDate() === daysIn(y, m0) ? 31 : d.getDate()
  const target = new Date(y, m0 + months, 1)
  return toISODate(new Date(target.getFullYear(), target.getMonth(), Math.min(day, daysIn(target.getFullYear(), target.getMonth()))))
}

/** The next weekday of the set strictly after `from`, in weeks that are `interval` weeks apart (counted from `from`'s week). */
function nextWeekly(from: string, interval: number, days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b)
  const wd = weekdayOf(from)
  const later = sorted.find((d) => d > wd)
  if (later !== undefined) return addDays(from, later - wd)
  return addDays(weekStart(from), 7 * interval + sorted[0])
}

/** The next due date after `from` according to the rule. */
export function nextDueDate(rule: TodoRecurrence, from: string): string {
  switch (rule.freq) {
    case 'daily':
      return addDays(from, rule.interval)
    case 'weekly':
      return rule.byWeekday?.length ? nextWeekly(from, rule.interval, rule.byWeekday) : addDays(from, 7 * rule.interval)
    case 'monthly':
      return addMonthsKeepEnd(from, rule.interval)
    case 'yearly':
      return addMonthsKeepEnd(from, 12 * rule.interval)
  }
}

/** First due date for a newly set repetition: today, or for weekdays the next matching day from today on. */
export function firstDueDate(rule: TodoRecurrence, today: string): string {
  if (rule.freq === 'weekly' && rule.byWeekday?.length && !rule.byWeekday.includes(weekdayOf(today))) return nextWeekly(today, 1, rule.byWeekday)
  return today
}

/**
 * The open copy that follows a repeating task once it is completed: next due date (from the due date, or from today without
 * one), the reminder moves by the same number of days (same time), steps are reset, „Mein Tag“ is not carried over.
 */
export function nextOccurrence(todo: Todo, today: string, meta: { id: string; createdAt: number; stepId: () => string }): Todo | null {
  const rule = todo.recurrence
  if (!rule) return null
  const from = todo.dueDate ?? today
  const due = nextDueDate(rule, from)
  const next: Todo = {
    id: meta.id,
    createdAt: meta.createdAt,
    listId: todo.listId,
    title: todo.title,
    done: false,
    important: todo.important,
    dueDate: due,
    recurrence: rule.byWeekday ? { ...rule, byWeekday: [...rule.byWeekday] } : { ...rule },
    steps: todo.steps.map((s) => ({ id: meta.stepId(), title: s.title, done: false })),
    order: todo.order,
  }
  if (todo.note) next.note = todo.note
  if (todo.reminder) next.reminder = `${addDays(todo.reminder.slice(0, 10), daysBetween(from, due))}${todo.reminder.slice(10)}`
  return next
}

/**
 * Start page card „Heute“: open tasks of „Mein Tag“ plus everything due today or earlier; overdue first (oldest first),
 * then due today, then the rest of „Mein Tag“, each in list order.
 */
export function todayTodos(data: Pick<AppData, 'todos'>, today: string): Todo[] {
  const rank = (t: Todo) => (t.dueDate && t.dueDate < today ? 0 : t.dueDate === today ? 1 : 2)
  return data.todos
    .filter((t) => !t.done && (t.myDay === today || (!!t.dueDate && t.dueDate <= today)))
    .sort((a, b) => rank(a) - rank(b) || (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || compareOpen(a, b))
}

/** Open tasks with a due date in [from, to], by day (calendar markers and day lists). */
export function todosByDueDate(data: Pick<AppData, 'todos'>, from: string, to: string): Map<string, Todo[]> {
  const map = new Map<string, Todo[]>()
  for (const t of [...data.todos].sort(compareOpen)) {
    if (t.done || !t.dueDate || t.dueDate < from || t.dueDate > to) continue
    const list = map.get(t.dueDate)
    if (list) list.push(t)
    else map.set(t.dueDate, [t])
  }
  return map
}

/** Lists of the overview in their order. */
export function sortedLists(lists: readonly TodoList[]): TodoList[] {
  return [...lists].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)
}

/** Name of the list a task belongs to. */
export function listName(lists: readonly TodoList[], listId: string | null): string {
  return (listId && lists.find((l) => l.id === listId)?.name) || DEFAULT_LIST_NAME
}

/** "Schritt 1 von 3" for the meta line: done / all. */
export function stepsLabel(todo: Pick<Todo, 'steps'>): string | null {
  if (todo.steps.length === 0) return null
  return `${todo.steps.filter((s) => s.done).length} von ${todo.steps.length}`
}

/** Next Monday after today (the option „Nächste Woche“). */
export function nextWeekStart(today: string): string {
  return addDays(weekStart(today), 7)
}
