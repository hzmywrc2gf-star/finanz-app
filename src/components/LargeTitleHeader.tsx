import { useRef } from 'react'
import type { ReactNode } from 'react'
import { barProgress, glowOffset, titleStyle } from '../domain/scrollFx'
import { useScrollEffect } from '../hooks/useScrollEffect'
import { reducedMotion } from '../lib/motion'
import { ChevronLeft } from './Icons'

/** A round icon button of the page (Start: "Jetzt sperren"); shown in the page and, once collapsed, again in the compact bar. */
export type HeaderAction = { label: string; icon: ReactNode; onClick: () => void }

/**
 * The top of every page: an iOS large title that collapses into a compact bar while the page scrolls.
 * - the bar is `position: sticky` (a fixed bar would be misplaced inside a page that is being pushed or dragged), translucent
 *   with a blur once it shows, with the back button of a sub-page at the place it always had (aria-label "Zurück");
 * - the large title (the page's one `h1`) rises slower than the page, shrinks and fades; the small title in the bar fades in;
 * - the gradient behind the page lags behind the content (own layer, transform only).
 * One scroll listener drives all of it through refs and CSS variables; no React state per frame. With reduced motion the
 * title only fades and the gradient stays put.
 */
export function LargeTitleHeader({
  title,
  onBack,
  parent = 'Start',
  action,
}: {
  title: string
  /** Sub-pages: the back button (labelled with the parent page) lives in the bar. */
  onBack?: () => void
  parent?: string
  action?: HeaderAction
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const last = useRef(-1)
  const calm = useRef(reducedMotion())

  useScrollEffect(wrapRef, (s) => {
    const wrap = wrapRef.current
    const glow = glowRef.current
    const h1 = titleRef.current
    if (!wrap || !glow || !h1) return
    // past the collapse the bar is done; only the gradient lag keeps moving
    const p = barProgress(s)
    if (p !== last.current || p < 1) {
      last.current = p
      const t = titleStyle(s, calm.current)
      wrap.style.setProperty('--bar', String(p))
      wrap.dataset.bar = p === 0 ? 'off' : p >= 0.5 ? 'on' : 'mid'
      h1.style.transform = t.y === 0 && t.scale === 1 ? '' : `translate3d(0, ${t.y}px, 0) scale(${t.scale})`
      h1.style.opacity = t.opacity === 1 ? '' : String(t.opacity)
    }
    glow.style.transform = calm.current ? '' : `translate3d(0, ${glowOffset(s)}px, 0)`
  })

  const heading = <h1 ref={titleRef} className={`page-title ${onBack ? 'sub-title' : ''}`}>{title}</h1>
  return (
    <>
      <div ref={glowRef} className="navbar-glow" aria-hidden="true" />
      <div ref={wrapRef} className="navbar-wrap" data-bar="off">
        <div className="navbar">
          <div className="navbar-bg" />
          <div className="navbar-row">
            <div className="navbar-side">
              {onBack && (
                <button className="back-btn" onClick={onBack} aria-label="Zurück">
                  <ChevronLeft />
                  <span aria-hidden="true">{parent}</span>
                </button>
              )}
            </div>
            {/* the text comes from CSS (::before), so it is no second copy of the title in the DOM text */}
            <span className="navbar-title" data-title={title} aria-hidden="true" />
            <div className="navbar-side navbar-end">
              {action && (
                <button className="round-btn navbar-action" onClick={action.onClick} aria-hidden="true" tabIndex={-1}>
                  {action.icon}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="navbar-spacer" />
      {onBack ? (
        <>
          <div className="subnav-space" />
          {heading}
        </>
      ) : action ? (
        <div className="titlebar">
          {heading}
          <button className="round-btn" aria-label={action.label} onClick={action.onClick}>
            {action.icon}
          </button>
        </div>
      ) : (
        heading
      )}
    </>
  )
}
