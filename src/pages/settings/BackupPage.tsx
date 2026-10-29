import { memo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { todayISO } from '../../domain/dates'
import { downloadTextFile } from '../../lib/download'
import { haptic } from '../../lib/haptics'
import { exportJSON, parseBackup } from '../../data/backup'
import { isEncryptedBackup } from '../../data/backupCrypto'
import type { AppData } from '../../domain/types'
import { useFinance } from '../../state/FinanceContext'
import { BackupExportSheet } from '../../components/BackupExportSheet'
import { BackupImportSheet } from '../../components/BackupImportSheet'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SaveError } from '../../components/SaveError'
import { SubPageHeader } from '../../components/SubPageHeader'

/** Settings > Datensicherung: export (encrypted or plain) and import of backup files. */
export const BackupPage = memo(function BackupPage({ onBack }: { onBack: () => void }) {
  const { data, replaceAll, saveError } = useFinance()
  const [pending, setPending] = useState<AppData | null>(null)
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [confirmPlain, setConfirmPlain] = useState(false)
  const [encryptedFile, setEncryptedFile] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
