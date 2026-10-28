import { useRef } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import {
  MONTH_FRACTION,
  MONTH_MAX_FRACTION,
  animationMs,
  isEdgeStart,
  monthStep,
  rubberBand,
  swipeDecision,
} from '../domain/gesture'
import { useDragGesture } from '../hooks/useDragGesture'
import { EASE_IOS, afterTransition, inSwipeRow, isFormField, modalOpen, reducedMotion } from '../lib/motion'

const OUT_MS = 160
const IN_MS = 240

/**
 * Wraps the content of a month page: a horizontal swipe changes the month (left = next, right = previous).
 * The content follows the finger with resistance, slides out, and the new month slides in from the other side.
 * Only the content moves; position: fixed children (Fab, sheets) belong outside of the pane.
 */
export function SwipePane({ onStep, children }: { onStep: (step: 1 | -1) => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useRef(1)
  const busy = useRef(false)

  const reset = (el: HTMLElement) => {
    el.style.transition = ''
    el.style.transform = ''
    el.style.opacity = ''
    el.style.willChange = ''
    el.removeAttribute('data-dragging')
  }

  useDragGesture(ref, {
    axis: 'x',
    // the left screen edge belongs to the back swipe of the sub-pages, a drag that begins on a booking row to the row
    canStart: (e) => !busy.current && !isEdgeStart(e.clientX) && !isFormField(e.target) && !inSwipeRow(e.target) && !modalOpen(),
    onStart: () => {
      const el = ref.current
      if (!el) return
      width.current = el.offsetWidth || 1
      el.style.transition = 'none'
      el.style.willChange = 'transform'
      el.setAttribute('data-dragging', '')
    },
    onMove: (dx) => {
      const limit = width.current * MONTH_MAX_FRACTION
      if (ref.current) ref.current.style.transform = `translate3d(${Math.sign(dx) * rubberBand(Math.abs(dx), limit)}px, 0, 0)`
    },
    onEnd: async ({ delta, velocity, cancelled }) => {
      const el = ref.current
      if (!el) return
      const sign = Math.sign(delta) || 1
      const commit = !cancelled && swipeDecision({ distance: Math.abs(delta), velocity: velocity * sign, size: width.current, fraction: MONTH_FRACTION })
      const reduced = reducedMotion()
      if (!commit) {
        const ms = animationMs(IN_MS, reduced)
        void el.offsetWidth
        el.style.transition = `transform ${ms}ms ${EASE_IOS}`
        el.style.transform = ''
        await afterTransition(el, ms)
        reset(el)
        return
      }
      busy.current = true
      // out: the old month leaves in the swipe direction ...
      const outMs = animationMs(OUT_MS, reduced)
      void el.offsetWidth
      el.style.transition = `transform ${outMs}ms ease-in, opacity ${outMs}ms ease-in`
      el.style.transform = reduced ? '' : `translate3d(${sign * width.current * 0.5}px, 0, 0)`
      el.style.opacity = '0'
      await afterTransition(el, outMs)
      // ... the new one enters from the opposite side
      flushSync(() => onStep(monthStep(delta)))
      const inMs = animationMs(IN_MS, reduced)
      el.style.transition = 'none'
      el.style.transform = reduced ? '' : `translate3d(${-sign * width.current * 0.3}px, 0, 0)`
      void el.offsetWidth
      el.style.transition = `transform ${inMs}ms ${EASE_IOS}, opacity ${inMs}ms ease-out`
      el.style.transform = ''
      el.style.opacity = '1'
      await afterTransition(el, inMs)
      reset(el)
      busy.current = false
    },
  })

  return (
    <div ref={ref} className="swipe-pane">
      {children}
    </div>
  )
}
