import type { Transaction } from '../domain/types'
import { currentBalance } from '../domain/calc'
import { compareTransactionsDesc } from '../domain/calc'
import { todayISO, formatShortDay } from '../domain/dates'
import { formatCents, formatSigned } from '../domain/money'
import { recurringTitle, upcoming } from '../domain/recurring'
import { useFinance } from '../state/FinanceContext'
import { TransactionList } from '../components/TransactionList'
import { Fab } from '../components/Fab'

export function StartPage({
  onAdd,
  onEdit,
}: {
  onAdd: () => void
  onEdit: (t: Transaction) => void
}) {
  const { data } = useFinance()
  const balance = currentBalance(data)
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
