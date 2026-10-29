import { useEffect, useRef } from 'react'
import { inFrozenHub, onWindowScroll } from '../lib/scrollStore'

/**
 * Runs `effect(scrollY)` once per frame while the window scrolls (single shared listener, see `lib/scrollStore`), as long as
 * the element in `ref` is not part of a frozen overview. The effect writes to refs/styles, never to React state.
 */
export function useScrollEffect(ref: { current: Element | null }, effect: (scrollY: number) => void) {
  const latest = useRef(effect)
  useEffect(() => {
    latest.current = effect
  })
  useEffect(
    () =>
      onWindowScroll((y) => {
        if (!inFrozenHub(ref.current)) latest.current(y)
      }),
    [ref],
  )
}
