import type { Todo } from '../domain/types'
import { formatDateDE } from '../domain/dates'
import { downloadFile } from './download'
import { buildIcs } from './ics'

/** The calendar file for a task's reminder: a 15-minute entry at the reminder time with an alert at its start, UID = task id. */
export function todoIcs(todo: Todo, now?: Date): string | null {
  if (!todo.reminder) return null
  return buildIcs({
    uid: todo.id,
    date: todo.reminder.slice(0, 10),
    time: todo.reminder.slice(11, 16),
    summary: todo.title,
    description: todo.dueDate ? `Fällig am ${formatDateDE(todo.dueDate)} · Aufgabe in Finanzklar` : 'Aufgabe in Finanzklar',
    product: 'Aufgabe',
    now,
  })
}

export function todoIcsFileName(todo: Todo): string {
  return `aufgabe-${(todo.reminder ?? '').slice(0, 10)}.ics`
}

/** Hands the reminder to the browser; on iOS Safari this opens "Zum Kalender hinzufügen". Re-adding replaces (same UID). */
export function downloadTodoReminder(todo: Todo): void {
  const ics = todoIcs(todo)
  if (ics) downloadFile(todoIcsFileName(todo), ics, 'text/calendar;charset=utf-8')
}
