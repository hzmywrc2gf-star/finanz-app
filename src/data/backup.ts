import type { Account, AppData, CalendarEvent, Category, EventRecurrence, Interval, Invoice, Kind, RecurringRule, Transaction, Transfer, TransferDirection } from '../domain/types'
import { isValidISODate } from '../domain/dates'
import { FALLBACK_NAME } from '../domain/defaults'
import { migrate } from './migrate'

export function exportJSON(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

/** Longest accepted greeting name. */
export const MAX_NAME_LENGTH = 40

const fail = (msg: string): never => {
  throw new Error(`Ungültige Sicherungsdatei: ${msg}`)
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isKind = (v: unknown): v is Kind => v === 'income' || v === 'expense'

const isAccount = (v: unknown): v is Account => v === 'konto' || v === 'bargeld'

const isDirection = (v: unknown): v is TransferDirection => v === 'withdrawal' || v === 'deposit'

const isInterval = (v: unknown): v is Interval => v === 'monthly' || v === 'quarterly' || v === 'yearly'

const isLocalDateTime = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return false
  const h = Number(v.slice(11, 13))
  const m = Number(v.slice(14, 16))
  return isValidISODate(v.slice(0, 10)) && h < 24 && m < 60
}

function validateRecurrence(r: unknown): EventRecurrence {
  if (!isObj(r)) return fail('Eine Terminwiederholung ist ungültig.')
  const { freq, interval, until, count, byWeekday } = r
  if (freq !== 'daily' && freq !== 'weekly' && freq !== 'monthly' && freq !== 'yearly') return fail('Eine Terminwiederholung hat einen ungültigen Rhythmus.')
  if (typeof interval !== 'number' || !Number.isInteger(interval) || interval < 1 || interval > 99) return fail('Der Abstand einer Terminwiederholung ist ungültig (1–99).')
  const out: EventRecurrence = { freq, interval }
  if (until !== undefined) {
    if (typeof until !== 'string' || !isValidISODate(until)) return fail('Das Ende einer Terminwiederholung ist ungültig.')
    out.until = until
  }
  if (count !== undefined) {
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > 1000) return fail('Die Anzahl einer Terminwiederholung ist ungültig (1–1000).')
    out.count = count
  }
  if (byWeekday !== undefined) {
    if (freq !== 'weekly') return fail('Wochentage gibt es nur bei wöchentlichen Terminen.')
    if (!Array.isArray(byWeekday) || byWeekday.length === 0 || byWeekday.length > 7 || byWeekday.some((d) => typeof d !== 'number' || !Number.isInteger(d) || d < 0 || d > 6) || new Set(byWeekday).size !== byWeekday.length) {
      return fail('Die Wochentage einer Terminwiederholung sind ungültig.')
    }
    out.byWeekday = [...(byWeekday as number[])].sort((a, b) => a - b)
  }
  return out
}

