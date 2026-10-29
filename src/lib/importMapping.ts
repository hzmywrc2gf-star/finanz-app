import { IMPORT_FIELDS } from '../domain/importRows'
import type { ColumnMapping } from '../domain/importRows'

/** Device setting (like the theme): which column holds what, per header layout. Only header names, no financial data. */
export const IMPORT_MAPPING_KEY = 'finanz-app:import-mapping'

/** Layouts remembered at most (oldest dropped first). */
const MAX_ENTRIES = 20

type Stored = Record<string, ColumnMapping>

function sanitize(value: unknown): ColumnMapping | null {
  if (!value || typeof value !== 'object') return null
  const mapping: ColumnMapping = {}
  for (const { field } of IMPORT_FIELDS) {
    const col = (value as Record<string, unknown>)[field]
    if (typeof col === 'number' && Number.isInteger(col) && col >= 0 && col < 1000) mapping[field] = col
  }
  return Object.keys(mapping).length ? mapping : null
}

function readAll(): Stored {
  try {
    const raw = localStorage.getItem(IMPORT_MAPPING_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Stored = {}
    for (const [signature, value] of Object.entries(parsed)) {
      const mapping = sanitize(value)
      if (mapping) out[signature] = mapping
    }
    return out
  } catch {
    return {}
  }
}

export function getSavedMapping(signature: string): ColumnMapping | null {
  return signature ? (readAll()[signature] ?? null) : null
}

/** Remembers the mapping for this header layout (storage errors are ignored). */
export function saveMapping(signature: string, mapping: ColumnMapping): void {
  if (!signature) return
  try {
    const all = readAll()
    delete all[signature] // re-insert last: the newest layout stays
    all[signature] = mapping
    const keys = Object.keys(all)
    for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) delete all[key]
    localStorage.setItem(IMPORT_MAPPING_KEY, JSON.stringify(all))
  } catch {
    // storage blocked or full: the mapping is just not remembered
  }
}
