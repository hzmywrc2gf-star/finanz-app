/**
 * Pure numbers for the scroll effects (no DOM): the large title that collapses into a compact bar, the top gradient that
 * lags behind the content, the hero card gradient that shifts. `s` is the window scroll position in px.
 */

/** Scrolling this far fully collapses the large title into the bar. */
export const TITLE_COLLAPSE_PX = 44
/** The title travels at 75 % of the scroll speed (it rises 25 % of the scroll back down), so it leaves slowly. */
export const TITLE_DRAG = 0.25
/** At full collapse the title is this much smaller. */
export const TITLE_SHRINK = 0.18
/** The gradient layer moves down by this share of the scroll, so the content passes it at 55 % speed. */
export const GLOW_LAG = 0.45
/** Past this scroll position the gradient has run out of view (its height plus the lag). */
export const GLOW_END_PX = 700
/** The hero gradient has moved all the way after this much scroll (px per percent: 3). */
export const HERO_SHIFT_DIV = 3

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** 0 = large title, 1 = compact bar. */
export const barProgress = (s: number): number => clamp01(s / TITLE_COLLAPSE_PX)

export type TitleStyle = { y: number; scale: number; opacity: number }

/** Where the large title is painted; `calm` (reduced motion) only fades it. */
export function titleStyle(s: number, calm = false): TitleStyle {
  const p = barProgress(s)
  return { y: calm ? 0 : Math.max(0, s) * TITLE_DRAG, scale: calm ? 1 : 1 - p * TITLE_SHRINK, opacity: 1 - p }
}

/** Vertical offset of the top gradient layer (px). */
export const glowOffset = (s: number): number => Math.max(0, s) * GLOW_LAG

/** background-position-y of the hero gradient in percent (0 at rest, 100 at the end). */
export const heroShift = (s: number): number => Math.min(100, Math.max(0, s) / HERO_SHIFT_DIV)
