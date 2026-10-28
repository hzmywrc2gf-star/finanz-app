const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Brings stored/imported raw data to the current version (5). Pure; unknown shapes
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
  if (isObj(data) && data.version === 3) {
    // v3 -> v4: cash account. Every booking so far belongs to the Konto; no cash, no transfers yet.
    data = {
      ...data,
      version: 4,
      settings: isObj(data.settings) ? { ...data.settings, startCashCents: 0 } : data.settings,
      transactions: Array.isArray(data.transactions)
        ? data.transactions.map((t) => (isObj(t) ? { ...t, account: 'konto' } : t))
        : data.transactions,
      transfers: [],
    }
  }
  if (isObj(data) && data.version === 4) {
    // v4 -> v5: contracts can wait for a confirmation; all existing ones keep booking automatically
    data = {
      ...data,
      version: 5,
      recurring: Array.isArray(data.recurring)
        ? data.recurring.map((r) => (isObj(r) ? { ...r, autoBook: true } : r))
        : data.recurring,
    }
  }
  return data
}
