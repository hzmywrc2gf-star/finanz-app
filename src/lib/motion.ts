/** Shared helpers for the CSS-transition based animations (no animation library). */
import { releaseCurve, releaseDuration } from '../domain/gesture'
import { isSettled, springStart, stepSpring } from '../domain/spring'
import type { SpringParams } from '../domain/spring'

/** iOS-like ease-out used for pushes, pops and spring-backs. */
export const EASE_IOS = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

/** iOS navigation (UINavigationController push/pop) curve: soft start, long gentle landing. */
export const EASE_NAV = 'cubic-bezier(0.32, 0.72, 0, 1)'

/**
 * Duration and timing function for the animation after a release: the iOS curve, started at the finger speed
 * (`distance` left to travel in px, `velocity` towards the target in px/ms; see `releaseDuration`).
 */
export function releaseMotion(distance: number, velocity: number): { ms: number; curve: string } {
  const ms = releaseDuration(distance, velocity, reducedMotion())
  return { ms, curve: releaseCurve(distance, velocity, ms) }
}

export const reducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Resolves when `el` finishes a transition (or shortly after `ms`, e.g. when nothing actually changed). */
export function afterTransition(el: HTMLElement, ms: number): Promise<void> {
  return new Promise((resolve) => {
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      el.removeEventListener('transitionend', onEnd)
      clearTimeout(timer)
      resolve()
    }
    const onEnd = (e: TransitionEvent) => {
      if (e.target === el) finish()
    }
    el.addEventListener('transitionend', onEnd)
    const timer = setTimeout(finish, ms + 60)
  })
}

/** Text fields and selects keep their own touch handling (caret, picker); drags never start on them. */
export const isFormField = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('input, select, textarea') !== null

/** Buttons, links and form controls: the sheet drag does not start on them (a tap there must stay a tap). */
export const isInteractive = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('input, select, textarea, button, a, label') !== null

/** A sheet or dialog is open: page-level gestures stay out of the way. */
export const modalOpen = (): boolean => document.querySelector('[aria-modal="true"]') !== null

/** Rows with a swipe-to-delete action own their horizontal drags; page-level swipes (month change) stay out. */
export const inSwipeRow = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('[data-swipe-row]') !== null

export type SpringRun = {
  from: number
  to: number
  /** Finger speed along the same axis in px/ms (0 = from rest). */
  velocity?: number
  params: SpringParams
  /** Closer than this (px) to the target counts as arrived (together with a low speed); default 0.3. */
  restOffset?: number
  /** Ends the run early (e.g. a closing sheet is off screen long before the tail of the spring is over). */
  stopWhen?: (value: number) => boolean
  onUpdate: (value: number) => void
  /** Called once when the spring arrived or `stopWhen` fired, never after `cancel`. */
  onDone?: () => void
}

/**
 * rAF driver for `domain/spring.ts`: calls `onUpdate` with the position once per frame (callers write `style.transform` on a
 * ref, no React state) until the spring is at rest, then `onUpdate(to)` and `onDone`. Returns `cancel` (stops where it is).
 * The first frame assumes 1/60 s; long frames are clamped inside `stepSpring`. Reduced motion is the caller's job.
 */
export function animateSpring({ from, to, velocity = 0, params, restOffset, stopWhen, onUpdate, onDone }: SpringRun): () => void {
  let state = springStart(from, to, velocity)
  let last = 0
  let id = 0
  const frame = (now: number) => {
    state = stepSpring(state, last ? (now - last) / 1000 : 1 / 60, params)
    last = now
    const value = to + state.offset
    if (isSettled(state, restOffset) || stopWhen?.(value)) {
      onUpdate(stopWhen?.(value) && !isSettled(state, restOffset) ? value : to)
      onDone?.()
      return
    }
    onUpdate(value)
    id = requestAnimationFrame(frame)
  }
  id = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(id)
}
