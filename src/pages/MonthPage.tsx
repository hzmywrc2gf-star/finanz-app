import { memo, useMemo, useState } from 'react'
import type { Transaction } from '../domain/types'
import { addMonths, monthLabel, monthShort, monthStart, todayISO } from '../domain/dates'
import { monthSummary, monthTrend, niceAxisMax } from '../domain/month'
import type { MonthPoint } from '../domain/month'
import { formatCents, formatDelta, formatPercent } from '../domain/money'
import { useFinance } from '../state/FinanceContext'
import { TransactionList } from '../components/TransactionList'
import { Fab } from '../components/Fab'
import { SwipePane } from '../components/SwipePane'
import { ChevronLeft, ChevronRight } from '../components/Icons'

/** "Oktober 2026 · Einnahmen 2.500,00 € · Ausgaben 850,00 € · Saldo 1.650,00 €" */
const pointText = (p: MonthPoint) =>
  `${monthLabel(p.month)} · Einnahmen ${formatCents(p.incomeCents)} · Ausgaben ${formatCents(p.expenseCents)} · Saldo ${formatCents(p.saldoCents)}`

/** Axis tick without decimals: 2500000 -> "25.000 €". */
const axisLabel = (cents: number) => `${Math.round(cents / 100).toLocaleString('de-DE')} €`

/** One comparison row; `upIsGood` says whether an increase is good news (income, saldo) or bad (expenses). */
function CompareRow({ label, cents, prevCents, upIsGood }: { label: string; cents: number; prevCents: number; upIsGood: boolean }) {
  const delta = cents - prevCents
  const tone = delta === 0 ? 'muted' : delta > 0 === upIsGood ? 'income-text' : 'expense-text'
  return (
    <li className="row-static">
      <span className="row-main">
        <div className="row-title">{label}</div>
        <div className="row-sub num">Vormonat {formatCents(prevCents)}</div>
      </span>
      <span className={`row-amount num ${tone}`}>
        {delta !== 0 && (
          <span className="glyph" aria-hidden="true">
            {delta > 0 ? '▲' : '▼'}
          </span>
        )}
        {formatDelta(delta)}
      </span>
    </li>
  )
}

