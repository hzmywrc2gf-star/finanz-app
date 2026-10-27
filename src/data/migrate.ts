const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Brings stored/imported raw data to the current version (3). Pure; unknown shapes
 * are returned unchanged so validation can reject them with a proper message.
 */
export function migrate(raw: unknown): unknown {
  let data = raw
  if (isObj(data) && data.version === 1) {
    // v1 -> v2: recurring bookings were added
    data = { ...data, version: 2, recurring: [] }
  }
  if (isObj(data) && data.version === 2) {
    // v2 -> v3: optional category budgets were added, nothing to convert
    data = { ...data, version: 3 }
  }
  return data
}
