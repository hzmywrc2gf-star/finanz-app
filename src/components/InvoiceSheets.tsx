import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Invoice } from '../domain/types'
import { accountBalance } from '../domain/calc'
import { formatDayMonth, todayISO } from '../domain/dates'
import { dueText, invoiceReminderDate, invoiceTitle, isOverdue, openInvoicesTotal, sortInvoices } from '../domain/invoices'
import { centsToInputString, formatCents, parseEuroInput } from '../domain/money'
import { downloadInvoiceReminder } from '../lib/invoiceCalendar'
import { haptic } from '../lib/haptics'
import { useFinance } from '../state/FinanceContext'
import { ConfirmDialog } from './ConfirmDialog'
import { ReceiptIcon } from './Icons'
import { Sheet } from './Sheet'

/** Which step of an invoice is open: pay it, change the amount (partial return) or return it completely. */
export type InvoiceFlow = { type: 'pay' | 'amount' | 'return'; invoice: Invoice }

/** The sheets and the dialog behind "Bezahlt", "Betrag ändern" and "Zurückgeschickt". */
export function InvoiceFlowDialogs({ flow, onClose }: { flow: InvoiceFlow | null; onClose: () => void }) {
  const { data, returnInvoice } = useFinance()
  if (!flow) return null
  const { invoice } = flow
  if (flow.type === 'pay') return <PayInvoiceSheet invoice={invoice} onClose={onClose} />
  if (flow.type === 'amount') return <InvoiceAmountSheet invoice={invoice} onClose={onClose} />
  return (
    <ConfirmDialog
      title="Komplett zurückgeschickt?"
      message={`„${invoiceTitle(invoice, data.categories)}“ wird entfernt, es wird nichts gebucht. Direkt danach kannst du das noch rückgängig machen.`}
      confirmLabel="Zurückgeschickt"
      onCancel={onClose}
      onConfirm={() => {
        haptic()
        returnInvoice(invoice.id)
        onClose()
      }}
    />
  )
}

