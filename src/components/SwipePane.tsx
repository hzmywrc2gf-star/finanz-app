import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import {
  MONTH_FRACTION,
  MONTH_MAX_FRACTION,
  animationMs,
  isEdgeStart,
  monthStep,
  rubberBand,
  rubberBandSlope,
  swipeDecision,
} from '../domain/gesture'
import { SPRING_BOUNCY, SPRING_CALM } from '../domain/spring'
import { useDragGesture } from '../hooks/useDragGesture'
import { afterTransition, animateSpring, inSwipeRow, isFormField, modalOpen, reducedMotion, releaseMotion } from '../lib/motion'
import { haptic } from '../lib/haptics'

/** Reduced motion: the new month fades in this long (otherwise it settles on the calm spring). */
const IN_MS = 240
/** The incoming month arrives from this share of the width on the other side. */
const IN_FROM_FRACTION = 0.3

/**
 * Wraps the content of a month page: a horizontal swipe changes the month (left = next, right = previous).
 * The content follows the finger with resistance, slides out, and the new month settles in from the other side on a calm
 * spring (no overshoot, which would show an empty edge). A short pull springs back on the bouncy spring at the finger speed.
 * Only the content moves; position: fixed children (Fab, sheets) belong outside of the pane.
 */
export function SwipePane({ onStep, children }: { onStep: (step: 1 | -1) => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useRef(1)
  const busy = useRef(false)
  /** Where the content was last painted (px), the start of the animation after a release. */
  const painted = useRef(0)
  const stopSpring = useRef<(() => void) | null>(null)
  useEffect(() => () => stopSpring.current?.(), [])

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
      // a pull may catch the pane while it still springs back
      stopSpring.current?.()
      stopSpring.current = null
      el.style.transition = 'none'
      el.style.willChange = 'transform'
      painted.current = 0
      el.setAttribute('data-dragging', '')
    },
    onMove: (dx) => {
      const limit = width.current * MONTH_MAX_FRACTION
      painted.current = Math.sign(dx) * rubberBand(Math.abs(dx), limit)
      if (ref.current) ref.current.style.transform = `translate3d(${painted.current}px, 0, 0)`
    },
    onEnd: async ({ delta, velocity, cancelled }) => {
      const el = ref.current
      if (!el) return
      const sign = Math.sign(delta) || 1
      const commit = !cancelled && swipeDecision({ distance: Math.abs(delta), velocity: velocity * sign, size: width.current, fraction: MONTH_FRACTION })
      const reduced = reducedMotion()
      if (commit) haptic() // the month changes (still inside the pointer event)
      if (!commit) {
        if (reduced) {
          const { ms, curve } = releaseMotion(0, 0)
          void el.offsetWidth
          el.style.transition = `transform ${ms}ms ${curve}`
          el.style.transform = ''
          await afterTransition(el, ms)
          reset(el)
          return
        }
        // springs back; the content moved slower than the finger (rubber band), so it carries on at that share of the speed
        const slope = rubberBandSlope(Math.abs(delta), width.current * MONTH_MAX_FRACTION)
        stopSpring.current = animateSpring({
          from: painted.current,
          to: 0,
          velocity: cancelled ? 0 : velocity * slope,
          params: SPRING_BOUNCY,
          onUpdate: (x) => {
            painted.current = x
            el.style.transform = `translate3d(${x}px, 0, 0)`
          },
          onDone: () => {
            stopSpring.current = null
            reset(el)
            painted.current = 0
          },
        })
        return
      }
      busy.current = true
      // out: the old month leaves in the swipe direction ...
      const outTo = sign * width.current * 0.5
      const { ms: outMs, curve: outCurve } = releaseMotion(Math.abs(outTo - painted.current), velocity * sign)
      void el.offsetWidth
      el.style.transition = `transform ${outMs}ms ${outCurve}, opacity ${outMs}ms ease-out`
      el.style.transform = reduced ? '' : `translate3d(${outTo}px, 0, 0)`
      el.style.opacity = '0'
      await afterTransition(el, outMs)
      // ... the new one enters from the opposite side
      flushSync(() => onStep(monthStep(delta)))
      if (reduced) {
        const inMs = animationMs(IN_MS, true)
        el.style.transition = 'none'
        el.style.transform = ''
        void el.offsetWidth
        el.style.transition = `opacity ${inMs}ms ease-out`
        el.style.opacity = '1'
        await afterTransition(el, inMs)
        reset(el)
        busy.current = false
        painted.current = 0
        return
      }
      const from = -sign * width.current * IN_FROM_FRACTION
      el.style.transition = 'none'
      el.style.transform = `translate3d(${from}px, 0, 0)`
      void el.offsetWidth
      el.style.transition = 'opacity 160ms ease-out'
      el.style.opacity = '1'
      stopSpring.current = animateSpring({
        from,
        to: 0,
        params: SPRING_CALM,
        restOffset: 0.5,
        onUpdate: (x) => {
          el.style.transform = `translate3d(${x}px, 0, 0)`
        },
        onDone: () => {
          stopSpring.current = null
          reset(el)
          busy.current = false
          painted.current = 0
        },
      })
    },
  })

  return (
    <div ref={ref} className="swipe-pane">
      {children}
    </div>
  )
}
