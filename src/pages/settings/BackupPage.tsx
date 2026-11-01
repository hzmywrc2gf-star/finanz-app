import { memo, useRef, useState } from 'react'
import { ERR_TOO_BIG, MAX_FILE_BYTES } from '../../lib/fileLimit'
import type { ChangeEvent } from 'react'
import { formatDateDE, todayISO } from '../../domain/dates'
import { useBackupSettings } from '../../hooks/useBackupSettings'
import { useVaultBackup } from '../../hooks/useVaultBackup'
import { setBackupReminderEnabled } from '../../lib/backupReminder'
import { downloadTextFile } from '../../lib/download'
import { haptic } from '../../lib/haptics'
import { exportJSON, parseBackup } from '../../data/backup'
import { isEncryptedBackup } from '../../data/backupCrypto'
import { isVaultBackup } from '../../data/vaultBackup'
import type { AppData } from '../../domain/types'
import { useFinance } from '../../state/FinanceContext'
import { BackupExportSheet } from '../../components/BackupExportSheet'
import { BackupImportSheet } from '../../components/BackupImportSheet'
import { VaultBackupImportSheet } from '../../components/VaultBackupImportSheet'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SaveError } from '../../components/SaveError'
import { SubPageHeader } from '../../components/SubPageHeader'
import { Switch } from '../../components/Switch'

/** Settings > Datensicherung: export (encrypted or plain) and import of backup files. */
export const BackupPage = memo(function BackupPage({ onBack }: { onBack: () => void }) {
  const { data, replaceAll, saveError } = useFinance()
  const [pending, setPending] = useState<AppData | null>(null)
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [confirmPlain, setConfirmPlain] = useState(false)
  const [encryptedFile, setEncryptedFile] = useState<string | null>(null)
  const [vaultFile, setVaultFile] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { last, enabled } = useBackupSettings()
  const monthly = useVaultBackup((outcome) =>
    setBackupMsg({ ok: true, text: outcome === 'shared' ? 'Sicherung erstellt.' : 'Sicherung wurde als Datei geladen.' }),
  )

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
      if (file.size > MAX_FILE_BYTES) throw new Error(ERR_TOO_BIG)
      const text = await file.text()
      if (isVaultBackup(text)) {
        setVaultFile(text) // sheet "Sicherung entschlüsseln": app password or recovery key
        setBackupMsg(null)
        return
      }
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
    setVaultFile(null)
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
      <SubPageHeader title="Datensicherung" parent="Einstellungen" onBack={onBack} />
      <SaveError message={saveError} />
      <div className="section-title">Monatliche Sicherung</div>
      <div className="card backup-monthly">
        <div className="backup-last">{last ? `Letzte Sicherung: ${formatDateDE(last)}` : 'Noch keine Sicherung'}</div>
        <button className="btn backup-now" disabled={!monthly.ready || monthly.busy} aria-busy={monthly.busy} onClick={monthly.run}>
          Jetzt in iCloud sichern
        </button>
        <div className="field switch-row">
          <label htmlFor="backup-reminder">Am 1. des Monats erinnern</label>
          <Switch id="backup-reminder" checked={enabled} onChange={setBackupReminderEnabled} />
        </div>
      </div>
      {monthly.error && (
        <div className="error" role="alert">
          {monthly.error}
        </div>
      )}
      <div className="footnote">
        Die Datei ist verschlüsselt und braucht kein eigenes Passwort: Zum Wiederherstellen reicht dein App-Passwort oder der
        Wiederherstellungsschlüssel. Wähle beim Sichern „In Dateien sichern“ und dann iCloud Drive.
        Die Sicherung lässt sich mit dem Passwort und Schlüssel von damals öffnen, wähle daher ein langes Passwort. Ein neuer
        Schlüssel oder ein neues Passwort ändert ältere Sicherungen nicht.
      </div>

      <div className="section-title">Eigene Sicherung</div>
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
      {vaultFile && (
        <VaultBackupImportSheet fileText={vaultFile} onClose={() => setVaultFile(null)} onRestored={onDecrypted} />
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
