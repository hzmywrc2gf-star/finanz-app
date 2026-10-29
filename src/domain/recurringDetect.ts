import type { AppData, Interval, Kind, RecurringRule, Transaction } from './types'
import { addDays, addMonths } from './dates'

/**
 * Finds bookings that repeat on a regular schedule (salary, subscriptions, rent, insurance) so the user can turn
 * them into Verträge. Pure and conservative: a missing suggestion costs one tap in the contract form, a wrong one
 * costs attention.
 *
 * Rules (decisions in brackets):
 * - Only Konto bookings without a recurringId of an existing rule (a Vertrag always books to the Konto).
 * - Grouping: same kind + identity. Identity = the note with case, digits, punctuation and spacing removed
 *   („Netflix“ ≈ „NETFLIX 10/2026“; different notes stay different groups, so two subscriptions in one category
 *   give two suggestions), or the category if the note is empty.
 * - Amounts: inside a group, bookings within 5 % of the median form one cluster, outliers are processed on their own
 *   (a pay rise above 5 % starts a new cluster; the old one ends and is then dropped as inactive).
 * - Interval: the newest run of bookings in strictly consecutive periods (monthly: month after month, at least 3;
 *   quarterly: 3 months apart, at least 3; yearly: 12 months apart, at least 2). A missing period ends the run
 *   (no gaps tolerated), two bookings in one period break it as well. The day must stay inside a window of 6 days
 *   (±3); the last day of a month counts as day 31, so 31.01. → 28.02. → 31.03. is one rhythm.
 * - dayOfMonth: most frequent day (ties: the one seen last); month-end bookings give 31.
 * - Active only: the last booking is at most one interval + 3 days back from today.
 * - Left out: groups an existing Vertrag already covers (kind, category, interval, amount within 5 %, and the same
 *   note if both have one) and dismissed keys.
 */
export interface RecurringSuggestion {
  /** Stable hash of kind, account, identity and interval; only used to remember "Nie vorschlagen" (not the amount). */
  key: string
  kind: Kind
  categoryId: string
  note?: string
  /** Amount of the latest booking. */
  amountCents: number
  interval: Interval
  dayOfMonth: number
  /** First booking of the found run. */
  startDate: string
  lastDate: string
  count: number
  transactionIds: string[]
}

const STEP: Record<Interval, number> = { monthly: 1, quarterly: 3, yearly: 12 }
export const MIN_COUNT: Record<Interval, number> = { monthly: 3, quarterly: 3, yearly: 2 }
const INTERVALS: Interval[] = ['monthly', 'quarterly', 'yearly']
const DAY_WINDOW = 6
const ACTIVE_SLACK_DAYS = 3
const AMOUNT_TOLERANCE_PERCENT = 5

/** Case, digits, punctuation, spacing and accents removed: the identity of a note. */
export function normalizeNote(note: string | undefined): string {
  return (note ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[^a-z]/g, '')
}

