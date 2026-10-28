/** Shared helpers for the CSS-transition based animations (no animation library). */

/** iOS-like ease-out used for pushes, pops and spring-backs. */
export const EASE_IOS = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

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
