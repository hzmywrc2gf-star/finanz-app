import { useState } from 'react'
import type { FormEvent } from 'react'
import { exportJSON } from '../data/backup'
import { generateRecoveryKey } from '../lib/crypto'
import { todayISO } from '../domain/dates'
import { downloadTextFile } from '../lib/download'
import { haptic } from '../lib/haptics'
import { validateNewPassword } from '../lib/password'
import { useFinance } from '../state/FinanceContext'
import { useLock } from '../state/LockContext'
import { BackupExportSheet } from './BackupExportSheet'
import { ConfirmDialog } from './ConfirmDialog'
import { PasswordFields } from './PasswordFields'
import { RecoveryKeyBox } from './RecoveryKeyBox'

type Step = 'password' | 'key' | 'face' | 'done'

const SUBTITLE: Record<Step, string> = {
  password: 'Schütze deine Daten',
  key: 'Wiederherstellungsschlüssel',
  face: 'Face ID',
  done: 'Geschützt',
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Unbekannter Fehler.')

/**
 * Mandatory first screen while no vault exists: the app only opens once it is protected. Four steps: password, recovery
 * key (must be confirmed as written down), optional Face ID, done. There is no way to skip it. Nothing is stored before
 * the recovery key was confirmed; the vault is created (and verified) when leaving step 2, existing data is carried over.
 */
export function LockSetupScreen({ onDone }: { onDone: () => void }) {
  const { data } = useFinance()
  const lock = useLock()
  const [step, setStep] = useState<Step>('password')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [recoveryKey] = useState(generateRecoveryKey)
  const [noted, setNoted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [confirmPlain, setConfirmPlain] = useState(false)
  const hasData = data.transactions.length > 0 || data.transfers.length > 0 || data.recurring.length > 0

  function toKey(e: FormEvent) {
    e.preventDefault()
    const problem = validateNewPassword(password, repeat)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setStep('key')
  }

  async function create() {
    if (busy || !noted) return
    setBusy(true)
    setError(null)
    try {
      await lock.enable(data, password, recoveryKey)
      setPassword('')
      setRepeat('')
      setStep(lock.passkeyLikely ? 'face' : 'done')
    } catch (e) {
      setError(errMsg(e))
    }
    setBusy(false)
  }

  async function addFaceId() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await lock.addPasskey()
      setStep('done')
    } catch (e) {
      setError(errMsg(e))
    }
    setBusy(false)
  }

  function finish() {
    haptic()
    onDone()
  }

  function exportPlain() {
    downloadTextFile(`finanz-backup-${todayISO()}.json`, exportJSON(data))
    setConfirmPlain(false)
    setExporting(false)
  }

  return (
    <main className="lock-screen setup-screen" aria-label="App-Sperre einrichten">
      <div className="lock-head">
        <img className="lock-icon" src="./icon-192.png" alt="" width={72} height={72} />
        <h1>Finanzklar</h1>
        <p className="muted">{SUBTITLE[step]}</p>
      </div>
      {step === 'password' && (
        <form onSubmit={toKey} noValidate>
          <p className="sheet-text">
            Finanzklar öffnet sich nur mit Passwort oder Face ID. Wähle ein Passwort, mit dem du die App entsperrst. Deine Daten
            werden damit verschlüsselt auf diesem Gerät gespeichert.
          </p>
          <PasswordFields
            idPrefix="lock"
            password={password}
            repeat={repeat}
            onPassword={(v) => {
              setPassword(v)
              setError(null)
            }}
            onRepeat={(v) => {
              setRepeat(v)
              setError(null)
            }}
            autoFocus
          />
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <div className="warning-box">
            Wenn du Passwort UND Wiederherstellungsschlüssel verlierst, sind deine Daten verloren. Es gibt keine andere
            Möglichkeit, sie zurückzuholen.
          </div>
          {hasData && (
            <div className="footnote">
              Tipp: Exportiere vorher ein verschlüsseltes Backup.{' '}
              <button type="button" className="link-btn inline" onClick={() => setExporting(true)}>
                Backup exportieren
              </button>
            </div>
          )}
          <button className="btn" type="submit">
            Weiter
          </button>
        </form>
      )}

      {step === 'key' && (
        <div>
          <p className="sheet-text">
            Das ist dein Wiederherstellungsschlüssel. Er öffnet deine Daten, falls du das Passwort vergisst. Notiere ihn auf
            Papier und bewahre ihn sicher auf. Hier wird er nur dieses eine Mal angezeigt.
          </p>
          <RecoveryKeyBox recoveryKey={recoveryKey} />
          <label className="check-row">
            <input type="checkbox" checked={noted} disabled={busy} onChange={(e) => setNoted(e.target.checked)} />
            <span>Ich habe den Schlüssel sicher notiert</span>
          </label>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="btn" type="button" disabled={!noted || busy} aria-busy={busy} onClick={create}>
            {busy ? 'Wird verschlüsselt …' : 'Weiter'}
          </button>
        </div>
      )}

      {step === 'face' && (
        <div>
          <h3 className="sheet-title">Face ID hinzufügen?</h3>
          <p className="sheet-text">
            Damit entsperrst du Finanzklar künftig mit einem Blick. Passwort und Wiederherstellungsschlüssel bleiben als
            Alternative.
          </p>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="btn" type="button" disabled={busy} aria-busy={busy} onClick={addFaceId}>
            {busy ? 'Face ID …' : 'Face ID hinzufügen'}
          </button>
          <button type="button" className="link-btn plain-skip" disabled={busy} onClick={() => setStep('done')}>
            Überspringen
          </button>
        </div>
      )}

      {step === 'done' && (
        <div>
          <h3 className="sheet-title">Finanzklar ist geschützt</h3>
          <p className="sheet-text">
            Deine Daten liegen jetzt nur noch verschlüsselt auf diesem Gerät. Finanzklar sperrt sich automatisch, wenn du die App
            eine Minute nicht benutzt. Das kannst du in den Einstellungen unter „Sicherheit“ ändern.
          </p>
          <button className="btn" type="button" onClick={finish}>
            Fertig
          </button>
        </div>
      )}

      {exporting && (
        <BackupExportSheet
          data={data}
          onClose={() => setExporting(false)}
          onExported={() => {}}
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
    </main>
  )
}
