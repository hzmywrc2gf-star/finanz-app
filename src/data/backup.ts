import type { AppData, Category, Kind, Transaction } from '../domain/types'
import { isValidISODate } from '../domain/dates'
import { FALLBACK_NAME } from '../domain/defaults'

export function exportJSON(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

const fail = (msg: string): never => {
  throw new Error(`Ungültige Sicherungsdatei: ${msg}`)
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isKind = (v: unknown): v is Kind => v === 'income' || v === 'expense'

/** Strictly validates a parsed object; also used for stored data. Throws German Error. */
export function validateAppData(raw: unknown): AppData {
  if (!isObj(raw)) return fail('Kein gültiges Objekt.')
  if (raw.version !== 1) return fail('Unbekannte Version.')
  if (!isObj(raw.settings)) return fail('Einstellungen fehlen.')
  const start = raw.settings.startBalanceCents
  if (typeof start !== 'number' || !Number.isSafeInteger(start)) {
    return fail('Startguthaben ist keine ganze Zahl (Cent).')
  }
  if (!Array.isArray(raw.categories)) return fail('Kategorien fehlen.')
  if (!Array.isArray(raw.transactions)) return fail('Buchungen fehlen.')

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
    if (typeof t.createdAt !== 'number' || !Number.isFinite(t.createdAt)) {
      return fail('Ein Erstellungszeitpunkt ist ungültig.')
    }
    const tx: Transaction = {
      id: t.id,
      kind: t.kind,
      amountCents: t.amountCents,
      date: t.date,
      categoryId: t.categoryId,
      createdAt: t.createdAt,
    }
    if (t.note) tx.note = t.note
    transactions.push(tx)
  }

  return { version: 1, settings: { startBalanceCents: start }, categories, transactions }
}

export function parseBackup(text: string): AppData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Ungültige Sicherungsdatei: Die Datei ist kein gültiges JSON.')
  }
  return validateAppData(raw)
}
