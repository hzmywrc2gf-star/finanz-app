const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Brings stored/imported raw data to the current version (2). Pure; unknown shapes
 * are returned unchanged so validation can reject them with a proper message.
 */
export function migrate(raw: unknown): unknown {
  if (isObj(raw) && raw.version === 1) {
    // v1 -> v2: recurring bookings were added
    return { ...raw, version: 2, recurring: [] }
  }
  return raw
}
