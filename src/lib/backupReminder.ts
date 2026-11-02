/** Device settings of the monthly backup reminder (like the theme: not part of AppData or any backup). Every access is guarded. */
import { addDays, isValidISODate } from '../domain/dates'

export const LAST_BACKUP_KEY = 'finanz-app:last-backup'
export const BACKUP_SNOOZE_KEY = 'finanz-app:backup-snooze'
export const BACKUP_REMINDER_KEY = 'finanz-app:backup-reminder'

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function readDate(key: string): string | null {
  try {
    const v = localStorage.getItem(key)
    return v !== null && isValidISODate(v) ? v : null
  } catch {
    return null
  }
}

function writeItem(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // storage blocked: the choice then only lasts until the page is reloaded
  }
  notify()
}

export const getLastBackup = () => readDate(LAST_BACKUP_KEY)
export const getBackupSnooze = () => readDate(BACKUP_SNOOZE_KEY)

export function getBackupReminderEnabled(): boolean {
  try {
    return localStorage.getItem(BACKUP_REMINDER_KEY) !== 'off'
  } catch {
    return true
  }
}

/** A finished backup: remember the day and drop a pending "Später". */
export function recordBackup(today: string): void {
  try {
    localStorage.removeItem(BACKUP_SNOOZE_KEY)
  } catch {
    /* ignore */
  }
  writeItem(LAST_BACKUP_KEY, today)
}

/** "Später": hidden until tomorrow. */
export function snoozeBackup(today: string): void {
  writeItem(BACKUP_SNOOZE_KEY, addDays(today, 1))
}

export function setBackupReminderEnabled(on: boolean): void {
  writeItem(BACKUP_REMINDER_KEY, on ? null : 'off')
}

/** For `useSyncExternalStore`: re-render when one of the settings changed in this tab. */
export function subscribeBackupSettings(listener: () => void): () => void {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/** One string for the three values (a stable snapshot for `useSyncExternalStore`). */
export const backupSettingsSnapshot = () => `${getLastBackup() ?? ''}|${getBackupSnooze() ?? ''}|${getBackupReminderEnabled() ? 1 : 0}`
