import type { AppData, Category, Kind } from './types'

export const EXPENSE_DEFAULTS = [
  'Lebensmittel',
  'Fixkosten',
  'Mobilität',
  'Freizeit',
  'Kleidung',
  'Gesundheit',
  'Sonstiges',
]
export const INCOME_DEFAULTS = ['Gehalt', 'Nebeneinkünfte', 'Sonstiges']

export const FALLBACK_NAME = 'Sonstiges'

/** Stable ids so backups and defaults line up. */
export function builtInId(kind: Kind, name: string): string {
  return `${kind}-${name.toLowerCase()}`
}

export function createDefaultCategories(): Category[] {
  const make = (kind: Kind, names: string[]): Category[] =>
    names.map((name) => ({
      id: builtInId(kind, name),
      name,
      kind,
      builtIn: name === FALLBACK_NAME,
    }))
  return [...make('expense', EXPENSE_DEFAULTS), ...make('income', INCOME_DEFAULTS)]
}

export function createDefaultData(): AppData {
  return {
    version: 6,
    settings: { startBalanceCents: 0, startCashCents: 0 },
    categories: createDefaultCategories(),
    transactions: [],
    recurring: [],
    transfers: [],
  }
}
