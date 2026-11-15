import { memo, useMemo, useState } from 'react'
import { addMonths, monthLabel, monthStart, todayISO } from '../domain/dates'
import {
  daySegments, financeEntries, longDayLabel, monthGrid, occurrencesByDay, occurrencesInRange, sameDayInMonth,
} from '../domain/calendar'
import type { DaySegment, FinanceEntry } from '../domain/calendar'
import { useFinance } from '../state/FinanceContext'
import { CalendarImportSheet } from '../components/CalendarImport'
import { DayList } from '../components/DayList'
import { Fab } from '../components/Fab'
import { ChevronLeft, ChevronRight, MoreIcon, PlusIcon } from '../components/Icons'
import { LargeTitleHeader } from '../components/LargeTitleHeader'
import { MonthGrid } from '../components/MonthGrid'
import { SwipePane } from '../components/SwipePane'

export interface CalendarHandlers {
  onNewEvent: (day: string, hour?: number) => void
  onEditEvent: (seg: DaySegment) => void
  onOpenFinance: (entry: FinanceEntry) => void
}

/** Calendar tab: the month as a grid with the selected day's entries below (next to it on wide screens). */
export const CalendarPage = memo(function CalendarPage({
  day,
  onDay,
  onOpenDay,
  onNewEvent,
  onEditEvent,
  onOpenFinance,
}: {
  day: string
  onDay: (day: string) => void
  onOpenDay: () => void
} & CalendarHandlers) {
  const { data } = useFinance()
  const [importing, setImporting] = useState(false)
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
  const segments = useMemo(() => daySegments(occs, day), [occs, day])
  const dayFinance = finance.get(day) ?? []

  const step = (n: number) => onDay(sameDayInMonth(day, addMonths(month, n)))

  return (
    <>
      <LargeTitleHeader
        title={monthLabel(month)}
        action={{ label: 'Kalender importieren', icon: <MoreIcon />, onClick: () => setImporting(true) }}
      />
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
          <div className="cal-left">
            <MonthGrid weeks={weeks} selected={day} today={today} events={byDay} finance={finance} onSelect={onDay} />
          </div>
          <section className="cal-right" aria-label="Termine des Tages">
            <div className="cal-day-head">
              <button type="button" className="cal-day-btn" onClick={onOpenDay} aria-label={`Tagesansicht: ${longDayLabel(day)}`}>
                <h2>{longDayLabel(day)}</h2>
                <ChevronRight />
              </button>
              <button type="button" className="round-btn cal-new-wide" onClick={() => onNewEvent(day)} aria-label="Neuer Termin">
                <PlusIcon />
              </button>
            </div>
            <DayList
              segments={segments}
              finance={dayFinance}
              onEvent={onEditEvent}
              onFinance={onOpenFinance}
            />
          </section>
        </div>
      </SwipePane>
      <Fab className="cal-fab" label="Termin hinzufügen" onClick={() => onNewEvent(day)} />
      {importing && <CalendarImportSheet onClose={() => setImporting(false)} />}
    </>
  )
})
