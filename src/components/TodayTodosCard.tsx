import { useMemo } from 'react'
import type { AppData } from '../domain/types'
import { dueLabel, isOverdue, todayTodos } from '../domain/todos'
import { useFinance } from '../state/FinanceContext'
import { ChevronRight, SunIcon } from './Icons'
import { TodoCheck } from './TodoParts'

/** How many tasks the start page shows at most. */
const SHOWN = 3

/**
 * Start page card „Heute“: up to three open tasks of „Mein Tag“, due today or overdue (overdue first), each with its check.
 * Tapping a title opens the details, "Alle anzeigen" opens „Mein Tag“ in the calendar tab. Hidden without such tasks.
 */
export function TodayTodosCard({ data, today, onOpenTodo, onOpenMyDay }: { data: AppData; today: string; onOpenTodo: (id: string) => void; onOpenMyDay: () => void }) {
  const { toggleTodo } = useFinance()
  const all = useMemo(() => todayTodos(data, today), [data, today])
  if (all.length === 0) return null
  const shown = all.slice(0, SHOWN)
  const more = all.length - shown.length
  return (
    <section className="pcard tint-lav todo-today" aria-label="Heute zu erledigen">
      <div className="pcard-head">
        <h2>Heute</h2>
        <button type="button" className="todo-today-all" onClick={onOpenMyDay}>
          Alle anzeigen
          <ChevronRight />
        </button>
      </div>
      <ul className="todo-today-list">
        {shown.map((t) => {
          const sub = t.dueDate && t.dueDate <= today ? dueLabel(t.dueDate, today) : 'Mein Tag'
          return (
            <li key={t.id} className="todo-today-item">
              <TodoCheck done={false} title={t.title} onToggle={() => toggleTodo(t.id)} />
              <button type="button" className="todo-today-main" onClick={() => onOpenTodo(t.id)}>
                <span className="t">{t.title}</span>
                <span className={isOverdue(t, today) ? 's overdue-text' : 's'}>
                  {sub === 'Mein Tag' && <SunIcon size={12} />}
                  {sub}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {more > 0 && <p className="todo-today-more">+{more} {more === 1 ? 'weitere Aufgabe' : 'weitere Aufgaben'}</p>}
    </section>
  )
}
