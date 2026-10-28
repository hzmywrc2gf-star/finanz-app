import type { Category, Transaction } from '../domain/types'
import { formatShortDay } from '../domain/dates'
import { formatSigned } from '../domain/money'
import { RepeatIcon } from './Icons'

/** One booking row; cash bookings get a small "Bar" badge unless `hideBadge` (cash page). */
export function TransactionRow({
  transaction: t,
  categoryName,
  hideBadge,
  onSelect,
}: {
  transaction: Transaction
  categoryName: string
  hideBadge?: boolean
  onSelect: (t: Transaction) => void
}) {
  return (
    <li>
      <button className="row" onClick={() => onSelect(t)}>
        <span
          className="dot"
          style={{ background: t.kind === 'income' ? 'var(--income)' : 'var(--expense)' }}
        />
        <span className="row-main">
          <div className="row-title">
            {categoryName}
            {t.account === 'bargeld' && !hideBadge && (
              <>
                {' '}
                <span className="badge">Bar</span>
              </>
            )}
          </div>
          <div className="row-sub">
            {formatShortDay(t.date)}
            {t.note ? ` · ${t.note}` : ''}
            {t.recurringId && <RepeatIcon />}
          </div>
        </span>
        <span className={`row-amount num ${t.kind === 'income' ? 'income-text' : 'expense-text'}`}>
          {formatSigned(t.amountCents, t.kind)}
        </span>
      </button>
    </li>
  )
}

export function TransactionList({
  transactions,
  categories,
  onSelect,
}: {
  transactions: Transaction[]
  categories: Category[]
  onSelect: (t: Transaction) => void
}) {
  const names = new Map(categories.map((c) => [c.id, c.name]))
  return (
    <ul className="list card">
      {transactions.map((t) => (
        <TransactionRow key={t.id} transaction={t} categoryName={names.get(t.categoryId) ?? 'Unbekannt'} onSelect={onSelect} />
      ))}
    </ul>
  )
}
