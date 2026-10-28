import type { AppData } from './types'
import { addMonths, monthEnd, monthStart } from './dates'

export interface BalancePoint {
  /** 'YYYY-MM' */
  month: string
  /** Konto balance in cents */
  cents: number
}

/**
 * Konto balance at the end of each of the last `months` calendar months (oldest first), cash excluded,
 * transfers included (withdrawal lowers, deposit raises the Konto).
 * Past months count everything dated up to their last day. The current month mirrors `accountBalance`, which
 * counts every entry whatever its date (also future-dated ones), so its point equals the start page's balance exactly.
 */
export function balanceHistory(data: AppData, today: string, months = 6): BalancePoint[] {
  const current = monthStart(today)
  const ends = Array.from({ length: months }, (_, i) => {
    const start = addMonths(current, i - (months - 1))
    return { month: start.slice(0, 7), end: i === months - 1 ? null : monthEnd(start) }
  })
  // net change per bucket, then a running sum: one pass over the data
  const deltas = new Array<number>(months).fill(0)
  const bucket = (date: string) => {
    for (let i = 0; i < months; i++) if (ends[i].end === null || date <= ends[i].end!) return i
    return months - 1
  }
  for (const t of data.transactions) {
    if (t.account === 'konto') deltas[bucket(t.date)] += t.kind === 'income' ? t.amountCents : -t.amountCents
  }
  for (const tr of data.transfers) {
    deltas[bucket(tr.date)] += tr.direction === 'withdrawal' ? -tr.amountCents : tr.amountCents
  }
  let sum = data.settings.startBalanceCents
  return ends.map((e, i) => {
    sum += deltas[i]
    return { month: e.month, cents: sum }
  })
}

/** True when anything is dated before the current month, so a history line has a past to show (no fake curve). */
export function hasHistory(data: AppData, today: string): boolean {
  const current = monthStart(today)
  return data.transactions.some((t) => t.account === 'konto' && t.date < current) || data.transfers.some((t) => t.date < current)
}
