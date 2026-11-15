import type { DaySegment, FinanceEntry } from '../domain/calendar'
import { timeText } from '../domain/calendar'
import { formatSigned } from '../domain/money'

/**
 * The entries of one day (Apple's compact list): own events with their time and a slate bar, payments (Verträge, Rechnungen)
 * with a sand bar and the amount in red/green like everywhere else.
 */
export function DayList({
  segments,
  finance,
  onEvent,
  onFinance,
}: {
  segments: DaySegment[]
  finance: FinanceEntry[]
  onEvent: (seg: DaySegment) => void
  onFinance: (entry: FinanceEntry) => void
}) {
  if (segments.length === 0 && finance.length === 0) return <div className="cal-empty">Keine Termine</div>
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
    </ul>
  )
}
