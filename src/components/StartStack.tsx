import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { BACK_FRACTION, animationMs, isEdgeStart, parallaxPercent, swipeDecision } from '../domain/gesture'
import { useDragGesture } from '../hooks/useDragGesture'
import { EASE_IOS, afterTransition, isFormField, modalOpen, reducedMotion } from '../lib/motion'
import type { StartView } from '../pages/StartPage'

/** How a view change reaches the screen: `animate` = push/pop, `instant` = no motion, `done` = a swipe already finished it. */
export type StackAnim = 'animate' | 'instant' | 'done'
type SubView = Exclude<StartView, 'hub'>
/** idle = at rest; push/pop = button transition; drag = finger on the edge swipe (and the settle after release). */
type Phase = 'idle' | 'push' | 'pop' | 'drag'

const PUSH_MS = 300
const SETTLE_MS = 250

/**
 * The start tab as an iOS navigation stack: the hub plus one sub-page on top. At rest only one of them is
 * rendered; while pushing, popping or dragging, both are, and everything moves through refs and CSS
 * transforms (no React update per frame). Edge swipe: drag the sub-page away from the left edge.
 */
export function StartStack({
  view,
  anim,
  hub,
  renderSub,
  onBack,
}: {
  view: StartView
  anim: StackAnim
  hub: ReactNode
  renderSub: (view: SubView) => ReactNode
  /** Called when an edge swipe has finished; the owner updates the history and sets `view` to the hub. */
  onBack: (anim: StackAnim) => void
}) {
  // the sub-page stays mounted while it slides out
  const [sub, setSub] = useState<SubView | null>(view === 'hub' ? null : view)
  const [phase, setPhase] = useState<Phase>('idle')
  const [prevView, setPrevView] = useState(view)
  if (view !== prevView) {
    setPrevView(view)
    if (view !== 'hub') {
      setSub(view)
      setPhase(anim === 'animate' ? 'push' : 'idle')
    } else if (anim === 'animate' && sub) {
      setPhase('pop')
    } else {
      setSub(null)
      setPhase('idle')
    }
  }
  const shownSub = view !== 'hub' ? view : sub
  const showHub = view === 'hub' || phase !== 'idle'

  const stackRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const dimRef = useRef<HTMLDivElement>(null)
  const hubScroll = useRef(0)
  const run = useRef(0)
  const width = useRef(1)

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
  const clearStyles = () => {
    for (const el of [subRef.current, hubRef.current, dimRef.current]) {
      if (el) {
        el.style.transform = ''
        el.style.transition = ''
        el.style.opacity = ''
        el.style.willChange = ''
      }
    }
    hubRef.current?.style.removeProperty('--hub-scroll')
  }
  /** Animates from the current state to `progress` and resolves false if something newer took over. */
  const settle = async (progress: number, ms: number, fade: boolean) => {
    const token = ++run.current
    const subEl = subRef.current
    if (!subEl) return false
    for (const el of [subEl, hubRef.current, dimRef.current]) if (el) el.style.willChange = fade ? 'opacity' : 'transform'
    void subEl.offsetWidth // commit the start position before transitioning
    const curve = `${ms}ms ${EASE_IOS}`
    subEl.style.transition = `transform ${curve}, opacity ${ms}ms linear`
    if (hubRef.current) hubRef.current.style.transition = `transform ${curve}`
    if (dimRef.current) dimRef.current.style.transition = `opacity ${curve}`
    paint(progress, fade)
    await afterTransition(subEl, ms)
    return token === run.current
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
    const pushing = phase === 'push'
    if (pushing) {
      hubRef.current?.style.setProperty('--hub-scroll', `${hubScroll.current}px`)
      window.scrollTo(0, 0)
    }
    paint(pushing ? 1 : 0, fade)
    void settle(pushing ? 0 : 1, ms, fade).then((current) => {
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
      flushSync(() => setPhase('drag')) // the hub has to exist before the first frame of the drag
      for (const el of [subRef.current, hubRef.current, dimRef.current]) if (el) el.style.transition = 'none'
      paint(0, false)
    },
    onMove: (dx) => paint(Math.min(Math.max(dx, 0), width.current) / width.current, false),
    onEnd: ({ delta, velocity, cancelled }) => {
      const dx = Math.min(Math.max(delta, 0), width.current)
      const commit = !cancelled && swipeDecision({ distance: dx, velocity, size: width.current, fraction: BACK_FRACTION })
      const reduced = reducedMotion()
      const ms = animationMs(SETTLE_MS, reduced)
      void settle(commit ? 1 : 0, ms, false).then((current) => {
        if (!current) return
        if (commit) onBack('done')
        else setPhase('idle')
      })
    },
  })

  return (
    <div ref={stackRef} className="stack" data-phase={phase} data-moving={phase !== 'idle' ? '' : undefined}>
      {showHub && (
        <div key="hub" ref={hubRef} className="stack-hub">
          {hub}
        </div>
      )}
      {phase !== 'idle' && <div key="dim" ref={dimRef} className="stack-dim" />}
      {shownSub && (
        <div key="sub" ref={subRef} className="stack-sub">
          {renderSub(shownSub)}
        </div>
      )}
    </div>
  )
}