function PayInvoiceSheet({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { data, payInvoice } = useFinance()
  const [amount, setAmount] = useState(centsToInputString(invoice.amountCents))
  const [paidDate, setPaidDate] = useState(() => todayISO())
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const cents = parseEuroInput(amount)
    if (cents === null) return setError('Bitte einen gültigen Betrag eingeben, z. B. 12,50.')
    if (cents <= 0) return setError('Der Betrag muss größer als 0 sein.')
    if (!paidDate) return setError('Bitte ein Zahlungsdatum wählen.')
    try {
      payInvoice(invoice.id, { paidDate, amountCents: cents })
      haptic()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  return (
    <Sheet title="Rechnung bezahlt" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="inv-lead">{invoiceTitle(invoice, data.categories)}</p>
        <div className="card">
          <div className="field">
            <label htmlFor="pay-amount">Betrag</label>
            <input
              id="pay-amount"
              className="amount num"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pay-date">Zahlungsdatum</label>
            <input id="pay-date" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
          </div>
        </div>
        <div className="footnote">Der Betrag wird als Ausgabe vom Konto gebucht.</div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit">
          Bezahlt buchen
        </button>
      </form>
    </Sheet>
  )
}

function InvoiceAmountSheet({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { data, changeInvoiceAmount } = useFinance()
  const [amount, setAmount] = useState(centsToInputString(invoice.amountCents))
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const cents = parseEuroInput(amount)
    if (cents === null) return setError('Bitte einen gültigen Betrag eingeben, z. B. 12,50.')
    if (cents <= 0) return setError('Der Betrag muss größer als 0 sein.')
    try {
      changeInvoiceAmount(invoice.id, cents)
      haptic()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  return (
    <Sheet title="Betrag ändern" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="inv-lead">{invoiceTitle(invoice, data.categories)}</p>
        <div className="card wide-labels">
          <div className="field">
            <label htmlFor="amt-amount">Neuer Betrag</label>
            <input
              id="amt-amount"
              className="amount num"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="footnote">Zum Beispiel nach einer Teilrücksendung. Die Rechnung bleibt offen.</div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit">
          Betrag speichern
        </button>
      </form>
    </Sheet>
  )
}

/** All open invoices with their sum and what is left of the Konto after paying them. */
export function InvoiceListSheet({ onClose }: { onClose: () => void }) {
  const { data } = useFinance()
  const [today] = useState(() => todayISO())
  const [openId, setOpenId] = useState<string | null>(null)
  const list = sortInvoices(data.invoices)
  const total = openInvoicesTotal(data)
  const available = accountBalance(data, 'konto') - total

  return (
    <>
      <Sheet title="Offene Rechnungen" onClose={onClose}>
        {list.length === 0 ? (
          <div className="empty">Keine offenen Rechnungen.</div>
        ) : (
          <>
            <section className="pcard tint-mist inv-sum" aria-label="Summe">
              <div className="inv-sum-row">
                <span>Offen</span>
                <b className="num" data-testid="invoices-total">{formatCents(total)}</b>
              </div>
              <div className="inv-sum-row">
                <span>Verfügbar nach Rechnungen</span>
                <b className={`num ${available < 0 ? 'expense-text' : ''}`} data-testid="invoices-available">{formatCents(available)}</b>
              </div>
            </section>
            <section className="card pcard plain inv-list" aria-label="Rechnungen">
              {list.map((inv) => {
                const title = invoiceTitle(inv, data.categories)
                return (
                  <button key={inv.id} className="prow inv-row" aria-label={`Rechnung öffnen: ${title}`} onClick={() => setOpenId(inv.id)}>
                    <span className="pico">
                      <ReceiptIcon />
                    </span>
                    <span className="pmain">
                      <div className="t">{title}</div>
                      <div className={isOverdue(inv, today) ? 's overdue-text' : 's'}>{dueText(inv, today)}</div>
                    </span>
                    <span className="pamt num expense-text">{`−${formatCents(inv.amountCents)}`}</span>
                  </button>
                )
              })}
            </section>
          </>
        )}
      </Sheet>
      {openId && data.invoices.some((i) => i.id === openId) && <InvoiceDetailSheet id={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}

function InvoiceDetailSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, updateInvoice, deleteInvoice } = useFinance()
  const invoice = data.invoices.find((i) => i.id === id)
  const [amount, setAmount] = useState(() => centsToInputString(invoice?.amountCents ?? 0))
  const [purchase, setPurchase] = useState(invoice?.purchaseDate ?? '')
  const [due, setDue] = useState(invoice?.dueDate ?? '')
  const [categoryId, setCategoryId] = useState(invoice?.categoryId ?? '')
  const [note, setNote] = useState(invoice?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [flow, setFlow] = useState<InvoiceFlow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [calendarDone, setCalendarDone] = useState(false)

  if (!invoice) return null
  const categories = data.categories.filter((c) => c.kind === 'expense')

  function submit(e: FormEvent) {
    e.preventDefault()
    const cents = parseEuroInput(amount)
    if (cents === null) return setError('Bitte einen gültigen Betrag eingeben, z. B. 12,50.')
    if (cents <= 0) return setError('Der Betrag muss größer als 0 sein.')
    if (!purchase) return setError('Bitte ein Kaufdatum wählen.')
    if (!due) return setError('Bitte „Zahlen bis“ wählen.')
    if (due < purchase) return setError('‚Zahlen bis‘ darf nicht vor dem Kaufdatum liegen.')
    try {
      updateInvoice(id, { amountCents: cents, note, categoryId, purchaseDate: purchase, dueDate: due })
      haptic()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  return (
    <>
      <Sheet title="Rechnung" onClose={onClose}>
        <form onSubmit={submit} noValidate>
          <div className="card">
            <div className="field">
              <label htmlFor="inv-amount">Betrag</label>
              <input id="inv-amount" className="amount num" inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="inv-purchase">Kaufdatum</label>
              <input id="inv-purchase" type="date" value={purchase} onChange={(e) => setPurchase(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="inv-due">Zahlen bis</label>
              <input id="inv-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="inv-cat">Kategorie</label>
              <select id="inv-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="inv-note">Händler</label>
              <input id="inv-note" placeholder="Optional" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
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
          <div className="pactions inv-detail-actions">
            <button className="pbtn" type="button" onClick={() => setFlow({ type: 'pay', invoice })}>
              Bezahlt
            </button>
            <button className="pbtn soft" type="button" onClick={() => setFlow({ type: 'return', invoice })}>
              Zurückgeschickt
            </button>
          </div>
          <button
            className="btn secondary inv-calendar"
            type="button"
            onClick={() => {
              downloadInvoiceReminder(invoice, invoiceTitle(invoice, data.categories))
              setCalendarDone(true)
            }}
          >
            In den Kalender eintragen
          </button>
          <div className="footnote" role={calendarDone ? 'status' : undefined}>
            {calendarDone
              ? 'Die Kalenderdatei wurde geladen. Öffne sie, um die Erinnerung zu speichern.'
              : `Erinnerung am ${formatDayMonth(invoiceReminderDate(invoice))} (3 Tage vor ‚Zahlen bis‘).`}
          </div>
          <button className="btn danger" type="button" onClick={() => setConfirmDelete(true)}>
            Rechnung löschen
          </button>
        </form>
        {confirmDelete && (
          <ConfirmDialog
            title="Rechnung löschen?"
            message="Es wird nichts gebucht. Direkt danach kannst du das noch rückgängig machen."
            confirmLabel="Löschen"
            danger
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() => {
              haptic()
              deleteInvoice(invoice.id)
              onClose()
            }}
          />
        )}
      </Sheet>
      <InvoiceFlowDialogs flow={flow} onClose={() => setFlow(null)} />
    </>
  )
}
