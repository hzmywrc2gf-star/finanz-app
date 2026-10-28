import { memo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { todayISO } from '../domain/dates'
import { downloadTextFile } from '../lib/download'
import { haptic } from '../lib/haptics'
import { centsToInputString, parseEuroInput } from '../domain/money'
import { exportJSON, parseBackup } from '../data/backup'
import { isEncryptedBackup } from '../data/backupCrypto'
import type { AppData } from '../domain/types'
import { useFinance } from '../state/FinanceContext'
import { BackupExportSheet } from '../components/BackupExportSheet'
import { BackupImportSheet } from '../components/BackupImportSheet'
import { AppLockSettings } from '../components/AppLockSettings'
import { CategoryManager } from '../components/CategoryManager'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { SegmentedControl } from '../components/SegmentedControl'
import { useThemePref } from '../hooks/useThemePref'
import type { ThemePref } from '../lib/theme'

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Automatisch' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
]

export const SettingsPage = memo(function SettingsPage() {
  const { data, setStartBalance, setStartCash, setDisplayName, replaceAll, saveError } = useFinance()
  const [balance, setBalance] = useState(centsToInputString(data.settings.startBalanceCents))
  const [cash, setCash] = useState(centsToInputString(data.settings.startCashCents))
  const [balanceMsg, setBalanceMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, setPending] = useState<AppData | null>(null)
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [confirmPlain, setConfirmPlain] = useState(false)
  const [encryptedFile, setEncryptedFile] = useState<string | null>(null)
  const [name, setName] = useState(data.settings.displayName ?? '')
  const [nameMsg, setNameMsg] = useState<string | null>(null)
  const [theme, setTheme] = useThemePref()
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

  // Later (with sync) the name will come from the login instead of being typed here.
  function saveName(e?: FormEvent) {
    e?.preventDefault()
    try {
      setDisplayName(name)
      setName(name.trim())
      setNameMsg(null)
    } catch (err) {
      setNameMsg(err instanceof Error ? err.message : 'Name konnte nicht gespeichert werden.')
    }
  }

  function exportPlain() {
    downloadTextFile(`finanz-backup-${todayISO()}.json`, exportJSON(data))
    haptic()
    setConfirmPlain(false)
    setExporting(false)
    setBackupMsg({ ok: true, text: 'Sicherung wurde exportiert (ohne Passwort).' })
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      if (isEncryptedBackup(text)) {
        setEncryptedFile(text) // the password sheet decrypts, then the usual validation and confirmation follow
        setBackupMsg(null)
        return
      }
      setPending(parseBackup(text))
      setBackupMsg(null)
    } catch (err) {
      setPending(null)
      setBackupMsg({ ok: false, text: err instanceof Error ? err.message : 'Import fehlgeschlagen.' })
    }
  }

  function onDecrypted(json: string) {
    try {
      setPending(parseBackup(json))
      setBackupMsg(null)
    } catch (err) {
      setPending(null)
      setBackupMsg({ ok: false, text: err instanceof Error ? err.message : 'Import fehlgeschlagen.' })
    }
    setEncryptedFile(null)
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

      <div className="section-title">Darstellung</div>
      <div className="card" style={{ padding: 12 }}>
        <SegmentedControl label="Darstellung" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      </div>
      <div className="footnote">Automatisch folgt der Einstellung des iPhones.</div>

      <div className="section-title">Persönlich</div>
      <form className="card" onSubmit={saveName} noValidate>
        <div className="field">
          <label htmlFor="display-name">Dein Name</label>
          <input
            id="display-name"
            autoComplete="given-name"
            placeholder="Für die Begrüßung"
            maxLength={40}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameMsg(null)
            }}
            onBlur={() => saveName()}
          />
        </div>
      </form>
      {nameMsg && (
        <div className="error" role="alert">
          {nameMsg}
        </div>
      )}
      <div className="footnote">Mit diesem Namen begrüßt dich Finanzklar, wenn du es mit Face ID entsperrst.</div>

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

      <AppLockSettings onExportBackup={() => setExporting(true)} />

      <div className="section-title">Datensicherung</div>
      <div className="card btn-row">
        <button className="btn secondary" style={{ background: 'var(--card-2)' }} onClick={() => setExporting(true)}>
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
      <div className="footnote">Alle Daten liegen nur auf diesem Gerät. Exportiere sie regelmäßig als Sicherung, am besten mit Passwort.</div>

      {exporting && (
        <BackupExportSheet
          data={data}
          onClose={() => setExporting(false)}
          onExported={() => setBackupMsg({ ok: true, text: 'Verschlüsselte Sicherung wurde exportiert.' })}
          onPlain={() => setConfirmPlain(true)}
        />
      )}
      {confirmPlain && (
        <ConfirmDialog
          title="Ohne Passwort exportieren?"
          message="Die Datei ist dann für jeden lesbar, der sie öffnet (z. B. in iCloud oder als Mail-Anhang). Trotzdem unverschlüsselt exportieren?"
          confirmLabel="Unverschlüsselt exportieren"
          danger
          onCancel={() => setConfirmPlain(false)}
          onConfirm={exportPlain}
        />
      )}
      {encryptedFile && (
        <BackupImportSheet fileText={encryptedFile} onClose={() => setEncryptedFile(null)} onDecrypted={onDecrypted} />
      )}
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
})
