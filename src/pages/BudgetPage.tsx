import { memo, useMemo, useState } from 'react'
import type { Category } from '../domain/types'
import { addMonths, monthLabel, monthStart, todayISO } from '../domain/dates'
import { monthBudgets } from '../domain/budget'
import { formatCents, formatPercent } from '../domain/money'
import { useFinance } from '../state/FinanceContext'
import { BudgetBar } from '../components/BudgetBar'
import { BudgetForm } from '../components/BudgetForm'
import { ChevronLeft, ChevronRight } from '../components/Icons'
import { SwipePane } from '../components/SwipePane'

/** "noch 87,60 €" / "23,10 € drüber" */
const remainingText = (remainingCents: number) =>
  remainingCents >= 0 ? `noch ${formatCents(remainingCents)}` : `${formatCents(-remainingCents)} drüber`

const TINTS = ['lav', 'mist', 'sand', 'sky'] as const

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
        <div className="month-switch">
          <button className="round-btn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Vorheriger Monat">
            <ChevronLeft />
          </button>
          <div className="month-pill" aria-live="polite">
            {monthLabel(month)}
          </div>
          <button className="round-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="Nächster Monat">
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
          <section className="budget-card total tint-sky" aria-label="Gesamt" data-status={total.status}>
            <div className="budget-top">
              <span className="budget-name">Gesamt</span>
              <span className={`budget-pct num c-${total.status}`}>{formatPercent(total.percent)}</span>
            </div>
            <div className="budget-amounts num">
              {formatCents(total.spentCents)} von {formatCents(total.budgetCents)}
            </div>
            <BudgetBar percent={total.percent} status={total.status} label="Gesamtbudget" />
            <div className={`budget-note num c-${total.status}`}>{remainingText(total.remainingCents)}</div>
          </section>
        )}

        <div className="cat-title">Kategorien</div>
        {categories.map((c, i) => {
          const item = itemById.get(c.id)
          const tint = `tint-${TINTS[i % TINTS.length]}`
          return item ? (
            <button key={c.id} className={`budget-card ${tint}`} data-status={item.status} onClick={() => setEditing(c)}>
              <span className="budget-top">
                <span>
                  <span className="budget-name" style={{ display: 'block' }}>{c.name}</span>
                  <span className="budget-amounts num" style={{ display: 'block' }}>
                    {formatCents(item.spentCents)} von {formatCents(item.budgetCents)}
                  </span>
                </span>
                <span className={`budget-pct num c-${item.status}`}>{formatPercent(item.percent)}</span>
              </span>
              <BudgetBar percent={item.percent} status={item.status} label={`Budget ${c.name}`} />
              <span className={`budget-note num c-${item.status}`} style={{ display: 'block' }}>
                {remainingText(item.remainingCents)}
              </span>
            </button>
          ) : (
            <button key={c.id} className={`budget-card ${tint}`} onClick={() => setEditing(c)}>
              <span className="budget-top">
                <span className="budget-name">{c.name}</span>
                <span className="budget-amounts num">{formatCents(spentById.get(c.id) ?? 0)}</span>
              </span>
              <span className="budget-empty" style={{ display: 'block' }}>Budget festlegen</span>
            </button>
          )
        })}
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
