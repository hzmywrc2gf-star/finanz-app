import { useState } from 'react'
import type { FormEvent } from 'react'
import { generateRecoveryKey } from '../lib/crypto'
import { haptic } from '../lib/haptics'
import { validateNewPassword } from '../lib/password'
import { useFinance } from '../state/FinanceContext'
import { useLock } from '../state/LockContext'
import { PasswordFields } from './PasswordFields'
import { RecoveryKeyBox } from './RecoveryKeyBox'
import { Sheet } from './Sheet'

type Step = 'password' | 'key' | 'face' | 'done'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Unbekannter Fehler.')

/**
 * Four steps: password, recovery key (must be confirmed as written down), optional Face ID, done. Nothing is stored
 * before the recovery key was confirmed; the vault is created when leaving step 2.
 */
export function LockSetupSheet({ onClose, onExportBackup }: { onClose: () => void; onExportBackup: () => void }) {
  const { data } = useFinance()
  const lock = useLock()
  const [step, setStep] = useState<Step>('password')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [recoveryKey] = useState(generateRecoveryKey)
  const [noted, setNoted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    onClose()
  }

  // after step 2 the lock is on: closing the sheet no longer cancels anything
  return (
    <Sheet title="App-Sperre einrichten" onClose={onClose} dismissible={!busy}>
      {step === 'password' && (
        <form onSubmit={toKey} noValidate>
          <p className="sheet-text">Wähle ein Passwort, mit dem du Finanzklar entsperrst.</p>
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
          <div className="footnote">
            Tipp: Exportiere vorher ein verschlüsseltes Backup.{' '}
            <button type="button" className="link-btn inline" onClick={onExportBackup}>
              Backup exportieren
            </button>
          </div>
          <button className="btn" type="submit">
            Weiter
          </button>
        </form>
      )}

      {step === 'key' && (
        <div>
          <p className="sheet-text">
            Das ist dein Wiederherstellungsschlüssel. Er öffnet deine Daten, falls du das Passwort vergisst. Notiere ihn auf Papier
            und bewahre ihn sicher auf. Hier wird er nur dieses eine Mal angezeigt.
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
            Damit entsperrst du Finanzklar künftig mit einem Blick. Passwort und Wiederherstellungsschlüssel bleiben als Alternative.
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
          <h3 className="sheet-title">App-Sperre ist aktiv</h3>
          <p className="sheet-text">
            Deine Daten liegen jetzt nur noch verschlüsselt auf diesem Gerät. Finanzklar sperrt sich automatisch, wenn du die App
            eine Minute nicht benutzt. Das kannst du in den Einstellungen ändern.
          </p>
          <button className="btn" type="button" onClick={finish}>
            Fertig
          </button>
        </div>
      )}
    </Sheet>
  )
}
