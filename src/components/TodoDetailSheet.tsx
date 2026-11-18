import { useEffect, useRef, useState } from 'react'
import type { Todo, TodoStep } from '../domain/types'
import { formatDateDE, todayISO, toISODate } from '../domain/dates'
import { DEFAULT_LIST_NAME, dueLabel, firstDueDate, isOverdue, reminderLabel, sortedLists, todoRecurrenceLabel } from '../domain/todos'
import { haptic } from '../lib/haptics'
import { downloadTodoReminder } from '../lib/todoCalendar'
import { useFinance } from '../state/FinanceContext'
import { ConfirmDialog } from './ConfirmDialog'
import { BellIcon, CalendarIcon, FolderIcon, PlannedIcon, PlusIcon, RepeatSmallIcon, SunIcon, XIcon } from './Icons'
import { Sheet } from './Sheet'
import { StarButton, TodoCheck } from './TodoParts'
import { DuePicker, ReminderPicker, RepeatPicker } from './TodoPickers'

/** A text that is saved when the field loses focus, on Enter and when the sheet goes away; `save` returning false reverts it. */
function useDraft(value: string, save: (v: string) => boolean | void) {
  const [draft, setDraft] = useState(value)
  const latest = useRef({ draft, value, save })
  useEffect(() => {
    latest.current = { draft, value, save }
  })
  // a change from elsewhere (undo, another device later) replaces an untouched draft
  const [prev, setPrev] = useState(value)
  if (value !== prev) {
    setPrev(value)
    setDraft(value)
  }
  const commit = () => {
    const { draft: d, value: v, save: s } = latest.current
    if (d !== v && s(d) === false) setDraft(v)
  }
  useEffect(() => () => commit(), [])
  return { draft, setDraft, commit }
}

const dateText = (ms: number) => formatDateDE(toISODate(new Date(ms)))

function StepRow({ todo, step }: { todo: Todo; step: TodoStep }) {
  const { toggleStep, updateStep, deleteStep } = useFinance()
  const { draft, setDraft, commit } = useDraft(step.title, (v) => {
    try {
      if (v.trim()) updateStep(todo.id, step.id, v)
      else deleteStep(todo.id, step.id)
    } catch {
      // the task or the step is gone already
    }
  })
  return (
    <li className="todo-step" data-done={step.done || undefined}>
      <TodoCheck small done={step.done} title={step.title} onToggle={() => toggleStep(todo.id, step.id)} />
      <input
        className="todo-step-input"
        aria-label={`Schritt: ${step.title}`}
        value={draft}
        maxLength={255}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <button
        type="button"
        className="todo-x"
        aria-label={`Schritt löschen: ${step.title}`}
        onClick={() => {
          haptic()
          deleteStep(todo.id, step.id)
        }}
      >
        <XIcon size={16} />
      </button>
    </li>
  )
}

/**
 * The details of a task (a tall sheet, reachable from every list, the calendar and the start page): check, title and star,
 * steps, „Mein Tag“, reminder (with the offer to put it into the calendar), due date, repetition, list, note, created/completed
 * date and delete. Every change is saved at once; text fields when they lose focus.
 */
