import { useState } from 'react'
import type { FormEvent } from 'react'
import { restoreVaultBackup } from '../data/vaultBackup'
import { exportJSON } from '../data/backup'
import { Sheet } from './Sheet'

/**
 * Opens a monthly backup file (encrypted vault snapshot) with the app password or the recovery key. A wrong entry
 * keeps the sheet open. The decrypted, validated data is handed on as JSON text for the usual `parseBackup` + confirmation.
 */
export function VaultBackupImportSheet({
  fileText,
  onClose,
  onRestored,
}: {
  fileText: string
  onClose: () => void
  onRestored: (json: string) => void
}) {
  const [secret, setSecret] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!secret.trim()) {
      setError('Bitte Passwort oder Schlüssel eingeben.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const data = await restoreVaultBackup(fileText, secret)
      setSecret('')
      onRestored(exportJSON(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Entschlüsseln fehlgeschlagen.')
      setBusy(false)
    }
  }

  return (
    <Sheet title="Sicherung entschlüsseln" onClose={onClose} dismissible={!busy}>
      <form onSubmit={submit} noValidate>
        <div className="card wide-labels">
          <div className="field">
            <label htmlFor="vb-secret">Passwort oder Wiederherstellungsschlüssel</label>
            <input
              id="vb-secret"
              type={show ? 'text' : 'password'}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={secret}
              disabled={busy}
              onChange={(e) => {
                setSecret(e.target.value)
                setError(null)
              }}
              autoFocus
            />
          </div>
        </div>
        <button type="button" className="link-btn" style={{ marginTop: 4 }} aria-pressed={show} onClick={() => setShow(!show)}>
          {show ? 'Eingabe verbergen' : 'Eingabe anzeigen'}
        </button>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="footnote">
          Das Passwort, mit dem die App beim Sichern gesperrt war, oder der Wiederherstellungsschlüssel aus der Einrichtung.
        </div>
        <button className="btn" type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Wird entschlüsselt …' : 'Entschlüsseln'}
        </button>
      </form>
    </Sheet>
  )
}
