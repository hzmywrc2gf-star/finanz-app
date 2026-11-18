import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { addMonths, monthLabel, monthStart, monthTitle, todayISO } from '../domain/dates'
import { pinchDecision, pinchPast, pinchScale } from '../domain/gesture'
import { SPRING_BOUNCY } from '../domain/spring'
import { usePinch } from '../hooks/usePinch'
import { haptic } from '../lib/haptics'
import { animateSpring, modalOpen, reducedMotion } from '../lib/motion'
import {
  daySegments, financeEntries, longDayLabel, monthGrid, occurrencesByDay, occurrencesInRange, sameDayInMonth,
} from '../domain/calendar'
import type { DaySegment, FinanceEntry } from '../domain/calendar'
import { todosByDueDate } from '../domain/todos'
import { useFinance } from '../state/FinanceContext'
import { CalendarModeSwitch } from '../components/CalendarModeSwitch'
import type { CalendarMode } from '../components/CalendarModeSwitch'
import { CalendarImportSheet } from '../components/CalendarImport'
import { DayList } from '../components/DayList'
import { ChevronLeft, ChevronRight, MoreIcon, PlusIcon } from '../components/Icons'
import { LargeTitleHeader } from '../components/LargeTitleHeader'
import { MonthGrid } from '../components/MonthGrid'
import { SwipePane } from '../components/SwipePane'

export interface CalendarHandlers {
  onNewEvent: (day: string, hour?: number) => void
  onEditEvent: (seg: DaySegment) => void
  onOpenFinance: (entry: FinanceEntry) => void
  /** Opens the details of a task (open tasks with a due date show up in the grid and the day lists). */
  onOpenTodo: (id: string) => void
}

/** The pinch spring runs over scale × this (its rest thresholds are in px). */
const SCALE_UNITS = 1000

/**
 * Calendar tab: the month as a grid with the selected day's entries below (next to it on wide screens). The title is only the
 * month ("November"; another year: "Januar 2027"), screen readers hear the year as well. Spreading two fingers on the grid
 * opens the day view of the selected day (today unless another day was tapped): the grid follows the fingers around that
 * cell, a tick marks the threshold, and the day view zooms out of the cell; a small pinch springs back.
 */
