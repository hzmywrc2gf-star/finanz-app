import type { Category, Transaction, Transfer } from '../domain/types'
import { formatShortDay, monthLabel } from '../domain/dates'
import { TRANSFER_LABELS, groupByMonth } from '../domain/ledger'
import type { LedgerEntry } from '../domain/ledger'
import { formatCents } from '../domain/money'
import { SwapIcon } from './Icons'
import { useFinance } from '../state/FinanceContext'
import { SwipeRow } from './SwipeRow'
import { TransactionRow } from './TransactionList'

function TransferRow({ transfer: t, onSelect }: { transfer: Transfer; onSelect: (t: Transfer) => void }) {
  const { deleteTransfer } = useFinance()
  return (
    <SwipeRow label={TRANSFER_LABELS[t.direction]} onDelete={() => deleteTransfer(t.id)}>
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
}

/** Bookings and transfers grouped by month ("Oktober 2026 · 8 Einträge"), newest first. */
export function LedgerList({
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
  const names = new Map(categories.map((c) => [c.id, c.name]))
  return (
    <>
      {groupByMonth(entries).map((g) => (
        <section key={g.month}>
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
                />
              ) : (
                <TransferRow key={e.transfer.id} transfer={e.transfer} onSelect={onSelectTransfer} />
              ),
            )}
          </ul>
        </section>
      ))}
    </>
  )
}