/** 53-bit string hash (cyrb53), synchronous because it only identifies dismissed suggestions, it is no security feature. */
export function hashKey(text: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

export function suggestionKey(kind: Kind, identity: string, interval: Interval): string {
  return hashKey(`${kind}|konto|${identity}|${interval}`)
}

const monthIndex = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1
const dayOf = (iso: string) => Number(iso.slice(8, 10))
const lastDayOfMonth = (iso: string) => dayOf(addDays(addMonths(iso, 1), -1))

/** Day used for comparing rhythms: the last day of a (31-day-or-shorter) month counts as 31. */
function effectiveDay(iso: string): number {
  const d = dayOf(iso)
  return d >= 28 && d === lastDayOfMonth(iso) ? 31 : d
}

/** within 5 % (integer arithmetic): |a − b| × 100 ≤ 5 × b */
export function similarAmount(a: number, b: number): boolean {
  return Math.abs(a - b) * 100 <= AMOUNT_TOLERANCE_PERCENT * b
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : Math.floor((s[mid - 1] + s[mid]) / 2)
}

/** Splits a group into clusters of similar amounts (each cluster within 5 % of its own median). */
function amountClusters(txs: Transaction[]): Transaction[][] {
  const clusters: Transaction[][] = []
  let rest = txs
  while (rest.length) {
    const med = median(rest.map((t) => t.amountCents))
    const inside = rest.filter((t) => similarAmount(t.amountCents, med))
    // the median is always a member for odd sizes; for even sizes make sure we make progress
    const cluster = inside.length ? inside : [rest[0]]
    clusters.push(cluster)
    rest = rest.filter((t) => !cluster.includes(t))
  }
  return clusters
}

/** Newest run of bookings in consecutive periods of `interval`, oldest first; [] if there is none. */
function newestRun(sortedAsc: Transaction[], interval: Interval): Transaction[] {
  const step = STEP[interval]
  const run: Transaction[] = []
  let min = 0
  let max = 0
  for (let i = sortedAsc.length - 1; i >= 0; i--) {
    const t = sortedAsc[i]
    if (run.length) {
      if (monthIndex(run[0].date) - monthIndex(t.date) !== step) break
      const e = effectiveDay(t.date)
      if (Math.max(max, e) - Math.min(min, e) > DAY_WINDOW) break
      min = Math.min(min, e)
      max = Math.max(max, e)
    } else {
      min = max = effectiveDay(t.date)
    }
    run.unshift(t)
  }
  return run
}

/** Most frequent effective day; ties go to the one seen last. */
function typicalDay(run: Transaction[]): number {
  const counts = new Map<number, number>()
  for (const t of run) counts.set(effectiveDay(t.date), (counts.get(effectiveDay(t.date)) ?? 0) + 1)
  let best = effectiveDay(run[run.length - 1].date)
  for (let i = run.length - 1; i >= 0; i--) {
    const e = effectiveDay(run[i].date)
    if ((counts.get(e) ?? 0) > (counts.get(best) ?? 0)) best = e
  }
  return best
}

export function coveredByRule(s: Pick<RecurringSuggestion, 'kind' | 'categoryId' | 'note' | 'amountCents' | 'interval'>, rules: RecurringRule[]): boolean {
  return rules.some(
    (r) =>
      r.kind === s.kind &&
      r.categoryId === s.categoryId &&
      r.interval === s.interval &&
      similarAmount(s.amountCents, r.amountCents) &&
      (!r.note || !s.note || normalizeNote(r.note) === normalizeNote(s.note)),
  )
}

export function detectRecurring(data: AppData, today: string, dismissed: ReadonlySet<string> | readonly string[] = []): RecurringSuggestion[] {
  const skip = dismissed instanceof Set ? dismissed : new Set(dismissed)
  const ruleIds = new Set(data.recurring.map((r) => r.id))
  const groups = new Map<string, { kind: Kind; identity: string; txs: Transaction[] }>()
  for (const t of data.transactions) {
    if (t.account !== 'konto') continue
    if (t.recurringId && ruleIds.has(t.recurringId)) continue
    const note = normalizeNote(t.note)
    const identity = note ? `note:${note}` : `cat:${t.categoryId}`
    const gk = `${t.kind}|${identity}`
    const g = groups.get(gk) ?? { kind: t.kind, identity, txs: [] }
    g.txs.push(t)
    groups.set(gk, g)
  }

  const found: RecurringSuggestion[] = []
  for (const g of groups.values()) {
    if (g.txs.length < 2) continue
    for (const cluster of amountClusters(g.txs)) {
      const sorted = [...cluster].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt))
      for (const interval of INTERVALS) {
        const run = newestRun(sorted, interval)
        if (run.length < MIN_COUNT[interval]) continue
        const latest = run[run.length - 1]
        // ended: the next booking would have been due more than 3 days ago
        const dayOfMonth = typicalDay(run)
        if (nextDue(latest.date, interval, dayOfMonth) < addDays(today, -ACTIVE_SLACK_DAYS)) continue
        const key = suggestionKey(g.kind, g.identity, interval)
        const note = latest.note?.trim()
        const s: RecurringSuggestion = {
          key,
          kind: g.kind,
          categoryId: latest.categoryId,
          amountCents: latest.amountCents,
          interval,
          dayOfMonth,
          startDate: run[0].date,
          lastDate: latest.date,
          count: run.length,
          transactionIds: run.map((t) => t.id),
        }
        if (note) s.note = note
        if (skip.has(key) || coveredByRule(s, data.recurring)) break
        found.push(s)
        break
      }
    }
  }
  return found.sort(
    (a, b) =>
      (a.kind === b.kind ? 0 : a.kind === 'income' ? -1 : 1) ||
      b.amountCents - a.amountCents ||
      (a.note ?? '').localeCompare(b.note ?? '', 'de') ||
      (a.key < b.key ? -1 : 1),
  )
}

/** When the booking after `date` is due: one interval later on `dayOfMonth`, clamped to the month's length. */
function nextDue(date: string, interval: Interval, dayOfMonth: number): string {
  const target = addMonths(date, STEP[interval])
  const day = Math.min(dayOfMonth, lastDayOfMonth(target))
  return `${target.slice(0, 8)}${String(day).padStart(2, '0')}`
}
