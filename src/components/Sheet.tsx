import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { SHEET_FRACTION, SHEET_PULL_UP_PX, rubberBand, swipeDecision } from '../domain/gesture'
import { useDragGesture } from '../hooks/useDragGesture'
import { SPRING_BOUNCY, SPRING_CALM } from '../domain/spring'
import { afterTransition, animateSpring, isInteractive, reducedMotion, releaseMotion } from '../lib/motion'

/** How far the sheet reaches below the screen edge (CSS: margin-bottom of .sheet), so a springy overshoot never shows a gap. */
const BELOW_EDGE_PX = 40

/**
 * Bottom sheet. It rises on a springy spring (SPRING_BOUNCY) and lets go of a short drag the same way, with the finger speed;
 * closing always animates out (Abbrechen, Escape, backdrop, swipe down) on the calm spring (no bounce) and then calls `onClose`.
 * The drag starts on the grabber/header, or anywhere on the sheet while its content is scrolled to the top, and may catch the
 * sheet while it is still moving. Reduced motion: the CSS fade and a quick fade out instead of springs.
 */
export function Sheet({
  title,
  onClose,
  dismissible = true,
  children,
}: {
  title: string
  onClose: () => void
  /** false: the sheet cannot be closed by the user (e.g. while a nested prompt is pending). */
  dismissible?: boolean
  children: ReactNode
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const dimRef = useRef<HTMLDivElement>(null)
  const latest = useRef({ onClose, dismissible })
  const closing = useRef(false)
  const mounted = useRef(true)
  const height = useRef(1)
  /** Where the sheet is painted (px below its resting place), the start of the animation after a release. */
  const offset = useRef(0)
  const fromHeader = useRef(false)
  /** Where the sheet stood when a drag caught it (it may still have been moving). */
  const dragBase = useRef(0)
  /** Stops the spring that currently moves the sheet. */
  const stopSpring = useRef<(() => void) | null>(null)

  useEffect(() => {
    latest.current = { onClose, dismissible }
  })
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stopSpring.current?.()
    }
  }, [])

  /** Paints the sheet `y` px below its resting place and dims the backdrop accordingly (no React state). */
  const paint = useCallback((y: number) => {
    offset.current = y
    if (sheetRef.current) sheetRef.current.style.transform = `translate3d(0, ${y}px, 0)`
    if (dimRef.current) dimRef.current.style.opacity = String(Math.min(1, Math.max(0, 1 - Math.max(y, 0) / height.current)))
  }, [])

  /** Animates to the resting place or off screen; `velocity` is the finger speed (px/ms, downwards positive), 0 = from rest. */
  const settle = useCallback(async (to: 'open' | 'closed', velocity = 0) => {
    const sheet = sheetRef.current
    const dim = dimRef.current
    if (!sheet || !dim) return
    height.current = sheet.offsetHeight || height.current
    stopSpring.current?.()
    stopSpring.current = null
    if (!reducedMotion()) {
      sheet.style.willChange = 'transform'
      await new Promise<void>((resolve) => {
        const closing = to === 'closed'
        stopSpring.current = animateSpring({
          from: offset.current,
          to: closing ? height.current : 0,
          velocity: closing ? Math.max(0, velocity) : velocity,
          params: closing ? SPRING_CALM : SPRING_BOUNCY,
          // a closing sheet is gone once it left the screen; the rest of the spring would be invisible
          stopWhen: closing ? (y) => y >= height.current - BELOW_EDGE_PX : undefined,
          onUpdate: paint,
          onDone: resolve,
        })
      })
      stopSpring.current = null
      if (to === 'closed') dim.style.opacity = '0'
      if (to === 'open' && sheet.isConnected) {
        sheet.style.transform = ''
        sheet.style.willChange = ''
        dim.style.opacity = ''
        offset.current = 0
      }
      return
    }
    // reduced motion: no slide, just a quick fade
    const { ms, curve } = releaseMotion(0, 0)
    sheet.style.transition = `opacity ${ms}ms ${curve}`
    dim.style.transition = `opacity ${ms}ms ease`
    dim.style.opacity = to === 'open' ? '1' : '0'
    sheet.style.opacity = to === 'open' ? '' : '0'
    sheet.style.transform = ''
    offset.current = 0
    await afterTransition(sheet, ms)
    if (to === 'open' && sheet.isConnected) {
      sheet.style.transition = ''
      dim.style.transition = ''
      dim.style.opacity = ''
    }
  }, [paint])

  // rises from below on the spring; the first frame is painted off screen, so nothing flashes
  useLayoutEffect(() => {
    const sheet = sheetRef.current
    const dim = dimRef.current
    if (!sheet || !dim || reducedMotion()) return
    height.current = sheet.offsetHeight || 1
    dim.setAttribute('data-driven', '')
    paint(height.current)
    void settle('open')
  }, [paint, settle])

  const closeWith = useCallback((velocity: number) => {
    if (closing.current || !latest.current.dismissible) return
    closing.current = true
    void settle('closed', velocity).then(() => {
      if (!mounted.current) return
      latest.current.onClose()
      // a parent that keeps the sheet mounted must not be left with an invisible one
      requestAnimationFrame(() => {
        if (!mounted.current) return
        closing.current = false
        void settle('open')
      })
    })
  }, [settle])
  const dismiss = useCallback(() => closeWith(0), [closeWith])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [dismiss])

  // A sheet whose content fits needs no scrolling, so a vertical touch anywhere on it may drag (touch-action: none).
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const check = () => sheet.toggleAttribute('data-fits', sheet.scrollHeight <= sheet.clientHeight + 1)
    check()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(check)
    observer.observe(sheet)
    return () => observer.disconnect()
  }, [])

  useDragGesture(sheetRef, {
    axis: 'y',
    canStart: (e) => {
      const sheet = sheetRef.current
      if (!sheet || closing.current || !latest.current.dismissible || isInteractive(e.target)) return false
      fromHeader.current = e.target instanceof Element && e.target.closest('.sheet-grab') !== null
      return fromHeader.current || sheet.scrollTop <= 0
    },
    // from the body only a downward pull counts (upward scrolls the content)
    accept: (dy) => fromHeader.current || dy > 0,
    onStart: () => {
      const sheet = sheetRef.current
      height.current = sheet?.offsetHeight || 1
      // a drag may catch the sheet while it still rises or springs back: it continues from where it is
      stopSpring.current?.()
      stopSpring.current = null
      dragBase.current = offset.current
      if (sheet) {
        sheet.style.transition = 'none'
        sheet.style.willChange = 'transform'
      }
      if (dimRef.current) dimRef.current.style.transition = 'none'
    },
    onMove: (dy) => {
      const y = dragBase.current + dy
      paint(y >= 0 ? y : -rubberBand(-y, SHEET_PULL_UP_PX))
    },
    onEnd: ({ delta, velocity, cancelled }) => {
      const distance = dragBase.current + delta
      const commit = !cancelled && swipeDecision({ distance, velocity, size: height.current, fraction: SHEET_FRACTION })
      if (commit) closeWith(velocity)
      else void settle('open', cancelled ? 0 : velocity)
    },
  })

  return (
    <div className="backdrop" onClick={dismiss}>
      <div ref={dimRef} className="backdrop-dim" />
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grab">
          <div className="grabber" aria-hidden="true" />
          <div className="sheet-head">
            <button className="link-btn" onClick={dismiss} style={{ paddingLeft: 0 }}>
              Abbrechen
            </button>
            <h2>{title}</h2>
            <span />
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
