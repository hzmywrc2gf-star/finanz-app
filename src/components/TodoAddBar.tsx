import { useEffect, useRef, useState } from 'react'
import type { TodoRecurrence } from '../domain/types'
import { todayISO } from '../domain/dates'
import { dayWord, firstDueDate, reminderLabel, todoRecurrenceLabel, viewDefaults } from '../domain/todos'
import { useKeyboardInset } from '../hooks/useKeyboardInset'
import type { TodoViewId } from '../domain/todos'
import { haptic } from '../lib/haptics'
import { useFinance } from '../state/FinanceContext'
import { BellIcon, PlannedIcon, PlusIcon, RepeatSmallIcon } from './Icons'
import { DuePicker, ReminderPicker, RepeatPicker } from './TodoPickers'

/**
 * The fixed entry line at the bottom of a list ("Aufgabe hinzufügen", round "+" on the left). While it is active, three pills
 * below it set a due date, a reminder and a repetition for the next task. Enter or "Hinzufügen" adds the task and keeps the
 * field focused for the next one. It sits above the tab bar, and above the keyboard while that is open.
 */
export function TodoAddBar({ view }: { view: TodoViewId }) {
  const { addTodo } = useFinance()
  const barRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [focused, setFocused] = useState(false)
  const [due, setDue] = useState<string | undefined>()
  const [reminder, setReminder] = useState<string | undefined>()
  const [rule, setRule] = useState<TodoRecurrence | undefined>()
  const [picker, setPicker] = useState<'due' | 'reminder' | 'repeat' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const blurTimer = useRef(0)
  useKeyboardInset(barRef)
  useEffect(() => () => window.clearTimeout(blurTimer.current), [])
  const today = todayISO()
  const defaults = viewDefaults(view, today)
  const active = focused || title !== '' || !!due || !!reminder || !!rule || picker !== null

  function submit() {
    if (!title.trim()) return
    try {
      const dueDate = due ?? (rule ? firstDueDate(rule, today) : defaults.dueDate)
      addTodo({ ...defaults, title, dueDate, reminder, recurrence: rule })
      haptic()
      setTitle('')
      setDue(undefined)
      setReminder(undefined)
      setRule(undefined)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }
  /** After a choice the field gets the focus back (inside the tap, so iOS keeps the keyboard). */
  const refocus = () => inputRef.current?.focus()
  const keepFocus = (e: { preventDefault: () => void }) => e.preventDefault()
  /** The keyboard goes away while a choice sheet is open (it would cover the sheet); the field gets the focus back after a choice. */
  const openPicker = (which: 'due' | 'reminder' | 'repeat') => {
    inputRef.current?.blur()
    setPicker(which)
  }

  return (
    <>
      <form
        ref={barRef}
        className="todo-add"
        data-active={active || undefined}
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="todo-add-card">
          <div className="todo-add-row">
            <button type="button" className="todo-add-plus" aria-label="Neue Aufgabe eingeben" tabIndex={-1} onMouseDown={keepFocus} onClick={refocus}>
              <PlusIcon />
            </button>
            <input
              ref={inputRef}
              className="todo-add-input"
              aria-label="Aufgabe hinzufügen"
              placeholder="Aufgabe hinzufügen"
              enterKeyHint="done"
              autoComplete="off"
              maxLength={255}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setError(null)
              }}
              onFocus={() => {
                window.clearTimeout(blurTimer.current)
                setFocused(true)
              }}
              // a tap on a pill blurs the field first: wait a moment so the pill still exists when the click arrives
              onBlur={() => {
                blurTimer.current = window.setTimeout(() => setFocused(false), 200)
              }}
            />
            {title.trim() && (
              <button type="submit" className="todo-add-go" onMouseDown={keepFocus}>
                Hinzufügen
              </button>
            )}
          </div>
          {active && (
            <div className="todo-pills" role="group" aria-label="Für die neue Aufgabe">
              <button type="button" className="todo-pill" data-set={due ? '' : undefined} onMouseDown={keepFocus} onClick={() => openPicker('due')}>
                <PlannedIcon size={15} />
                {due ? dayWord(due, today) : 'Fällig'}
              </button>
              <button type="button" className="todo-pill" data-set={reminder ? '' : undefined} onMouseDown={keepFocus} onClick={() => openPicker('reminder')}>
                <BellIcon size={15} />
                {reminder ? reminderLabel(reminder, today) : 'Erinnerung'}
              </button>
              <button type="button" className="todo-pill" data-set={rule ? '' : undefined} onMouseDown={keepFocus} onClick={() => openPicker('repeat')}>
                <RepeatSmallIcon size={15} />
                {rule ? todoRecurrenceLabel(rule) : 'Wiederholen'}
              </button>
            </div>
          )}
          {error && (
            <div className="error todo-add-error" role="alert">
              {error}
            </div>
          )}
        </div>
      </form>
      {picker === 'due' && (
        <DuePicker
          value={due}
          onPick={(d) => {
            setDue(d ?? undefined)
            refocus()
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'reminder' && (
        <ReminderPicker
          value={reminder}
          onPick={(r) => {
            setReminder(r ?? undefined)
            refocus()
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'repeat' && (
        <RepeatPicker
          value={rule}
          onPick={(r) => {
            setRule(r ?? undefined)
            if (r && !due) setDue(firstDueDate(r, today))
            refocus()
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  )
}
