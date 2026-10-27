import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Interval, Kind, RecurringRule } from '../domain/types'
import { addDays, formatDateDE, todayISO } from '../domain/dates'
import { centsToInputString, parseEuroInput } from '../domain/money'
import { INTERVAL_LABELS, dayOfMonthOf, occurrencesBetween } from '../domain/recurring'
import type { RecurringInput } from '../state/actions'
import { useFinance } from '../state/FinanceContext'
import { Sheet } from './Sheet'
import { SegmentedControl } from './SegmentedControl'
import { ConfirmDialog } from './ConfirmDialog'

export function RecurringForm({ rule, onClose }: { rule?: RecurringRule; onClose: () => void }) {
  const { data, addRecurring, updateRecurring, deleteRecurring } = useFinance()
  const [kind, setKind] = useState<Kind>(rule?.kind ?? 'expense')
  const [amount, setAmount] = useState(rule ? centsToInputString(rule.amountCents) : '')
  const [categoryId, setCategoryId] = useState(rule?.categoryId ?? '')
  const [note, setNote] = useState(rule?.note ?? '')
  const [interval, setInterval] = useState<Interval>(rule?.interval ?? 'monthly')
  const [start, setStart] = useState(rule?.startDate ?? todayISO())
  // until the day is edited by hand it follows the start date
  const [day, setDay] = useState<string | null>(rule ? String(rule.dayOfMonth) : null)
  const [end, setEnd] = useState(rule?.endDate ?? '')
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pastPrompt, setPastPrompt] = useState<{ input: RecurringInput; count: number } | null>(null)

  const categories = data.categories.filter((c) => c.kind === kind)
  const effectiveCategory = categories.some((c) => c.id === categoryId)
    ? categoryId
    : (categories.find((c) => !c.builtIn) ?? categories[0])?.id ?? ''
  const dayText = day ?? (start ? String(dayOfMonthOf(start)) : '')

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
    if (!effectiveCategory) {
      setError('Bitte eine Kategorie wählen.')
      return
    }
    const dayNum = Number(dayText)
    if (!/^\d+$/.test(dayText) || dayNum < 1 || dayNum > 31) {
      setError('Der Tag im Monat muss zwischen 1 und 31 liegen.')
      return
    }
    if (!start) {
      setError('Bitte ein Startdatum wählen.')
      return
    }
    if (end && end < start) {
      setError('Das Enddatum darf nicht vor dem Startdatum liegen.')
      return
    }
    const input: RecurringInput = {
      kind,
      amountCents: cents,
      categoryId: effectiveCategory,
      note,
      interval,
      dayOfMonth: dayNum,
      startDate: start,
      endDate: end || undefined,
    }
    try {
      if (rule) {
        updateRecurring(rule.id, input)
        onClose()
        return
      }
      const draft: RecurringRule = { ...input, id: 'draft', bookedThrough: addDays(start, -1) }
      const count = occurrencesBetween(draft, draft.bookedThrough, todayISO()).length
      if (count > 0) {
        setPastPrompt({ input, count })
        return
      }
      addRecurring(input, true)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  function addWithChoice(catchUp: boolean) {
    if (!pastPrompt) return
    try {
      addRecurring(pastPrompt.input, catchUp)
      onClose()
    } catch (err) {
      setPastPrompt(null)
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  return (
    <Sheet title={rule ? 'Wiederkehrende Buchung' : 'Neue wiederkehrende Buchung'} onClose={onClose}>
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
            <label htmlFor="rc-amount">Betrag</label>
            <input
              id="rc-amount"
              className="amount num"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00 €"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus={!rule}
            />
          </div>
          <div className="field">
            <label htmlFor="rc-cat">Kategorie</label>
            <select id="rc-cat" value={effectiveCategory} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rc-note">Bezeichnung</label>
            <input
              id="rc-note"
              placeholder="Optional, z. B. Miete"
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <SegmentedControl<Interval>
            label="Rhythmus"
            value={interval}
            onChange={setInterval}
            options={(Object.keys(INTERVAL_LABELS) as Interval[]).map((v) => ({ value: v, label: INTERVAL_LABELS[v] }))}
          />
        </div>
        <div className="card wide-labels" style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="rc-day">Tag im Monat</label>
            <input
              id="rc-day"
              className="num"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              value={dayText}
              onChange={(e) => setDay(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="rc-start">Startdatum</label>
            <input id="rc-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rc-end">Enddatum</label>
            <input id="rc-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            {end && (
              <button type="button" className="clear-btn" onClick={() => setEnd('')}>
                Entfernen
              </button>
            )}
          </div>
        </div>
        <div className="footnote">Am 29.–31. wird in kürzeren Monaten am Monatsletzten gebucht.</div>

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit">
          Sichern
        </button>
        {rule && (
          <button className="btn danger" type="button" onClick={() => setConfirmDelete(true)}>
            Löschen
          </button>
        )}
      </form>
      {confirmDelete && rule && (
        <ConfirmDialog
          title="Wiederkehrende Buchung löschen?"
          message="Es werden keine weiteren Termine gebucht. Bereits gebuchte Einträge bleiben erhalten."
          confirmLabel="Löschen"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteRecurring(rule.id)
            onClose()
          }}
        />
      )}
      {pastPrompt && (
        <ConfirmDialog
          title="Vergangene Termine nachbuchen?"
          message={`${pastPrompt.count} ${pastPrompt.count === 1 ? 'Termin seit' : 'Termine seit'} ${formatDateDE(pastPrompt.input.startDate)} ${pastPrompt.count === 1 ? 'liegt' : 'liegen'} in der Vergangenheit.`}
          confirmLabel="Nachbuchen"
          secondaryLabel="Nur künftige"
          onCancel={() => setPastPrompt(null)}
          onSecondary={() => addWithChoice(false)}
          onConfirm={() => addWithChoice(true)}
        />
      )}
    </Sheet>
  )
}
