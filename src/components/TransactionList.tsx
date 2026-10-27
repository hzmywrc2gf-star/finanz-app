import type { Category, Transaction } from '../domain/types'
import { formatShortDay } from '../domain/dates'
import { formatSigned } from '../domain/money'
import { RepeatIcon } from './Icons'

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
        <li key={t.id}>
          <button className="row" onClick={() => onSelect(t)}>
            <span
              className="dot"
              style={{ background: t.kind === 'income' ? 'var(--income)' : 'var(--expense)' }}
            />
            <span className="row-main">
              <div className="row-title">{names.get(t.categoryId) ?? 'Unbekannt'}</div>
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
      ))}
    </ul>
  )
}
