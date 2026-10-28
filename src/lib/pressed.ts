import { pressCancelled } from '../domain/gesture'

/** What shows the pressed state: buttons (rows, tabs, ...) and the budget hint card. */
const PRESSABLE = 'button, .budget-alert'
/** A quick tap keeps the highlight at least this long, otherwise it would never be seen. */
const MIN_VISIBLE_MS = 70

/**
 * Immediate tap feedback: `data-pressed` goes onto the pressed control on pointerdown (CSS styles it like :active, which
 * iOS applies late or not at all) and comes off on pointerup/cancel, once the finger moves past the drag threshold
 * (a scroll or swipe starts) or the page scrolls. Installed once for the whole document; one listener each, no per-element work.
 */
export function installPressedFeedback(doc: Document = document): void {
  let pressed: Element | null = null
  let x0 = 0
  let y0 = 0
  let t0 = 0
  let timer = 0
  const clear = () => {
    window.clearTimeout(timer)
    pressed?.removeAttribute('data-pressed')
    pressed = null
  }
  doc.addEventListener(
    'pointerdown',
    (e) => {
      clear()
      if (!e.isPrimary) return
      const target = e.target instanceof Element ? e.target.closest(PRESSABLE) : null
      if (!target || target.matches(':disabled')) return
      pressed = target
      x0 = e.clientX
      y0 = e.clientY
      t0 = e.timeStamp
      target.setAttribute('data-pressed', '')
    },
    { capture: true, passive: true },
  )
  doc.addEventListener(
    'pointermove',
    (e) => {
      if (pressed && pressCancelled(e.clientX - x0, e.clientY - y0)) clear()
    },
    { capture: true, passive: true },
  )
  doc.addEventListener(
    'pointerup',
    (e) => {
      if (!pressed) return
      const wait = MIN_VISIBLE_MS - (e.timeStamp - t0)
      if (wait > 0) timer = window.setTimeout(clear, wait)
      else clear()
    },
    { capture: true, passive: true },
  )
  doc.addEventListener('pointercancel', clear, { capture: true, passive: true })
  doc.addEventListener('scroll', clear, { capture: true, passive: true })
}
