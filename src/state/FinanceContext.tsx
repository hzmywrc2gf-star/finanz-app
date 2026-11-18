import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppData, CalendarEvent, Invoice, Kind } from '../domain/types'
import type { FinanceRepository } from '../data/repository'
import { LocalStorageRepository } from '../data/localStorageRepo'
import { todayISO } from '../domain/dates'
import { bookDue } from '../domain/recurring'
import type { RecurringSuggestion } from '../domain/recurringDetect'
import { haptic } from '../lib/haptics'
import { UndoToast } from '../components/UndoToast'
import * as A from './actions'
import type { ContractBookingInput, EventInput, InvoiceInput, RecurringInput, TodoInput, TodoListInput, TodoPatch, TransactionInput, TransferInput } from './actions'

export interface FinanceApi {
  data: AppData
  /** Last persistence error, if saving failed. */
  saveError: string | null
  addTransaction(input: TransactionInput): void
  updateTransaction(id: string, input: TransactionInput): void
  deleteTransaction(id: string): void
  setStartBalance(cents: number): void
  setStartCash(cents: number): void
  /** Name for the greeting after Face ID unlock; empty removes it. */
  setDisplayName(name: string): void
  addTransfer(input: TransferInput): void
  updateTransfer(id: string, input: TransferInput): void
  deleteTransfer(id: string): void
  addCategory(kind: Kind, name: string): void
  renameCategory(id: string, name: string): void
  deleteCategory(id: string): void
  /** cents = null removes the monthly budget. */
  setCategoryBudget(id: string, cents: number | null): void
  /** catchUp: also book the occurrences since startDate that lie in the past. */
  addRecurring(input: RecurringInput, catchUp: boolean): void
  updateRecurring(id: string, input: RecurringInput): void
  deleteRecurring(id: string): void
  /** Books the oldest pending occurrence of a manual contract with the given (edited) values. */
  confirmOccurrence(ruleId: string, occurrenceDate: string, input: ContractBookingInput): void
  /** Marks the oldest pending occurrence as handled without booking. */
  skipOccurrence(ruleId: string, occurrenceDate: string): void
  /** "Jetzt buchen": handles the next unhandled occurrence now, even if it lies in the future. */
  bookNextNow(ruleId: string, input: ContractBookingInput): void
  /** Kauf auf Rechnung: an open invoice, not a booking yet. */
  addInvoice(input: InvoiceInput): Invoice
  updateInvoice(id: string, input: InvoiceInput): void
  /** Removes an invoice without booking anything; "Rückgängig" in the toast restores it. */
  deleteInvoice(id: string): void
  /** Books the payment as a Konto expense and removes the invoice; "Rückgängig" restores the invoice and removes the booking. */
  payInvoice(id: string, opts: { paidDate: string; amountCents?: number }): void
  /** Partial return: new amount, the invoice stays open. */
  changeInvoiceAmount(id: string, amountCents: number): void
  /** "Komplett zurückgeschickt": removes the invoice, books nothing; undoable. */
  returnInvoice(id: string): void
  /** "Später": hides the reminder for two days (at most to "Zahlen bis"). */
  snoozeInvoice(id: string): void
  /** Calendar events (Termine). */
  addEvent(input: EventInput): void
  updateEvent(id: string, input: EventInput): void
  /** Deletes the whole event (a repeating one with all its dates); "Rückgängig" in the toast restores it. */
  deleteEvent(id: string): void
  /** "Nur diesen Termin": skips one date of a repeating event; undoable. */
  deleteOccurrence(id: string, date: string): void
  /** Imports parsed .ics events (duplicates are skipped); "Rückgängig" removes the batch. Returns the number added. */
  importEvents(events: Omit<CalendarEvent, 'id' | 'createdAt'>[]): number
  /** To-do: a new task (top of its list); returns its id. */
  addTodo(input: TodoInput): string
  updateTodo(id: string, patch: TodoPatch): void
  /** Ticks a task off (a repeating one creates its next copy) or opens it again. */
  toggleTodo(id: string): void
  toggleImportant(id: string): void
  /** true = „Mein Tag“ today, false = removed from it. */
  setMyDay(id: string, on: boolean): void
  /** Deletes a task; "Rückgängig" in the toast restores it. */
  deleteTodo(id: string): void
  addStep(todoId: string, title: string): void
  toggleStep(todoId: string, stepId: string): void
  updateStep(todoId: string, stepId: string, title: string): void
  deleteStep(todoId: string, stepId: string): void
  /** A new own list; returns its id. */
  addList(input: TodoListInput): string
  updateList(id: string, input: TodoListInput): void
  /** Deletes a list with its tasks; "Rückgängig" brings both back. */
  deleteList(id: string): void
  replaceAll(data: AppData): void
  /** "Alle Daten löschen": fresh start (only the name stays); "Rückgängig" in the toast brings everything back for 5 s. */
  resetAll(): void
  /** File import: adds the bookings (new categories are created); "Rückgängig" in the toast removes the whole batch. Returns the new ids. */
  importTransactions(bookings: A.ImportBooking[]): string[]
  /** Turns a found pattern into a Vertrag (links its bookings, handles the past); throws German errors. */
  createRecurringFromSuggestion(suggestion: RecurringSuggestion, autoBook: boolean): void
}

