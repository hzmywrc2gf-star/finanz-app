import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppData, Kind } from '../domain/types'
import type { FinanceRepository } from '../data/repository'
import { LocalStorageRepository } from '../data/localStorageRepo'
import * as A from './actions'
import type { TransactionInput } from './actions'

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
  replaceAll(data: AppData): void
}

const FinanceContext = createContext<FinanceApi | null>(null)

const defaultRepo = new LocalStorageRepository()

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
      ref.current = d
      setData(d)
    })
    return () => {
      cancelled = true
    }
  }, [repository])

  // Actions may throw (German validation errors) so forms can show them.
  const apply = useCallback(
    (fn: (d: AppData) => AppData) => {
      const current = ref.current
      if (!current) throw new Error('Daten werden noch geladen.')
      const next = fn(current)
      ref.current = next
      setData(next)
      repository.save(next).then(
        () => setSaveError(null),
        () => setSaveError('Speichern fehlgeschlagen. Bitte Speicherplatz prüfen.'),
      )
    },
    [repository],
  )

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
      replaceAll: (nd) => apply(() => nd),
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

