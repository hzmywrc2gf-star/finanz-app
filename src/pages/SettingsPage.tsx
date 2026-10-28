import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { todayISO } from '../domain/dates'
import { centsToInputString, parseEuroInput } from '../domain/money'
import { exportJSON, parseBackup } from '../data/backup'
import type { AppData } from '../domain/types'
import { useFinance } from '../state/FinanceContext'
import { CategoryManager } from '../components/CategoryManager'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function SettingsPage() {
  const { data, setStartBalance, setStartCash, replaceAll, saveError } = useFinance()
  const [balance, setBalance] = useState(centsToInputString(data.settings.startBalanceCents))
  const [cash, setCash] = useState(centsToInputString(data.settings.startCashCents))
  const [balanceMsg, setBalanceMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, setPending] = useState<AppData | null>(null)
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  function exportBackup() {
    const blob = new Blob([exportJSON(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finanz-backup-${todayISO()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setBackupMsg({ ok: true, text: 'Sicherung wurde exportiert.' })
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPending(parseBackup(await file.text()))
      setBackupMsg(null)
    } catch (err) {
      setPending(null)
      setBackupMsg({ ok: false, text: err instanceof Error ? err.message : 'Import fehlgeschlagen.' })
    }
  }

  function confirmImport() {
    if (!pending) return
    try {
      replaceAll(pending)
      setBalance(centsToInputString(pending.settings.startBalanceCents))
      setCash(centsToInputString(pending.settings.startCashCents))
      setBackupMsg({
        ok: true,
        text: `Import erfolgreich: ${pending.transactions.length} Buchungen, ${pending.categories.length} Kategorien.`,
      })
    } catch (err) {
      setBackupMsg({ ok: false, text: err instanceof Error ? err.message : 'Import fehlgeschlagen.' })
    }
    setPending(null)
  }

  return (
    <>
      <h1 className="page-title">Einstellungen</h1>
      {saveError && (
        <div className="error" role="alert">
          {saveError}
        </div>
      )}

      <div className="section-title">Startguthaben</div>
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

      <CategoryManager />

      <div className="section-title">Datensicherung</div>
      <div className="card btn-row">
        <button className="btn secondary" style={{ background: 'var(--card-2)' }} onClick={exportBackup}>
          Exportieren
        </button>
        <button className="btn secondary" style={{ background: 'var(--card-2)' }} onClick={() => fileRef.current?.click()}>
          Importieren
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
      </div>
      {backupMsg && (
        <div className={backupMsg.ok ? 'success' : 'error'} role={backupMsg.ok ? 'status' : 'alert'}>
          {backupMsg.text}
        </div>
      )}
      <div className="footnote">Alle Daten liegen nur auf diesem Gerät. Exportiere sie regelmäßig als Sicherung.</div>

      {pending && (
        <ConfirmDialog
          title="Alle Daten ersetzen?"
          message={`Die aktuellen Daten werden durch die Sicherung ersetzt (${pending.transactions.length} Buchungen).`}
          confirmLabel="Ersetzen"
          danger
          onCancel={() => setPending(null)}
          onConfirm={confirmImport}
        />
      )}
    </>
  )
}
