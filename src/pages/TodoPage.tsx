import { memo, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { TodoColor } from '../domain/types'
import { todayISO } from '../domain/dates'
import { SMART_LISTS, openCounts, sortedLists } from '../domain/todos'
import type { TodoViewId } from '../domain/todos'
import { useFinance } from '../state/FinanceContext'
import { CalendarModeSwitch } from '../components/CalendarModeSwitch'
import type { CalendarMode } from '../components/CalendarModeSwitch'
import { ChevronRight, PlusIcon } from '../components/Icons'
import { LargeTitleHeader } from '../components/LargeTitleHeader'
import { ListGlyph, ListTile } from '../components/TodoParts'
import { SMART_STYLE } from '../components/todoSmartStyle'
import { TodoListSheet } from '../components/TodoListSheet'

function ListRow({ color, glyph, name, count, onClick }: { color: TodoColor; glyph: ReactNode; name: string; count: number; onClick: () => void }) {
  return (
    <li>
      <button type="button" className="row menu-row todo-list-row" onClick={onClick} aria-label={`${name}, ${count === 1 ? '1 offene Aufgabe' : `${count} offene Aufgaben`}`}>
        <ListTile color={color}>{glyph}</ListTile>
        <span className="row-main row-title">{name}</span>
        <span className="row-value num">{count > 0 ? count : ''}</span>
        <span className="chev">
          <ChevronRight />
        </span>
      </button>
    </li>
  )
}

/**
 * To-do overview (the calendar tab in "To-do" mode): the smart lists „Mein Tag“, „Wichtig“, „Geplant“, „Aufgaben“ with their
 * open counts, below them „Meine Listen“ and "Neue Liste" (name, colour, symbol). Each row opens the list as a sub-page.
 */
export const TodoPage = memo(function TodoPage({
  onMode,
  onOpenList,
}: {
  onMode: (mode: CalendarMode) => void
  onOpenList: (view: TodoViewId) => void
}) {
  const { data } = useFinance()
  const [creating, setCreating] = useState(false)
  const today = todayISO()
  const counts = useMemo(() => openCounts(data, today), [data, today])
  const lists = useMemo(() => sortedLists(data.todoLists), [data.todoLists])

  return (
    <>
      <LargeTitleHeader title="To-do" />
      <CalendarModeSwitch value="todo" onChange={onMode} />
      <ul className="list card settings-list todo-smart" aria-label="Intelligente Listen">
        {SMART_LISTS.map((s) => (
          <ListRow key={s.id} color={SMART_STYLE[s.id].color} glyph={SMART_STYLE[s.id].glyph()} name={s.name} count={counts.get(s.id) ?? 0} onClick={() => onOpenList(s.id)} />
        ))}
      </ul>
      <h2 className="section-title">Meine Listen</h2>
      {lists.length > 0 ? (
        <ul className="list card settings-list todo-own" aria-label="Meine Listen">
          {lists.map((l) => (
            <ListRow key={l.id} color={l.color} glyph={<ListGlyph icon={l.icon} />} name={l.name} count={counts.get(l.id) ?? 0} onClick={() => onOpenList(l.id)} />
          ))}
        </ul>
      ) : (
        <p className="footnote todo-lists-empty">Eigene Listen sammeln, was zusammengehört – zum Beispiel Einkäufe, Haushalt oder ein Projekt.</p>
      )}
      <button type="button" className="btn secondary todo-new-list" onClick={() => setCreating(true)}>
        <PlusIcon /> Neue Liste
      </button>
      {creating && <TodoListSheet onClose={() => setCreating(false)} onCreated={onOpenList} />}
    </>
  )
})
