import { useState } from 'react'
import type { RecurringRule } from '../domain/types'
import { formatDateDE, formatDayMonth, todayISO } from '../domain/dates'
import { formatSigned } from '../domain/money'
import { nextOccurrence, recurrenceLabel, recurringTitle } from '../domain/recurring'
import { useFinance } from '../state/FinanceContext'
import { RecurringForm } from './RecurringForm'

export function RecurringManager() {
  const { data } = useFinance()
  const [form, setForm] = useState<{ rule?: RecurringRule } | null>(null)
  const today = todayISO()
  const names = new Map(data.categories.map((c) => [c.id, c.name]))

  function nextLabel(rule: RecurringRule): string {
    const next = nextOccurrence(rule, today)
    if (!next) return 'beendet'
    const label = next.slice(0, 4) === today.slice(0, 4) ? formatDayMonth(next) : formatDateDE(next)
    return `nächste: ${label}`
  }

  return (
    <>
      <ul className="list card">
        {data.recurring.length === 0 && (
          <li>
            <div className="empty">
              Noch keine Verträge.
              <br />
              Miete, Abos oder Gehalt werden dann automatisch gebucht.
            </div>
          </li>
        )}
        {data.recurring.map((r) => (
          <li key={r.id}>
            <button className="row" onClick={() => setForm({ rule: r })}>
              <span className="row-main">
                <div className="row-title">{recurringTitle(r, data.categories)}</div>
                <div className="row-sub wrap">
                  {names.get(r.categoryId) ?? 'Unbekannt'} · {recurrenceLabel(r)} · {nextLabel(r)}
                </div>
              </span>
              <span className={`row-amount num ${r.kind === 'income' ? 'income-text' : 'expense-text'}`}>
                {formatSigned(r.amountCents, r.kind)}
              </span>
            </button>
          </li>
        ))}
        <li>
          <button className="row row-add" onClick={() => setForm({})}>
            Vertrag hinzufügen
          </button>
        </li>
      </ul>
      {form && (
        <RecurringForm key={form.rule?.id ?? 'new'} rule={form.rule} onClose={() => setForm(null)} />
      )}
    </>
  )
}
