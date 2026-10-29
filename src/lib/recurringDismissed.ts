/**
 * Device setting (like the theme): suggestions the user rejected with "Nie vorschlagen". Only the hashed keys of
 * `detectRecurring` are stored, no notes or amounts. Every access is guarded: blocked storage means nothing is hidden.
 */
export const RECURRING_DISMISSED_KEY = 'finanz-app:recurring-dismissed'

/** Remembered at most (oldest dropped first). */
const MAX_KEYS = 200

export function getDismissedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(RECURRING_DISMISSED_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((k): k is string => typeof k === 'string' && k.length > 0 && k.length <= 32).slice(-MAX_KEYS))
  } catch {
    return new Set()
  }
}

export function dismissKey(key: string): void {
  if (!key) return
  try {
    const keys = [...getDismissedKeys()].filter((k) => k !== key)
    keys.push(key)
    localStorage.setItem(RECURRING_DISMISSED_KEY, JSON.stringify(keys.slice(-MAX_KEYS)))
  } catch {
    // storage blocked or full: the suggestion just shows up again
  }
}
