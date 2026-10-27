import type { Transaction } from '../domain/types'
import { currentBalance } from '../domain/calc'
import { compareTransactionsDesc } from '../domain/calc'
import { todayISO, formatShortDay } from '../domain/dates'
import { formatCents, formatPercent, formatSigned } from '../domain/money'
import { budgetAlerts } from '../domain/budget'
import { recurringTitle, upcoming } from '../domain/recurring'
import { useFinance } from '../state/FinanceContext'
import { TransactionList } from '../components/TransactionList'
import { Fab } from '../components/Fab'

export function StartPage({
  onAdd,
  onEdit,
  onOpenBudgets,
}: {
  onAdd: () => void
  onEdit: (t: Transaction) => void
  onOpenBudgets: () => void
}) {
  const { data } = useFinance()
  const balance = currentBalance(data)
  const alerts = budgetAlerts(data, todayISO())
  const due = upcoming(data, todayISO())
  const recent = [...data.transactions].sort(compareTransactionsDesc).slice(0, 8)

  return (
    <>
      <h1 className="page-title">Finanzen</h1>
      <div className="card card-pad">
        <div className="balance-label">Kontostand</div>
        <div
          className={`balance-value num ${balance < 0 ? 'expense-text' : ''}`}
          data-testid="balance"
        >
          {formatCents(balance)}
        </div>
      </div>

      {alerts.length > 0 && (
        <>
          <div className="section-title">Budgets</div>
          <button className="list card budget-alert" onClick={onOpenBudgets}>
            {alerts.map((a) => (
              <span key={a.categoryId} className="row-static budget-alert-row">
                <span className="dot" style={{ background: `var(--${a.status})` }} />
                <span className="row-main">
                  <span className="row-title">{a.name}</span>
                  <span className="row-sub" style={{ color: `var(--${a.status}-text)` }}>
                    {a.status === 'over'
                      ? `${formatPercent(a.percent)} · ${formatCents(-a.remainingCents)} drüber`
                      : `${formatPercent(a.percent)} verbraucht · noch ${formatCents(a.remainingCents)}`}
                  </span>
                </span>
              </span>
            ))}
          </button>
        </>
      )}

      {due.length > 0 && (
        <>
          <div className="section-title">Demnächst fällig</div>
          <ul className="list card">
            {due.map(({ rule, date }) => (
              <li key={`${rule.id}:${date}`}>
                <div className="row-static">
                  <span
                    className="dot"
                    style={{ background: rule.kind === 'income' ? 'var(--income)' : 'var(--expense)' }}
                  />
                  <span className="row-main">
                    <div className="row-title">{recurringTitle(rule, data.categories)}</div>
                    <div className="row-sub">{formatShortDay(date)}</div>
                  </span>
                  <span className={`row-amount num ${rule.kind === 'income' ? 'income-text' : 'expense-text'}`}>
                    {formatSigned(rule.amountCents, rule.kind)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="section-title">Letzte Buchungen</div>
      {recent.length === 0 ? (
        <div className="card empty">
          Noch keine Buchungen.
          <br />
          Tippe auf „+“, um die erste zu erfassen.
        </div>
      ) : (
        <TransactionList transactions={recent} categories={data.categories} onSelect={onEdit} />
      )}
      <Fab onClick={onAdd} />
    </>
  )
}
