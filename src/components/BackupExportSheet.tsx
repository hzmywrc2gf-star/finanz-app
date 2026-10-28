import { useState } from 'react'
import type { FormEvent } from 'react'
import { exportEncrypted } from '../data/backupCrypto'
import { todayISO } from '../domain/dates'
import type { AppData } from '../domain/types'
import { downloadTextFile } from '../lib/download'
import { haptic } from '../lib/haptics'
import { Sheet } from './Sheet'

export const MIN_PASSWORD_LENGTH = 10

/** Password prompt for the encrypted backup. The password lives only in this component's state until the file is made. */
export function BackupExportSheet({
  data,
  onClose,
  onExported,
  onPlain,
}: {
  data: AppData
  onClose: () => void
  onExported: () => void
  /** "Ohne Passwort exportieren": the parent asks for confirmation. */
  onPlain: () => void
}) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Das Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`)
      return
    }
    if (password !== repeat) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const text = await exportEncrypted(data, password)
      downloadTextFile(`finanz-backup-${todayISO()}-verschluesselt.json`, text)
      haptic()
      onExported()
      onClose()
    } catch {
      setError('Verschlüsseln fehlgeschlagen.')
      setBusy(false)
    }
  }

  const type = show ? 'text' : 'password'
  return (
    <Sheet title="Backup exportieren" onClose={onClose} dismissible={!busy}>
      <form onSubmit={submit} noValidate>
        <div className="card wide-labels pw-fields">
          <div className="field">
            <label htmlFor="bk-pw">Passwort</label>
            <input
              id="bk-pw"
              type={type}
              autoComplete="new-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={password}
              disabled={busy}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="bk-pw2">Passwort wiederholen</label>
            <input
              id="bk-pw2"
              type={type}
              autoComplete="new-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={repeat}
              disabled={busy}
              onChange={(e) => {
                setRepeat(e.target.value)
                setError(null)
              }}
            />
          </div>
        </div>
        <button type="button" className="link-btn" style={{ marginTop: 4 }} aria-pressed={show} onClick={() => setShow(!show)}>
          {show ? 'Passwort verbergen' : 'Passwort anzeigen'}
        </button>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="footnote">
          Mindestens {MIN_PASSWORD_LENGTH} Zeichen. Ohne dieses Passwort lässt sich das Backup nicht wiederherstellen. Es wird nirgends
          gespeichert.
        </div>
        <button className="btn" type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Wird verschlüsselt …' : 'Verschlüsselt exportieren'}
        </button>
        <button type="button" className="link-btn plain-export" disabled={busy} onClick={onPlain}>
          Ohne Passwort exportieren
        </button>
      </form>
    </Sheet>
  )
}
