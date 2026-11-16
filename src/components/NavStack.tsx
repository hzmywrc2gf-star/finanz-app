import { Activity, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { BACK_FRACTION, animationMs, isEdgeStart, parallaxPercent, swipeDecision } from '../domain/gesture'
import { useDragGesture } from '../hooks/useDragGesture'
import { SPRING_CALM } from '../domain/spring'
import { affineCss, springProgress, zoomFrame } from '../domain/zoom'
import type { ZoomGeometry } from '../domain/zoom'
import { haptic } from '../lib/haptics'
import { EASE_IOS, EASE_NAV, afterTransition, animateSpring, isFormField, modalOpen, reducedMotion, releaseMotion } from '../lib/motion'

/**
 * How a view change reaches the screen: `animate` = push/pop, `instant` = no motion, `done` = a swipe already finished it,
 * `zoom` = the sub-page grows out of (or shrinks back into) the hub's anchor element (calendar: the day cell after a pinch).
 */
export type StackAnim = 'animate' | 'instant' | 'done' | 'zoom'
/** idle = at rest; push/pop = button transition; drag = finger on the edge swipe (and the settle after release); zoomIn/zoomOut = zoom transition. */
type Phase = 'idle' | 'push' | 'pop' | 'drag' | 'zoomIn' | 'zoomOut'

/** The zoom's calm spring as progress samples (60 per second), computed once; played as keyframes by the browser. */
let zoomCurve: number[] | null = null
const zoomProgress = () => (zoomCurve ??= springProgress(SPRING_CALM))

/** Duration of a button/row push and the Zurück-button pop (ms); tune here. Swipe-back uses the finger speed instead. */
const PUSH_MS = 450

/**
 * A tab as an iOS navigation stack (Start and Einstellungen share it): the hub plus one sub-page on top. At rest only one of them is
 * rendered; while pushing, popping or dragging, both are, and everything moves through refs and CSS
 * transforms (no React update per frame). Edge swipe: drag the sub-page away from the left edge.
 */
export function NavStack<V extends string>({
  view,
  anim,
  hub,
  renderSub,
  onBack,
  zoomAnchor,
  prerender,
}: {
  view: V | 'hub'
  anim: StackAnim
  hub: ReactNode
  renderSub: (view: V) => ReactNode
  /** Called when an edge swipe has finished; the owner updates the history and sets `view` to the hub. */
  onBack: (anim: StackAnim) => void
  /** For `zoom`: the element of the hub the sub-page grows out of (missing = a normal push/pop). */
  zoomAnchor?: (hub: HTMLElement) => HTMLElement | null
  /**
   * A view (or the hub) that is likely to come next, rendered ahead of time while hidden (React `Activity`: no effects, no
   * layout, rendered at low priority), so the zoom that follows only has to show it instead of building it in its first frame.
   */
  prerender?: V | 'hub' | null
}) {
  // the sub-page stays mounted while it slides out
  const [sub, setSub] = useState<V | null>(view === 'hub' ? null : view)
  const [phase, setPhase] = useState<Phase>('idle')
  const [prevView, setPrevView] = useState(view)
  if (view !== prevView) {
    setPrevView(view)
    if (view !== 'hub') {
      setSub(view)
      setPhase(anim === 'animate' ? 'push' : anim === 'zoom' ? 'zoomIn' : 'idle')
    } else if ((anim === 'animate' || anim === 'zoom') && sub) {
      setPhase(anim === 'zoom' ? 'zoomOut' : 'pop')
    } else {
      setSub(null)
      setPhase('idle')
    }
  }
  const shownSub = view !== 'hub' ? view : sub
  const showHub = view === 'hub' || phase !== 'idle'
  // hidden ahead-of-time renders keep their slot (and React state) when they become the real hub/sub-page
  const preSub = !shownSub && prerender && prerender !== 'hub' ? prerender : null
  const subView = shownSub ?? preSub
  const preHub = !showHub && prerender === 'hub'

  const stackRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const dimRef = useRef<HTMLDivElement>(null)
  const hubScroll = useRef(0)
  const run = useRef(0)
  const width = useRef(1)
  /** The finger is past the share of the width that lets go of the page (a tick told the user). */
  const pastThreshold = useRef(false)
  /** Where the sub-page was last painted during the drag (px), the start of the spring. */
  const paintedDx = useRef(0)
  const stopSpring = useRef<(() => void) | null>(null)
  useEffect(() => () => stopSpring.current?.(), [])
  const zoomGeo = useRef<ZoomGeometry | null>(null)
  const zoomAnims = useRef<Animation[]>([])
  const zoomFrameId = useRef(0)
  const anchorOf = useRef(zoomAnchor)
  useLayoutEffect(() => {
    anchorOf.current = zoomAnchor
  })

  // where the hub was scrolled when a sub-page opens, so it can slide away from exactly there
  useLayoutEffect(() => {
    if (view !== 'hub') return
    const remember = () => {
      hubScroll.current = window.scrollY
    }
    remember()
    window.addEventListener('scroll', remember, { passive: true })
    return () => window.removeEventListener('scroll', remember)
  }, [view])

  /** progress 0 = sub-page fully open, 1 = fully gone; `fade` swaps the slide for an opacity change. */
  const paint = (progress: number, fade: boolean) => {
    const subEl = subRef.current
    const hubEl = hubRef.current
    const dimEl = dimRef.current
    if (subEl) {
      subEl.style.transform = fade ? '' : `translate3d(${progress * 100}%, 0, 0)`
      subEl.style.opacity = fade ? String(1 - progress) : ''
    }
    if (hubEl) hubEl.style.transform = fade ? '' : `translate3d(${parallaxPercent(progress)}%, 0, 0)`
    if (dimEl) dimEl.style.opacity = fade ? '0' : String(1 - progress)
  }
  const stopZoom = () => {
    cancelAnimationFrame(zoomFrameId.current)
    for (const a of zoomAnims.current) a.cancel()
    zoomAnims.current = []
  }
  const clearStyles = () => {
    stopZoom()
    for (const el of [subRef.current, pageRef.current, hubRef.current, dimRef.current]) {
      if (el) {
        el.style.transform = ''
        el.style.transition = ''
        el.style.opacity = ''
        el.style.willChange = ''
        el.style.transformOrigin = ''
        el.style.height = ''
        el.style.borderRadius = ''
      }
    }
    stackRef.current?.style.removeProperty('min-height')
    zoomGeo.current = null
    hubRef.current?.style.removeProperty('--hub-scroll')
  }
  useEffect(() => () => stopZoom(), [])
  /** Animates from the current state to `progress` and resolves false if something newer took over. */
  const settle = async (progress: number, ms: number, fade: boolean, easing = EASE_IOS) => {
    const token = ++run.current
    const subEl = subRef.current
    if (!subEl) return false
    for (const el of [subEl, hubRef.current, dimRef.current]) if (el) el.style.willChange = fade ? 'opacity' : 'transform'
    void subEl.offsetWidth // commit the start position before transitioning
    const curve = `${ms}ms ${easing}`
    subEl.style.transition = `transform ${curve}, opacity ${ms}ms linear`
    if (hubRef.current) hubRef.current.style.transition = `transform ${curve}`
    if (dimRef.current) dimRef.current.style.transition = `opacity ${curve}`
    paint(progress, fade)
    await afterTransition(subEl, ms)
    return token === run.current
  }

  /**
   * The rest of an edge swipe on the calm spring (no overshoot: clamped to the two end states), starting at the finger speed.
   * `from`/`to` in px of the sub-page offset; resolves false if something newer took over.
   */
  const springSettle = (from: number, to: number, velocity: number) => {
    const token = ++run.current
    stopSpring.current?.()
    return new Promise<boolean>((resolve) => {
      const stop = animateSpring({
        from,
        to,
        velocity,
        params: SPRING_CALM,
        restOffset: 1,
        onUpdate: (x) => {
          if (token !== run.current) {
            stop()
            return resolve(false)
          }
          paint(Math.min(Math.max(x, 0), width.current) / width.current, false)
        },
        onDone: () => resolve(token === run.current),
      })
      stopSpring.current = stop
    })
  }

  /**
   * Measures the anchor and the sub-page for a zoom and turns the sub-page into the zoom window: as tall as the viewport,
   * `overflow: clip` with rounded corners (CSS, `data-phase^=zoom`), the page overflowing inside it; the stack keeps the
   * page's height so the window scroll stays where it is. False when there is nothing to zoom from (then a plain push/pop runs).
   */
  const prepareZoom = (opening: boolean) => {
    const hubEl = hubRef.current
    const subEl = subRef.current
    const pageEl = pageRef.current
    const anchor = hubEl && anchorOf.current?.(hubEl)
    if (!hubEl || !subEl || !pageEl || !anchor) return false
    const a = anchor.getBoundingClientRect()
    const r = subEl.getBoundingClientRect()
    if (a.width <= 0 || a.height <= 0 || r.width <= 0) return false
    const vh = window.innerHeight
    zoomGeo.current = {
      anchor: { left: a.left, top: a.top, width: a.width, height: a.height },
      vw: window.innerWidth,
      vh,
      left: r.left,
      top: r.top + window.scrollY,
      width: r.width,
    }
    stackRef.current?.style.setProperty('min-height', `${pageEl.offsetHeight}px`)
    subEl.style.height = `${vh}px`
    subEl.style.transformOrigin = '0 0'
    pageEl.style.transformOrigin = '0 0'
    hubEl.style.transformOrigin = `${a.left + a.width / 2}px ${a.top + a.height / 2}px`
    for (const el of [subEl, pageEl, hubEl]) el.style.willChange = 'transform, opacity'
    if (dimRef.current) dimRef.current.style.opacity = '0'
    paintZoom(opening ? 0 : 1)
    return true
  }

  /** One zoom state as inline styles (the first frame, before the keyframes take over). */
  const paintZoom = (z: number) => {
    const g = zoomGeo.current
    if (!g) return
    const f = zoomFrame(g, z, window.scrollY)
    const subEl = subRef.current
    const pageEl = pageRef.current
    const hubEl = hubRef.current
    if (subEl) {
      subEl.style.transform = affineCss(f.win)
      subEl.style.opacity = String(f.win.opacity)
      subEl.style.borderRadius = `${f.win.radiusX}px / ${f.win.radiusY}px`
    }
    if (pageEl) pageEl.style.transform = affineCss(f.page)
    if (hubEl) {
      hubEl.style.transform = `scale(${f.hub.scale})`
      hubEl.style.opacity = String(f.hub.opacity)
    }
  }

  /**
   * Plays the zoom from `from` to `to` (0 = anchor, 1 = full) on the calm spring as keyframes (Web Animations): transform and
   * opacity run on the compositor, so a busy main thread (the page that just mounted) cannot make the motion stutter; only the
   * corner radius is a separate (main-thread) effect. Resolves false if something newer took over.
   */
  const zoomSettle = (from: number, to: number) => {
    const token = ++run.current
    stopSpring.current?.()
    stopZoom()
    const g = zoomGeo.current
    const subEl = subRef.current
    const pageEl = pageRef.current
    const hubEl = hubRef.current
    if (!g || !subEl || !pageEl || !hubEl) return Promise.resolve(token === run.current)
    const scrollY = window.scrollY // fixed for the whole zoom (the day view scrolled itself before this frame)
    const progress = zoomProgress()
    const frames = progress.map((p) => zoomFrame(g, from + (to - from) * p, scrollY))
    const duration = ((progress.length - 1) * 1000) / 60
    const timing: KeyframeAnimationOptions = { duration, easing: 'linear', fill: 'forwards' }
    const anims = [
      subEl.animate(frames.map((f) => ({ transform: affineCss(f.win), opacity: f.win.opacity })), timing),
      subEl.animate(frames.map((f) => ({ borderRadius: `${f.win.radiusX}px / ${f.win.radiusY}px` })), timing),
      pageEl.animate(frames.map((f) => ({ transform: affineCss(f.page) })), timing),
      hubEl.animate(frames.map((f) => ({ transform: `scale(${f.hub.scale})`, opacity: f.hub.opacity })), timing),
    ]
    zoomAnims.current = anims
    return anims[0].finished.then(
      () => token === run.current,
      () => false,
    )
  }

  // push / pop started by the Zurück button or a row; the CSS keeps the sub-page above the hub while `data-phase` is not idle
  useLayoutEffect(() => {
    if (phase === 'idle') {
      run.current++ // an unfinished animation must not touch the new state
      clearStyles()
      if (view === 'hub') window.scrollTo(0, 0)
      return
    }
    if (phase === 'drag') return
    const fade = reducedMotion()
    const ms = animationMs(PUSH_MS, fade)
    const pushing = phase === 'push' || phase === 'zoomIn'
    if (pushing) {
      hubRef.current?.style.setProperty('--hub-scroll', `${hubScroll.current}px`)
      window.scrollTo(0, 0)
    }
    stopZoom() // a push/pop that interrupts a zoom starts from a clean sub-page
    // zoom (after a pinch); reduced motion or no anchor: the plain push/pop below (a quick fade with reduced motion)
    if ((phase === 'zoomIn' || phase === 'zoomOut') && !fade && prepareZoom(pushing)) {
      const start = () =>
        void zoomSettle(pushing ? 0 : 1, pushing ? 1 : 0).then((current) => {
          if (!current) return
          if (!pushing) setSub(null)
          setPhase('idle')
        })
      // opening: one frame later, after the new page has scrolled itself (day view: to the hour) in its own frame callback
      if (pushing) zoomFrameId.current = requestAnimationFrame(start)
      else start()
      return
    }
    paint(pushing ? 1 : 0, fade)
    void settle(pushing ? 0 : 1, ms, fade, EASE_NAV).then((current) => {
      if (!current) return
      if (!pushing) setSub(null)
      setPhase('idle')
    })
  }, [phase, view])

  useDragGesture(stackRef, {
    axis: 'x',
    canStart: (e) => !!subRef.current && phase === 'idle' && isEdgeStart(e.clientX) && !isFormField(e.target) && !modalOpen(),
    accept: (dx) => dx > 0,
    onStart: () => {
      width.current = stackRef.current?.clientWidth || 1
      run.current++
      stopSpring.current?.()
      pastThreshold.current = false
      paintedDx.current = 0
      flushSync(() => setPhase('drag')) // the hub has to exist before the first frame of the drag
      // the layers only exist while moving (will-change is removed with the rest in clearStyles)
      for (const el of [subRef.current, hubRef.current, dimRef.current]) {
        if (!el) continue
        el.style.transition = 'none'
        el.style.willChange = 'transform'
      }
      paint(0, false)
    },
    onMove: (dx) => {
      paintedDx.current = Math.min(Math.max(dx, 0), width.current)
      paint(paintedDx.current / width.current, false)
    },
    // one tick when the finger crosses the line where letting go would leave the page (and again when it goes back), none on release
    onMoveEvent: (dx) => {
      const past = Math.min(Math.max(dx, 0), width.current) / width.current > BACK_FRACTION
      if (past !== pastThreshold.current) {
        pastThreshold.current = past
        haptic()
      }
    },
    onEnd: ({ delta, velocity, cancelled }) => {
      const dx = Math.min(Math.max(delta, 0), width.current)
      const commit = !cancelled && swipeDecision({ distance: dx, velocity, size: width.current, fraction: BACK_FRACTION })
      const done = (current: boolean) => {
        if (!current) return
        if (commit) onBack('done')
        else setPhase('idle')
      }
      if (reducedMotion()) {
        // reduced motion: the rest as a quick fade/slide of at most 120 ms instead of the spring
        const { ms, curve } = releaseMotion(commit ? width.current - dx : dx, commit ? velocity : -velocity)
        void settle(commit ? 1 : 0, ms, false, curve).then(done)
      } else {
        void springSettle(paintedDx.current, commit ? width.current : 0, cancelled ? 0 : velocity).then(done)
      }
    },
  })

  return (
    <div ref={stackRef} className="stack" data-phase={phase} data-moving={phase !== 'idle' ? '' : undefined}>
      {(showHub || preHub) && (
        <Activity mode={showHub ? 'visible' : 'hidden'}>
          <div ref={hubRef} className="stack-hub">
            {hub}
          </div>
        </Activity>
      )}
      {phase !== 'idle' && <div key="dim" ref={dimRef} className="stack-dim" />}
      {subView && (
        <Activity mode={shownSub ? 'visible' : 'hidden'}>
          <div ref={subRef} className="stack-sub">
            {/* the page itself: the zoom scales it inside the sub-page's clipping window */}
            <div ref={pageRef} className="stack-page">
              {renderSub(subView)}
            </div>
          </div>
        </Activity>
      )}
    </div>
  )
}
