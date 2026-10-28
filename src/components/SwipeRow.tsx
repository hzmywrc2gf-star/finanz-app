import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { ROW_ACTION_PX, animationMs, isEdgeStart, rowSwipeOutcome } from '../domain/gesture'
import { useDragGesture } from '../hooks/useDragGesture'
import { haptic } from '../lib/haptics'
import { afterTransition, isFormField, modalOpen, reducedMotion, releaseMotion } from '../lib/motion'
import { TrashIcon } from './Icons'

const SLIDE_OUT_MS = 110
const COLLAPSE_MS = 90

/** The one row that currently shows its "Löschen" button; opening or touching another place closes it. */
let openRow: { el: HTMLElement; close: () => void } | null = null

/**
 * A list item that can be swiped to the left (iOS Mail): the content follows the finger and reveals a red
 * "Löschen" button. Released past half of the button it stays open, a long swipe or flick deletes right away.
 * Everything moves through refs and CSS transforms. The swipe is an enhancement; every row also opens its edit sheet.
 */
export function SwipeRow({ label, onDelete, children }: { label: string; onDelete: () => void; children: ReactNode }) {
  const liRef = useRef<HTMLLIElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const width = useRef(1)
  /** closed / open at rest, busy while animating (no new drag, no taps). */
  const state = useRef<'closed' | 'open' | 'busy'>('closed')
  const unlisten = useRef<(() => void) | null>(null)
  /** Where the content stands (px, 0 = closed), the start of the animation after a release. */
  const offset = useRef(0)

  const paint = (x: number) => {
    offset.current = x
    if (contentRef.current) contentRef.current.style.transform = x === 0 ? '' : `translate3d(${x}px, 0, 0)`
  }
  const setPhase = (phase: 'closed' | 'open' | 'drag') => liRef.current?.setAttribute('data-swipe', phase)

  /**
   * Moves the content to `x` with the spring curve, starting at the finger speed `velocity` (px/ms, negative = leftwards;
   * 0 = from rest). Instantly with reduced motion. will-change stays until the move is over.
   */
  const moveTo = async (x: number, velocity = 0) => {
    const el = contentRef.current
    if (!el) return
    const { ms, curve } = releaseMotion(Math.abs(x - offset.current), Math.sign(x - offset.current) * velocity)
    el.style.willChange = 'transform'
    void el.offsetWidth // commit the current position before transitioning
    el.style.transition = reducedMotion() ? 'none' : `transform ${ms}ms ${curve}`
    paint(x)
    if (!reducedMotion()) await afterTransition(el, ms)
    el.style.transition = ''
    el.style.willChange = ''
  }

  const forget = () => {
    unlisten.current?.()
    unlisten.current = null
    if (openRow?.el === liRef.current) openRow = null
  }

  const close = async (velocity = 0) => {
    if (state.current !== 'open') return
    state.current = 'busy'
    forget()
    await moveTo(0, velocity)
    state.current = 'closed'
    setPhase('closed')
  }

  const open = async (velocity = 0) => {
    const li = liRef.current
    if (!li) return
    if (openRow && openRow.el !== li) void openRow.close()
    openRow = { el: li, close: () => close() }
    unlisten.current?.()
    state.current = 'busy'
    setPhase('open')
    // a touch anywhere else or any scrolling closes the row again
    const onDown = (e: PointerEvent) => {
      if (!li.contains(e.target as Node)) void close()
    }
    const onScroll = () => void close()
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('scroll', onScroll, { passive: true })
    unlisten.current = () => {
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('scroll', onScroll)
    }
    await moveTo(-ROW_ACTION_PX, velocity)
    state.current = 'open'
  }

  /** Slides the row out and collapses its height, then deletes. Reduced motion: a quick fade. */
  const remove = async () => {
    const li = liRef.current
    const el = contentRef.current
    if (!li || !el) return
    haptic() // still inside the touch/click handler
    state.current = 'busy'
    forget()
    if (reducedMotion()) {
      const ms = animationMs(SLIDE_OUT_MS + COLLAPSE_MS, true)
      li.style.transition = `opacity ${ms}ms linear`
      li.style.opacity = '0'
      await afterTransition(li, ms)
    } else {
      el.style.transition = `transform ${SLIDE_OUT_MS}ms ease-in`
      paint(-width.current)
      await afterTransition(el, SLIDE_OUT_MS)
      li.style.height = `${li.offsetHeight}px`
      void li.offsetHeight
      li.style.transition = `height ${COLLAPSE_MS}ms ease-out`
      li.style.height = '0'
      await afterTransition(li, COLLAPSE_MS)
    }
    onDelete()
  }

  useEffect(() => {
    const li = liRef.current
    return () => {
      unlisten.current?.()
      unlisten.current = null
      if (openRow?.el === li) openRow = null
    }
  }, [])

  useDragGesture(liRef, {
    axis: 'x',
    // the left screen edge belongs to the back swipe; inputs and open sheets keep their own touch handling
    canStart: (e) => state.current !== 'busy' && !isEdgeStart(e.clientX) && !isFormField(e.target) && !modalOpen(),
    // a closed row only follows a drag to the left (no right-swipe action)
    accept: (dx) => state.current === 'open' || dx < 0,
    onStart: () => {
      const el = contentRef.current
      if (!el) return
      width.current = liRef.current?.offsetWidth || 1
      if (openRow && openRow.el !== liRef.current) void openRow.close()
      el.style.transition = 'none'
      el.style.willChange = 'transform'
      setPhase('drag')
    },
    onMove: (dx) => paint(Math.min(0, Math.max(-width.current, (state.current === 'open' ? -ROW_ACTION_PX : 0) + dx))),
    onEnd: ({ delta, velocity, cancelled }) => {
      const el = contentRef.current
      if (!el) return
      const wasOpen = state.current === 'open'
      const offset = Math.min(0, Math.max(-width.current, (wasOpen ? -ROW_ACTION_PX : 0) + delta))
      const outcome = cancelled ? (wasOpen ? 'open' : 'close') : rowSwipeOutcome({ offset, velocity, width: width.current })
      if (outcome === 'delete') {
        void remove()
      } else if (outcome === 'open') {
        void open(velocity)
      } else if (wasOpen) {
        void close(velocity)
      } else {
        state.current = 'busy'
        void moveTo(0, velocity).then(() => {
          state.current = 'closed'
          setPhase('closed')
        })
      }
    },
  })

  return (
    <li ref={liRef} className="swipe-li" data-swipe-row="" data-swipe="closed">
      <div className="swipe-action">
        <button type="button" aria-label={`Löschen: ${label}`} onClick={() => void remove()}>
          <TrashIcon />
          Löschen
        </button>
      </div>
      <div
        ref={contentRef}
        className="swipe-content"
        // tapping an open row only closes it; the edit sheet stays shut
        onClickCapture={(e) => {
          if (state.current === 'closed') return
          e.stopPropagation()
          e.preventDefault()
          void close()
        }}
      >
        {children}
      </div>
    </li>
  )
}
