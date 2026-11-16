import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { PINCH_MIN_DISTANCE, pinchDistance, pinchFactor, pinchVelocity } from '../domain/gesture'
import type { Point, Sample } from '../domain/gesture'

export type PinchEnd = { factor: number; velocity: number; cancelled: boolean }

export type PinchOptions = {
  /** Checked when the second finger lands; false leaves the two fingers alone. */
  canStart?: () => boolean
  /** Two fingers are down (the first one on the element); `center` = their midpoint in client px. */
  onStart?: (center: Point) => void
  /** At most once per animation frame: current distance / start distance. */
  onMove: (factor: number) => void
  /** Inside the pointermove event (user gesture), e.g. for a haptic tick at the threshold. Keep it tiny. */
  onMoveEvent?: (factor: number) => void
  /** `velocity` = speed of ln(factor) in 1/ms (positive = apart); `cancelled` for pointercancel. */
  onEnd: (end: PinchEnd) => void
}

/**
 * Two-finger pinch recogniser on top of pointer events (touch only). The first finger has to land on the element, the second
 * may land anywhere. Only `pointerdown` (and the zoom blockers below) stay attached; move/up/cancel are window listeners for the
 * length of one touch, so a finger captured by a one-finger drag (which a second finger cancels, see useDragGesture) still counts.
 * The browser's own pinch zoom is kept off this element: `touchmove` with two fingers is prevented (Chrome would otherwise
 * scroll with two fingers) and Safari's `gesturestart`/`gesturechange` are prevented; one-finger scrolling stays untouched.
 */
export function usePinch(ref: RefObject<HTMLElement | null>, options: PinchOptions) {
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const points = new Map<number, Point>()
    let pair: [number, number] | null = null
    let start = 0
    let factor = 1
    let frame = 0
    let samples: Sample[] = []

    const current = () => {
      const a = pair && points.get(pair[0])
      const b = pair && points.get(pair[1])
      return a && b ? pinchFactor(start, pinchDistance(a, b)) : 1
    }
    const maybeStart = (e: PointerEvent) => {
      if (pair || points.size !== 2 || latest.current.canStart?.() === false) return
      const [a, b] = [...points.keys()]
      const pa = points.get(a)!
      const pb = points.get(b)!
      const d = pinchDistance(pa, pb)
      if (!(d >= PINCH_MIN_DISTANCE)) return
      pair = [a, b]
      start = d
      factor = 1
      samples = [{ t: e.timeStamp, v: 0 }]
      latest.current.onStart?.({ x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 })
    }
    const finish = (e: PointerEvent, cancelled: boolean) => {
      if (!pair) return
      pair = null
      cancelAnimationFrame(frame)
      frame = 0
      latest.current.onEnd({ factor, velocity: cancelled ? 0 : pinchVelocity(samples, e.timeStamp), cancelled })
    }

    const firstDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || points.size > 0) return
      points.set(e.pointerId, { x: e.clientX, y: e.clientY })
      listen(true)
    }
    // while tracking: further fingers, wherever they land (capture phase, before the element's own listener)
    const otherDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || points.has(e.pointerId)) return
      // a primary pointer starts a new touch: whatever is still tracked lost its pointerup somewhere (stale), start over
      if (e.isPrimary) {
        reset()
        return
      }
      points.set(e.pointerId, { x: e.clientX, y: e.clientY })
      maybeStart(e)
    }
    const move = (e: PointerEvent) => {
      const p = points.get(e.pointerId)
      if (!p) return
      p.x = e.clientX
      p.y = e.clientY
      if (!pair || (e.pointerId !== pair[0] && e.pointerId !== pair[1])) return
      factor = current()
      samples.push({ t: e.timeStamp, v: Math.log(factor) })
      if (samples.length > 24) samples.splice(0, samples.length - 24)
      latest.current.onMoveEvent?.(factor)
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0
          if (pair) latest.current.onMove(factor)
        })
      }
    }
    const lift = (e: PointerEvent, cancelled: boolean) => {
      if (!points.has(e.pointerId)) return
      if (pair && (e.pointerId === pair[0] || e.pointerId === pair[1])) finish(e, cancelled)
      points.delete(e.pointerId)
      if (points.size === 0) listen(false)
    }
    const up = (e: PointerEvent) => lift(e, false)
    const cancel = (e: PointerEvent) => lift(e, true)

    const reset = () => {
      cancelAnimationFrame(frame)
      frame = 0
      if (pair) {
        pair = null
        latest.current.onEnd({ factor, velocity: 0, cancelled: true })
      }
      points.clear()
      listen(false)
    }

    const listen = (on: boolean) => {
      const toggle = on ? window.addEventListener.bind(window) : window.removeEventListener.bind(window)
      toggle('pointerdown', otherDown as EventListener, { capture: true, passive: true })
      toggle('pointermove', move as EventListener, { capture: true, passive: true })
      toggle('pointerup', up as EventListener, { capture: true, passive: true })
      toggle('pointercancel', cancel as EventListener, { capture: true, passive: true })
    }

    // no browser zoom (or two-finger scrolling) on this surface; a single finger still scrolls
    const blockTouch = (e: TouchEvent) => {
      if (e.touches.length >= 2 && e.cancelable) e.preventDefault()
    }
    const blockGesture = (e: Event) => e.preventDefault()

    el.addEventListener('pointerdown', firstDown, { passive: true })
    el.addEventListener('touchmove', blockTouch, { passive: false })
    el.addEventListener('gesturestart', blockGesture)
    el.addEventListener('gesturechange', blockGesture)
    return () => {
      cancelAnimationFrame(frame)
      listen(false)
      el.removeEventListener('pointerdown', firstDown)
      el.removeEventListener('touchmove', blockTouch)
      el.removeEventListener('gesturestart', blockGesture)
      el.removeEventListener('gesturechange', blockGesture)
    }
  }, [ref])
}
