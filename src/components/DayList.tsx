import type { DaySegment, FinanceEntry } from '../domain/calendar'
import { timeText } from '../domain/calendar'
import { formatSigned } from '../domain/money'
import type { Todo } from '../domain/types'
import { listName } from '../domain/todos'
import { useFinance } from '../state/FinanceContext'
import { TodoCheck } from './TodoParts'

/**
 * The entries of one day (Apple's compact list): own events with their time and a slate bar, payments (Verträge, Rechnungen)
 * with a sand bar and the amount in red/green like everywhere else, open tasks due that day with their round check (tick off
 * right here; tap the row for the details).
 */
export function DayList({
  segments,
  finance,
  todos = [],
  onEvent,
  onFinance,
  onTodo,
}: {
  segments: DaySegment[]
  finance: FinanceEntry[]
  todos?: Todo[]
  onEvent: (seg: DaySegment) => void
  onFinance: (entry: FinanceEntry) => void
  onTodo?: (id: string) => void
}) {
  const { data, toggleTodo } = useFinance()
  if (segments.length === 0 && finance.length === 0 && todos.length === 0) return <div className="cal-empty">Keine Termine</div>
  return (
    <ul className="cal-list">
      {segments.map((seg) => (
        <li key={seg.occ.key}>
          <button type="button" className="cal-item" data-testid="cal-event" onClick={() => onEvent(seg)}>
            <span className="cal-bar" aria-hidden="true" />
            <span className="cal-time num">{timeText(seg)}</span>
            <span className="cal-main">
              <span className="cal-name">{seg.occ.event.title}</span>
              {seg.occ.event.location && <span className="cal-sub">{seg.occ.event.location}</span>}
            </span>
          </button>
        </li>
      ))}
      {finance.map((f) => (
        <li key={f.key}>
          <button type="button" className="cal-item fin" data-testid="cal-finance" onClick={() => onFinance(f)}>
            <span className="cal-bar" aria-hidden="true" />
            <span className="cal-time">{f.type === 'invoice' ? 'Rechnung' : 'Vertrag'}</span>
            <span className="cal-main">
              <span className="cal-name">{f.title}</span>
            </span>
            <span className={`cal-amt num ${f.flow === 'income' ? 'income-text' : 'expense-text'}`}>
              {formatSigned(f.amountCents, f.flow)}
            </span>
          </button>
        </li>
      ))}
      {todos.map((t) => (
        <li key={t.id} className="cal-todo" data-testid="cal-todo">
          <TodoCheck done={t.done} title={t.title} onToggle={() => toggleTodo(t.id)} />
          <button type="button" className="cal-item todo" onClick={() => onTodo?.(t.id)}>
            <span className="cal-main">
              <span className="cal-name">{t.title}</span>
              <span className="cal-sub">Aufgabe · {listName(data.todoLists, t.listId)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
