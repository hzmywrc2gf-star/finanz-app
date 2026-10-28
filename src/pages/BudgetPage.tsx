import { memo, useMemo, useState } from 'react'
import type { Category } from '../domain/types'
import { addMonths, monthLabel, monthStart, todayISO } from '../domain/dates'
import { monthBudgets } from '../domain/budget'
import type { BudgetStatus } from '../domain/budget'
import { formatCents, formatPercent } from '../domain/money'
import { useFinance } from '../state/FinanceContext'
import { BudgetForm } from '../components/BudgetForm'
import { ChevronLeft, ChevronRight } from '../components/Icons'
import { SwipePane } from '../components/SwipePane'

/** "noch 87,60 €" / "23,10 € drüber" */
const remainingText = (remainingCents: number) =>
  remainingCents >= 0 ? `noch ${formatCents(remainingCents)}` : `${formatCents(-remainingCents)} drüber`

function Progress({ percent, status, label }: { percent: number; status: BudgetStatus; label: string }) {
  return (
    <div
      className="bar-track budget-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-valuetext={`${formatPercent(percent)} verbraucht`}
      data-status={status}
    >
      <div className="bar-fill" style={{ width: `${Math.min(percent, 100)}%`, background: `var(--${status})` }} />
    </div>
  )
}

export const BudgetPage = memo(function BudgetPage() {
  const { data } = useFinance()
  const [month, setMonth] = useState(() => monthStart(todayISO()))
  const [editing, setEditing] = useState<Category | null>(null)
  const currentMonth = monthStart(todayISO())
  const { items, total, unbudgeted } = useMemo(() => monthBudgets(data, month), [data, month])
  const itemById = new Map(items.map((i) => [i.categoryId, i]))
  const spentById = new Map(unbudgeted.map((u) => [u.categoryId, u.spentCents]))
  const categories = data.categories.filter((c) => c.kind === 'expense')

  return (
    <>
      <h1 className="page-title">Budgets</h1>
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

        {items.length > 0 && (
          <div className="card card-pad budget-total" data-status={total.status}>
            <div className="bar-head">
              <span className="budget-name">Gesamt</span>
              <span className="num budget-remaining" style={{ color: `var(--${total.status}-text)` }}>
                {remainingText(total.remainingCents)}
              </span>
            </div>
            <div className="budget-amounts num">
              {formatCents(total.spentCents)} von {formatCents(total.budgetCents)}
            </div>
            <Progress percent={total.percent} status={total.status} label="Gesamtbudget" />
          </div>
        )}

        <div className="section-title">Kategorien</div>
        <ul className="list card">
          {categories.map((c) => {
            const item = itemById.get(c.id)
            return (
              <li key={c.id}>
                <button className="row budget-row" onClick={() => setEditing(c)}>
                  {item ? (
                    <span className="budget-body" data-status={item.status}>
                      <span className="bar-head">
                        <span className="budget-name">{c.name}</span>
                        <span className="num budget-amounts">
                          {formatCents(item.spentCents)} von {formatCents(item.budgetCents)}
                        </span>
                      </span>
                      <span className="bar-head budget-sub">
                        <span className="num" style={{ color: `var(--${item.status}-text)` }}>
                          {remainingText(item.remainingCents)}
                        </span>
                        <span className="num muted">{formatPercent(item.percent)}</span>
                      </span>
                      <Progress percent={item.percent} status={item.status} label={`Budget ${c.name}`} />
                    </span>
                  ) : (
                    <span className="budget-body">
                      <span className="bar-head">
                        <span className="budget-name">{c.name}</span>
                        <span className="num budget-amounts">{formatCents(spentById.get(c.id) ?? 0)}</span>
                      </span>
                      <span className="budget-sub muted">Budget festlegen</span>
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        {items.length === 0 && <div className="footnote">Tippe auf eine Kategorie, um ein Monatsbudget festzulegen.</div>}
      </SwipePane>

      {editing && (
        <BudgetForm
          key={editing.id}
          category={data.categories.find((c) => c.id === editing.id) ?? editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
})
