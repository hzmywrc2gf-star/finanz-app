import { memo } from 'react'
import type { FinanceEntry, GridDay, Occurrence } from '../domain/calendar'
import { WEEKDAY_LONG, WEEKDAY_SHORT, weekdayOf } from '../domain/calendar'

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
  return (
    <div className="cal-grid" role="grid" aria-label="Monatsübersicht">
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
