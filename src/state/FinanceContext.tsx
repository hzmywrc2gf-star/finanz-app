import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppData, Kind } from '../domain/types'
import type { FinanceRepository } from '../data/repository'
import { LocalStorageRepository } from '../data/localStorageRepo'
import { todayISO } from '../domain/dates'
import { bookDue } from '../domain/recurring'
import * as A from './actions'
import type { RecurringInput, TransactionInput } from './actions'

export interface FinanceApi {
  data: AppData
  /** Last persistence error, if saving failed. */
  saveError: string | null
  addTransaction(input: TransactionInput): void
  updateTransaction(id: string, input: TransactionInput): void
  deleteTransaction(id: string): void
  setStartBalance(cents: number): void
  addCategory(kind: Kind, name: string): void
  renameCategory(id: string, name: string): void
  deleteCategory(id: string): void
  /** cents = null removes the monthly budget. */
  setCategoryBudget(id: string, cents: number | null): void
  /** catchUp: also book the occurrences since startDate that lie in the past. */
  addRecurring(input: RecurringInput, catchUp: boolean): void
  updateRecurring(id: string, input: RecurringInput): void
  deleteRecurring(id: string): void
  replaceAll(data: AppData): void
}

/** How often due recurring bookings are re-checked while the app stays open. */
const REBOOK_INTERVAL_MS = 60 * 60 * 1000

const FinanceContext = createContext<FinanceApi | null>(null)

const defaultRepo = new LocalStorageRepository()

const SAVE_ERROR = 'Speichern fehlgeschlagen. Bitte Speicherplatz prüfen.'

export function FinanceProvider({
  children,
  repository = defaultRepo,
}: {
  children: ReactNode
  repository?: FinanceRepository
}) {
  const [data, setData] = useState<AppData | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const ref = useRef<AppData | null>(null)

  useEffect(() => {
    let cancelled = false
    repository.load().then((d) => {
      if (cancelled) return
      const booked = bookDue(d, todayISO())
      ref.current = booked
      setData(booked)
      if (booked !== d) repository.save(booked).catch(() => setSaveError(SAVE_ERROR))
    })
    return () => {
      cancelled = true
    }
  }, [repository])

  const commit = useCallback(
    (next: AppData) => {
      ref.current = next
      setData(next)
      repository.save(next).then(
        () => setSaveError(null),
        () => setSaveError(SAVE_ERROR),
      )
    },
    [repository],
  )

  // Actions may throw (German validation errors) so forms can show them.
  const apply = useCallback(
    (fn: (d: AppData) => AppData) => {
      const current = ref.current
      if (!current) throw new Error('Daten werden noch geladen.')
      commit(fn(current))
    },
    [commit],
  )

  // The date can change while the app stays open (or in the background): re-check when it
  // becomes visible again and once an hour.
  useEffect(() => {
    const rebook = () => {
      const current = ref.current
      if (!current) return
      const next = bookDue(current, todayISO())
      if (next !== current) commit(next)
    }
    const onVisible = () => document.visibilityState === 'visible' && rebook()
    document.addEventListener('visibilitychange', onVisible)
    const timer = setInterval(rebook, REBOOK_INTERVAL_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(timer)
    }
  }, [commit])

  const api = useMemo<FinanceApi | null>(() => {
    if (!data) return null
    return {
      data,
      saveError,
      addTransaction: (i) => apply((d) => A.addTransaction(d, i)),
      updateTransaction: (id, i) => apply((d) => A.updateTransaction(d, id, i)),
      deleteTransaction: (id) => apply((d) => A.deleteTransaction(d, id)),
      setStartBalance: (c) => apply((d) => A.setStartBalance(d, c)),
      addCategory: (k, n) => apply((d) => A.addCategory(d, k, n)),
      renameCategory: (id, n) => apply((d) => A.renameCategory(d, id, n)),
      deleteCategory: (id) => apply((d) => A.deleteCategory(d, id)),
      setCategoryBudget: (id, c) => apply((d) => A.setCategoryBudget(d, id, c)),
      addRecurring: (i, catchUp) => apply((d) => A.addRecurring(d, i, { today: todayISO(), catchUp })),
      updateRecurring: (id, i) => apply((d) => A.updateRecurring(d, id, i)),
      deleteRecurring: (id) => apply((d) => A.deleteRecurring(d, id)),
      // an older backup may already have occurrences due
      replaceAll: (nd) => apply(() => bookDue(nd, todayISO())),
    }
  }, [data, saveError, apply])

  if (!api) return null
  return <FinanceContext.Provider value={api}>{children}</FinanceContext.Provider>
}

export function useFinance(): FinanceApi {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance muss innerhalb von FinanceProvider verwendet werden.')
  return ctx
}

