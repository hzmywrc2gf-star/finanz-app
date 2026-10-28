import { useCallback, useEffect, useRef } from 'react'

/** Leave animation after a tap (ms); the normal run (CSS `greeting`, 2.5 s) is: fade in 0.35 s, hold 1.7 s, fade out 0.45 s. */
const TAP_OUT_MS = 150

/**
 * Fullscreen greeting after unlocking with Face ID: fades in, holds, fades out, then calls `onDone`.
 * A tap ends it early with a quick fade; it only intercepts taps while it exists.
 */
export function Greeting({ text, onDone }: { text: string; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const leaving = useRef(false)
  const tapTimer = useRef(0)
  // the CSS animation normally ends it; the timer is only a safety net (e.g. animations switched off)
  useEffect(() => {
    const timer = window.setTimeout(onDone, 3000)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(tapTimer.current)
    }
  }, [onDone])

  const leave = useCallback(() => {
    const el = ref.current
    if (!el || leaving.current) return
    leaving.current = true
    // freeze the current opacity of the running animation, then fade from there
    const current = getComputedStyle(el).opacity
    el.style.animation = 'none'
    el.style.opacity = current
    // pointer events stay on until unmount: iOS hit-tests the click at touch end, it must not reach the app below
    void el.offsetWidth
    el.style.transition = `opacity ${TAP_OUT_MS}ms ease-out`
    el.style.opacity = '0'
    tapTimer.current = window.setTimeout(onDone, TAP_OUT_MS + 20)
  }, [onDone])

  return (
    <div
      ref={ref}
      className="greeting"
      role="status"
      onPointerDown={leave}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onAnimationEnd={(e) => e.target === e.currentTarget && onDone()}
    >
      <h1>{text}</h1>
    </div>
  )
}
