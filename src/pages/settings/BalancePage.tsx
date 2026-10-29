import { memo, useState } from 'react'
import type { FormEvent } from 'react'
import { centsToInputString, parseEuroInput } from '../../domain/money'
import { useFinance } from '../../state/FinanceContext'
import { SaveError } from '../../components/SaveError'
import { SubPageHeader } from '../../components/SubPageHeader'

/** Settings > Startguthaben: opening balance of the account and of the cash. */
export const BalancePage = memo(function BalancePage({ onBack }: { onBack: () => void }) {
  const { data, setStartBalance, setStartCash, saveError } = useFinance()
  const [balance, setBalance] = useState(centsToInputString(data.settings.startBalanceCents))
  const [cash, setCash] = useState(centsToInputString(data.settings.startCashCents))
  const [balanceMsg, setBalanceMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function saveBalance(e: FormEvent) {
    e.preventDefault()
    const cents = parseEuroInput(balance, { allowNegative: true })
    const cashCents = parseEuroInput(cash, { allowNegative: true })
    if (cents === null || cashCents === null) {
      setBalanceMsg({ ok: false, text: 'Bitte einen gültigen Betrag eingeben, z. B. 1.000,00.' })
      return
    }
    setStartBalance(cents)
    setStartCash(cashCents)
    setBalance(centsToInputString(cents))
    setCash(centsToInputString(cashCents))
    setBalanceMsg({ ok: true, text: 'Startguthaben gespeichert.' })
  }

  return (
    <>
      <SubPageHeader title="Startguthaben" parent="Einstellungen" onBack={onBack} />
      <SaveError message={saveError} />
      <form className="card" onSubmit={saveBalance} noValidate>
        <div className="field">
          <label htmlFor="start-balance">Konto</label>
          <input
            id="start-balance"
            className="num"
            inputMode="decimal"
            autoComplete="off"
            value={balance}
            onChange={(e) => {
              setBalance(e.target.value)
              setBalanceMsg(null)
            }}
          />
          <span className="muted">€</span>
        </div>
        <div className="field">
          <label htmlFor="start-cash">Bargeld</label>
          <input
            id="start-cash"
            className="num"
            inputMode="decimal"
            autoComplete="off"
            value={cash}
            onChange={(e) => {
              setCash(e.target.value)
              setBalanceMsg(null)
            }}
          />
          <span className="muted">€</span>
        </div>
        <div className="btn-row" style={{ borderTop: '0.5px solid var(--sep)' }}>
          <button className="btn" type="submit">
            Speichern
          </button>
        </div>
      </form>
      {balanceMsg && (
        <div className={balanceMsg.ok ? 'success' : 'error'} role={balanceMsg.ok ? 'status' : 'alert'}>
          {balanceMsg.text}
        </div>
      )}
      <div className="footnote">
        Der Kontostand ergibt sich aus dem Startguthaben plus Einnahmen minus Ausgaben, Abhebungen und plus Einzahlungen. Beim
        Bargeld gilt der Startbestand Bargeld, Abhebungen kommen dazu.
      </div>
    </>
  )
})
