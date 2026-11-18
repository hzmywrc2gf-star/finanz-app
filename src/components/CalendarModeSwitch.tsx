import { SegmentedControl } from './SegmentedControl'

export type CalendarMode = 'calendar' | 'todo'

const OPTIONS: { value: CalendarMode; label: string }[] = [
  { value: 'calendar', label: 'Kalender' },
  { value: 'todo', label: 'To-do' },
]

/** "Kalender | To-do" below the title of the calendar tab (the tab bar keeps its five tabs). */
export function CalendarModeSwitch({ value, onChange }: { value: CalendarMode; onChange: (mode: CalendarMode) => void }) {
  return (
    <div className="cal-mode">
      <SegmentedControl options={OPTIONS} value={value} onChange={onChange} label="Ansicht" />
    </div>
  )
}
