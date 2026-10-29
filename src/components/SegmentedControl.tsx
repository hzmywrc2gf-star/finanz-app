import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { SPRING_BOUNCY } from '../domain/spring'
import type { SpringParams } from '../domain/spring'
import { haptic } from '../lib/haptics'
import { animateSpring, reducedMotion } from '../lib/motion'

/** The selection pill is a little quicker than a sheet: the same damping, a shorter response. */
const PILL_SPRING: SpringParams = { ...SPRING_BOUNCY, response: 0.32 }

/**
 * iOS segmented control. The selection is a pill that glides to the chosen option on a spring (moved through a ref and
 * `transform`, no React state per frame); a change of value gives a light haptic tick. Reduced motion: the pill jumps.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  /** Where the pill is painted (px), null until it was placed the first time. */
  const painted = useRef<number | null>(null)
  const stop = useRef<(() => void) | null>(null)

  /** Puts the pill under the pressed option, gliding when `animate` and it was placed before. */
  const place = useCallback((animate: boolean) => {
    const pill = pillRef.current
    const active = rootRef.current?.querySelector<HTMLElement>('button[aria-pressed="true"]')
    if (!pill || !active) return
    const to = active.offsetLeft
    pill.style.width = `${active.offsetWidth}px`
    stop.current?.()
    stop.current = null
    const paint = (x: number) => {
      painted.current = x
      pill.style.transform = `translate3d(${x}px, 0, 0)`
    }
    if (!animate || painted.current === null || painted.current === to || reducedMotion()) {
      pill.style.willChange = ''
      paint(to)
      return
    }
    pill.style.willChange = 'transform'
    stop.current = animateSpring({
      from: painted.current,
      to,
      params: PILL_SPRING,
      onUpdate: paint,
      onDone: () => {
        stop.current = null
        pill.style.willChange = ''
      },
    })
  }, [])

  // before the first paint the pill is already in place; later changes glide
  const placedOnce = useRef(false)
  useLayoutEffect(() => {
    place(placedOnce.current)
    placedOnce.current = true
  }, [value, options.length, place])

  // a resized or newly visible control (rotation, a sheet that just appeared) puts the pill back without animation
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => place(false))
    observer.observe(root)
    return () => {
      observer.disconnect()
      stop.current?.()
    }
  }, [place])

  return (
    <div ref={rootRef} className="segmented" role="group" aria-label={label}>
      <span ref={pillRef} className="seg-pill" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => {
            if (value !== o.value) haptic()
            onChange(o.value)
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
