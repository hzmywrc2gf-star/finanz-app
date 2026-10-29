import { useLayoutEffect, useRef } from 'react'
import type { BudgetStatus } from '../domain/budget'
import { formatPercent } from '../domain/money'
import { reducedMotion } from '../lib/motion'

/**
 * Budget bar, tone-in-tone gradient per status (CSS `.bar-fill[data-status]`). With a label it is a progressbar, otherwise decoration.
 * A bar that is already on screen when it first appears is full right away; one further down waits empty (`data-pending`) and fills
 * once, with a slow ease-out, when it scrolls into view. Later changes of the value (another month) just resize it.
 */
export function BudgetBar({ percent, status, label }: { percent: number; status: BudgetStatus; label?: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const track = trackRef.current
    const fill = fillRef.current
    if (!track || !fill || reducedMotion() || typeof IntersectionObserver === 'undefined') return
    if (track.getBoundingClientRect().top < window.innerHeight) return // in view on the first paint: no animation
    fill.setAttribute('data-pending', '')
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      fill.removeAttribute('data-pending')
      observer.disconnect()
    })
    observer.observe(track)
    return () => {
      observer.disconnect()
      fill.removeAttribute('data-pending')
    }
  }, [])

  const fill = <div ref={fillRef} className="bar-fill" data-status={status} style={{ width: `${Math.min(percent, 100)}%` }} />
  if (!label) {
    return (
      <div ref={trackRef} className="bar-track budget-track" data-status={status} aria-hidden="true">
        {fill}
      </div>
    )
  }
  return (
    <div
      ref={trackRef}
      className="bar-track budget-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-valuetext={`${formatPercent(percent)} verbraucht`}
      data-status={status}
    >
      {fill}
    </div>
  )
}
