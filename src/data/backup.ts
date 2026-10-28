import type { Account, AppData, Category, Interval, Kind, RecurringRule, Transaction, Transfer, TransferDirection } from '../domain/types'
import { isValidISODate } from '../domain/dates'
import { FALLBACK_NAME } from '../domain/defaults'
import { migrate } from './migrate'

export function exportJSON(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

const fail = (msg: string): never => {
  throw new Error(`Ungültige Sicherungsdatei: ${msg}`)
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isKind = (v: unknown): v is Kind => v === 'income' || v === 'expense'

const isAccount = (v: unknown): v is Account => v === 'konto' || v === 'bargeld'

const isDirection = (v: unknown): v is TransferDirection => v === 'withdrawal' || v === 'deposit'

const isInterval = (v: unknown): v is Interval => v === 'monthly' || v === 'quarterly' || v === 'yearly'

/** Strictly validates a parsed object of the current version (4); also used for stored data. Throws German Error. */
export function validateAppData(raw: unknown): AppData {
  if (!isObj(raw)) return fail('Kein gültiges Objekt.')
  if (raw.version !== 4) return fail('Unbekannte Version.')
  if (!isObj(raw.settings)) return fail('Einstellungen fehlen.')
  const start = raw.settings.startBalanceCents
  if (typeof start !== 'number' || !Number.isSafeInteger(start)) {
    return fail('Startguthaben ist keine ganze Zahl (Cent).')
  }
  const startCash = raw.settings.startCashCents
  if (typeof startCash !== 'number' || !Number.isSafeInteger(startCash)) {
    return fail('Startbestand Bargeld ist keine ganze Zahl (Cent).')
  }
  if (!Array.isArray(raw.categories)) return fail('Kategorien fehlen.')
  if (!Array.isArray(raw.transactions)) return fail('Buchungen fehlen.')
  if (!Array.isArray(raw.recurring)) return fail('Wiederkehrende Buchungen fehlen.')
  if (!Array.isArray(raw.transfers)) return fail('Umbuchungen fehlen.')

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
    const rule: RecurringRule = {
      id: r.id,
      kind: r.kind,
      amountCents: r.amountCents,
      categoryId: r.categoryId,
      interval: r.interval,
      dayOfMonth: r.dayOfMonth,
      startDate: r.startDate,
      bookedThrough: r.bookedThrough,
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

  return {
    version: 4,
    settings: { startBalanceCents: start, startCashCents: startCash },
    categories,
    transactions,
    recurring,
    transfers,
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
