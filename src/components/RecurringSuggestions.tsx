import { useMemo, useState } from 'react'
import { formatDayMonth, todayISO } from '../domain/dates'
import { formatSigned } from '../domain/money'
import { recurrenceLabel } from '../domain/recurring'
import { detectRecurring } from '../domain/recurringDetect'
import type { RecurringSuggestion } from '../domain/recurringDetect'
import { haptic } from '../lib/haptics'
import { Switch } from './Switch'
import { dismissKey, getDismissedKeys } from '../lib/recurringDismissed'
import { useFinance } from '../state/FinanceContext'
import { CheckIcon, RefreshIcon } from './Icons'
import { Sheet } from './Sheet'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * "Verträge erkennen": one card per pattern found in the bookings, to turn into a Vertrag.
 * The list is recomputed from the current data on every render, so patterns whose bookings vanished (undone import)
 * or that got a Vertrag disappear by themselves; `importedIds` limits it to patterns that include those bookings.
 */
export function RecurringSuggestions({ importedIds, onClose }: { importedIds?: string[]; onClose: () => void }) {
  const { data, createRecurringFromSuggestion } = useFinance()
  const [today] = useState(() => todayISO())
  const [dismissed, setDismissed] = useState(() => getDismissedKeys())
  const [notNow, setNotNow] = useState<Set<string>>(() => new Set())
  const [auto, setAuto] = useState<Record<string, boolean>>({})
  const [created, setCreated] = useState<Map<string, string>>(() => new Map())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const current = useMemo(() => {
    const found = detectRecurring(data, today, dismissed)
    if (!importedIds) return found
    const wanted = new Set(importedIds)
    return found.filter((s) => s.transactionIds.some((id) => wanted.has(id)))
  }, [data, today, dismissed, importedIds])
  // the cards that were there when the sheet opened keep their place (created ones turn into a confirmation)
  const [order] = useState(() => current.map((s) => s.key))
  const byKey = new Map(current.map((s) => [s.key, s]))

  const titleOf = (s: RecurringSuggestion) => s.note || data.categories.find((c) => c.id === s.categoryId)?.name || 'Unbekannt'

  function create(s: RecurringSuggestion) {
    try {
      createRecurringFromSuggestion(s, auto[s.key] ?? true)
      haptic()
      setCreated((m) => new Map(m).set(s.key, `${titleOf(s)} · ${recurrenceLabel(s)}`))
      setErrors(({ [s.key]: _gone, ...rest }) => rest)
    } catch (e) {
      setErrors((m) => ({ ...m, [s.key]: e instanceof Error ? e.message : 'Der Vertrag konnte nicht angelegt werden.' }))
    }
  }

  function never(s: RecurringSuggestion) {
    dismissKey(s.key)
    setDismissed(getDismissedKeys())
  }

  const cards = order.filter((key) => created.has(key) || (byKey.has(key) && !notNow.has(key)))
  const open = cards.filter((key) => !created.has(key)).length

  return (
    <Sheet title="Verträge erkennen" onClose={onClose}>
      <div className="suggest">
        {cards.length > 0 && (
          <p className="suggest-intro">
            {open > 0
              ? `${plural(open, 'wiederkehrende Buchung', 'wiederkehrende Buchungen')} gefunden. Als Vertrag werden sie künftig automatisch gebucht oder zur Bestätigung angezeigt.`
              : 'Keine weiteren Vorschläge.'}
          </p>
        )}
        {cards.map((key) => {
          const done = created.get(key)
          const s = byKey.get(key)
          if (done) {
            return (
              <div key={key} className="suggest-done" role="status">
                <span className="pico">
                  <CheckIcon />
                </span>
                <span>
                  Angelegt: <b>{done}</b>
                </span>
              </div>
            )
          }
          if (!s) return null
          const title = titleOf(s)
          const category = data.categories.find((c) => c.id === s.categoryId)?.name
          const id = `sg-auto-${key}`
          return (
            <section key={key} className="pcard tint-lav suggest-card" aria-label={title}>
              <div className="prow">
                <span className="pico">
                  <RefreshIcon />
                </span>
                <span className="pmain">
                  <div className="suggest-top">
                    <div className="t">{title}</div>
                    <span className={`pamt num ${s.kind === 'income' ? 'income-text' : 'expense-text'}`}>{formatSigned(s.amountCents, s.kind)}</span>
                  </div>
                  <div className="s">
                    {category && category !== title ? `${category} · ` : ''}
                    {recurrenceLabel(s)}
                  </div>
                  <div className="s">
                    zuletzt {formatDayMonth(s.lastDate)} · {s.count}-mal gefunden
                  </div>
                </span>
              </div>
              <div className="field switch-row suggest-auto">
                <label htmlFor={id}>Automatisch buchen</label>
                <Switch id={id} checked={auto[key] ?? true} onChange={(on) => setAuto((m) => ({ ...m, [key]: on }))} />
              </div>
              {errors[key] && (
                <div className="error suggest-error" role="alert">
                  {errors[key]}
                </div>
              )}
              <div className="pactions">
                <button className="pbtn" type="button" aria-label={`Als Vertrag anlegen: ${title}`} onClick={() => create(s)}>
                  Als Vertrag anlegen
                </button>
              </div>
              <div className="suggest-links">
                <button className="link-btn" type="button" aria-label={`Nicht jetzt: ${title}`} onClick={() => setNotNow((set) => new Set(set).add(key))}>
                  Nicht jetzt
                </button>
                <button className="link-btn" type="button" aria-label={`Nie vorschlagen: ${title}`} onClick={() => never(s)}>
                  Nie vorschlagen
                </button>
              </div>
            </section>
          )
        })}
        {cards.length === 0 && <div className="empty">Keine weiteren wiederkehrenden Buchungen gefunden.</div>}
        <button className="btn secondary suggest-close" type="button" onClick={onClose}>
          Fertig
        </button>
      </div>
    </Sheet>
  )
}