function validateEvents(list: unknown[]): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const ids = new Set<string>()
  for (const e of list) {
    if (!isObj(e)) return fail('Ein Termin ist ungültig.')
    if (typeof e.id !== 'string' || !e.id) return fail('Ein Termin hat keine ID.')
    if (ids.has(e.id)) return fail('Doppelte Termin-ID.')
    ids.add(e.id)
    if (typeof e.title !== 'string' || !e.title.trim() || e.title.length > 200 || e.title.trim() !== e.title) return fail('Ein Termin hat keinen gültigen Titel (1–200 Zeichen).')
    if (typeof e.allDay !== 'boolean') return fail('Ein Termin hat keine Angabe zu „ganztägig“.')
    if (typeof e.createdAt !== 'number' || !Number.isFinite(e.createdAt)) return fail('Ein Erstellungszeitpunkt bei Terminen ist ungültig.')
    if (e.allDay) {
      if (typeof e.start !== 'string' || !isValidISODate(e.start) || typeof e.end !== 'string' || !isValidISODate(e.end)) return fail('Ein Datum bei Terminen ist ungültig.')
    } else if (!isLocalDateTime(e.start) || !isLocalDateTime(e.end)) {
      return fail('Eine Uhrzeit bei Terminen ist ungültig.')
    }
    if ((e.end as string) < (e.start as string)) return fail('Ein Termin endet vor seinem Beginn.')
    if (!e.allDay && e.end === e.start) return fail('Ein Termin endet vor seinem Beginn.')
    const ev: CalendarEvent = { id: e.id, createdAt: e.createdAt, title: e.title, allDay: e.allDay, start: e.start as string, end: e.end as string }
    if (e.location !== undefined) {
      if (typeof e.location !== 'string' || e.location.length > 200) return fail('Ein Ort bei Terminen ist ungültig (höchstens 200 Zeichen).')
      if (e.location) ev.location = e.location
    }
    if (e.notes !== undefined) {
      if (typeof e.notes !== 'string' || e.notes.length > 2000) return fail('Eine Notiz bei Terminen ist ungültig (höchstens 2000 Zeichen).')
      if (e.notes) ev.notes = e.notes
    }
    if (e.recurrence !== undefined) ev.recurrence = validateRecurrence(e.recurrence)
    if (e.exdates !== undefined) {
      if (!Array.isArray(e.exdates) || e.exdates.some((d) => typeof d !== 'string' || !isValidISODate(d))) return fail('Ausgenommene Termine sind ungültig.')
      if (e.exdates.length) ev.exdates = [...(e.exdates as string[])]
    }
    if (e.importUid !== undefined) {
      if (typeof e.importUid !== 'string' || !e.importUid || e.importUid.length > 300) return fail('Eine Import-Kennung bei Terminen ist ungültig.')
      ev.importUid = e.importUid
    }
    events.push(ev)
  }
  return events
}

