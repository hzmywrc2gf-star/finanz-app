import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { followOffset, gestureIntent, releaseVelocity } from '../domain/gesture'
import type { Axis, Sample } from '../domain/gesture'

export type DragEnd = { delta: number; velocity: number; cancelled: boolean }

export type DragOptions = {
  axis: Axis
  /** Checked on pointer down; false leaves the touch to the browser (scrolling, taps, inputs). */
  canStart: (e: PointerEvent) => boolean
  /** Checked once the direction is clear; false gives the drag up (e.g. wrong way). */
  accept?: (delta: number) => boolean
  onStart?: () => void
  /**
   * At most once per animation frame, with the offset to paint along the axis: the finger travel since pointer down, minus the
   * dead zone before the direction was clear, which fades out over the first pixels (no jump when the content starts to follow).
   */
  onMove: (delta: number) => void
  /**
   * Optional, runs inside the pointermove event itself (not in the animation frame) with the same offset as `onMove`: for things
   * that need a user event, like a haptic tick when a threshold is crossed. Keep it tiny; it runs for every move event.
   */
  onMoveEvent?: (delta: number) => void
  /** `delta` is the raw finger travel, `velocity` px/ms along the axis; `cancelled` for pointercancel / lost capture. */
  onEnd: (end: DragEnd) => void
}

/**
 * Pointer-event drag recogniser. Nothing happens until the movement is clearly along `axis`, so taps and
 * vertical scrolling stay untouched; only then the pointer is captured. Callbacks always see the latest options.
 * Only `pointerdown` is listened to permanently (hundreds of list rows each use this hook); the move/up/cancel listeners
 * exist just for the length of one touch. Nothing in here reads layout.
 */
export function useDragGesture(ref: RefObject<HTMLElement | null>, options: DragOptions) {
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const horizontal = () => latest.current.axis === 'x'
    let state: 'idle' | 'pending' | 'drag' = 'idle'
    let id = -1
    let x0 = 0
    let y0 = 0
    let delta = 0
    let startDelta = 0
    let frame = 0
    let samples: Sample[] = []

    const down = (e: PointerEvent) => {
      if (state !== 'idle' || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
      if (!latest.current.canStart(e)) return
      state = 'pending'
      id = e.pointerId
      x0 = e.clientX
      y0 = e.clientY
      delta = 0
      startDelta = 0
      samples = [{ t: e.timeStamp, v: 0 }]
      listen(true)
    }
    const move = (e: PointerEvent) => {
      if (state === 'idle' || e.pointerId !== id) return
      // a mouse released outside the element never sends pointerup here: treat a buttonless move as cancel
      if (e.pointerType === 'mouse' && e.buttons === 0) {
        end(e, true)
        return
      }
      const dx = e.clientX - x0
      const dy = e.clientY - y0
      const main = horizontal() ? dx : dy
      if (state === 'pending') {
        const intent = gestureIntent(main, horizontal() ? dy : dx)
        if (intent === 'pending') return
        if (intent === 'reject' || latest.current.accept?.(main) === false) {
          state = 'idle'
          listen(false)
          return
        }
        state = 'drag'
        startDelta = main
        try {
          el.setPointerCapture(id)
        } catch {
          // the pointer is already gone; the end handler cleans up
        }
        latest.current.onStart?.()
      }
      delta = main
      latest.current.onMoveEvent?.(followOffset(delta, startDelta))
      // every coalesced touch sample counts for the velocity (a frame may carry several), the painted offset only needs the latest
      const events = e.getCoalescedEvents?.() ?? []
      for (const c of events.length > 0 ? events : [e]) {
        samples.push({ t: c.timeStamp, v: horizontal() ? c.clientX - x0 : c.clientY - y0 })
      }
      if (samples.length > 24) samples.splice(0, samples.length - 24)
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0
          if (state === 'drag') latest.current.onMove(followOffset(delta, startDelta))
        })
      }
    }
    const end = (e: PointerEvent, cancelled: boolean) => {
      if (state === 'idle' || e.pointerId !== id) return
      const wasDrag = state === 'drag'
      state = 'idle'
      listen(false)
      cancelAnimationFrame(frame)
      frame = 0
      if (!wasDrag) return
      try {
        el.releasePointerCapture(id)
      } catch {
        // already released
      }
      latest.current.onEnd({ delta, velocity: cancelled ? 0 : releaseVelocity(samples, e.timeStamp), cancelled })
    }
    const up = (e: PointerEvent) => end(e, false)
    const cancel = (e: PointerEvent) => end(e, true)
    // capturing on `el` makes a touch pointer lose its implicit capture on the original target: that event is no cancel
    const lost = (e: PointerEvent) => e.target === el && end(e, true)

    /** Adds or removes the listeners that only matter while a touch is being tracked. */
    const listen = (on: boolean) => {
      const toggle = on ? el.addEventListener.bind(el) : el.removeEventListener.bind(el)
      toggle('pointermove', move as EventListener, { passive: true })
      toggle('pointerup', up as EventListener)
      toggle('pointercancel', cancel as EventListener)
      toggle('lostpointercapture', lost as EventListener)
    }

    el.addEventListener('pointerdown', down, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      listen(false)
      el.removeEventListener('pointerdown', down)
    }
  }, [ref])
}