function TrendChart({ points, selected }: { points: MonthPoint[]; selected: string }) {
  const [active, setActive] = useState<string | null>(null)
  const axisMax = niceAxisMax(Math.max(...points.flatMap((p) => [p.incomeCents, p.expenseCents])))
  const height = (cents: number) => (cents > 0 && axisMax > 0 ? `max(2px, ${(cents / axisMax) * 100}%)` : '0')
  const ticks = axisMax > 0 ? [0, axisMax / 2, axisMax] : [0]
  const activePoint = points.find((p) => p.month === active)

  return (
    <div className="card card-pad">
      <div className="legend" aria-hidden="true">
        <span><i className="swatch" style={{ background: 'var(--income)' }} />Einnahmen</span>
        <span><i className="swatch" style={{ background: 'var(--expense)' }} />Ausgaben</span>
      </div>
      <div
        className="trend"
        role="group"
        aria-label={`Einnahmen und Ausgaben pro Monat, ${monthLabel(points[0].month)} bis ${monthLabel(points[points.length - 1].month)}`}
      >
        <div className="trend-grid" aria-hidden="true">
          {ticks.map((t) => (
            <div key={t} className="trend-line" style={{ bottom: axisMax ? `${(t / axisMax) * 100}%` : 0 }}>
              <span>{axisLabel(t)}</span>
            </div>
          ))}
        </div>
        <div className="trend-cols">
          {points.map((p) => (
            <button
              key={p.month}
              className="trend-col"
              data-selected={p.month === selected}
              aria-pressed={p.month === active}
              aria-label={pointText(p)}
              onClick={() => setActive(p.month)}
              onMouseEnter={() => setActive(p.month)}
            >
              <span className="trend-bars" aria-hidden="true">
                <span className="trend-bar" style={{ height: height(p.incomeCents), background: 'var(--income)' }} />
                <span className="trend-bar" style={{ height: height(p.expenseCents), background: 'var(--expense)' }} />
              </span>
              <span className="trend-label" aria-hidden="true">{monthShort(p.month)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="callout num" role="status">
        {activePoint ? pointText(activePoint) : <span className="muted">Tippe auf einen Monat für Details.</span>}
      </div>
      <table className="trend-table num">
        <thead>
          <tr>
            <th scope="col">Monat</th>
            <th scope="col">Einnahmen</th>
            <th scope="col">Ausgaben</th>
            <th scope="col">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {[...points].reverse().map((p) => (
            <tr key={p.month} data-selected={p.month === selected}>
              <th scope="row">{monthShort(p.month)} {p.month.slice(0, 4)}</th>
              <td>{formatCents(p.incomeCents)}</td>
              <td>{formatCents(p.expenseCents)}</td>
              <td>{formatCents(p.saldoCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const MonthPage = memo(function MonthPage({
  onAdd,
  onEdit,
}: {
  onAdd: (defaultDate: string) => void
  onEdit: (t: Transaction) => void
}) {
  const { data } = useFinance()
  const [month, setMonth] = useState(() => monthStart(todayISO()))
  const currentMonth = monthStart(todayISO())
  const summary = useMemo(() => monthSummary(data, month), [data, month])
  const trend = useMemo(() => monthTrend(data, month, 6), [data, month])
  const hasTrendData = trend.some((p) => p.incomeCents > 0 || p.expenseCents > 0)
  const prevMonth = addMonths(month, -1)
  const max = summary.expenseByCategory[0]?.cents ?? 0
  const { previous } = summary

  return (
    <>
      <h1 className="page-title">Monat</h1>
      <SwipePane onStep={(step) => setMonth((m) => addMonths(m, step))}>
        <div className="week-nav">
          <button className="icon-btn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Vorheriger Monat">
            <ChevronLeft />
          </button>
          <div className="label" aria-live="polite">
            {monthLabel(month)}
          </div>
          <button className="icon-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="Nächster Monat">
            <ChevronRight />
          </button>
        </div>
        {month !== currentMonth && (
          <div className="today-row">
            <button className="pill" onClick={() => setMonth(currentMonth)}>
              Aktueller Monat
            </button>
          </div>
        )}

        {summary.transactionCount === 0 ? (
          <div className="card empty">Keine Buchungen im {monthLabel(month)}.</div>
        ) : (
          <>
            <div className="card">
              <div className="summary">
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
                  <div className={`v num ${summary.saldoCents < 0 ? 'expense-text' : 'income-text'}`}>
                    {formatCents(summary.saldoCents)}
                  </div>
                </div>
              </div>
              {(summary.savingsRate !== null || summary.recurringExpenseCents > 0) && (
                <div className="summary-extra">
                  {summary.savingsRate !== null && (
                    <div className="bar-head">
                      <span>Sparquote</span>
                      <span className="num">{formatPercent(summary.savingsRate)}</span>
                    </div>
                  )}
                  {summary.recurringExpenseCents > 0 && (
                    <div className="bar-head muted">
                      <span>davon wiederkehrend</span>
                      <span className="num">{formatCents(summary.recurringExpenseCents)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="section-title">Vergleich zum Vormonat</div>
            {previous.transactionCount === 0 ? (
              <div className="card empty">Keine Daten für {monthLabel(prevMonth)}</div>
            ) : (
              <>
                <ul className="list card">
                  <CompareRow label="Einnahmen" cents={summary.incomeCents} prevCents={previous.incomeCents} upIsGood />
                  <CompareRow label="Ausgaben" cents={summary.expenseCents} prevCents={previous.expenseCents} upIsGood={false} />
                  <CompareRow label="Saldo" cents={summary.saldoCents} prevCents={previous.saldoCents} upIsGood />
                </ul>
                <div className="footnote">ggü. {monthLabel(prevMonth)}</div>
              </>
            )}
          </>
        )}

        {hasTrendData && (
          <>
            <div className="section-title">Verlauf (6 Monate)</div>
            <TrendChart points={trend} selected={month} />
          </>
        )}

        {summary.transactionCount > 0 && (
          <>
            <div className="section-title">Ausgaben nach Kategorie</div>
            {summary.expenseByCategory.length === 0 ? (
              <div className="card empty">Keine Ausgaben in diesem Monat.</div>
            ) : (
              <ul className="list card">
                {summary.expenseByCategory.map((c) => {
                  const delta = previous.expenseCents > 0 ? c.cents - c.prevCents : 0
                  return (
                    <li key={c.categoryId} className="bar-item">
                      <div className="bar-head">
                        <span className="bar-name">
                          {c.name}{' '}
                          {delta !== 0 && (
                            <span className={`delta ${delta > 0 ? 'expense-text' : 'income-text'}`}>
                              {delta > 0 ? '▲' : '▼'} {formatCents(Math.abs(delta))}
                            </span>
                          )}
                        </span>
                        <span className="num">
                          {formatCents(c.cents)}
                          <span className="pct">{formatPercent(c.percent)}</span>
                        </span>
                      </div>
                      <div className="bar-track" role="presentation">
                        <div className="bar-fill" style={{ width: `${max ? (c.cents / max) * 100 : 0}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {summary.incomeCents > 0 && (
              <>
                <div className="section-title">Einnahmen nach Kategorie</div>
                <ul className="list card">
                  {summary.incomeByCategory.map((c) => (
                    <li key={c.categoryId} className="bar-item">
                      <div className="bar-head">
                        <span>{c.name}</span>
                        <span className="num">
                          {formatCents(c.cents)}
                          <span className="pct">{formatPercent(c.percent)}</span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {summary.topExpenses.length > 0 && (
              <>
                <div className="section-title">Größte Ausgaben</div>
                <TransactionList transactions={summary.topExpenses} categories={data.categories} onSelect={onEdit} />
              </>
            )}

            <div className="section-title">Alle Buchungen</div>
            <TransactionList transactions={summary.transactions} categories={data.categories} onSelect={onEdit} />
          </>
        )}
      </SwipePane>
      <Fab onClick={() => onAdd(month === currentMonth ? todayISO() : month)} />
    </>
  )
})