export function TodoDetailSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, updateTodo, toggleTodo, toggleImportant, setMyDay, deleteTodo, addStep } = useFinance()
  const todo = data.todos.find((t) => t.id === id)
  const today = todayISO()
  const [picker, setPicker] = useState<'due' | 'reminder' | 'repeat' | null>(null)
  const [offerCalendar, setOfferCalendar] = useState<Todo | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [newStep, setNewStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const title = useDraft(todo?.title ?? '', (v) => {
    if (!v.trim()) return false
    try {
      updateTodo(id, { title: v })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  })
  const note = useDraft(todo?.note ?? '', (v) => {
    try {
      updateTodo(id, { note: v })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  })

  // deleted (here or by undoing its creation): nothing to show
  useEffect(() => {
    if (!todo) onClose()
  }, [todo, onClose])
  if (!todo) return null

  const set = (patch: Parameters<typeof updateTodo>[1]) => {
    try {
      updateTodo(id, patch)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }
  const addNewStep = () => {
    if (!newStep.trim()) return
    try {
      addStep(id, newStep)
      setNewStep('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }
  const inMyDay = todo.myDay === today
  const lists = sortedLists(data.todoLists)

  return (
    <>
      <Sheet title="Aufgabe" onClose={onClose} closeLabel="Fertig">
        <div className="card todo-detail-head" data-done={todo.done || undefined}>
          <div className="todo-detail-top">
            <TodoCheck done={todo.done} title={todo.title} onToggle={() => toggleTodo(id)} />
            <textarea
              className="todo-detail-title"
              aria-label="Titel"
              rows={1}
              maxLength={255}
              value={title.draft}
              onChange={(e) => title.setDraft(e.target.value.replace(/\n/g, ' '))}
              onBlur={title.commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
            />
            <StarButton on={todo.important} title={todo.title} onToggle={() => toggleImportant(id)} />
          </div>
          {todo.steps.length > 0 && (
            <ul className="todo-steps" aria-label="Schritte">
              {todo.steps.map((s) => (
                <StepRow key={s.id} todo={todo} step={s} />
              ))}
            </ul>
          )}
          <form
            className="todo-step-add"
            onSubmit={(e) => {
              e.preventDefault()
              addNewStep()
            }}
          >
            <span className="todo-step-plus" aria-hidden="true">
              <PlusIcon />
            </span>
            <input
              className="todo-step-input"
              aria-label="Schritt hinzufügen"
              placeholder={todo.steps.length ? 'Nächster Schritt' : 'Schritt hinzufügen'}
              enterKeyHint="done"
              maxLength={255}
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onBlur={addNewStep}
            />
          </form>
        </div>

        <ul className="list card todo-opts">
          <li className="todo-opt" data-set={inMyDay || undefined}>
            <button type="button" className="row todo-opt-main" onClick={() => !inMyDay && (haptic(), setMyDay(id, true))} aria-pressed={inMyDay}>
              <span className="todo-opt-icon"><SunIcon size={20} /></span>
              <span className="row-main row-title">{inMyDay ? 'Zu „Mein Tag“ hinzugefügt' : 'Zu „Mein Tag“ hinzufügen'}</span>
            </button>
            {inMyDay && (
              <button type="button" className="todo-x" aria-label="Aus „Mein Tag“ entfernen" onClick={() => setMyDay(id, false)}>
                <XIcon size={16} />
              </button>
            )}
          </li>
          <li className="todo-opt" data-set={todo.reminder ? '' : undefined}>
            <button type="button" className="row todo-opt-main" onClick={() => setPicker('reminder')}>
              <span className="todo-opt-icon"><BellIcon size={20} /></span>
              <span className="row-main">
                <span className="row-title">{todo.reminder ? `Erinnerung: ${reminderLabel(todo.reminder, today)}` : 'Erinnerung'}</span>
              </span>
            </button>
            {todo.reminder && (
              <button type="button" className="todo-x" aria-label="Erinnerung entfernen" onClick={() => set({ reminder: null })}>
                <XIcon size={16} />
              </button>
            )}
          </li>
          <li className="todo-opt" data-set={todo.dueDate ? '' : undefined}>
            <button type="button" className="row todo-opt-main" onClick={() => setPicker('due')}>
              <span className="todo-opt-icon"><PlannedIcon size={20} /></span>
              <span className={`row-main row-title ${isOverdue(todo, today) ? 'overdue-text' : ''}`}>
                {todo.dueDate ? (isOverdue(todo, today) ? dueLabel(todo.dueDate, today) : `Fällig: ${dueLabel(todo.dueDate, today, todo.done)}`) : 'Fälligkeitsdatum'}
              </span>
            </button>
            {todo.dueDate && (
              <button type="button" className="todo-x" aria-label="Fälligkeit entfernen" onClick={() => set({ dueDate: null })}>
                <XIcon size={16} />
              </button>
            )}
          </li>
          <li className="todo-opt" data-set={todo.recurrence ? '' : undefined}>
            <button type="button" className="row todo-opt-main" onClick={() => setPicker('repeat')}>
              <span className="todo-opt-icon"><RepeatSmallIcon size={20} /></span>
              <span className="row-main row-title">{todo.recurrence ? todoRecurrenceLabel(todo.recurrence) : 'Wiederholen'}</span>
            </button>
            {todo.recurrence && (
              <button type="button" className="todo-x" aria-label="Wiederholung entfernen" onClick={() => set({ recurrence: null })}>
                <XIcon size={16} />
              </button>
            )}
          </li>
          <li className="todo-opt">
            <label className="row todo-opt-main" htmlFor="todo-list-select">
              <span className="todo-opt-icon"><FolderIcon size={20} /></span>
              <span className="row-main row-title">Liste</span>
            </label>
            <select
              id="todo-list-select"
              className="todo-list-select"
              value={todo.listId ?? ''}
              onChange={(e) => set({ listId: e.target.value || null })}
            >
              <option value="">{DEFAULT_LIST_NAME}</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </li>
        </ul>
        {todo.reminder && (
          <button type="button" className="btn secondary todo-ics" onClick={() => downloadTodoReminder(todo)}>
            <CalendarIcon /> In den Kalender eintragen
          </button>
        )}

        <div className="card todo-note">
          <textarea
            aria-label="Notiz"
            placeholder="Notiz hinzufügen"
            rows={4}
            maxLength={5000}
            value={note.draft}
            onChange={(e) => note.setDraft(e.target.value)}
            onBlur={note.commit}
          />
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <p className="footnote todo-created">
          {todo.done && todo.completedAt ? `Erledigt am ${dateText(todo.completedAt)}` : `Erstellt am ${dateText(todo.createdAt)}`}
        </p>
        <button type="button" className="btn danger" onClick={() => setConfirmDelete(true)}>
          Aufgabe löschen
        </button>
      </Sheet>
      {picker === 'due' && <DuePicker value={todo.dueDate} onPick={(d) => set({ dueDate: d })} onClose={() => setPicker(null)} />}
      {picker === 'reminder' && (
        <ReminderPicker
          value={todo.reminder}
          onPick={(r) => {
            set({ reminder: r })
            if (r) setOfferCalendar({ ...todo, reminder: r })
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'repeat' && (
        <RepeatPicker
          value={todo.recurrence}
          onPick={(r) => set(r && !todo.dueDate ? { recurrence: r, dueDate: firstDueDate(r, today) } : { recurrence: r })}
          onClose={() => setPicker(null)}
        />
      )}
      {offerCalendar && (
        <ConfirmDialog
          title="In den Kalender eintragen?"
          message={`„${offerCalendar.title}“ · ${reminderLabel(offerCalendar.reminder as string, today)}. Der Kalender deines Geräts erinnert dich dann daran.`}
          confirmLabel="Eintragen"
          cancelLabel="Nein"
          onCancel={() => setOfferCalendar(null)}
          onConfirm={() => {
            downloadTodoReminder(offerCalendar)
            setOfferCalendar(null)
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Aufgabe löschen?"
          message={`„${todo.title}“ wird gelöscht. Direkt danach kannst du das noch rückgängig machen.`}
          confirmLabel="Löschen"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            haptic()
            setConfirmDelete(false)
            deleteTodo(id)
            onClose()
          }}
        />
      )}
    </>
  )
}
