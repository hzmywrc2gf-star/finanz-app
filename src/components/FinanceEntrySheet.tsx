import type { FinanceEntry } from '../domain/calendar'
import { formatDateDE } from '../domain/dates'
import { formatCents, formatSigned } from '../domain/money'
import { INTERVAL_LABELS, nextOccurrence } from '../domain/recurring'
import { useFinance } from '../state/FinanceContext'
import { InvoiceDetailSheet } from './InvoiceSheets'
import { Sheet } from './Sheet'

/** What a tap on a payment in the calendar opens: an invoice's own sheet, or a read-only note about the Vertrag. */
export function FinanceEntrySheet({ entry, onClose, onOpenContracts }: { entry: FinanceEntry; onClose: () => void; onOpenContracts: () => void }) {
  const { data } = useFinance()
  if (entry.type === 'invoice') {
    return data.invoices.some((i) => i.id === entry.refId) ? <InvoiceDetailSheet id={entry.refId} onClose={onClose} /> : null
  }
  const rule = data.recurring.find((r) => r.id === entry.refId)
  if (!rule) return null
  const next = nextOccurrence(rule, entry.date)
  return (
    <Sheet title="Vertrag" onClose={onClose}>
      <div className="card card-pad cal-contract">
        <div className="balance-label">{entry.title}</div>
        <div className={`balance-value num ${entry.flow === 'income' ? 'income-text' : 'expense-text'}`}>{formatSigned(rule.amountCents, rule.kind)}</div>
        <div className="balance-sub">
          {INTERVAL_LABELS[rule.interval]} · am {formatDateDE(entry.date)}
        </div>
        {next && <div className="footnote" style={{ margin: '8px 0 0' }}>Danach am {formatDateDE(next)} · {formatCents(rule.amountCents)}</div>}
      </div>
      <div className="footnote">Das ist nur eine Anzeige. Ändern kannst du den Vertrag unter Verträge.</div>
      <button className="btn" type="button" onClick={onOpenContracts}>
        Zu den Verträgen
      </button>
    </Sheet>
  )
}
