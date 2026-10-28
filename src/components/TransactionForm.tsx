import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Account, Kind, Transaction } from '../domain/types'
import type { TransactionInput } from '../state/actions'
import { todayISO } from '../domain/dates'
import { centsToInputString, parseEuroInput } from '../domain/money'
import { useFinance } from '../state/FinanceContext'
import { Sheet } from './Sheet'
import { SegmentedControl } from './SegmentedControl'
import { ConfirmDialog } from './ConfirmDialog'

/** Starting values for a new booking, chosen by the page that opens the form. */
export interface AddPreset {
  defaultDate?: string
  defaultKind?: Kind
  defaultAccount?: Account
}

/** For booking a contract's occurrence: prefilled values, own title/button and own save action (always Konto). */
export interface ContractBooking {
  title: string
  submitLabel: string
  initial: { kind: Kind; amountCents: number; date: string; categoryId: string; note?: string }
  onSubmit: (input: TransactionInput) => void
}

export function TransactionForm({
  transaction,
  defaultDate,
  defaultKind,
  defaultAccount,
  booking,
  onClose,
}: {
  transaction?: Transaction
  defaultDate?: string
  defaultKind?: Kind
  /** For new bookings: where the opener lives (cash page → 'bargeld'). Editing keeps the booking's account. */
  defaultAccount?: Account
  /** Confirm/"Jetzt buchen" mode: replaces the add/update call and hides the account switch. */
  booking?: ContractBooking
  onClose: () => void
}) {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useFinance()
  const start = booking?.initial ?? transaction
  const [kind, setKind] = useState<Kind>(start?.kind ?? defaultKind ?? 'expense')
  const [account, setAccount] = useState<Account>(transaction?.account ?? defaultAccount ?? 'konto')
  const [amount, setAmount] = useState(start ? centsToInputString(start.amountCents) : '')
  const [date, setDate] = useState(start?.date ?? defaultDate ?? todayISO())
  const [categoryId, setCategoryId] = useState(start?.categoryId ?? '')
  const [note, setNote] = useState(start?.note ?? '')
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
    const input = { kind, amountCents: cents, date, categoryId: effectiveCategory, account, note }
    try {
      if (booking) booking.onSubmit(input)
      else if (transaction) updateTransaction(transaction.id, input)
      else addTransaction(input)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  return (
    <Sheet title={booking?.title ?? (transaction ? 'Buchung bearbeiten' : 'Neue Buchung')} onClose={onClose}>
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
        {!booking && (
          <div style={{ marginTop: 12 }}>
            <SegmentedControl<Account>
              label="Konto oder Bargeld"
              value={account}
              onChange={setAccount}
              options={[
                { value: 'konto', label: 'Konto' },
                { value: 'bargeld', label: 'Bargeld' },
              ]}
            />
          </div>
        )}
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
              autoFocus={!start}
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
          {booking?.submitLabel ?? 'Sichern'}
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
