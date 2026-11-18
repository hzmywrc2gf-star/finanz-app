import { describe, expect, it } from 'vitest'
import type { Todo } from '../domain/types'
import { todoIcs, todoIcsFileName } from './todoCalendar'

const todo: Todo = {
  id: 'abc-123', createdAt: 1, listId: null, title: 'Steuererklärung abgeben, Belege; prüfen', done: false, important: true,
  dueDate: '2026-11-20', reminder: '2026-11-19T18:30', steps: [], order: 0,
}

describe('todoIcs', () => {
  it('writes an entry at the reminder time with an alert, the task id as UID and escaped text', () => {
    const ics = todoIcs(todo, new Date(Date.UTC(2026, 10, 18, 9, 0, 0))) as string
    const lines = ics.replace(/\r\n /g, '').split('\r\n')
    expect(lines).toContain('PRODID:-//Finanzklar//Aufgabe//DE')
    expect(lines).toContain('UID:abc-123@finanzklar')
    expect(lines).toContain('DTSTAMP:20261118T090000Z')
    expect(lines).toContain('DTSTART:20261119T183000')
    expect(lines).toContain('DTEND:20261119T184500')
    expect(lines).toContain('SUMMARY:Steuererklärung abgeben\\, Belege\\; prüfen')
    expect(lines).toContain('DESCRIPTION:Fällig am 20.11.2026 · Aufgabe in Finanzklar')
    expect(ics).toContain('BEGIN:VALARM\r\nACTION:DISPLAY')
    expect(lines).toContain('TRIGGER:-PT0M')
    expect(todoIcsFileName(todo)).toBe('aufgabe-2026-11-19.ics')
  })
  it('no reminder, no file', () => {
    expect(todoIcs({ ...todo, reminder: undefined })).toBeNull()
  })
})
