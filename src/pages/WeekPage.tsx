import { useMemo, useState } from 'react'
import type { Transaction } from '../domain/types'
import { addWeeks, startOfWeek, todayISO, weekLabel } from '../domain/dates'
import { weekSummary } from '../domain/calc'
import { formatCents, formatPercent } from '../domain/money'
import { useFinance } from '../state/FinanceContext'
import { TransactionList } from '../components/TransactionList'
import { Fab } from '../components/Fab'
import { ChevronLeft, ChevronRight } from '../components/Icons'

export function WeekPage({
  onAdd,
  onEdit,
}: {
  onAdd: (defaultDate: string) => void
  onEdit: (t: Transaction) => void
}) {
  const { data } = useFinance()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayISO()))
  const currentWeek = startOfWeek(todayISO())
  const summary = useMemo(
    () => weekSummary(data.transactions, data.categories, weekStart),
    [data.transactions, data.categories, weekStart],
  )
  const max = summary.byCategory[0]?.cents ?? 0

  return (
    <>
      <h1 className="page-title">Woche</h1>
      <div className="week-nav">
        <button className="icon-btn" onClick={() => setWeekStart(addWeeks(weekStart, -1))} aria-label="Vorherige Woche">
          <ChevronLeft />
        </button>
        <div className="label" aria-live="polite">
          {weekLabel(weekStart)}
        </div>
        <button className="icon-btn" onClick={() => setWeekStart(addWeeks(weekStart, 1))} aria-label="Nächste Woche">
          <ChevronRight />
        </button>
      </div>
      {weekStart !== currentWeek && (
        <div className="today-row">
          <button className="pill" onClick={() => setWeekStart(currentWeek)}>
            Heute
          </button>
        </div>
      )}

      <div className="card summary">
        <div>
          <div className="k">Einnahmen</div>
          <div className="v num income-text">{formatCents(summary.incomeCents)}</div>
        </div>
        <div>
          <div className="k">Ausgaben</div>
          <div className="v num expense-text">{formatCents(summary.expenseCents)}</div>
        </div>
        <div>
          <div className="k">Saldo</div>
          <div className={`v num ${summary.saldoCents < 0 ? 'expense-text' : summary.saldoCents > 0 ? 'income-text' : ''}`}>
            {formatCents(summary.saldoCents)}
          </div>
        </div>
      </div>

      <div className="section-title">Ausgaben nach Kategorie</div>
      {summary.byCategory.length === 0 ? (
        <div className="card empty">Keine Ausgaben in dieser Woche.</div>
      ) : (
        <ul className="list card">
          {summary.byCategory.map((c) => (
            <li key={c.categoryId} className="bar-item">
              <div className="bar-head">
                <span>{c.name}</span>
                <span className="num">
                  {formatCents(c.cents)}
                  <span className="pct">{formatPercent(c.percent)}</span>
                </span>
              </div>
              <div className="bar-track" role="presentation">
                <div className="bar-fill" style={{ width: `${max ? (c.cents / max) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="section-title">Buchungen</div>
      {summary.transactions.length === 0 ? (
        <div className="card empty">Keine Buchungen in dieser Woche.</div>
      ) : (
        <TransactionList transactions={summary.transactions} categories={data.categories} onSelect={onEdit} />
      )}
      <Fab onClick={() => onAdd(weekStart === currentWeek ? todayISO() : weekStart)} />
    </>
  )
}
