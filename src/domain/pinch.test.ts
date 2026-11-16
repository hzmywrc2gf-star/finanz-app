import { describe, expect, it } from 'vitest'
import {
  PINCH_CLOSE_FACTOR,
  PINCH_MIN_DISTANCE,
  PINCH_OPEN_FACTOR,
  pinchDecision,
  pinchDistance,
  pinchFactor,
  pinchPast,
  pinchScale,
  releaseVelocity,
} from './gesture'
import { monthTitle } from './dates'

describe('pinch', () => {
  it('distance and factor', () => {
    expect(pinchDistance({ x: 0, y: 0 }, { x: 30, y: 40 })).toBe(50)
    expect(pinchFactor(100, 150)).toBe(1.5)
    expect(pinchFactor(100, 50)).toBe(0.5)
    // unusable start (fingers almost on top of each other) or a broken value: no change
    expect(pinchFactor(PINCH_MIN_DISTANCE - 1, 200)).toBe(1)
    expect(pinchFactor(0, 200)).toBe(1)
    expect(pinchFactor(NaN, 200)).toBe(1)
    expect(pinchFactor(100, 0)).toBe(1)
  })

  it('threshold: open from 1.25, close from 0.8, the other direction never counts', () => {
    expect(pinchPast(PINCH_OPEN_FACTOR, 'open')).toBe(true)
    expect(pinchPast(1.24, 'open')).toBe(false)
    expect(pinchPast(0.5, 'open')).toBe(false)
    expect(pinchPast(PINCH_CLOSE_FACTOR, 'close')).toBe(true)
    expect(pinchPast(0.81, 'close')).toBe(false)
    expect(pinchPast(2, 'close')).toBe(false)
  })

  it('decision: past the threshold, or a quick pinch that already travelled', () => {
    expect(pinchDecision({ factor: 1.3, velocity: 0, dir: 'open' })).toBe(true)
    expect(pinchDecision({ factor: 1.15, velocity: 0, dir: 'open' })).toBe(false) // small and slow: springs back
    expect(pinchDecision({ factor: 1.15, velocity: 0.002, dir: 'open' })).toBe(true) // quick spread
    expect(pinchDecision({ factor: 1.03, velocity: 0.005, dir: 'open' })).toBe(false) // quick but hardly moved
    expect(pinchDecision({ factor: 1.15, velocity: -0.002, dir: 'open' })).toBe(false) // already closing again
    expect(pinchDecision({ factor: 0.75, velocity: 0, dir: 'close' })).toBe(true)
    expect(pinchDecision({ factor: 0.88, velocity: -0.002, dir: 'close' })).toBe(true)
    expect(pinchDecision({ factor: 0.88, velocity: 0, dir: 'close' })).toBe(false)
    expect(pinchDecision({ factor: 1.5, velocity: 0.01, dir: 'close' })).toBe(false)
  })

  it('velocity in ln(factor) per ms from the samples', () => {
    const samples = [0, 20, 40, 60, 80].map((t) => ({ t, v: Math.log(1 + t / 200) }))
    const v = releaseVelocity(samples, 80)
    expect(v).toBeCloseTo(Math.log(1.4) / 80, 6)
  })

  it('scale: 1 at the start, follows with a rubber band, monotonic, bounded, resists the wrong way', () => {
    expect(pinchScale(1, 'open')).toBe(1)
    expect(pinchScale(1, 'close')).toBe(1)
    let last = 0
    for (let f = 0.3; f <= 4; f += 0.05) {
      const s = pinchScale(f, 'open')
      expect(s).toBeGreaterThan(last)
      last = s
    }
    expect(pinchScale(1.25, 'open')).toBeGreaterThan(1.05)
    expect(pinchScale(1.25, 'open')).toBeLessThan(1.25) // slower than the fingers
    expect(pinchScale(100, 'open')).toBeLessThan(Math.exp(0.3) + 1e-9)
    expect(pinchScale(0.5, 'open')).toBeGreaterThan(Math.exp(-0.05) - 1e-9) // the wrong way: hardly moves
    // symmetric for closing
    expect(pinchScale(0.8, 'close')).toBeCloseTo(1 / pinchScale(1.25, 'open'), 9)
    expect(pinchScale(0.01, 'close')).toBeGreaterThan(Math.exp(-0.3) - 1e-9)
  })
})

describe('monthTitle', () => {
  it('only the month in the current year, with the year otherwise', () => {
    expect(monthTitle('2026-11-01', '2026-11-16')).toBe('November')
    expect(monthTitle('2026-01-01', '2026-11-16')).toBe('Januar')
    expect(monthTitle('2027-01-01', '2026-11-16')).toBe('Januar 2027')
    expect(monthTitle('2025-12-01', '2026-01-02')).toBe('Dezember 2025')
  })
})
