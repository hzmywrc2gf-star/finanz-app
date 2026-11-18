import { memo, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Todo, TodoColor, TodoIcon } from '../domain/types'
import { dueLabel, isOverdue, stepsLabel } from '../domain/todos'
import { haptic } from '../lib/haptics'
import { afterTransition, reducedMotion } from '../lib/motion'
import {
  BellIcon, BookIcon, CartIcon, GiftIcon, HeartIcon, HouseIcon, ListIcon, NoteIcon, PlannedIcon, RepeatSmallIcon, StarIcon, SunIcon, TravelIcon, WorkIcon,
} from './Icons'
import { SwipeRow } from './SwipeRow'

/** Pause after the tap before a ticked-off task leaves the open tasks (the circle fills and the title is struck through meanwhile). */
const CHECK_PAUSE_MS = 350
/** The row then folds away (the only layout animation besides deleting a row). */
const COLLAPSE_MS = 160

export function ListGlyph({ icon, size = 18 }: { icon: TodoIcon; size?: number }) {
  switch (icon) {
    case 'cart':
      return <CartIcon size={size} />
    case 'home':
      return <HouseIcon size={size} />
    case 'work':
      return <WorkIcon size={size} />
    case 'heart':
      return <HeartIcon size={size} />
    case 'gift':
      return <GiftIcon size={size} />
    case 'travel':
      return <TravelIcon size={size} />
    case 'book':
      return <BookIcon size={size} />
    default:
      return <ListIcon />
  }
}

/** Square symbol tile of a list (settings-row style), in the list's colour. */
export function ListTile({ color, children }: { color: TodoColor; children: ReactNode }) {
  return (
    <span className="menu-icon todo-tile" data-color={color}>
      {children}
    </span>
  )
}

/**
 * The round check of a task (a real checkbox for assistive technology). Ticking an open task off: haptic tick, the circle fills
 * with a drawn check mark and the title is struck through, then after a short pause `onToggle` runs (`collapse` may fold the
 * row away first). Opening a completed task again happens at once. Reduced motion: no pause, no animation.
 */
export function TodoCheck({
  done,
  title,
  onToggle,
  collapse,
  small,
}: {
  done: boolean
  title: string
  onToggle: () => void
  collapse?: () => Promise<void>
  small?: boolean
}) {
  const [checking, setChecking] = useState(false)
  const timer = useRef(0)
  const latest = useRef({ onToggle, collapse })
  useEffect(() => {
    latest.current = { onToggle, collapse }
  })
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const shown = done || checking
  return (
    <button
      type="button"
      className={small ? 'todo-check small' : 'todo-check'}
      role="checkbox"
      aria-checked={shown}
      aria-label={`Als erledigt markieren: ${title}`}
      data-checking={checking || undefined}
      onClick={(e) => {
        e.stopPropagation()
        if (checking) return
        haptic()
        if (done || reducedMotion()) return onToggle()
        setChecking(true)
        timer.current = window.setTimeout(async () => {
          await latest.current.collapse?.()
          latest.current.onToggle()
        }, CHECK_PAUSE_MS)
      }}
    >
      <span className="todo-check-circle" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
    </button>
  )
}

/** The star of a task: filled = important. */
export function StarButton({ on, title, onToggle }: { on: boolean; title: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="todo-star"
      aria-pressed={on}
      aria-label={`Wichtig: ${title}`}
      onClick={(e) => {
        e.stopPropagation()
        haptic()
        onToggle()
      }}
    >
      <StarIcon size={22} filled={on} />
    </button>
  )
}

/** The meta line below a task's title: list, „Mein Tag“, steps, due date, repetition, reminder, note (separated by "·"). */
export function TodoMeta({ todo, today, list, hideMyDay }: { todo: Todo; today: string; list?: string; hideMyDay?: boolean }) {
  const items: { key: string; node: ReactNode; cls?: string }[] = []
  if (list) items.push({ key: 'list', node: list })
  if (!hideMyDay && todo.myDay === today) items.push({ key: 'myday', node: <><SunIcon size={13} />Mein Tag</> })
  const steps = stepsLabel(todo)
  if (steps) items.push({ key: 'steps', node: steps })
  if (todo.dueDate) {
    const cls = isOverdue(todo, today) ? 'overdue-text' : !todo.done && todo.dueDate === today ? 'todo-due-today' : undefined
    items.push({ key: 'due', node: <><PlannedIcon size={13} />{dueLabel(todo.dueDate, today, todo.done)}</>, cls })
  }
  const icons: ReactNode[] = []
  if (todo.recurrence) icons.push(<span key="r" className="todo-meta-icon"><RepeatSmallIcon size={13} /><span className="sr-only">wiederholt</span></span>)
  if (todo.reminder) icons.push(<span key="b" className="todo-meta-icon"><BellIcon size={13} /><span className="sr-only">Erinnerung</span></span>)
  if (todo.note) icons.push(<span key="n" className="todo-meta-icon"><NoteIcon size={13} /><span className="sr-only">Notiz</span></span>)
  if (icons.length) items.push({ key: 'icons', node: <span className="todo-meta-icons">{icons}</span> })
  if (items.length === 0) return null
  return (
    <span className="todo-meta">
      {items.map((it, i) => (
        <span key={it.key} className={it.cls ? `todo-meta-item ${it.cls}` : 'todo-meta-item'}>
          {it.node}
          {i < items.length - 1 && <span className="todo-sep" aria-hidden="true">·</span>}
        </span>
      ))}
    </span>
  )
}

/**
 * One task in a list: check, title with meta line, star; tap opens the details, swipe left deletes (undo in the toast).
 * Memoized: a stable `todo` object and stable handlers keep a long list from re-rendering when one task changes.
 */
export const TodoRow = memo(function TodoRow({
  todo,
  today,
  list,
  hideMyDay,
  onToggle,
  onStar,
  onOpen,
  onDelete,
}: {
  todo: Todo
  today: string
  /** List name, shown in the smart lists. */
  list?: string
  hideMyDay?: boolean
  onToggle: (id: string) => void
  onStar: (id: string) => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  /** Folds the row away before the ticked-off task leaves the open list. */
  const collapse = async () => {
    const el = rowRef.current
    if (!el || reducedMotion()) return
    el.style.height = `${el.offsetHeight}px`
    void el.offsetHeight
    el.style.transition = `height ${COLLAPSE_MS}ms ease-out, opacity ${COLLAPSE_MS}ms ease-out`
    el.style.height = '0'
    el.style.opacity = '0'
    await afterTransition(el, COLLAPSE_MS)
  }
  return (
    <SwipeRow label={todo.title} onDelete={() => onDelete(todo.id)}>
      <div ref={rowRef} className="todo-row" data-done={todo.done || undefined} data-testid="todo-row">
        <TodoCheck done={todo.done} title={todo.title} onToggle={() => onToggle(todo.id)} collapse={todo.done ? undefined : collapse} />
        <button type="button" className="todo-main" onClick={() => onOpen(todo.id)}>
          <span className="todo-title">{todo.title}</span>
          <TodoMeta todo={todo} today={today} list={list} hideMyDay={hideMyDay} />
        </button>
        <StarButton on={todo.important} title={todo.title} onToggle={() => onStar(todo.id)} />
      </div>
    </SwipeRow>
  )
})
