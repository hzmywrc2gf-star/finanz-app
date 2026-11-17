import { describe, expect, it } from 'vitest'
import { SPRING_BOUNCY, SPRING_CALM } from './spring'
import { ZOOM_RADIUS, affineCss, springProgress, zoomFrame } from './zoom'
import type { Affine, ZoomGeometry } from './zoom'

const g: ZoomGeometry = { anchor: { left: 160, top: 300, width: 50, height: 56 }, vw: 390, vh: 844, left: 0, top: 0, width: 390 }
/** Screen position of a point `p` of the page: page layout origin (left, top − scroll) + window(page(p)). */
const apply = (t: Affine, x: number, y: number) => ({ x: t.x + t.sx * x, y: t.y + t.sy * y })
const screen = (z: number, scrollY: number, px: number, py: number) => {
  const f = zoomFrame(g, z, scrollY)
  const inner = apply(f.page, px, py)
  const outer = apply(f.win, inner.x, inner.y)
  return { x: g.left + outer.x, y: g.top - scrollY + outer.y }
}
const windowRect = (z: number, scrollY: number) => {
  const f = zoomFrame(g, z, scrollY)
  return { left: g.left + f.win.x, top: g.top - scrollY + f.win.y, width: f.win.sx * g.width, height: f.win.sy * g.vh }
}

describe('zoomFrame', () => {
  it('is the identity when fully open, whatever the scroll position', () => {
    for (const scrollY of [0, 420]) {
      const f = zoomFrame(g, 1, scrollY)
      expect(screen(1, scrollY, 30, scrollY + 100).x).toBeCloseTo(30)
      expect(screen(1, scrollY, 30, scrollY + 100).y).toBeCloseTo(100)
      expect(f.win.opacity).toBe(1)
      expect(f.win.radiusX).toBe(0)
      expect(f.hub).toEqual({ scale: 1 + 0.5, opacity: 1 - 0.7 })
      expect(windowRect(1, scrollY)).toEqual({ left: 0, top: expect.closeTo(0) as unknown as number, width: 390, height: 844 })
    }
  })

  it('starts as the anchor rectangle, transparent and rounded, with the hub untouched', () => {
    const r = windowRect(0, 420)
    expect(r.left).toBeCloseTo(160)
    expect(r.top).toBeCloseTo(300)
    expect(r.width).toBeCloseTo(50)
    expect(r.height).toBeCloseTo(56)
    const f = zoomFrame(g, 0, 420)
    expect(f.win.opacity).toBe(0)
    expect(f.hub).toEqual({ scale: 1, opacity: 1 })
    // the radius is ZOOM_RADIUS on screen in both directions (the window itself is scaled unevenly)
    expect(f.win.radiusX * f.win.sx).toBeCloseTo(ZOOM_RADIUS)
    expect(f.win.radiusY * f.win.sy).toBeCloseTo(ZOOM_RADIUS)
  })

  it('scales the page uniformly around the point that is in the middle of the screen at rest', () => {
    for (const z of [0, 0.3, 0.7]) {
      const scrollY = 420
      const s = (g.anchor.width + (g.vw - g.anchor.width) * z) / g.width
      const mid = screen(z, scrollY, g.vw / 2, scrollY + g.vh / 2)
      const r = windowRect(z, scrollY)
      expect(mid.x).toBeCloseTo(r.left + r.width / 2)
      expect(mid.y).toBeCloseTo(r.top + r.height / 2)
      const a = screen(z, scrollY, 10, scrollY + 10)
      const b = screen(z, scrollY, 110, scrollY + 210)
      expect(b.x - a.x).toBeCloseTo(100 * s)
      expect(b.y - a.y).toBeCloseTo(200 * s)
    }
  })

  it('clamps progress to 0..1', () => {
    expect(zoomFrame(g, -1, 0)).toEqual(zoomFrame(g, 0, 0))
    expect(zoomFrame(g, 2, 0)).toEqual(zoomFrame(g, 1, 0))
  })
})

describe('springProgress / affineCss', () => {
  it('samples the calm spring from 0 to exactly 1 without overshoot', () => {
    const p = springProgress(SPRING_CALM)
    expect(p[0]).toBe(0)
    expect(p[p.length - 1]).toBe(1)
    for (let i = 1; i < p.length; i++) expect(p[i]).toBeGreaterThanOrEqual(p[i - 1])
    // about 0.8 s at 60 samples per second
    expect(p.length).toBeGreaterThan(30)
    expect(p.length).toBeLessThan(70)
  })

  it('lets a bouncy spring overshoot a little', () => {
    expect(Math.max(...springProgress(SPRING_BOUNCY))).toBeGreaterThan(1)
  })

  it('writes translate + scale with rounded numbers', () => {
    expect(affineCss({ x: 1.23456, y: -2, sx: 0.1234567, sy: 1 })).toBe('translate3d(1.235px, -2px, 0) scale(0.12346, 1)')
  })
})
