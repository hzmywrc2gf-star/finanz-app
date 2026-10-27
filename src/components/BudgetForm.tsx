import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Category } from '../domain/types'
import { centsToInputString, parseEuroInput } from '../domain/money'
import { useFinance } from '../state/FinanceContext'
import { Sheet } from './Sheet'

export function BudgetForm({ category, onClose }: { category: Category; onClose: () => void }) {
  const { setCategoryBudget } = useFinance()
  const has = category.monthlyBudgetCents !== undefined
  const [amount, setAmount] = useState(has ? centsToInputString(category.monthlyBudgetCents!) : '')
  const [error, setError] = useState<string | null>(null)

  function save(cents: number | null) {
    try {
      setCategoryBudget(category.id, cents)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const cents = parseEuroInput(amount)
    if (cents === null) {
      setError('Bitte einen gültigen Betrag eingeben, z. B. 400,00.')
      return
    }
    if (cents <= 0) {
      setError('Das Budget muss größer als 0 sein.')
      return
    }
    save(cents)
  }

  return (
    <Sheet title={`Budget · ${category.name}`} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="card">
          <div className="field">
            <label htmlFor="budget-amount">Pro Monat</label>
            <input
              id="budget-amount"
              className="amount num"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00 €"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus={!has}
            />
          </div>
        </div>
        <div className="footnote">Gilt für jeden Kalendermonat. Gezählt werden die Ausgaben dieser Kategorie.</div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit">
          Sichern
        </button>
        {has && (
          <button className="btn danger" type="button" onClick={() => save(null)}>
            Budget entfernen
          </button>
        )}
      </form>
    </Sheet>
  )
}
