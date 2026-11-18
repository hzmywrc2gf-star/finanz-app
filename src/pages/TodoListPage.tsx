import { memo, useCallback, useMemo, useState } from 'react'
import type { Todo } from '../domain/types'
import { todayISO } from '../domain/dates'
import { SMART_LISTS, isSmartList, listName, myDayDate, plannedTodos, splitTodos, viewTodos } from '../domain/todos'
import type { TodoViewId } from '../domain/todos'
import { useFinance } from '../state/FinanceContext'
import { ChevronRight, MoreIcon } from '../components/Icons'
import { LargeTitleHeader } from '../components/LargeTitleHeader'
import { TodoAddBar } from '../components/TodoAddBar'
import { TodoListSheet } from '../components/TodoListSheet'
import { ListGlyph, TodoRow } from '../components/TodoParts'
import { SMART_STYLE } from '../components/todoSmartStyle'

const EMPTY: Record<string, string> = {
  myday: 'Was steht heute an? Aufgaben in „Mein Tag“ gelten nur für heute – morgen startest du mit einer leeren Liste.',
  important: 'Tippe bei einer Aufgabe auf den Stern, dann erscheint sie hier.',
  planned: 'Aufgaben mit Fälligkeitsdatum erscheinen hier, sortiert nach Tagen.',
  list: 'Noch keine Aufgaben. Unten kannst du die erste hinzufügen.',
}

/**
 * One to-do list as a sub-page of the calendar tab: large title in the list's colour („Mein Tag“ with today's date), the open
 * tasks, a foldable „Erledigt (N)“ section and the fixed entry line at the bottom. Own lists have a "…" button for name,
 * colour, symbol and deleting. „Geplant“ groups its tasks by day (Überfällig, Heute, Morgen, Diese Woche, Später).
 */
export const TodoListPage = memo(function TodoListPage({
  view,
  onBack,
  onOpenTodo,
}: {
  view: TodoViewId
  onBack: () => void
  onOpenTodo: (id: string) => void
}) {
  const { data, toggleTodo, toggleImportant, deleteTodo } = useFinance()
  const [editing, setEditing] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const today = todayISO()
  const smart = isSmartList(view)
  const list = smart ? null : data.todoLists.find((l) => l.id === view) ?? null
  const name = smart ? (SMART_LISTS.find((s) => s.id === view)?.name ?? '') : (list?.name ?? '')
  const tone = smart ? SMART_STYLE[view].color : list?.color

  const todos = useMemo(() => viewTodos(data, view, today), [data, view, today])
  const { open, done } = useMemo(() => splitTodos(todos), [todos])
  const groups = useMemo(() => (view === 'planned' ? plannedTodos(data, today) : null), [data, view, today])
  // in the smart lists every row names its list
  const listOf = useCallback((t: Todo) => (smart ? listName(data.todoLists, t.listId) : undefined), [smart, data.todoLists])

  const rows = (items: Todo[]) =>
    items.map((t) => (
      <TodoRow
        key={t.id}
        todo={t}
        today={today}
        list={listOf(t)}
        hideMyDay={view === 'myday'}
        onToggle={toggleTodo}
        onStar={toggleImportant}
        onOpen={onOpenTodo}
        onDelete={deleteTodo}
      />
    ))

  return (
    <>
      <LargeTitleHeader
        title={name}
        onBack={onBack}
        parent="To-do"
        tone={tone}
        subtitle={view === 'myday' ? myDayDate(today) : undefined}
        action={list ? { label: 'Liste bearbeiten', icon: <MoreIcon />, onClick: () => setEditing(true) } : undefined}
      />
      {groups ? (
        groups.map((g) => (
          <section key={g.id} aria-label={g.name}>
            <h2 className={g.id === 'overdue' ? 'section-title todo-group overdue-text' : 'section-title todo-group'}>{g.name}</h2>
            <ul className="list card todo-list">{rows(g.todos)}</ul>
          </section>
        ))
      ) : open.length > 0 ? (
        <ul className="list card todo-list" aria-label="Offene Aufgaben">
          {rows(open)}
        </ul>
      ) : null}
      {open.length === 0 && done.length === 0 && (!groups || groups.length === 0) && (
        <div className="todo-empty">
          <span className="menu-icon todo-tile" data-color={tone ?? 'slate'} aria-hidden="true">
            {smart ? SMART_STYLE[view].glyph(26) : list ? <ListGlyph icon={list.icon} size={26} /> : null}
          </span>
          <p>{EMPTY[smart && view !== 'tasks' ? view : 'list']}</p>
        </div>
      )}
      {open.length === 0 && done.length > 0 && <p className="todo-all-done">Alles erledigt.</p>}
      {done.length > 0 && view !== 'planned' && (
        <section className="todo-done" aria-label="Erledigt">
          <button type="button" className="todo-done-head" aria-expanded={showDone} onClick={() => setShowDone((s) => !s)}>
            <span className="todo-done-chev" aria-hidden="true">
              <ChevronRight />
            </span>
            Erledigt <span className="num">({done.length})</span>
          </button>
          {showDone && <ul className="list card todo-list">{rows(done)}</ul>}
        </section>
      )}
      {(list || smart) && <TodoAddBar view={view} />}
      {editing && list && <TodoListSheet list={list} onClose={() => setEditing(false)} onDeleted={onBack} />}
    </>
  )
})
