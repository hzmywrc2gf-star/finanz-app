import { memo, useCallback, useMemo, useState } from 'react'
import type { Transaction, Transfer, TransferDirection } from '../domain/types'
import { accountBalance } from '../domain/calc'
import { ledgerEntries } from '../domain/ledger'
import { formatCents } from '../domain/money'
import { useFinance } from '../state/FinanceContext'
import { LedgerList } from '../components/LedgerList'
import { SubPageHeader } from '../components/SubPageHeader'
import { TransferForm } from '../components/TransferForm'
import type { AddPreset } from '../components/TransactionForm'

type TransferSheet = { transfer?: Transfer; direction?: TransferDirection } | null

export const CashPage = memo(function CashPage({
  onBack,
  onAdd,
  onEdit,
}: {
  onBack: () => void
  onAdd: (preset: AddPreset) => void
  onEdit: (t: Transaction) => void
}) {
  const { data } = useFinance()
  const [sheet, setSheet] = useState<TransferSheet>(null)
  const cash = accountBalance(data, 'bargeld')
  const entries = useMemo(() => ledgerEntries(data, { account: 'bargeld' }), [data])
  const selectTransfer = useCallback((transfer: Transfer) => setSheet({ transfer }), [])

  return (
    <>
      <SubPageHeader title="Bargeld" onBack={onBack} />
      <div className="card card-pad">
        <div className="balance-label">Bargeld-Bestand</div>
        <div className={`balance-value num ${cash < 0 ? 'expense-text' : ''}`} data-testid="cash-balance">
          {formatCents(cash)}
        </div>
      </div>

      <div className="action-row">
        <button onClick={() => onAdd({ defaultAccount: 'bargeld', defaultKind: 'expense' })}>Bar bezahlt</button>
        <button onClick={() => onAdd({ defaultAccount: 'bargeld', defaultKind: 'income' })}>Bar erhalten</button>
        <button onClick={() => setSheet({ direction: 'withdrawal' })}>Abhebung</button>
      </div>
      <div className="today-row">
        <button className="link-btn" onClick={() => setSheet({ direction: 'deposit' })}>
          Einzahlung aufs Konto
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="card empty">Noch keine Bargeld-Buchungen.</div>
      ) : (
        <LedgerList
          entries={entries}
          categories={data.categories}
          hideCashBadge
          onSelectTransaction={onEdit}
          onSelectTransfer={selectTransfer}
        />
      )}
      <div className="footnote">Abhebungen buchen vom Konto ins Bargeld und zählen nicht als Ausgabe.</div>

      {sheet && (
        <TransferForm
          key={sheet.transfer?.id ?? sheet.direction}
          transfer={sheet.transfer}
          defaultDirection={sheet.direction}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  )
})
