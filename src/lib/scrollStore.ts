/**
 * One passive window scroll listener for all scroll effects (large title, gradient lag, hero shift). Subscribers are called at
 * most once per animation frame with the scroll position and write to refs themselves; nothing here touches React state.
 */
type Listener = (scrollY: number) => void

const listeners = new Set<Listener>()
let frame = 0

const flush = () => {
  frame = 0
  const y = window.scrollY
  for (const listener of [...listeners]) listener(y)
}
const onScroll = () => {
  if (!frame) frame = requestAnimationFrame(flush)
}

/** Calls `listener` for every frame in which the window scrolled; returns the unsubscribe function. No call on subscribe. */
export function onWindowScroll(listener: Listener): () => void {
  if (listeners.size === 0) window.addEventListener('scroll', onScroll, { passive: true })
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
      frame = 0
    }
  }
}

/**
 * Is `el` part of the start/settings overview while it is pushed away or pulled back (NavStack `data-moving`)? Then the window
 * scroll belongs to the other page (the overview is shown from the top or frozen where it was), so effects must not follow it.
 */
export const inFrozenHub = (el: Element | null): boolean => el?.closest('.stack[data-moving] > .stack-hub') != null