/** Strictly validates a parsed object of the current version (8); also used for stored data. Throws German Error. */
export function validateAppData(raw: unknown): AppData {
  if (!isObj(raw)) return fail('Kein gültiges Objekt.')
  if (raw.version !== 8) return fail('Unbekannte Version.')
  if (!isObj(raw.settings)) return fail('Einstellungen fehlen.')
  const start = raw.settings.startBalanceCents
  if (typeof start !== 'number' || !Number.isSafeInteger(start)) {
    return fail('Startguthaben ist keine ganze Zahl (Cent).')
  }
  const startCash = raw.settings.startCashCents
  if (typeof startCash !== 'number' || !Number.isSafeInteger(startCash)) {
    return fail('Startbestand Bargeld ist keine ganze Zahl (Cent).')
  }
  let displayName: string | undefined
  if (raw.settings.displayName !== undefined) {
    const n = raw.settings.displayName
    if (typeof n !== 'string' || n.length > MAX_NAME_LENGTH) return fail(`Der Name ist ungültig (höchstens ${MAX_NAME_LENGTH} Zeichen).`)
    if (n.trim() !== n) return fail('Der Name hat überflüssige Leerzeichen.')
    if (n) displayName = n
  }
  if (!Array.isArray(raw.categories)) return fail('Kategorien fehlen.')
  if (!Array.isArray(raw.transactions)) return fail('Buchungen fehlen.')
  if (!Array.isArray(raw.recurring)) return fail('Wiederkehrende Buchungen fehlen.')
  if (!Array.isArray(raw.transfers)) return fail('Umbuchungen fehlen.')
  if (!Array.isArray(raw.invoices)) return fail('Rechnungen fehlen.')
  if (!Array.isArray(raw.events)) return fail('Termine fehlen.')

  const categories: Category[] = []
  const catIds = new Map<string, Category>()
  for (const c of raw.categories as unknown[]) {
    if (!isObj(c)) return fail('Eine Kategorie ist ungültig.')
    if (typeof c.id !== 'string' || !c.id) return fail('Eine Kategorie hat keine ID.')
    if (typeof c.name !== 'string' || !c.name.trim()) return fail('Eine Kategorie hat keinen Namen.')
    if (!isKind(c.kind)) return fail(`Kategorie „${c.name}“ hat eine ungültige Art.`)
    if (typeof c.builtIn !== 'boolean') return fail(`Kategorie „${c.name}“ ist ungültig.`)
    if (catIds.has(c.id)) return fail('Doppelte Kategorie-ID.')
    const cat: Category = { id: c.id, name: c.name, kind: c.kind, builtIn: c.builtIn }
    if (c.monthlyBudgetCents !== undefined) {
      if (c.kind !== 'expense') return fail(`Kategorie „${c.name}“: Budgets gibt es nur für Ausgaben-Kategorien.`)
      if (typeof c.monthlyBudgetCents !== 'number' || !Number.isSafeInteger(c.monthlyBudgetCents) || c.monthlyBudgetCents <= 0) {
        return fail(`Das Budget der Kategorie „${c.name}“ ist keine positive ganze Zahl (Cent).`)
      }
      cat.monthlyBudgetCents = c.monthlyBudgetCents
    }
    categories.push(cat)
    catIds.set(cat.id, cat)
  }
  for (const kind of ['income', 'expense'] as const) {
    if (!categories.some((c) => c.kind === kind && c.builtIn && c.name === FALLBACK_NAME)) {
      return fail(`Kategorie „${FALLBACK_NAME}“ (${kind === 'income' ? 'Einnahmen' : 'Ausgaben'}) fehlt.`)
    }
  }

  const transactions: Transaction[] = []
  const txIds = new Set<string>()
  for (const t of raw.transactions as unknown[]) {
    if (!isObj(t)) return fail('Eine Buchung ist ungültig.')
    if (typeof t.id !== 'string' || !t.id) return fail('Eine Buchung hat keine ID.')
    if (txIds.has(t.id)) return fail('Doppelte Buchungs-ID.')
    txIds.add(t.id)
    if (!isKind(t.kind)) return fail('Eine Buchung hat eine ungültige Art.')
    if (typeof t.amountCents !== 'number' || !Number.isSafeInteger(t.amountCents) || t.amountCents <= 0) {
      return fail('Ein Betrag ist keine positive ganze Zahl (Cent).')
    }
    if (typeof t.date !== 'string' || !isValidISODate(t.date)) return fail('Ein Datum ist ungültig.')
    if (typeof t.categoryId !== 'string') return fail('Eine Buchung hat keine Kategorie.')
    const cat = catIds.get(t.categoryId)
    if (!cat) return fail('Eine Buchung verweist auf eine unbekannte Kategorie.')
    if (cat.kind !== t.kind) return fail('Art von Buchung und Kategorie stimmen nicht überein.')
    if (t.note !== undefined && typeof t.note !== 'string') return fail('Eine Notiz ist ungültig.')
    if (!isAccount(t.account)) return fail('Eine Buchung hat ein ungültiges Konto.')
    if (typeof t.createdAt !== 'number' || !Number.isFinite(t.createdAt)) {
      return fail('Ein Erstellungszeitpunkt ist ungültig.')
    }
    const tx: Transaction = {
      id: t.id,
      kind: t.kind,
      amountCents: t.amountCents,
      date: t.date,
      categoryId: t.categoryId,
      account: t.account,
      createdAt: t.createdAt,
    }
    if (t.note) tx.note = t.note
    // may point to a rule that was deleted later, so it is not checked against the rules
    if (t.recurringId !== undefined) {
      if (typeof t.recurringId !== 'string' || !t.recurringId) return fail('Eine Buchung hat eine ungültige Regel-ID.')
      tx.recurringId = t.recurringId
    }
    transactions.push(tx)
  }

  const recurring: RecurringRule[] = []
  const ruleIds = new Set<string>()
  for (const r of raw.recurring as unknown[]) {
    if (!isObj(r)) return fail('Eine wiederkehrende Buchung ist ungültig.')
    if (typeof r.id !== 'string' || !r.id) return fail('Eine wiederkehrende Buchung hat keine ID.')
    if (ruleIds.has(r.id)) return fail('Doppelte ID bei wiederkehrenden Buchungen.')
    ruleIds.add(r.id)
    if (!isKind(r.kind)) return fail('Eine wiederkehrende Buchung hat eine ungültige Art.')
    if (typeof r.amountCents !== 'number' || !Number.isSafeInteger(r.amountCents) || r.amountCents <= 0) {
      return fail('Ein Betrag bei wiederkehrenden Buchungen ist keine positive ganze Zahl (Cent).')
    }
    if (typeof r.categoryId !== 'string') return fail('Eine wiederkehrende Buchung hat keine Kategorie.')
    const cat = catIds.get(r.categoryId)
    if (!cat) return fail('Eine wiederkehrende Buchung verweist auf eine unbekannte Kategorie.')
    if (cat.kind !== r.kind) return fail('Art und Kategorie einer wiederkehrenden Buchung stimmen nicht überein.')
    if (r.note !== undefined && typeof r.note !== 'string') return fail('Eine Notiz bei wiederkehrenden Buchungen ist ungültig.')
    if (!isInterval(r.interval)) return fail('Ein Rhythmus bei wiederkehrenden Buchungen ist ungültig.')
    if (typeof r.dayOfMonth !== 'number' || !Number.isInteger(r.dayOfMonth) || r.dayOfMonth < 1 || r.dayOfMonth > 31) {
      return fail('Ein Tag im Monat bei wiederkehrenden Buchungen ist ungültig (1–31).')
    }
    if (typeof r.startDate !== 'string' || !isValidISODate(r.startDate)) return fail('Ein Startdatum ist ungültig.')
    if (r.endDate !== undefined) {
      if (typeof r.endDate !== 'string' || !isValidISODate(r.endDate)) return fail('Ein Enddatum ist ungültig.')
      if (r.endDate < r.startDate) return fail('Ein Enddatum liegt vor dem Startdatum.')
    }
    if (typeof r.bookedThrough !== 'string' || !isValidISODate(r.bookedThrough)) {
      return fail('Ein Buchungsstand bei wiederkehrenden Buchungen ist ungültig.')
    }
    if (typeof r.autoBook !== 'boolean') return fail('Eine wiederkehrende Buchung hat keine Angabe zum automatischen Buchen.')
    const rule: RecurringRule = {
      id: r.id,
      kind: r.kind,
      amountCents: r.amountCents,
      categoryId: r.categoryId,
      interval: r.interval,
      dayOfMonth: r.dayOfMonth,
      startDate: r.startDate,
      bookedThrough: r.bookedThrough,
      autoBook: r.autoBook,
    }
    if (r.note) rule.note = r.note
    if (r.endDate !== undefined) rule.endDate = r.endDate
    recurring.push(rule)
  }

  const transfers: Transfer[] = []
  const transferIds = new Set<string>()
  for (const tr of raw.transfers as unknown[]) {
    if (!isObj(tr)) return fail('Eine Umbuchung ist ungültig.')
    if (typeof tr.id !== 'string' || !tr.id) return fail('Eine Umbuchung hat keine ID.')
    if (transferIds.has(tr.id)) return fail('Doppelte Umbuchungs-ID.')
    transferIds.add(tr.id)
    if (!isDirection(tr.direction)) return fail('Eine Umbuchung hat eine ungültige Richtung.')
    if (typeof tr.amountCents !== 'number' || !Number.isSafeInteger(tr.amountCents) || tr.amountCents <= 0) {
      return fail('Ein Betrag bei Umbuchungen ist keine positive ganze Zahl (Cent).')
    }
    if (typeof tr.date !== 'string' || !isValidISODate(tr.date)) return fail('Ein Datum bei Umbuchungen ist ungültig.')
    if (tr.note !== undefined && typeof tr.note !== 'string') return fail('Eine Notiz bei Umbuchungen ist ungültig.')
    if (typeof tr.createdAt !== 'number' || !Number.isFinite(tr.createdAt)) {
      return fail('Ein Erstellungszeitpunkt bei Umbuchungen ist ungültig.')
    }
    const transfer: Transfer = {
      id: tr.id,
      direction: tr.direction,
      amountCents: tr.amountCents,
      date: tr.date,
      createdAt: tr.createdAt,
    }
    if (tr.note) transfer.note = tr.note
    transfers.push(transfer)
  }

  const invoices: Invoice[] = []
  const invoiceIds = new Set<string>()
  for (const inv of raw.invoices as unknown[]) {
    if (!isObj(inv)) return fail('Eine Rechnung ist ungültig.')
    if (typeof inv.id !== 'string' || !inv.id) return fail('Eine Rechnung hat keine ID.')
    if (invoiceIds.has(inv.id)) return fail('Doppelte Rechnungs-ID.')
    invoiceIds.add(inv.id)
    if (typeof inv.amountCents !== 'number' || !Number.isSafeInteger(inv.amountCents) || inv.amountCents <= 0) {
      return fail('Ein Betrag bei Rechnungen ist keine positive ganze Zahl (Cent).')
    }
    if (typeof inv.categoryId !== 'string') return fail('Eine Rechnung hat keine Kategorie.')
    const cat = catIds.get(inv.categoryId)
    if (!cat) return fail('Eine Rechnung verweist auf eine unbekannte Kategorie.')
    if (cat.kind !== 'expense') return fail('Die Kategorie einer Rechnung ist keine Ausgaben-Kategorie.')
    if (inv.note !== undefined && (typeof inv.note !== 'string' || inv.note.length > 200)) return fail('Eine Notiz bei Rechnungen ist ungültig.')
    if (typeof inv.purchaseDate !== 'string' || !isValidISODate(inv.purchaseDate)) return fail('Ein Kaufdatum bei Rechnungen ist ungültig.')
    if (typeof inv.dueDate !== 'string' || !isValidISODate(inv.dueDate)) return fail('Ein Zahlungsdatum bei Rechnungen ist ungültig.')
    if (inv.dueDate < inv.purchaseDate) return fail('Eine Rechnung ist vor dem Kaufdatum fällig.')
    if (inv.snoozedUntil !== undefined && (typeof inv.snoozedUntil !== 'string' || !isValidISODate(inv.snoozedUntil))) {
      return fail('Ein Erinnerungsaufschub bei Rechnungen ist ungültig.')
    }
    if (typeof inv.createdAt !== 'number' || !Number.isFinite(inv.createdAt)) {
      return fail('Ein Erstellungszeitpunkt bei Rechnungen ist ungültig.')
    }
    const invoice: Invoice = {
      id: inv.id,
      createdAt: inv.createdAt,
      categoryId: inv.categoryId,
      amountCents: inv.amountCents,
      purchaseDate: inv.purchaseDate,
      dueDate: inv.dueDate,
    }
    if (inv.note) invoice.note = inv.note
    if (inv.snoozedUntil !== undefined) invoice.snoozedUntil = inv.snoozedUntil
    invoices.push(invoice)
  }

  const events = validateEvents(raw.events as unknown[])

  return {
    version: 8,
    settings: { startBalanceCents: start, startCashCents: startCash, ...(displayName ? { displayName } : {}) },
    categories,
    transactions,
    recurring,
    transfers,
    invoices,
    events,
  }
}

export function parseBackup(text: string): AppData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Ungültige Sicherungsdatei: Die Datei ist kein gültiges JSON.')
  }
  return validateAppData(migrate(raw))
}
