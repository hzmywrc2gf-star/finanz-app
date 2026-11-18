import { useState } from 'react'
import type { ReactNode } from 'react'
import type { TodoRecurrence } from '../domain/types'
import { addDays, todayISO } from '../domain/dates'
import { WEEKDAY_SHORT } from '../domain/calendar'
import { isWorkdays, nextWeekStart, shortDateLabel, todoRecurrenceLabel } from '../domain/todos'
import { CheckIcon } from './Icons'
import { SegmentedControl } from './SegmentedControl'
import { Sheet } from './Sheet'

/*
 * Small choice sheets of a task: due date, reminder and repetition (quick choices plus "Datum wählen"/"Benutzerdefiniert").
 * Choosing closes the sheet at once (like "Sichern"); "Abbrechen"/swipe keeps the old value.
 */

function Option({ label, detail, selected, onClick }: { label: string; detail?: string; selected?: boolean; onClick: () => void }) {
  return (
    <li>
      <button type="button" className="row todo-option" aria-pressed={selected} onClick={onClick}>
        <span className="row-main row-title">{label}</span>
        {detail && <span className="row-value">{detail}</span>}
        <span className="todo-option-check" aria-hidden="true">{selected && <CheckIcon />}</span>
      </button>
    </li>
  )
}

function OptionList({ children }: { children: ReactNode }) {
  return <ul className="list card todo-options">{children}</ul>
}

export function DuePicker({ value, onPick, onClose }: { value?: string; onPick: (date: string | null) => void; onClose: () => void }) {
  const today = todayISO()
  const [custom, setCustom] = useState(value ?? addDays(today, 1))
  const pick = (d: string | null) => {
    onPick(d)
    onClose()
  }
  const quick = [
    { label: 'Heute', date: today },
    { label: 'Morgen', date: addDays(today, 1) },
    { label: 'Nächste Woche', date: nextWeekStart(today) },
  ]
  return (
    <Sheet title="Fälligkeit" onClose={onClose}>
      <OptionList>
        {quick.map((q) => (
          <Option key={q.label} label={q.label} detail={shortDateLabel(q.date, today)} selected={value === q.date} onClick={() => pick(q.date)} />
        ))}
      </OptionList>
      <div className="section-title">Datum wählen</div>
      <form
        className="card todo-custom"
        onSubmit={(e) => {
          e.preventDefault()
          if (custom) pick(custom)
        }}
      >
        <div className="field">
          <label htmlFor="todo-due-date">Datum</label>
          <input id="todo-due-date" type="date" value={custom} onChange={(e) => setCustom(e.target.value)} />
        </div>
        <button className="btn todo-apply" type="submit" disabled={!custom}>
          Übernehmen
        </button>
      </form>
      {value && (
        <button type="button" className="btn danger" onClick={() => pick(null)}>
          Fälligkeit entfernen
        </button>
      )}
    </Sheet>
  )
}

export function ReminderPicker({ value, onPick, onClose }: { value?: string; onPick: (reminder: string | null) => void; onClose: () => void }) {
  const today = todayISO()
  const [hour] = useState(() => new Date().getHours())
  const [date, setDate] = useState(value?.slice(0, 10) ?? today)
  const [time, setTime] = useState(value?.slice(11, 16) ?? '09:00')
  const pick = (r: string | null) => {
    onPick(r)
    onClose()
  }
  const quick: { label: string; value: string }[] = []
  // "Später heute": three hours from now on the full hour, only while the day still has room for it
  const later = hour + 3
  if (later <= 21) quick.push({ label: 'Später heute', value: `${today}T${String(later).padStart(2, '0')}:00` })
  quick.push({ label: 'Morgen', value: `${addDays(today, 1)}T09:00` }, { label: 'Nächste Woche', value: `${nextWeekStart(today)}T09:00` })
  return (
    <Sheet title="Erinnerung" onClose={onClose}>
      <OptionList>
        {quick.map((q) => (
          <Option key={q.label} label={q.label} detail={`${shortDateLabel(q.value.slice(0, 10), today)}, ${q.value.slice(11)}`} selected={value === q.value} onClick={() => pick(q.value)} />
        ))}
      </OptionList>
      <div className="section-title">Datum und Uhrzeit wählen</div>
      <form
        className="card todo-custom"
        onSubmit={(e) => {
          e.preventDefault()
          if (date && time) pick(`${date}T${time}`)
        }}
      >
        <div className="field">
          <label htmlFor="todo-rem-date">Datum</label>
          <input id="todo-rem-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="todo-rem-time">Uhrzeit</label>
          <input id="todo-rem-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <button className="btn todo-apply" type="submit" disabled={!date || !time}>
          Übernehmen
        </button>
      </form>
      <p className="footnote">Die Erinnerung kommt über den Kalender deines iPhones: Danach kannst du sie dort eintragen.</p>
      {value && (
        <button type="button" className="btn danger" onClick={() => pick(null)}>
          Erinnerung entfernen
        </button>
      )}
    </Sheet>
  )
}

