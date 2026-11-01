import { backupDue } from '../domain/backupReminder'
import { formatDateDE, todayISO } from '../domain/dates'
import { useBackupSettings } from '../hooks/useBackupSettings'
import { useVaultBackup } from '../hooks/useVaultBackup'
import { snoozeBackup } from '../lib/backupReminder'
import { CloudUpIcon } from './Icons'

/** Start page: the monthly backup reminder. Renders nothing unless a backup is due (see `backupDue`). */
export function BackupReminderCard() {
  const { last, snoozedUntil, enabled } = useBackupSettings()
  const today = todayISO()
  if (!backupDue(today, last, snoozedUntil, enabled)) return null
  return <BackupCardBody today={today} last={last} />
}

// a separate component so the backup file is only prepared while the card is on screen
function BackupCardBody({ today, last }: { today: string; last: string | null }) {
  const { ready, busy, error, run } = useVaultBackup()
  return (
    <section className="pcard tint-sand" aria-label="Monatliche Sicherung">
      <div className="pcard-head">
        <h2>Monatliche Sicherung</h2>
      </div>
      <div className="prow">
        <span className="pico">
          <CloudUpIcon />
        </span>
        <span className="pmain">
          <div className="t">{last ? `Letzte Sicherung: ${formatDateDE(last)}` : 'Noch keine Sicherung'}</div>
          <div className="s">Wähle danach „In Dateien sichern“ → iCloud Drive.</div>
        </span>
      </div>
      {error && (
        <div className="error backup-error" role="alert">
          {error}
        </div>
      )}
      <div className="pactions backup-actions">
        <button className="pbtn" disabled={!ready || busy} aria-busy={busy} onClick={run}>
          Jetzt in iCloud sichern
        </button>
        <button className="pbtn soft backup-later" disabled={busy} onClick={() => snoozeBackup(today)}>
          Später
        </button>
      </div>
    </section>
  )
}
