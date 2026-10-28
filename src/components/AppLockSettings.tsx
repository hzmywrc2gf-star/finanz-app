import { useState } from 'react'
import type { FormEvent } from 'react'
import { AUTO_LOCK_OPTIONS } from '../data/vault'
import type { AutoLockMinutes } from '../data/vault'
import { haptic } from '../lib/haptics'
import { validateNewPassword } from '../lib/password'
import { useLock } from '../state/LockContext'
import { ConfirmDialog } from './ConfirmDialog'
import { PasswordFields } from './PasswordFields'
import { RecoveryKeyBox } from './RecoveryKeyBox'
import { SegmentedControl } from './SegmentedControl'
import { Sheet } from './Sheet'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Unbekannter Fehler.')

const AUTO_LOCK_LABEL: Record<AutoLockMinutes, string> = { 0: 'Sofort', 1: '1 Min.', 5: '5 Min.', 15: '15 Min.' }
const AUTO_LOCK_CHOICES = AUTO_LOCK_OPTIONS.map((m) => ({ value: String(m), label: AUTO_LOCK_LABEL[m] }))

type Dialog = 'change' | 'newKeyConfirm' | 'newKey' | 'faceRemove' | null

function ChangePasswordSheet({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const lock = useLock()
  const [oldPw, setOldPw] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const problem = !oldPw ? 'Bitte das aktuelle Passwort eingeben.' : validateNewPassword(password, repeat)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await lock.changePassword(oldPw, password)
      haptic()
      onChanged()
      onClose()
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  return (
    <Sheet title="Passwort ändern" onClose={onClose} dismissible={!busy}>
      <form onSubmit={submit} noValidate>
        <div className="card wide-labels pw-fields">
          <div className="field">
            <label htmlFor="chg-old">Aktuelles</label>
            <input
              id="chg-old"
              type="password"
              autoComplete="current-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={oldPw}
              disabled={busy}
              onChange={(e) => {
                setOldPw(e.target.value)
                setError(null)
              }}
              autoFocus
            />
          </div>
        </div>
        <div style={{ height: 12 }} />
        <PasswordFields
          idPrefix="chg"
          label="Neues"
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
          disabled={busy}
        />
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Wird gespeichert …' : 'Passwort ändern'}
        </button>
      </form>
    </Sheet>
  )
}

function NewRecoveryKeySheet({ recoveryKey, onClose }: { recoveryKey: string; onClose: () => void }) {
  const [noted, setNoted] = useState(false)
  return (
    <Sheet title="Neuer Schlüssel" onClose={onClose} dismissible={noted}>
      <p className="sheet-text">
        Das ist dein neuer Wiederherstellungsschlüssel. Der alte funktioniert nicht mehr. Notiere den neuen auf Papier und bewahre ihn
        sicher auf.
      </p>
      <RecoveryKeyBox recoveryKey={recoveryKey} />
      <label className="check-row">
        <input type="checkbox" checked={noted} onChange={(e) => setNoted(e.target.checked)} />
        <span>Ich habe den Schlüssel sicher notiert</span>
      </label>
      <button
        className="btn"
        type="button"
        disabled={!noted}
        onClick={() => {
          haptic()
          onClose()
        }}
      >
        Fertig
      </button>
    </Sheet>
  )
}

/** Settings section "Sicherheit": the app lock is always on (set up on first start), here it is only managed. */
export function AppLockSettings() {
  const lock = useLock()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [newKey, setNewKey] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const close = () => setDialog(null)

  async function generateKey() {
    close()
    try {
      setNewKey(await lock.regenerateRecoveryKey())
      setMsg(null)
      setDialog('newKey')
    } catch (e) {
      setMsg({ ok: false, text: errMsg(e) })
    }
  }

  async function addFaceId() {
    setMsg(null)
    try {
      await lock.addPasskey()
      haptic()
      setMsg({ ok: true, text: 'Face ID wurde hinzugefügt.' })
    } catch (e) {
      setMsg({ ok: false, text: errMsg(e) })
    }
  }

  function removeFaceId() {
    close()
    try {
      lock.removePasskey()
      setMsg({ ok: true, text: 'Face ID wurde entfernt.' })
    } catch (e) {
      setMsg({ ok: false, text: errMsg(e) })
    }
  }

  return (
    <>
      <div className="section-title">Sicherheit</div>
      <div className="card" style={{ padding: 12 }}>
        <div className="row-sub" style={{ marginBottom: 8 }}>
          Automatisch sperren
        </div>
        <SegmentedControl
          label="Automatisch sperren"
          options={AUTO_LOCK_CHOICES}
          value={String(lock.autoLockMinutes)}
          onChange={(v) => {
            try {
              lock.setAutoLock(Number(v) as AutoLockMinutes)
              setMsg(null)
            } catch (e) {
              setMsg({ ok: false, text: errMsg(e) })
            }
          }}
        />
      </div>
      <div className="footnote">
        {lock.autoLockMinutes === 0
          ? 'Sofort: Finanzklar sperrt sich, sobald du die App verlässt, und nach einer Minute ohne Eingabe.'
          : `Finanzklar sperrt sich, wenn du die App ${lock.autoLockMinutes} ${lock.autoLockMinutes === 1 ? 'Minute' : 'Minuten'} verlässt oder nicht benutzt.`}
      </div>
      <ul className="list card lock-rows" style={{ marginTop: 12 }}>
        {(lock.hasPasskey || lock.passkeyLikely) && (
          <li>
            <button className="row" onClick={lock.hasPasskey ? () => setDialog('faceRemove') : addFaceId}>
              <span className="row-main">
                <span className="row-title">Face ID</span>
                <span className="row-sub">{lock.hasPasskey ? 'Eingerichtet' : 'Nicht eingerichtet'}</span>
              </span>
              <span className={lock.hasPasskey ? 'row-action danger' : 'row-action'}>{lock.hasPasskey ? 'Entfernen' : 'Hinzufügen'}</span>
            </button>
          </li>
        )}
        <li>
          <button className="row" onClick={() => setDialog('change')}>
            <span className="row-main row-title">Passwort ändern</span>
          </button>
        </li>
        <li>
          <button className="row" onClick={() => setDialog('newKeyConfirm')}>
            <span className="row-main row-title">Neuen Wiederherstellungsschlüssel erzeugen</span>
          </button>
        </li>
        <li>
          <button className="row" onClick={() => lock.lockNow()}>
            <span className="row-main row-title">Jetzt sperren</span>
          </button>
        </li>
      </ul>
      {msg && (
        <div className={msg.ok ? 'success' : 'error'} role={msg.ok ? 'status' : 'alert'}>
          {msg.text}
        </div>
      )}

      {dialog === 'change' && (
        <ChangePasswordSheet onClose={close} onChanged={() => setMsg({ ok: true, text: 'Passwort wurde geändert.' })} />
      )}
      {dialog === 'newKeyConfirm' && (
        <ConfirmDialog
          title="Neuen Schlüssel erzeugen?"
          message="Der bisherige Wiederherstellungsschlüssel wird sofort ungültig. Du bekommst einen neuen, den du sicher notieren musst."
          confirmLabel="Neuen Schlüssel erzeugen"
          danger
          onCancel={close}
          onConfirm={generateKey}
        />
      )}
      {dialog === 'newKey' && <NewRecoveryKeySheet recoveryKey={newKey} onClose={() => { setNewKey(''); close() }} />}
      {dialog === 'faceRemove' && (
        <ConfirmDialog
          title="Face ID entfernen?"
          message="Danach entsperrst du Finanzklar nur noch mit Passwort oder Wiederherstellungsschlüssel."
          confirmLabel="Entfernen"
          danger
          onCancel={close}
          onConfirm={removeFaceId}
        />
      )}
    </>
  )
}
