import { memo, useMemo } from 'react'
import type { Category, Transaction } from '../domain/types'
import { formatShortDay } from '../domain/dates'
import { formatSigned } from '../domain/money'
import { useFinance } from '../state/FinanceContext'
import { RepeatIcon } from './Icons'
import { SwipeRow } from './SwipeRow'

/**
 * One booking row (swipe left to delete, with undo); cash bookings get a small "Bar" badge unless `hideBadge` (cash page).
 * Memoized: with a stable `transaction` object and stable handlers a list of hundreds of rows is not re-rendered
 * when a sheet opens or one booking changes.
 */
export const TransactionRow = memo(function TransactionRow({
  transaction: t,
  categoryName,
  hideBadge,
  onSelect,
  onDelete,
}: {
  transaction: Transaction
  categoryName: string
  hideBadge?: boolean
  onSelect: (t: Transaction) => void
  onDelete: (id: string) => void
}) {
  return (
    <SwipeRow label={categoryName} onDelete={() => onDelete(t.id)}>
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
    </SwipeRow>
  )
})

export const TransactionList = memo(function TransactionList({
  transactions,
  categories,
  onSelect,
}: {
  transactions: Transaction[]
  categories: Category[]
  onSelect: (t: Transaction) => void
}) {
  const { deleteTransaction } = useFinance() // stable: the actions do not change with the data
  const names = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])
  return (
    <ul className="list card">
      {transactions.map((t) => (
        <TransactionRow
          key={t.id}
          transaction={t}
          categoryName={names.get(t.categoryId) ?? 'Unbekannt'}
          onSelect={onSelect}
          onDelete={deleteTransaction}
        />
      ))}
    </ul>
  )
})
