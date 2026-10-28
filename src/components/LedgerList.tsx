import { memo, useMemo } from 'react'
import type { Category, Transaction, Transfer } from '../domain/types'
import { formatShortDay, monthLabel } from '../domain/dates'
import { TRANSFER_LABELS, groupByMonth } from '../domain/ledger'
import type { LedgerEntry } from '../domain/ledger'
import { formatCents } from '../domain/money'
import { SwapIcon } from './Icons'
import { useFinance } from '../state/FinanceContext'
import { SwipeRow } from './SwipeRow'
import { TransactionRow } from './TransactionList'

/** Row and month header heights (px), only used to estimate the height of months that are not rendered yet. */
const ROW_PX = 56
const MONTH_HEAD_PX = 28
/** From this many entries on, months outside the screen are skipped by the renderer (short lists render completely, which keeps text search simple). */
const LONG_LIST = 60

/** Memoized like `TransactionRow`: stable `transfer` and handlers keep it out of unrelated re-renders. */
const TransferRow = memo(function TransferRow({
  transfer: t,
  onSelect,
  onDelete,
}: {
  transfer: Transfer
  onSelect: (t: Transfer) => void
  onDelete: (id: string) => void
}) {
  return (
    <SwipeRow label={TRANSFER_LABELS[t.direction]} onDelete={() => onDelete(t.id)}>
      <button className="row" onClick={() => onSelect(t)}>
        <span className="transfer-icon">
          <SwapIcon />
        </span>
        <span className="row-main">
          <div className="row-title">{TRANSFER_LABELS[t.direction]}</div>
          <div className="row-sub">
            {formatShortDay(t.date)} · {t.direction === 'withdrawal' ? 'Konto → Bargeld' : 'Bargeld → Konto'}
            {t.note ? ` · ${t.note}` : ''}
          </div>
        </span>
        <span className="row-amount num">{formatCents(t.amountCents)}</span>
      </button>
    </SwipeRow>
  )
})

/** Bookings and transfers grouped by month ("Oktober 2026 · 8 Einträge"), newest first. */
export const LedgerList = memo(function LedgerList({
  entries,
  categories,
  hideCashBadge,
  onSelectTransaction,
  onSelectTransfer,
}: {
  entries: LedgerEntry[]
  categories: Category[]
  hideCashBadge?: boolean
  onSelectTransaction: (t: Transaction) => void
  onSelectTransfer: (t: Transfer) => void
}) {
  const { deleteTransaction, deleteTransfer } = useFinance() // stable: the actions do not change with the data
  const names = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])
  const groups = useMemo(() => groupByMonth(entries), [entries])
  const long = entries.length > LONG_LIST
  return (
    <>
      {groups.map((g) => (
        // in a long list, off-screen months are not styled, laid out or painted (content-visibility); the estimated height keeps the scroll bar steady
        <section
          key={g.month}
          className={long ? 'ledger-month ledger-skip' : 'ledger-month'}
          style={long ? { containIntrinsicSize: `auto ${MONTH_HEAD_PX + g.entries.length * ROW_PX}px` } : undefined}
        >
          <div className="month-head">
            <h2>{monthLabel(g.month)}</h2>
            <span>
              {g.entries.length} {g.entries.length === 1 ? 'Eintrag' : 'Einträge'}
            </span>
          </div>
          <ul className="list card">
            {g.entries.map((e) =>
              e.type === 'transaction' ? (
                <TransactionRow
                  key={e.transaction.id}
                  transaction={e.transaction}
                  categoryName={names.get(e.transaction.categoryId) ?? 'Unbekannt'}
                  hideBadge={hideCashBadge}
                  onSelect={onSelectTransaction}
                  onDelete={deleteTransaction}
                />
              ) : (
                <TransferRow key={e.transfer.id} transfer={e.transfer} onSelect={onSelectTransfer} onDelete={deleteTransfer} />
              ),
            )}
          </ul>
        </section>
      ))}
    </>
  )
})
