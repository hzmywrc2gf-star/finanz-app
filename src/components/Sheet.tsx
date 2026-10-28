import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { SHEET_FRACTION, SHEET_PULL_UP_PX, animationMs, rubberBand, swipeDecision } from '../domain/gesture'
import { useDragGesture } from '../hooks/useDragGesture'
import { EASE_IOS, afterTransition, isInteractive, reducedMotion } from '../lib/motion'

const SETTLE_MS = 250

/**
 * Bottom sheet. Closing always animates out (Abbrechen, Escape, backdrop, swipe down) and then calls `onClose`.
 * The drag starts on the grabber/header, or anywhere on the sheet while its content is scrolled to the top.
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
  const fromHeader = useRef(false)

  useEffect(() => {
    latest.current = { onClose, dismissible }
  })
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const settle = useCallback(async (to: 'open' | 'closed') => {
    const sheet = sheetRef.current
    const dim = dimRef.current
    if (!sheet || !dim) return
    const reduced = reducedMotion()
    const ms = animationMs(SETTLE_MS, reduced)
    sheet.style.willChange = 'transform'
    void sheet.offsetHeight
    sheet.style.transition = `transform ${ms}ms ${EASE_IOS}, opacity ${ms}ms ease`
    dim.style.transition = `opacity ${ms}ms ease`
    dim.style.opacity = to === 'open' ? '1' : '0'
    if (to === 'open') {
      sheet.style.transform = ''
    } else if (reduced) {
      sheet.style.opacity = '0' // no slide, just a quick fade
    } else {
      sheet.style.transform = 'translate3d(0, 100%, 0)'
    }
    await afterTransition(sheet, ms)
    if (to === 'open' && sheet.isConnected) {
      sheet.style.transition = ''
      sheet.style.willChange = ''
      dim.style.transition = ''
      dim.style.opacity = ''
    }
  }, [])

  const dismiss = useCallback(() => {
    if (closing.current || !latest.current.dismissible) return
    closing.current = true
    void settle('closed').then(() => {
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
      if (sheet.getAnimations().length > 0) return false // still sliding in
      fromHeader.current = e.target instanceof Element && e.target.closest('.sheet-grab') !== null
      return fromHeader.current || sheet.scrollTop <= 0
    },
    // from the body only a downward pull counts (upward scrolls the content)
    accept: (dy) => fromHeader.current || dy > 0,
    onStart: () => {
      const sheet = sheetRef.current
      height.current = sheet?.offsetHeight || 1
      if (sheet) {
        sheet.style.transition = 'none'
        sheet.style.willChange = 'transform'
      }
      if (dimRef.current) dimRef.current.style.transition = 'none'
    },
    onMove: (dy) => {
      const y = dy >= 0 ? dy : -rubberBand(-dy, SHEET_PULL_UP_PX)
      if (sheetRef.current) sheetRef.current.style.transform = `translate3d(0, ${y}px, 0)`
      if (dimRef.current) dimRef.current.style.opacity = String(Math.max(0, 1 - Math.max(y, 0) / height.current))
    },
    onEnd: ({ delta, velocity, cancelled }) => {
      const commit = !cancelled && swipeDecision({ distance: delta, velocity, size: height.current, fraction: SHEET_FRACTION })
      if (commit) dismiss()
      else void settle('open')
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
