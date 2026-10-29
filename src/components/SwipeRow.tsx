import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { ROW_ACTION_PX, ROW_DELETE_FRACTION, animationMs, isEdgeStart, rowSwipeOutcome } from '../domain/gesture'
import { SPRING_BOUNCY } from '../domain/spring'
import { useDragGesture } from '../hooks/useDragGesture'
import { haptic } from '../lib/haptics'
import { afterTransition, animateSpring, isFormField, modalOpen, reducedMotion } from '../lib/motion'
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
  /** Where the content stood when the current drag started (it may still have been moving). */
  const dragBase = useRef(0)
  /** Stops the spring that currently moves the content. */
  const stopSpring = useRef<(() => void) | null>(null)
  /** Dragged past the "delete right away" line (a tick told the user); a release there must not tick a second time. */
  const armed = useRef(false)

  const paint = (x: number) => {
    offset.current = x
    if (contentRef.current) contentRef.current.style.transform = x === 0 ? '' : `translate3d(${x}px, 0, 0)`
  }
  const setPhase = (phase: 'closed' | 'open' | 'drag') => liRef.current?.setAttribute('data-swipe', phase)

  /**
   * Moves the content to `x` on the bouncy spring, starting at the finger speed `velocity` (px/ms, negative = leftwards;
   * 0 = from rest). Closing never swings past the left edge of the row. Instantly with reduced motion. will-change stays until
   * the move is over.
   */
  const moveTo = (x: number, velocity = 0) =>
    new Promise<void>((resolve) => {
      const el = contentRef.current
      stopSpring.current?.()
      stopSpring.current = null
      if (!el) return resolve()
      el.style.transition = ''
      if (reducedMotion()) {
        paint(x)
        el.style.willChange = ''
        return resolve()
      }
      el.style.willChange = 'transform'
      stopSpring.current = animateSpring({
        from: offset.current,
        to: x,
        velocity,
        params: SPRING_BOUNCY,
        onUpdate: (v) => paint(x === 0 ? Math.min(0, v) : v),
        onDone: () => {
          stopSpring.current = null
          el.style.willChange = ''
          paint(x)
          resolve()
        },
      })
    })

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
    if (!armed.current) haptic() // still inside the touch/click handler (a drag past the line already ticked when it armed)
    armed.current = false
    stopSpring.current?.()
    stopSpring.current = null
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
      stopSpring.current?.()
      unlisten.current?.()
      unlisten.current = null
      if (openRow?.el === li) openRow = null
    }
  }, [])

  /** Where the content stands for a finger travel of `dx` (never right of the closed place, never beyond the row). */
  const rowOffset = (dx: number) => Math.min(0, Math.max(-width.current, dragBase.current + dx))

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
      // a drag may catch the row while it still springs: it continues from where it is
      stopSpring.current?.()
      stopSpring.current = null
      dragBase.current = offset.current
      armed.current = false
      el.style.transition = 'none'
      el.style.willChange = 'transform'
      setPhase('drag')
    },
    onMove: (dx) => paint(rowOffset(dx)),
    // the tick has to happen inside the pointer event: past 60 % of the width releasing deletes (arming), back before it disarms
    onMoveEvent: (dx) => {
      const now = -rowOffset(dx) > width.current * ROW_DELETE_FRACTION
      if (now !== armed.current) {
        armed.current = now
        haptic()
      }
    },
    onEnd: ({ delta, velocity, cancelled }) => {
      const el = contentRef.current
      if (!el) return
      const wasOpen = state.current === 'open'
      const offset = rowOffset(delta)
      const outcome = cancelled ? (wasOpen ? 'open' : 'close') : rowSwipeOutcome({ offset, velocity, width: width.current })
      if (outcome !== 'delete') armed.current = false
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
