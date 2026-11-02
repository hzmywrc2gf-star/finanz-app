import { useSyncExternalStore } from 'react'
import {
  backupSettingsSnapshot,
  getBackupReminderEnabled,
  getBackupSnooze,
  getLastBackup,
  subscribeBackupSettings,
} from '../lib/backupReminder'

/** The device settings of the monthly backup (last backup, "Später", reminder switch); re-renders when one changes. */
export function useBackupSettings() {
  useSyncExternalStore(subscribeBackupSettings, backupSettingsSnapshot)
  return { last: getLastBackup(), snoozedUntil: getBackupSnooze(), enabled: getBackupReminderEnabled() }
}