export const CalendarPage = memo(function CalendarPage({
  day,
  onDay,
  onOpenDay,
  onPinch,
  onNewEvent,
  onEditEvent,
  onOpenFinance,
  onOpenTodo,
  onMode,
}: {
  /** "Kalender | To-do" below the title. */
  onMode: (mode: CalendarMode) => void
  day: string
  onDay: (day: string) => void
  /** `zoom`: opened by a pinch, the day view grows out of the selected cell. */
  onOpenDay: (how?: 'zoom') => void
  /** Two fingers are down (true) / let go without opening the day (false): the day view is rendered ahead of time meanwhile. */
  onPinch?: (active: boolean) => void
} & CalendarHandlers) {
  const { data } = useFinance()
  const [importing, setImporting] = useState(false)
  const pinchRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const pastPinch = useRef(false)
  const opening = useRef(false)
  const stopZoom = useRef<(() => void) | null>(null)
  useEffect(() => () => stopZoom.current?.(), [])
  const today = todayISO()
  const month = monthStart(day)
  const weeks = useMemo(() => monthGrid(month), [month])
  const from = weeks[0][0].date
  const to = weeks[5][6].date

  const occs = useMemo(() => occurrencesInRange(data.events, from, to), [data.events, from, to])
  const byDay = useMemo(() => occurrencesByDay(occs, from, to), [occs, from, to])
  const finance = useMemo(() => {
    const map = new Map<string, FinanceEntry[]>()
    for (const f of financeEntries(data, from, to)) {
      const list = map.get(f.date)
      if (list) list.push(f)
      else map.set(f.date, [f])
    }
    return map
  }, [data, from, to])
  const todos = useMemo(() => todosByDueDate(data, from, to), [data, from, to])
  const segments = useMemo(() => daySegments(occs, day), [occs, day])
  const dayFinance = finance.get(day) ?? []
  const dayTodos = todos.get(day)

  const step = (n: number) => onDay(sameDayInMonth(day, addMonths(month, n)))
  const year = month.slice(0, 4)
  const title = monthTitle(month, today)

  usePinch(pinchRef, {
    canStart: () => !opening.current && !modalOpen(),
    onStart: () => {
      const el = zoomRef.current
      const cell = el?.querySelector<HTMLElement>('.cal-cell[data-selected="true"]')
      if (!el || !cell) return
      stopZoom.current?.()
      stopZoom.current = null
      pastPinch.current = false
      // the grid grows around the selected cell (measured once; the transform is the only thing that changes)
      const g = el.getBoundingClientRect()
      const c = cell.getBoundingClientRect()
      const scale = el.style.transform ? g.width / el.offsetWidth : 1
      el.style.transformOrigin = `${(c.left + c.width / 2 - g.left) / scale}px ${(c.top + c.height / 2 - g.top) / scale}px`
      el.style.willChange = 'transform'
      onPinch?.(true)
    },
    onMove: (factor) => {
      const el = zoomRef.current
      if (el && !reducedMotion()) el.style.transform = `scale(${pinchScale(factor, 'open')})`
    },
    // one tick when the fingers cross the line where letting go opens the day (and again when they go back)
    onMoveEvent: (factor) => {
      const past = pinchPast(factor, 'open')
      if (past !== pastPinch.current) {
        pastPinch.current = past
        haptic()
      }
    },
    onEnd: ({ factor, velocity, cancelled }) => {
      const el = zoomRef.current
      if (!el) return
      if (!cancelled && pinchDecision({ factor, velocity, dir: 'open' })) {
        // the grid stays enlarged: the day view zooms out of the cell from here, and the month leaves the DOM afterwards
        opening.current = true
        onOpenDay('zoom')
        // safety net: should the month stay on screen (nothing navigated), it becomes usable again
        window.setTimeout(() => {
          opening.current = false
          el.style.transform = ''
          el.style.transformOrigin = ''
          el.style.willChange = ''
        }, 2000)
        return
      }
      onPinch?.(false)
      const reset = () => {
        el.style.transform = ''
        el.style.transformOrigin = ''
        el.style.willChange = ''
      }
      const from = el.style.transform ? pinchScale(factor, 'open') : 1
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

  return (
    <>
      <LargeTitleHeader
        title={title}
        srSuffix={title === monthLabel(month) ? undefined : year}
        action={{ label: 'Kalender importieren', icon: <MoreIcon />, onClick: () => setImporting(true) }}
      />
      <CalendarModeSwitch value="calendar" onChange={onMode} />
      <SwipePane onStep={step}>
        <div className="cal-toolbar">
          <button className="icon-btn" onClick={() => step(-1)} aria-label="Vorheriger Monat">
            <ChevronLeft />
          </button>
          <button className="pill" onClick={() => onDay(today)} disabled={day === today} aria-label="Heute">
            Heute
          </button>
          <button className="icon-btn" onClick={() => step(1)} aria-label="Nächster Monat">
            <ChevronRight />
          </button>
        </div>
        <div className="cal-split">
          <div ref={pinchRef} className="cal-left" data-testid="cal-pinch">
            <div ref={zoomRef} className="cal-zoom">
              <MonthGrid weeks={weeks} selected={day} today={today} events={byDay} finance={finance} todos={todos} onSelect={onDay} />
            </div>
          </div>
          <section className="cal-right" aria-label="Termine des Tages">
            <div className="cal-day-head">
              <button type="button" className="cal-day-btn" onClick={() => onOpenDay()} aria-label={`Tagesansicht: ${longDayLabel(day)}`}>
                <h2>{longDayLabel(day)}</h2>
                <ChevronRight />
              </button>
              {/* inline instead of a floating button: a floating "+" would cover the last entry of the day (Start does the same) */}
              <button type="button" className="round-btn cal-new" onClick={() => onNewEvent(day)} aria-label="Termin hinzufügen">
                <PlusIcon />
              </button>
            </div>
            {/* a new day fades in and rises a little (keyed by the day) */}
            <div key={day} className="cal-day-anim">
              <DayList segments={segments} finance={dayFinance} todos={dayTodos} onEvent={onEditEvent} onFinance={onOpenFinance} onTodo={onOpenTodo} />
            </div>
          </section>
        </div>
      </SwipePane>
      {importing && <CalendarImportSheet onClose={() => setImporting(false)} />}
    </>
  )
})
