import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { addDays, todayISO } from '../domain/dates'
import {
  WEEKDAY_SHORT, dayMonthLabel, daySegments, financeEntries, layoutDay, longDayLabel, occurrencesInRange, timeFromMinutes, timeText, weekStart,
} from '../domain/calendar'
import { useFinance } from '../state/FinanceContext'
import { DayList } from '../components/DayList'
import { Fab } from '../components/Fab'
import { SubPageHeader } from '../components/SubPageHeader'
import { SwipePane } from '../components/SwipePane'
import type { CalendarHandlers } from './CalendarPage'

/** Height of one hour in the timeline (px). */
const HOUR_PX = 56
const HOURS = Array.from({ length: 24 }, (_, h) => h)

const minutesNow = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

/** Day view (a sub-page of the calendar): week strip, all-day lane and an hourly timeline; swipe sideways for the neighbouring day. */
export const DayPage = memo(function DayPage({
  day,
  onDay,
  onBack,
  onNewEvent,
  onEditEvent,
  onOpenFinance,
}: {
  day: string
  onDay: (day: string) => void
  onBack: () => void
} & CalendarHandlers) {
  const { data } = useFinance()
  const today = todayISO()
  const timelineRef = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(minutesNow)

  const occs = useMemo(() => occurrencesInRange(data.events, day, day), [data.events, day])
  const segments = useMemo(() => daySegments(occs, day), [occs, day])
  const allDay = segments.filter((s) => s.allDay)
  const placed = useMemo(() => layoutDay(segments), [segments])
  const finance = useMemo(() => financeEntries(data, day, day), [data, day])
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart(day), i)), [day])

  // minute hand of the "now" line
  useEffect(() => {
    const t = setInterval(() => setNow(minutesNow()), 30_000)
    return () => clearInterval(t)
  }, [])

  // open at 7:00 (or an hour before now, for today)
  useEffect(() => {
    const t = setTimeout(() => {
      const el = timelineRef.current
      if (!el) return
      const target = day === todayISO() ? Math.max(0, minutesNow() - 60) : 7 * 60
      window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY + (target / 60) * HOUR_PX - 120))
    }, 0)
    return () => clearTimeout(t)
    // only on opening; swiping to another day keeps the scroll position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tapSlot(e: MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget && !(e.target instanceof HTMLElement && e.target.dataset.slot !== undefined)) return
    const rect = e.currentTarget.getBoundingClientRect()
    onNewEvent(day, Math.min(23, Math.max(0, Math.floor((e.clientY - rect.top) / HOUR_PX))))
  }

  return (
    <>
      <SubPageHeader title={dayMonthLabel(day)} onBack={onBack} parent="Kalender" />
      <div className="day-strip" role="group" aria-label={longDayLabel(day)}>
        {week.map((d, i) => (
          <button
            key={d}
            type="button"
            className="day-chip"
            data-today={d === today}
            data-selected={d === day}
            aria-pressed={d === day}
            aria-label={longDayLabel(d)}
            onClick={() => onDay(d)}
          >
            <span className="wd">{WEEKDAY_SHORT[i]}</span>
            <span className="dn num">{Number(d.slice(8, 10))}</span>
          </button>
        ))}
      </div>
      <SwipePane onStep={(n) => onDay(addDays(day, n))}>
        {(allDay.length > 0 || finance.length > 0) && (
          <section className="card cal-allday" aria-label="Ganztägig und Zahlungen">
            <DayList segments={allDay} finance={finance} onEvent={onEditEvent} onFinance={onOpenFinance} />
          </section>
        )}
        <div ref={timelineRef} className="tl" style={{ height: 24 * HOUR_PX }} data-testid="timeline" onClick={tapSlot}>
          {HOURS.map((h) => (
            <div key={h} className="tl-hour" style={{ top: h * HOUR_PX }} data-slot="">
              <span className="tl-label num" aria-hidden="true">
                {h === 0 ? '' : timeFromMinutes(h * 60)}
              </span>
            </div>
          ))}
          {placed.map((p) => {
            const { segment: seg } = p
            const top = (seg.startMin / 60) * HOUR_PX
            const height = Math.max(22, ((p.endMin - seg.startMin) / 60) * HOUR_PX - 2)
            return (
              <button
                key={seg.occ.key}
                type="button"
                className="tl-event"
                data-testid="tl-event"
                style={{
                  top,
                  height,
                  left: `calc(var(--tl-gutter) + (100% - var(--tl-gutter)) * ${p.column / p.columns})`,
                  width: `calc((100% - var(--tl-gutter)) / ${p.columns} - 6px)`,
                }}
                onClick={() => onEditEvent(seg)}
              >
                <span className="tl-name">{seg.occ.event.title}</span>
                {height >= 40 && <span className="tl-when num">{timeText(seg)}</span>}
                {height >= 58 && seg.occ.event.location && <span className="tl-when">{seg.occ.event.location}</span>}
              </button>
            )
          })}
          {day === today && (
            <div className="tl-now" style={{ top: (now / 60) * HOUR_PX }} aria-hidden="true" data-testid="now-line" />
          )}
        </div>
      </SwipePane>
      <Fab className="cal-fab" label="Termin hinzufügen" onClick={() => onNewEvent(day)} />
    </>
  )
})
