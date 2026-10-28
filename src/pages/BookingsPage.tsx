import { memo, useMemo, useState } from 'react'
import type { Transaction, Transfer } from '../domain/types'
import { ledgerEntries } from '../domain/ledger'
import { useFinance } from '../state/FinanceContext'
import { Fab } from '../components/Fab'
import { ClearIcon, SearchIcon } from '../components/Icons'
import { LedgerList } from '../components/LedgerList'
import { SubPageHeader } from '../components/SubPageHeader'
import { TransferForm } from '../components/TransferForm'

/** All bookings and transfers, newest first, grouped by month, with search. */
export const BookingsPage = memo(function BookingsPage({
  onBack,
  onAdd,
  onEdit,
}: {
  onBack: () => void
  onAdd: () => void
  onEdit: (t: Transaction) => void
}) {
  const { data } = useFinance()
  const [query, setQuery] = useState('')
  const [transfer, setTransfer] = useState<Transfer | null>(null)
  const entries = useMemo(() => ledgerEntries(data, { query }), [data, query])
  const searching = query.trim() !== ''

  return (
    <>
      <SubPageHeader title="Alle Buchungen" onBack={onBack} />
      <div className="search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Suchen"
          aria-label="Suchen"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="search-clear" aria-label="Suche löschen" onClick={() => setQuery('')}>
            <ClearIcon />
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="card empty">
          {searching ? (
            'Keine Treffer'
          ) : (
            <>
              Noch keine Buchungen.
              <br />
              Tippe auf „+“, um die erste zu erfassen.
            </>
          )}
        </div>
      ) : (
        <LedgerList
          entries={entries}
          categories={data.categories}
          onSelectTransaction={onEdit}
          onSelectTransfer={setTransfer}
        />
      )}
      <Fab onClick={onAdd} />
      {transfer && <TransferForm key={transfer.id} transfer={transfer} onClose={() => setTransfer(null)} />}
    </>
  )
})
