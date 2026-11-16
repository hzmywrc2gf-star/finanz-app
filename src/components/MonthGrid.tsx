import { memo, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { FinanceEntry, GridDay, Occurrence } from '../domain/calendar'
import { WEEKDAY_LONG, WEEKDAY_SHORT, weekdayOf } from '../domain/calendar'
import { SPRING_BOUNCY } from '../domain/spring'
import type { SpringParams } from '../domain/spring'
import { animateSpring, reducedMotion } from '../lib/motion'

/** The selection ring glides like the segmented-control pill: the bouncy spring with a shorter response. */
const RING_SPRING: SpringParams = { ...SPRING_BOUNCY, response: 0.32 }
/** The spring runs over progress × this (its rest thresholds are in px). */
const RING_UNITS = 1000

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function dayLabel(date: string, events: number, finance: number): string {
  const text = `${WEEKDAY_LONG[weekdayOf(date)]}, ${Number(date.slice(8, 10))}. ${MONTH_NAMES[Number(date.slice(5, 7)) - 1]}`
  const parts = [text]
  if (events) parts.push(plural(events, 'Termin', 'Termine'))
  if (finance) parts.push(plural(finance, 'Zahlung', 'Zahlungen'))
  return parts.join(', ')
}

/**
 * The month as a 7 x 6 grid (Monday first). Today is a filled circle, the selected day a ring; below the number a filled dot
 * marks own events and a hollow dot marks payments (Verträge, Rechnungen). On wide screens (iPad) the cells also show up to two titles (events first, then payments on sand).
 * The selection ring is one layer of its own that glides from day to day on a spring (transform only); after a month change
 * it simply stands at the new place. Reduced motion: it jumps.
 */
export const MonthGrid = memo(function MonthGrid({
  weeks,
  selected,
  today,
  events,
  finance,
  onSelect,
}: {
  weeks: GridDay[][]
  selected: string
  today: string
  events: ReadonlyMap<string, Occurrence[]>
  finance: ReadonlyMap<string, FinanceEntry[]>
  onSelect: (date: string) => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLSpanElement>(null)
  /** Where the ring is painted (px in the grid), null until it was placed the first time. */
  const painted = useRef<{ x: number; y: number } | null>(null)
  const stop = useRef<(() => void) | null>(null)
  const monthKey = weeks[0][0].date
  const shownMonth = useRef(monthKey)

  /** Puts the ring around the selected day's number, gliding when `animate` and it was placed before. */
  const place = useCallback((animate: boolean) => {
    const ring = ringRef.current
    const num = gridRef.current?.querySelector<HTMLElement>('.cal-cell[data-selected="true"] .cal-num')
    if (!ring) return
    stop.current?.()
    stop.current = null
    if (!num) {
      ring.style.visibility = 'hidden'
      painted.current = null
      return
    }
    ring.style.visibility = ''
    ring.style.width = `${num.offsetWidth}px`
    ring.style.height = `${num.offsetHeight}px`
    ring.dataset.today = String(num.parentElement?.dataset.today === 'true')
    // the grid is the offset parent of the numbers (cells and rows are not positioned)
    const to = { x: num.offsetLeft, y: num.offsetTop }
    const paint = (x: number, y: number) => {
      painted.current = { x, y }
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }
    const from = painted.current
    if (!animate || !from || (from.x === to.x && from.y === to.y) || reducedMotion()) {
      ring.style.willChange = ''
      paint(to.x, to.y)
      return
    }
    ring.style.willChange = 'transform'
    stop.current = animateSpring({
      from: 0,
      to: RING_UNITS,
      params: RING_SPRING,
      onUpdate: (v) => {
        const t = v / RING_UNITS
        paint(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)
      },
      onDone: () => {
        stop.current = null
        ring.style.willChange = ''
      },
    })
  }, [])

  // before the first paint the ring is in place; a new day in the same month glides, a month change does not
  useLayoutEffect(() => {
    const sameMonth = shownMonth.current === monthKey
    shownMonth.current = monthKey
    place(sameMonth)
  }, [selected, today, monthKey, place])

  // rotation, iPad split view, fonts: back in place without gliding
  useEffect(() => {
    const grid = gridRef.current
    if (!grid || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => place(false))
    observer.observe(grid)
    return () => {
      observer.disconnect()
      stop.current?.()
    }
  }, [place])

  return (
    <div ref={gridRef} className="cal-grid" role="grid" aria-label="Monatsübersicht">
      <span ref={ringRef} className="cal-ring" aria-hidden="true" data-testid="cal-ring" />
      <div className="cal-weekdays" role="row">
        {WEEKDAY_SHORT.map((d, i) => (
          <div key={d} className="cal-wd" role="columnheader" data-weekend={i >= 5}>
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0].date} className="cal-week" role="row">
          {week.map(({ date, inMonth }) => {
            const evs = events.get(date)
            const fin = finance.get(date)
            const items = [
              ...(evs ?? []).map((o) => ({ key: o.key, title: o.event.title, fin: false })),
              ...(fin ?? []).map((f) => ({ key: f.key, title: f.title, fin: true })),
            ]
            const titles = items.slice(0, 2)
            const more = items.length - titles.length
            return (
              <button
                key={date}
                type="button"
                role="gridcell"
                className="cal-cell"
                data-date={date}
                data-out={!inMonth}
                data-today={date === today}
                data-selected={date === selected}
                aria-selected={date === selected}
                aria-label={dayLabel(date, evs?.length ?? 0, fin?.length ?? 0)}
                onClick={() => onSelect(date)}
              >
                <span className="cal-num num">{Number(date.slice(8, 10))}</span>
                <span className="cal-dots" aria-hidden="true">
                  {evs && <i className="cal-dot" />}
                  {fin && <i className="cal-dot hollow" />}
                </span>
                <span className="cal-titles" aria-hidden="true">
                  {titles.map((o) => (
                    <span key={o.key} className="cal-title" data-fin={o.fin || undefined}>
                      {o.title}
                    </span>
                  ))}
                  {more > 0 && <span className="cal-title more">+{more}</span>}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
})
