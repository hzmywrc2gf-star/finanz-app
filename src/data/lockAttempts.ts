/**
 * Throttle for wrong passwords / recovery keys on the lock screen: after 5 consecutive failures wait 30 s, doubling
 * with every further failure up to 15 minutes. This is a UX brake against fat fingers and casual guessing ONLY: the
 * counter lives in localStorage, so anyone who can reach the storage can reset it or copy the vault and guess offline.
 * The real protection against that is the 600k-iteration PBKDF2 and a long password.
 */
export const ATTEMPTS_KEY = 'finanz-app:lock-attempts'
export const FREE_ATTEMPTS = 5
export const BASE_WAIT_MS = 30_000
export const MAX_WAIT_MS = 15 * 60_000

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export interface Attempts {
  failures: number
  /** Timestamp (ms) until which unlocking is blocked; 0 = not blocked. */
  until: number
}

/** Wait imposed after the n-th consecutive failure (0 for the first four). */
export function waitAfterFailures(failures: number): number {
  if (failures < FREE_ATTEMPTS) return 0
  return Math.min(BASE_WAIT_MS * 2 ** (failures - FREE_ATTEMPTS), MAX_WAIT_MS)
}

export function readAttempts(store: Store = localStorage): Attempts {
  try {
    const raw: unknown = JSON.parse(store.getItem(ATTEMPTS_KEY) ?? 'null')
    if (typeof raw === 'object' && raw !== null) {
      const { failures, until } = raw as Record<string, unknown>
      if (typeof failures === 'number' && Number.isSafeInteger(failures) && failures >= 0 && typeof until === 'number' && Number.isFinite(until)) {
        return { failures, until }
      }
    }
  } catch {
    /* unreadable or blocked storage: start fresh */
  }
  return { failures: 0, until: 0 }
}

/** Milliseconds left until the next attempt is allowed (0 = allowed now). */
export function remainingWaitMs(now: number, store: Store = localStorage): number {
  const { until } = readAttempts(store)
  return Math.max(0, until - now)
}

export function recordFailure(now: number, store: Store = localStorage): Attempts {
  const failures = readAttempts(store).failures + 1
  const wait = waitAfterFailures(failures)
  const next = { failures, until: wait > 0 ? now + wait : 0 }
  try {
    store.setItem(ATTEMPTS_KEY, JSON.stringify(next))
  } catch {
    /* ignore: throttle is best effort */
  }
  return next
}

export function recordSuccess(store: Store = localStorage): void {
  try {
    store.removeItem(ATTEMPTS_KEY)
  } catch {
    /* ignore */
  }
}
