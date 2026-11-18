import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { addDays, todayISO } from '../domain/dates'
import {
  WEEKDAY_SHORT, dayMonthLabel, daySegments, financeEntries, layoutDay, longDayLabel, occurrencesInRange, timeFromMinutes, timeText, weekStart,
} from '../domain/calendar'
import { pinchDecision, pinchPast, pinchScale } from '../domain/gesture'
import { SPRING_BOUNCY } from '../domain/spring'
import { usePinch } from '../hooks/usePinch'
import { haptic } from '../lib/haptics'
import { animateSpring, modalOpen, reducedMotion } from '../lib/motion'
import { todosByDueDate } from '../domain/todos'
import { useFinance } from '../state/FinanceContext'
import { DayList } from '../components/DayList'
import { Fab } from '../components/Fab'
import { SubPageHeader } from '../components/SubPageHeader'
import { SwipePane } from '../components/SwipePane'
import type { CalendarHandlers } from './CalendarPage'

/** Height of one hour in the timeline (px). */
const HOUR_PX = 56
const HOURS = Array.from({ length: 24 }, (_, h) => h)

/** The pinch spring runs over scale × this (its rest thresholds are in px). */
const SCALE_UNITS = 1000

/** Top of `el` in page px, without transforms (the page may still be sliding or zooming in). */
function pageTop(el: HTMLElement): number {
  let top = 0
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop
  return top
}

const minutesNow = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * Day view (a sub-page of the calendar): week strip, all-day lane and an hourly timeline; swipe sideways for the neighbouring day.
 * Pinching two fingers together returns to the month (the page shrinks with the fingers, a tick marks the threshold, then it
 * zooms back into the day's cell); a small pinch springs back.
 */
export const DayPage = memo(function DayPage({
  day,
  onDay,
  onBack,
  onPinchBack,
  onPinch,
  onNewEvent,
  onEditEvent,
  onOpenFinance,
  onOpenTodo,
}: {
  day: string
  onDay: (day: string) => void
  onBack: () => void
  /** Back to the month after a pinch (zooms into the cell). */
  onPinchBack: () => void
  /** Two fingers are down (true) / let go without leaving (false): the month is rendered ahead of time meanwhile. */
  onPinch?: (active: boolean) => void
} & CalendarHandlers) {
  const { data } = useFinance()
  const today = todayISO()
  const timelineRef = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(minutesNow)
  const zoomRef = useRef<HTMLDivElement>(null)
  const pastPinch = useRef(false)
  const leaving = useRef(false)
  const stopZoom = useRef<(() => void) | null>(null)
  useEffect(() => () => stopZoom.current?.(), [])

  const occs = useMemo(() => occurrencesInRange(data.events, day, day), [data.events, day])
  const segments = useMemo(() => daySegments(occs, day), [occs, day])
  const allDay = segments.filter((s) => s.allDay)
  const placed = useMemo(() => layoutDay(segments), [segments])
  const finance = useMemo(() => financeEntries(data, day, day), [data, day])
  const todos = useMemo(() => todosByDueDate(data, day, day).get(day) ?? [], [data, day])
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart(day), i)), [day])

  // minute hand of the "now" line
  useEffect(() => {
    const t = setInterval(() => setNow(minutesNow()), 30_000)
    return () => clearInterval(t)
  }, [])

  // open at 7:00 (or an hour before now, for today) before the first frame, so the page arrives there instead of jumping;
  // a frame later than the commit, because the navigation itself scrolls to the top first
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = timelineRef.current
      if (!el) return
      const target = day === todayISO() ? Math.max(0, minutesNow() - 60) : 7 * 60
      window.scrollTo({ top: Math.max(0, pageTop(el) + (target / 60) * HOUR_PX - 120), behavior: 'instant' })
    })
    return () => cancelAnimationFrame(id)
    // only on opening; swiping to another day keeps the scroll position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  usePinch(zoomRef, {
    canStart: () => !leaving.current && !modalOpen(),
    onStart: () => {
      const el = zoomRef.current
      if (!el) return
      stopZoom.current?.()
      stopZoom.current = null
      pastPinch.current = false
      // shrinks around the middle of what is on screen
      el.style.transformOrigin = `50% ${window.scrollY + window.innerHeight / 2 - pageTop(el)}px`
      el.style.willChange = 'transform'
      onPinch?.(true)
    },
    onMove: (factor) => {
      const el = zoomRef.current
      if (el && !reducedMotion()) el.style.transform = `scale(${pinchScale(factor, 'close')})`
    },
    onMoveEvent: (factor) => {
      const past = pinchPast(factor, 'close')
      if (past !== pastPinch.current) {
        pastPinch.current = past
        haptic()
      }
    },
    onEnd: ({ factor, velocity, cancelled }) => {
      const el = zoomRef.current
      if (!el) return
      if (!cancelled && pinchDecision({ factor, velocity, dir: 'close' })) {
        leaving.current = true
        onPinchBack()
        return
      }
      onPinch?.(false)
      const reset = () => {
        el.style.transform = ''
        el.style.transformOrigin = ''
        el.style.willChange = ''
      }
      const from = el.style.transform ? pinchScale(factor, 'close') : 1
      if (from === 1 || reducedMotion()) return reset()
      stopZoom.current = animateSpring({
        from: from * SCALE_UNITS,
        to: SCALE_UNITS,
        velocity: cancelled ? 0 : velocity * from * SCALE_UNITS * 0.3,
        params: SPRING_BOUNCY,
        restOffset: 1,
        onUpdate: (v) => {
          el.style.transform = `scale(${v / SCALE_UNITS})`
        },
        onDone: () => {
          stopZoom.current = null
          reset()
        },
      })
    },
  })

  function tapSlot(e: MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget && !(e.target instanceof HTMLElement && e.target.dataset.slot !== undefined)) return
    const rect = e.currentTarget.getBoundingClientRect()
    onNewEvent(day, Math.min(23, Math.max(0, Math.floor((e.clientY - rect.top) / HOUR_PX))))
  }

  return (
    <>
      <SubPageHeader title={dayMonthLabel(day)} onBack={onBack} parent="Kalender" />
      <div ref={zoomRef} className="day-zoom" data-testid="day-pinch">
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
          {(allDay.length > 0 || finance.length > 0 || todos.length > 0) && (
            <section className="card cal-allday" aria-label="Ganztägig, Zahlungen und Aufgaben">
              <DayList segments={allDay} finance={finance} todos={todos} onEvent={onEditEvent} onFinance={onOpenFinance} onTodo={onOpenTodo} />
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
      </div>
      <Fab className="cal-fab" label="Termin hinzufügen" onClick={() => onNewEvent(day)} />
    </>
  )
})
