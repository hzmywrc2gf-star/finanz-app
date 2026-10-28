import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Transfer, TransferDirection } from '../domain/types'
import { todayISO } from '../domain/dates'
import { TRANSFER_LABELS } from '../domain/ledger'
import { centsToInputString, parseEuroInput } from '../domain/money'
import { haptic } from '../lib/haptics'
import { useFinance } from '../state/FinanceContext'
import { Sheet } from './Sheet'
import { SegmentedControl } from './SegmentedControl'
import { ConfirmDialog } from './ConfirmDialog'

/** Abhebung (Konto → Bargeld) or Einzahlung (Bargeld → Konto). */
export function TransferForm({
  transfer,
  defaultDirection = 'withdrawal',
  onClose,
}: {
  transfer?: Transfer
  defaultDirection?: TransferDirection
  onClose: () => void
}) {
  const { addTransfer, updateTransfer, deleteTransfer } = useFinance()
  const [direction, setDirection] = useState<TransferDirection>(transfer?.direction ?? defaultDirection)
  const [amount, setAmount] = useState(transfer ? centsToInputString(transfer.amountCents) : '')
  const [date, setDate] = useState(transfer?.date ?? todayISO())
  const [note, setNote] = useState(transfer?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    const cents = parseEuroInput(amount)
    if (cents === null) {
      setError('Bitte einen gültigen Betrag eingeben, z. B. 100,00.')
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
    const input = { direction, amountCents: cents, date, note }
    try {
      if (transfer) updateTransfer(transfer.id, input)
      else addTransfer(input)
      haptic()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  return (
    <Sheet title={transfer ? 'Umbuchung bearbeiten' : 'Umbuchung'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <SegmentedControl<TransferDirection>
          label="Richtung der Umbuchung"
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'withdrawal', label: TRANSFER_LABELS.withdrawal },
            { value: 'deposit', label: TRANSFER_LABELS.deposit },
          ]}
        />
        <div className="footnote">
          {direction === 'withdrawal' ? 'Vom Konto ins Bargeld.' : 'Vom Bargeld aufs Konto.'} Zählt nicht als Einnahme oder Ausgabe.
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="tr-amount">Betrag</label>
            <input
              id="tr-amount"
              className="amount num"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00 €"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus={!transfer}
            />
          </div>
          <div className="field">
            <label htmlFor="tr-date">Datum</label>
            <input id="tr-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="tr-note">Notiz</label>
            <input
              id="tr-note"
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
        {transfer && (
          <button className="btn danger" type="button" onClick={() => setConfirmDelete(true)}>
            Umbuchung löschen
          </button>
        )}
      </form>
      {confirmDelete && transfer && (
        <ConfirmDialog
          title="Umbuchung löschen?"
          message="Direkt danach kannst du das Löschen noch rückgängig machen."
          confirmLabel="Löschen"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            haptic()
            deleteTransfer(transfer.id)
            onClose()
          }}
        />
      )}
    </Sheet>
  )
}
