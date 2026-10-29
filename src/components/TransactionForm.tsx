import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Account, Invoice, Kind, Transaction } from '../domain/types'
import type { TransactionInput } from '../state/actions'
import { formatDayMonth, todayISO } from '../domain/dates'
import { defaultDueDate, invoiceReminderDate, invoiceTitle } from '../domain/invoices'
import { centsToInputString, parseEuroInput } from '../domain/money'
import { haptic } from '../lib/haptics'
import { downloadInvoiceReminder } from '../lib/invoiceCalendar'
import { useFinance } from '../state/FinanceContext'
import { Sheet } from './Sheet'
import { SegmentedControl } from './SegmentedControl'
import { Switch } from './Switch'
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
  const { data, addTransaction, updateTransaction, deleteTransaction, addInvoice } = useFinance()
  const start = booking?.initial ?? transaction
  const [kind, setKind] = useState<Kind>(start?.kind ?? defaultKind ?? 'expense')
  const [account, setAccount] = useState<Account>(transaction?.account ?? defaultAccount ?? 'konto')
  const [amount, setAmount] = useState(start ? centsToInputString(start.amountCents) : '')
  const [date, setDate] = useState(start?.date ?? defaultDate ?? todayISO())
  const [categoryId, setCategoryId] = useState(start?.categoryId ?? '')
  const [note, setNote] = useState(start?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Kauf auf Rechnung: only for new expenses; "Zahlen bis" follows the purchase date until it is edited
  const [onInvoice, setOnInvoice] = useState(false)
  const [dueEdited, setDueEdited] = useState<string | null>(null)
  const [offer, setOffer] = useState<Invoice | null>(null)
  const canInvoice = !transaction && !booking && kind === 'expense'
  const invoiceMode = canInvoice && onInvoice
  const due = dueEdited ?? (date ? defaultDueDate(date) : '')

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
    if (invoiceMode) {
      if (!due) {
        setError('Bitte „Zahlen bis“ wählen.')
        return
      }
      if (due < date) {
        setError('‚Zahlen bis‘ darf nicht vor dem Kaufdatum liegen.')
        return
      }
      try {
        const inv = addInvoice({ amountCents: cents, note, categoryId: effectiveCategory, purchaseDate: date, dueDate: due })
        haptic()
        // a reminder in the past would be useless in the calendar; the start page asks right away anyway
        if (invoiceReminderDate(inv) >= todayISO()) setOffer(inv)
        else onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
      }
      return
    }
    const input = { kind, amountCents: cents, date, categoryId: effectiveCategory, account, note }
    try {
      if (booking) booking.onSubmit(input)
      else if (transaction) updateTransaction(transaction.id, input)
      else addTransaction(input)
      haptic()
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
        {!booking && !invoiceMode && (
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
          {canInvoice && (
            <div className="field switch-row">
              <label htmlFor="tx-invoice">Auf Rechnung</label>
              <Switch id="tx-invoice" checked={onInvoice} onChange={setOnInvoice} />
            </div>
          )}
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
            <label htmlFor="tx-date">{invoiceMode ? 'Kaufdatum' : 'Datum'}</label>
            <input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {invoiceMode && (
            <div className="field">
              <label htmlFor="tx-due">Zahlen bis</label>
              <input id="tx-due" type="date" value={due} onChange={(e) => setDueEdited(e.target.value)} />
            </div>
          )}
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
            <label htmlFor="tx-note">{invoiceMode ? 'Händler' : 'Notiz'}</label>
            <input
              id="tx-note"
              placeholder="Optional"
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        {invoiceMode && (
          <div className="footnote">
            Du wirst 3 Tage vor ‚Zahlen bis‘ gefragt, ob es beim Betrag geblieben ist. Der Kontostand ändert sich erst beim Bezahlen.
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit">
          {booking?.submitLabel ?? (invoiceMode ? 'Rechnung sichern' : 'Sichern')}
        </button>
        {transaction && (
          <button className="btn danger" type="button" onClick={() => setConfirmDelete(true)}>
            Buchung löschen
          </button>
        )}
      </form>
      {offer && (
        <ConfirmDialog
          title="In den Kalender eintragen?"
          message={`Erinnerung am ${formatDayMonth(invoiceReminderDate(offer))} (3 Tage vor ‚Zahlen bis‘).`}
          confirmLabel="Eintragen"
          cancelLabel="Nein"
          onCancel={onClose}
          onConfirm={() => {
            downloadInvoiceReminder(offer, invoiceTitle(offer, data.categories))
            onClose()
          }}
        />
      )}
      {confirmDelete && transaction && (
        <ConfirmDialog
          title="Buchung löschen?"
          message="Direkt danach kannst du das Löschen noch rückgängig machen."
          confirmLabel="Löschen"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            haptic()
            deleteTransaction(transaction.id)
            onClose()
          }}
        />
      )}
    </Sheet>
  )
}
