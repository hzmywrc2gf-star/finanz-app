import { memo, useState } from 'react'
import { todayISO } from '../domain/dates'
import { formatCents } from '../domain/money'
import { monthlyEquivalent } from '../domain/recurring'
import { detectRecurring } from '../domain/recurringDetect'
import { getDismissedKeys } from '../lib/recurringDismissed'
import { useFinance } from '../state/FinanceContext'
import { RecurringSuggestions } from '../components/RecurringSuggestions'
import { RecurringManager } from '../components/RecurringManager'
import { SubPageHeader } from '../components/SubPageHeader'

/** Recurring rules ("Verträge"): monthly fixed costs on top, then the list with add/edit/delete. */
export const ContractsPage = memo(function ContractsPage({ onBack }: { onBack: () => void }) {
  const { data } = useFinance()
  const { activeCount, monthlyCents } = monthlyEquivalent(data.recurring, todayISO())
  const [suggesting, setSuggesting] = useState(false)
  const [none, setNone] = useState(false)

  function detect() {
    if (detectRecurring(data, todayISO(), getDismissedKeys()).length === 0) {
      setNone(true)
      return
    }
    setNone(false)
    setSuggesting(true)
  }

  return (
    <>
      <SubPageHeader title="Verträge" onBack={onBack} />
      <div className="card card-pad">
        <div className="balance-label">Fixkosten pro Monat</div>
        <div className="balance-value num" data-testid="fixed-costs">
          {formatCents(monthlyCents)}
        </div>
        <div className="balance-sub">
          {activeCount === 0 ? 'Keine aktiven Verträge' : `${activeCount} ${activeCount === 1 ? 'aktiver Vertrag' : 'aktive Verträge'}`}
        </div>
      </div>
      <RecurringManager />
      <button className="btn secondary detect-btn" type="button" onClick={detect}>
        Verträge aus Buchungen erkennen
      </button>
      {none && (
        <div className="footnote" role="status">
          Keine wiederkehrenden Buchungen gefunden.
        </div>
      )}
      {suggesting && <RecurringSuggestions onClose={() => setSuggesting(false)} />}
      <div className="footnote">Vierteljährliche und jährliche Beträge sind auf den Monat umgerechnet. Einnahmen zählen nicht mit.</div>
    </>
  )
})
