import type { Transaction } from '../domain/types'
import { currentBalance } from '../domain/calc'
import { compareTransactionsDesc } from '../domain/calc'
import { formatCents } from '../domain/money'
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
