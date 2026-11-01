import { useCallback, useEffect, useRef, useState } from 'react'
import { todayISO } from '../domain/dates'
import type { AppData } from '../domain/types'
import { recordBackup } from '../lib/backupReminder'
import { downloadFile } from '../lib/download'
import { haptic } from '../lib/haptics'
import { useFinance } from '../state/FinanceContext'
import { useLock } from '../state/LockContext'

const ERR_BACKUP = 'Die Sicherung konnte nicht erstellt werden.'

export type BackupOutcome = 'shared' | 'downloaded'

/**
 * One-tap backup. The file is built AHEAD of the tap (and rebuilt after every data change), because iOS only allows
 * `navigator.share()` right after a tap: creating the file needs an async flush of pending saves, which would use up
 * the user activation. `run()` therefore does nothing asynchronous before it calls `share()`.
 * Without Web Share for files (desktop browsers) the file is downloaded instead.
 */
export function useVaultBackup(onDone?: (outcome: BackupOutcome) => void) {
  const { data } = useFinance()
  const { createVaultBackup } = useLock()
  const [built, setBuilt] = useState<{ data: AppData; file: File } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<File | null>(null)
  const busyRef = useRef(false)
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  })

  useEffect(() => {
    let cancelled = false
    createVaultBackup().then(
      (file) => {
        if (cancelled) return
        fileRef.current = file
        setBuilt({ data, file })
      },
      () => {
        if (!cancelled) setError(ERR_BACKUP)
      },
    )
    return () => {
      cancelled = true
    }
  }, [data, createVaultBackup])

  const ready = built !== null && built.data === data

  /** Call straight from the click handler. */
  const run = useCallback(() => {
    const file = fileRef.current
    if (!file || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    let outcome: Promise<BackupOutcome>
    try {
      // no `await` before this point: the share sheet needs the tap's user activation
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        outcome = navigator.share({ files: [file], title: 'Finanzklar-Sicherung' }).then(() => 'shared' as const)
      } else {
        downloadFile(file.name, file, 'application/json')
        outcome = Promise.resolve('downloaded' as const)
      }
    } catch (e) {
      outcome = Promise.reject(e)
    }
    outcome
      .then(
        (result) => {
          recordBackup(todayISO())
          haptic()
          doneRef.current?.(result)
        },
        (e: unknown) => {
          // closing the share sheet is not a failure and not a backup either
          if (e instanceof DOMException && e.name === 'AbortError') return
          setError(ERR_BACKUP)
        },
      )
      .finally(() => {
        busyRef.current = false
        setBusy(false)
      })
  }, [])

  return { ready, busy, error, run }
}