type Unit = TodoRecurrence['freq']
const UNITS: { value: Unit; label: string }[] = [
  { value: 'daily', label: 'Tage' },
  { value: 'weekly', label: 'Wochen' },
  { value: 'monthly', label: 'Monate' },
  { value: 'yearly', label: 'Jahre' },
]
const same = (a: TodoRecurrence | undefined, b: TodoRecurrence) => !!a && todoRecurrenceLabel(a) === todoRecurrenceLabel(b)

export function RepeatPicker({ value, onPick, onClose }: { value?: TodoRecurrence; onPick: (r: TodoRecurrence | null) => void; onClose: () => void }) {
  const [every, setEvery] = useState(String(value?.interval ?? 1))
  const [unit, setUnit] = useState<Unit>(value?.freq ?? 'weekly')
  const [days, setDays] = useState<number[]>(value?.byWeekday ?? [])
  const pick = (r: TodoRecurrence | null) => {
    onPick(r)
    onClose()
  }
  const quick: { label: string; rule: TodoRecurrence }[] = [
    { label: 'Täglich', rule: { freq: 'daily', interval: 1 } },
    { label: 'Wochentags', rule: { freq: 'weekly', interval: 1, byWeekday: [0, 1, 2, 3, 4] } },
    { label: 'Wöchentlich', rule: { freq: 'weekly', interval: 1 } },
    { label: 'Monatlich', rule: { freq: 'monthly', interval: 1 } },
    { label: 'Jährlich', rule: { freq: 'yearly', interval: 1 } },
  ]
  const n = Number(every)
  const valid = Number.isInteger(n) && n >= 1 && n <= 99
  const custom = value && !quick.some((q) => same(value, q.rule)) && !isWorkdays(value)
  return (
    <Sheet title="Wiederholen" onClose={onClose}>
      <OptionList>
        {quick.map((q) => (
          <Option key={q.label} label={q.label} selected={same(value, q.rule)} onClick={() => pick(q.rule)} />
        ))}
      </OptionList>
      <div className="section-title">Benutzerdefiniert{custom ? ` · ${todoRecurrenceLabel(value)}` : ''}</div>
      <form
        className="card todo-custom"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          pick({ freq: unit, interval: n, ...(unit === 'weekly' && days.length ? { byWeekday: [...days].sort((a, b) => a - b) } : {}) })
        }}
      >
        <div className="field">
          <label htmlFor="todo-rep-n">Alle</label>
          <input id="todo-rep-n" inputMode="numeric" value={every} onChange={(e) => setEvery(e.target.value.replace(/\D/g, '').slice(0, 2))} />
        </div>
        <div className="todo-seg">
          <SegmentedControl options={UNITS} value={unit} onChange={setUnit} label="Einheit" />
        </div>
        {unit === 'weekly' && (
          <div className="todo-days" role="group" aria-label="Wochentage">
            {WEEKDAY_SHORT.map((d, i) => (
              <button
                key={d}
                type="button"
                className="todo-day"
                aria-pressed={days.includes(i)}
                onClick={() => setDays((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))}
              >
                {d}
              </button>
            ))}
          </div>
        )}
        {!valid && <div className="error" role="alert">Bitte eine Zahl von 1 bis 99 eingeben.</div>}
        <button className="btn todo-apply" type="submit" disabled={!valid}>
          Übernehmen
        </button>
      </form>
      {value && (
        <button type="button" className="btn danger" onClick={() => pick(null)}>
          Nicht wiederholen
        </button>
      )}
    </Sheet>
  )
}
