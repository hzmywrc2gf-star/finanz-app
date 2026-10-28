import { useState } from 'react'
import type { FormEvent } from 'react'
import { decodeBackupFile } from '../data/backupCrypto'
import { Sheet } from './Sheet'

/** Password prompt for an encrypted backup file. A wrong password keeps the sheet open for another try. */
export function BackupImportSheet({
  fileText,
  onClose,
  onDecrypted,
}: {
  fileText: string
  onClose: () => void
  /** The decrypted JSON text, still to be validated by `parseBackup`. */
  onDecrypted: (json: string) => void
}) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!password) {
      setError('Bitte das Passwort eingeben.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const json = await decodeBackupFile(fileText, password)
      onDecrypted(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Entschlüsseln fehlgeschlagen.')
      setBusy(false)
    }
  }

  return (
    <Sheet title="Backup entschlüsseln" onClose={onClose} dismissible={!busy}>
      <form onSubmit={submit} noValidate>
        <div className="card wide-labels">
          <div className="field">
            <label htmlFor="bk-open-pw">Passwort</label>
            <input
              id="bk-open-pw"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
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
        </div>
        <button type="button" className="link-btn" style={{ marginTop: 4 }} aria-pressed={show} onClick={() => setShow(!show)}>
          {show ? 'Passwort verbergen' : 'Passwort anzeigen'}
        </button>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="footnote">Diese Datei ist mit einem Passwort verschlüsselt.</div>
        <button className="btn" type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Wird entschlüsselt …' : 'Entschlüsseln'}
        </button>
      </form>
    </Sheet>
  )
}
