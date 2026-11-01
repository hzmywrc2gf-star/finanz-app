/**
 * Monthly backup reminder: pure logic. The reminder is due once per calendar month: as soon as the month of `today`
 * is later than the month of the last backup (so on the 1st, and on any later day if the 1st was missed).
 */

const month = (iso: string) => iso.slice(0, 7)

/**
 * @param today ISO date of today (local)
 * @param lastBackupISO date of the last successful backup on this device, or null if there was none yet
 * @param snoozedUntil "Später" hides the card until this date (exclusive: shown again ON this date), or null
 * @param enabled the switch "Am 1. des Monats erinnern"
 */
export function backupDue(today: string, lastBackupISO: string | null, snoozedUntil: string | null, enabled: boolean): boolean {
  if (!enabled) return false
  if (snoozedUntil !== null && today < snoozedUntil) return false
  if (lastBackupISO === null) return true
  return month(today) > month(lastBackupISO)
}
