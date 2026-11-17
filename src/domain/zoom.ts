/**
 * Geometry of the calendar zoom (the day view grows out of its cell, NavStack.tsx), as plain numbers (no DOM).
 * Everything the animation changes is a transform or an opacity (compositor work only): the sub-page is a viewport-sized
 * window with rounded corners (`overflow: clip`) that is scaled unevenly from the cell's rectangle to the screen, and the
 * page inside it gets the opposite uneven part on top of one uniform scale, so the content itself is never stretched.
 */
import { isSettled, springStart, stepSpring } from './spring'
import type { SpringParams } from './spring'

/** Measured once when a zoom starts. Anchor in viewport px; the sub-page box: left/top in page px, its width. */
export type ZoomGeometry = {
  anchor: { left: number; top: number; width: number; height: number }
  vw: number
  vh: number
  left: number
  top: number
  width: number
}

/** `translate(x, y) scale(sx, sy)` with transform-origin 0 0. */
export type Affine = { x: number; y: number; sx: number; sy: number }

export type ZoomFrame = {
  /** The clipping window (the sub-page element, as tall as the viewport while zooming). */
  win: Affine & { opacity: number; radiusX: number; radiusY: number }
  /** The page inside the window. */
  page: Affine
  /** The hub underneath grows around the anchor (origin set once) and fades. */
  hub: { scale: number; opacity: number }
}

/** Corner radius of the window while it is as small as the anchor (px on screen). */
export const ZOOM_RADIUS = 14
/** The hub grows by this much (around the anchor) while the sub-page zooms open, and fades. */
export const ZOOM_HUB_SCALE = 0.5

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * The frame at zoom progress `zRaw` (0 = the sub-page sits in the anchor's rectangle, rounded and transparent; 1 = full
 * screen, all identity) while the page is scrolled to `scrollY`. The page point in the middle of the screen at rest ends up
 * in the middle of the window, scaled uniformly by window width / page width.
 */
export function zoomFrame(g: ZoomGeometry, zRaw: number, scrollY: number): ZoomFrame {
  const z = Math.min(1, Math.max(0, zRaw))
  const a = g.anchor
  const w = lerp(a.width, g.vw, z)
  const h = lerp(a.height, g.vh, z)
  const cx = lerp(a.left + a.width / 2, g.vw / 2, z)
  const cy = lerp(a.top + a.height / 2, g.vh / 2, z)
  const s = w / g.width
  // the window's layout box: page (left, top), i.e. on screen (left, top - scrollY), width × vh
  const sx = w / g.width
  const sy = h / g.vh
  const radius = lerp(ZOOM_RADIUS, 0, z)
  // the page point that sits in the middle of the screen at rest
  const ex = g.vw / 2 - g.left
  const ey = scrollY + g.vh / 2 - g.top
  return {
    win: {
      x: cx - w / 2 - g.left,
      y: cy - h / 2 - (g.top - scrollY),
      sx,
      sy,
      opacity: Math.min(1, z * 2.5),
      radiusX: radius / sx,
      radiusY: radius / sy,
    },
    page: { x: (w / 2 - s * ex) / sx, y: (h / 2 - s * ey) / sy, sx: s / sx, sy: s / sy },
    hub: { scale: 1 + ZOOM_HUB_SCALE * z, opacity: 1 - 0.7 * z },
  }
}

/** CSS transform of an `Affine` (origin 0 0); rounded to keep keyframes small. */
export const affineCss = ({ x, y, sx, sy }: Affine): string =>
  `translate3d(${round(x)}px, ${round(y)}px, 0) scale(${round(sx, 5)}, ${round(sy, 5)})`

const round = (n: number, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits

/**
 * A spring from rest at 0 to 1 sampled once per `fps` frame until it settles (`restOffset` in thousandths), for keyframes the
 * browser plays on its own (compositor) instead of a JS frame loop. First value 0, last value exactly 1.
 */
export function springProgress(params: SpringParams, { fps = 60, restOffset = 2, maxSeconds = 3 } = {}): number[] {
  const units = 1000
  let state = springStart(0, units, 0)
  const out = [0]
  for (let i = 0; i < fps * maxSeconds && !isSettled(state, restOffset); i++) {
    state = stepSpring(state, 1 / fps, params)
    out.push((units + state.offset) / units)
  }
  out[out.length - 1] = 1
  return out
}
