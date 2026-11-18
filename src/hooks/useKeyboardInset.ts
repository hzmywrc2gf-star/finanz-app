import { useEffect } from 'react'
import type { RefObject } from 'react'

/**
 * Keeps a fixed element above the on-screen keyboard: the part of the layout viewport the keyboard covers (visual viewport
 * height + offset vs. the window height) goes into the CSS variable `--kbd` (px), written through the ref, no React state.
 */
export function useKeyboardInset(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const vv = window.visualViewport
    const el = ref.current
    if (!vv || !el) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
        el.style.setProperty('--kbd', `${inset}px`)
        el.toggleAttribute('data-kbd', inset > 80)
      })
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      cancelAnimationFrame(frame)
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [ref])
}
