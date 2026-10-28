import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { gestureIntent, releaseVelocity } from '../domain/gesture'
import type { Axis, Sample } from '../domain/gesture'

export type DragEnd = { delta: number; velocity: number; cancelled: boolean }

export type DragOptions = {
  axis: Axis
  /** Checked on pointer down; false leaves the touch to the browser (scrolling, taps, inputs). */
  canStart: (e: PointerEvent) => boolean
  /** Checked once the direction is clear; false gives the drag up (e.g. wrong way). */
  accept?: (delta: number) => boolean
  onStart?: () => void
  /** At most once per animation frame, with the finger offset along the axis since pointer down. */
  onMove: (delta: number) => void
  /** `velocity` is px/ms along the axis; `cancelled` for pointercancel / lost capture. */
  onEnd: (end: DragEnd) => void
}

/**
 * Pointer-event drag recogniser. Nothing happens until the movement is clearly along `axis`, so taps and
 * vertical scrolling stay untouched; only then the pointer is captured. Callbacks always see the latest options.
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
      samples = [{ t: e.timeStamp, v: 0 }]
    }
    const move = (e: PointerEvent) => {
      if (state === 'idle' || e.pointerId !== id) return
      const dx = e.clientX - x0
      const dy = e.clientY - y0
      const main = horizontal() ? dx : dy
      if (state === 'pending') {
        const intent = gestureIntent(main, horizontal() ? dy : dx)
        if (intent === 'pending') return
        if (intent === 'reject' || latest.current.accept?.(main) === false) {
          state = 'idle'
          return
        }
        state = 'drag'
        try {
          el.setPointerCapture(id)
        } catch {
          // the pointer is already gone; the end handler cleans up
        }
        latest.current.onStart?.()
      }
      delta = main
      samples.push({ t: e.timeStamp, v: main })
      if (samples.length > 12) samples.shift()
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0
          if (state === 'drag') latest.current.onMove(delta)
        })
      }
    }
    const end = (e: PointerEvent, cancelled: boolean) => {
      if (state === 'idle' || e.pointerId !== id) return
      const wasDrag = state === 'drag'
      state = 'idle'
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

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', cancel)
    el.addEventListener('lostpointercapture', lost)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', cancel)
      el.removeEventListener('lostpointercapture', lost)
    }
  }, [ref])
}
