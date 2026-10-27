import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Kind, Transaction } from '../domain/types'
import { todayISO } from '../domain/dates'
import { centsToInputString, parseEuroInput } from '../domain/money'
import { useFinance } from '../state/FinanceContext'
import { Sheet } from './Sheet'
import { SegmentedControl } from './SegmentedControl'
import { ConfirmDialog } from './ConfirmDialog'

export function TransactionForm({
  transaction,
  defaultDate,
  onClose,
}: {
  transaction?: Transaction
  defaultDate?: string
  onClose: () => void
}) {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useFinance()
  const [kind, setKind] = useState<Kind>(transaction?.kind ?? 'expense')
  const [amount, setAmount] = useState(transaction ? centsToInputString(transaction.amountCents) : '')
  const [date, setDate] = useState(transaction?.date ?? defaultDate ?? todayISO())
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [note, setNote] = useState(transaction?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const categories = data.categories.filter((c) => c.kind === kind)
  const effectiveCategory = categories.some((c) => c.id === categoryId)
    ? categoryId
    : (categories.find((c) => !c.builtIn) ?? categories[0])?.id ?? ''

  function submit(e: FormEvent) {
    e.preventDefault()
    const cents = parseEuroInput(amount)
    if (cents === null) {
      setError('Bitte einen gültigen Betrag eingeben, z. B. 12,50.')
      return
    }
    if (cents <= 0) {
      setError('Der Betrag muss größer als 0 sein.')
      return
    }
    if (!date) {
      setError('Bitte ein Datum wählen.')
      return
    }
    if (!effectiveCategory) {
      setError('Bitte eine Kategorie wählen.')
      return
    }
    const input = { kind, amountCents: cents, date, categoryId: effectiveCategory, note }
    try {
      if (transaction) updateTransaction(transaction.id, input)
      else addTransaction(input)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  return (
    <Sheet title={transaction ? 'Buchung bearbeiten' : 'Neue Buchung'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <SegmentedControl<Kind>
          label="Art der Buchung"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'expense', label: 'Ausgabe' },
            { value: 'income', label: 'Einnahme' },
          ]}
        />
        <div className="card" style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="tx-amount">Betrag</label>
            <input
              id="tx-amount"
              className="amount num"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00 €"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus={!transaction}
            />
          </div>
          <div className="field">
            <label htmlFor="tx-date">Datum</label>
            <input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="tx-cat">Kategorie</label>
            <select id="tx-cat" value={effectiveCategory} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="tx-note">Notiz</label>
            <input
              id="tx-note"
              placeholder="Optional"
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit">
          Sichern
        </button>
        {transaction && (
          <button className="btn danger" type="button" onClick={() => setConfirmDelete(true)}>
            Buchung löschen
          </button>
        )}
      </form>
      {confirmDelete && transaction && (
        <ConfirmDialog
          title="Buchung löschen?"
          message="Diese Aktion kann nicht rückgängig gemacht werden."
          confirmLabel="Löschen"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteTransaction(transaction.id)
            onClose()
          }}
        />
      )}
    </Sheet>
  )
}