/** How often due recurring bookings are re-checked while the app stays open. */
const REBOOK_INTERVAL_MS = 60 * 60 * 1000

/** The most recent undoable change (delete or import), kept for "Rückgängig" (only one step back). */
type Undo = { id: number; message: string; revert: (d: AppData) => AppData }

const FinanceContext = createContext<FinanceApi | null>(null)

const defaultRepo = new LocalStorageRepository()

const SAVE_ERROR = 'Speichern fehlgeschlagen. Bitte Speicherplatz prüfen.'

export function FinanceProvider({
  children,
  repository = defaultRepo,
  seed = null,
}: {
  children: ReactNode
  repository?: FinanceRepository
  /** Data that replaces the in-memory data when the repository is swapped (restored backup during setup). */
  seed?: AppData | null
}) {
  const [data, setData] = useState<AppData | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [undo, setUndo] = useState<Undo | null>(null)
  const undoSeq = useRef(0)
  const ref = useRef<AppData | null>(null)

  useEffect(() => {
    // The repository was swapped while running (app lock turned on or off): hand the data we already hold to the
    // new one instead of reloading, so nothing changed in between is lost.
    if (ref.current) {
      if (seed && seed !== ref.current) {
        ref.current = seed
        setData(seed)
      }
      repository.save(ref.current).catch(() => setSaveError(SAVE_ERROR))
      return
    }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `seed` is only read at the moment the repository changes
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

  // The actions only depend on `apply`, so their identity survives data changes: memoized list rows can take them as props.
  const actions = useMemo<Omit<FinanceApi, 'data' | 'saveError'>>(
    () => ({
      addTransaction: (i) => apply((d) => A.addTransaction(d, i)),
      updateTransaction: (id, i) => apply((d) => A.updateTransaction(d, id, i)),
      deleteTransaction: (id) => {
        const value = ref.current?.transactions.find((t) => t.id === id)
        apply((d) => A.deleteTransaction(d, id))
        if (value) setUndo({ id: ++undoSeq.current, message: 'Buchung gelöscht', revert: (d) => A.restoreTransaction(d, value) })
      },
      setStartBalance: (c) => apply((d) => A.setStartBalance(d, c)),
      setStartCash: (c) => apply((d) => A.setStartCash(d, c)),
      setDisplayName: (n) => apply((d) => A.setDisplayName(d, n)),
      addTransfer: (i) => apply((d) => A.addTransfer(d, i)),
      updateTransfer: (id, i) => apply((d) => A.updateTransfer(d, id, i)),
      deleteTransfer: (id) => {
        const value = ref.current?.transfers.find((t) => t.id === id)
        apply((d) => A.deleteTransfer(d, id))
        if (value) setUndo({ id: ++undoSeq.current, message: 'Umbuchung gelöscht', revert: (d) => A.restoreTransfer(d, value) })
      },
      addCategory: (k, n) => apply((d) => A.addCategory(d, k, n)),
      renameCategory: (id, n) => apply((d) => A.renameCategory(d, id, n)),
      deleteCategory: (id) => apply((d) => A.deleteCategory(d, id)),
      setCategoryBudget: (id, c) => apply((d) => A.setCategoryBudget(d, id, c)),
      addRecurring: (i, catchUp) => apply((d) => A.addRecurring(d, i, { today: todayISO(), catchUp })),
      // switching a rule to automatic books its pending occurrences right away
      updateRecurring: (id, i) => apply((d) => bookDue(A.updateRecurring(d, id, i), todayISO())),
      deleteRecurring: (id) => apply((d) => A.deleteRecurring(d, id)),
      confirmOccurrence: (id, date, i) => apply((d) => A.confirmOccurrence(d, id, date, i)),
      skipOccurrence: (id, date) => apply((d) => A.skipOccurrence(d, id, date)),
      bookNextNow: (id, i) => apply((d) => A.bookNextNow(d, id, i)),
      addInvoice: (i) => {
        const id = crypto.randomUUID()
        apply((d) => A.addInvoice(d, i, Date.now(), id))
        return (ref.current as AppData).invoices.find((inv) => inv.id === id) as Invoice
      },
      updateInvoice: (id, i) => apply((d) => A.updateInvoice(d, id, i)),
      deleteInvoice: (id) => {
        const value = ref.current?.invoices.find((i) => i.id === id)
        apply((d) => A.deleteInvoice(d, id))
        if (value) setUndo({ id: ++undoSeq.current, message: 'Rechnung entfernt', revert: (d) => A.restoreInvoice(d, value) })
      },
      payInvoice: (id, opts) => {
        const value = ref.current?.invoices.find((i) => i.id === id)
        let result: A.PayInvoiceResult | undefined
        apply((d) => (result = A.payInvoice(d, id, opts)).data)
        const txId = (result as A.PayInvoiceResult).transactionId
        if (value) setUndo({ id: ++undoSeq.current, message: 'Rechnung bezahlt', revert: (d) => A.undoPayInvoice(d, value, txId) })
      },
      changeInvoiceAmount: (id, c) => apply((d) => A.changeInvoiceAmount(d, id, c)),
      returnInvoice: (id) => {
        const value = ref.current?.invoices.find((i) => i.id === id)
        apply((d) => A.returnInvoice(d, id))
        if (value) setUndo({ id: ++undoSeq.current, message: 'Rechnung entfernt', revert: (d) => A.restoreInvoice(d, value) })
      },
      addEvent: (i) => apply((d) => A.addEvent(d, i)),
      updateEvent: (id, i) => apply((d) => A.updateEvent(d, id, i)),
      deleteEvent: (id) => {
        const value = ref.current?.events.find((e) => e.id === id)
        apply((d) => A.deleteEvent(d, id))
        if (value) setUndo({ id: ++undoSeq.current, message: 'Termin gelöscht', revert: (d) => A.restoreEvent(d, value) })
      },
      deleteOccurrence: (id, date) => {
        apply((d) => A.deleteOccurrence(d, id, date))
        setUndo({ id: ++undoSeq.current, message: 'Termin gelöscht', revert: (d) => A.restoreOccurrence(d, id, date) })
      },
      importEvents: (events) => {
        let result: A.ImportEventsResult | undefined
        apply((d) => (result = A.importEvents(d, events)).data)
        const ids = (result as A.ImportEventsResult).eventIds
        if (ids.length > 0) setUndo({ id: ++undoSeq.current, message: ids.length === 1 ? '1 Termin importiert' : `${ids.length} Termine importiert`, revert: (d) => A.undoImportEvents(d, ids) })
        return ids.length
      },
      snoozeInvoice: (id) => apply((d) => A.snoozeInvoice(d, id, todayISO())),
      addTodo: (i) => {
        const meta = { id: crypto.randomUUID(), createdAt: Date.now() }
        apply((d) => A.addTodo(d, i, meta))
        return meta.id
      },
      updateTodo: (id, patch) => apply((d) => A.updateTodo(d, id, patch)),
      toggleTodo: (id) => apply((d) => A.toggleTodo(d, id, { now: Date.now(), today: todayISO() })),
      toggleImportant: (id) => apply((d) => A.toggleImportant(d, id)),
      setMyDay: (id, on) => apply((d) => A.setMyDay(d, id, on ? todayISO() : null)),
      deleteTodo: (id) => {
        const value = ref.current?.todos.find((t) => t.id === id)
        apply((d) => A.deleteTodo(d, id))
        if (value) setUndo({ id: ++undoSeq.current, message: 'Aufgabe gelöscht', revert: (d) => A.restoreTodo(d, value) })
      },
      addStep: (id, title) => apply((d) => A.addStep(d, id, title)),
      toggleStep: (id, stepId) => apply((d) => A.toggleStep(d, id, stepId)),
      updateStep: (id, stepId, title) => apply((d) => A.updateStep(d, id, stepId, title)),
      deleteStep: (id, stepId) => apply((d) => A.deleteStep(d, id, stepId)),
      addList: (i) => {
        const meta = { id: crypto.randomUUID(), createdAt: Date.now() }
        apply((d) => A.addList(d, i, meta))
        return meta.id
      },
      updateList: (id, i) => apply((d) => A.updateList(d, id, i)),
      deleteList: (id) => {
        const list = ref.current?.todoLists.find((l) => l.id === id)
        const todos = ref.current?.todos.filter((t) => t.listId === id) ?? []
        apply((d) => A.deleteList(d, id))
        if (list) setUndo({ id: ++undoSeq.current, message: 'Liste gelöscht', revert: (d) => A.restoreList(d, list, todos) })
      },
      // an older backup may already have occurrences due
      replaceAll: (nd) => {
        apply(() => bookDue(nd, todayISO()))
        setUndo(null)
      },
      resetAll: () => {
        const before = ref.current
        apply((d) => A.resetData(d))
        if (before) setUndo({ id: ++undoSeq.current, message: 'Alle Daten gelöscht', revert: () => before })
      },
      importTransactions: (bookings) => {
        let result: A.ImportResult | undefined
        apply((d) => (result = A.importTransactions(d, bookings)).data)
        const done = result as A.ImportResult
        const n = done.transactionIds.length
        setUndo({ id: ++undoSeq.current, message: n === 1 ? '1 Buchung importiert' : `${n} Buchungen importiert`, revert: (d) => A.undoImport(d, done) })
        return done.transactionIds
      },
      createRecurringFromSuggestion: (s, autoBook) =>
        apply((d) => bookDue(A.createRecurringFromSuggestion(d, s, { autoBook }), todayISO())),
    }),
    [apply],
  )
  const api = useMemo<FinanceApi | null>(() => (data ? { data, saveError, ...actions } : null), [data, saveError, actions])

  const undoDelete = () => {
    if (!undo) return
    haptic()
    try {
      apply(undo.revert)
    } catch {
      // already back (or data replaced): nothing to restore
    }
    setUndo(null)
  }
  const expireUndo = useCallback(() => setUndo(null), [])

  if (!api) return null
  return (
    <FinanceContext.Provider value={api}>
      {children}
      {undo && (
        <UndoToast
          id={undo.id}
          message={undo.message}
          onUndo={undoDelete}
          onExpire={expireUndo}
        />
      )}
    </FinanceContext.Provider>
  )
}

export function useFinance(): FinanceApi {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance muss innerhalb von FinanceProvider verwendet werden.')
  return ctx
}

