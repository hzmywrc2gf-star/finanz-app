import { describe, expect, it } from 'vitest'
import {
  animationMs,
  gestureIntent,
  isEdgeStart,
  monthStep,
  parallaxPercent,
  releaseVelocity,
  rubberBand,
  swipeDecision,
  BACK_FRACTION,
  MONTH_FRACTION,
  SHEET_FRACTION,
} from './gesture'

describe('edge start', () => {
  it('accepts the outer 24 px only', () => {
    expect(isEdgeStart(0)).toBe(true)
    expect(isEdgeStart(24)).toBe(true)
    expect(isEdgeStart(25)).toBe(false)
    expect(isEdgeStart(100)).toBe(false)
    expect(isEdgeStart(-3)).toBe(false)
  })
})

describe('gestureIntent', () => {
  it('waits for 8 px of travel', () => {
    expect(gestureIntent(5, 0)).toBe('pending')
    expect(gestureIntent(5, 5)).toBe('pending')
    expect(gestureIntent(7.9, 0)).toBe('pending')
  })
  it('matches a clearly dominant main axis', () => {
    expect(gestureIntent(12, 2)).toBe('match')
    expect(gestureIntent(-30, 10)).toBe('match')
  })
  it('rejects vertical scrolling', () => {
    expect(gestureIntent(2, 12)).toBe('reject')
    expect(gestureIntent(10, -20)).toBe('reject')
  })
  it('keeps diagonal drags pending (ratio 1.5)', () => {
    expect(gestureIntent(12, 10)).toBe('pending')
    expect(gestureIntent(15, 10)).toBe('pending')
    expect(gestureIntent(16, 10)).toBe('match')
  })
})

describe('swipeDecision', () => {
  const size = 400
  it('commits past the fraction of the size', () => {
    expect(swipeDecision({ distance: 141, velocity: 0, size, fraction: BACK_FRACTION })).toBe(true)
    expect(swipeDecision({ distance: 140, velocity: 0, size, fraction: BACK_FRACTION })).toBe(false)
    expect(swipeDecision({ distance: 101, velocity: 0, size, fraction: MONTH_FRACTION })).toBe(true)
    expect(swipeDecision({ distance: 121, velocity: 0, size, fraction: SHEET_FRACTION })).toBe(true)
    expect(swipeDecision({ distance: 100, velocity: 0, size, fraction: SHEET_FRACTION })).toBe(false)
  })
  it('commits a fast flick over a short distance', () => {
    expect(swipeDecision({ distance: 40, velocity: 0.8, size, fraction: BACK_FRACTION })).toBe(true)
  })
  it('needs both speed and 30 px for a flick', () => {
    expect(swipeDecision({ distance: 40, velocity: 0.5, size, fraction: BACK_FRACTION })).toBe(false)
    expect(swipeDecision({ distance: 20, velocity: 2, size, fraction: BACK_FRACTION })).toBe(false)
    expect(swipeDecision({ distance: 30, velocity: 2, size, fraction: BACK_FRACTION })).toBe(false)
  })
  it('springs back for a drag against the commit direction', () => {
    expect(swipeDecision({ distance: -80, velocity: -1, size, fraction: BACK_FRACTION })).toBe(false)
  })
})

describe('releaseVelocity', () => {
  it('uses the last 100 ms', () => {
    const samples = [
      { t: 0, v: 0 },
      { t: 50, v: 100 },
      { t: 150, v: 110 },
      { t: 200, v: 160 },
    ]
    // window 100..200 -> samples at 150 and 200: 50 px / 50 ms
    expect(releaseVelocity(samples, 200)).toBeCloseTo(1)
  })
  it('is 0 when the finger rested before lifting', () => {
    expect(releaseVelocity([{ t: 0, v: 0 }, { t: 40, v: 80 }], 400)).toBe(0)
  })
  it('is 0 for a single sample or identical timestamps', () => {
    expect(releaseVelocity([{ t: 10, v: 5 }], 20)).toBe(0)
    expect(releaseVelocity([{ t: 10, v: 5 }, { t: 10, v: 9 }], 20)).toBe(0)
  })
  it('is negative for a leftward drag', () => {
    expect(releaseVelocity([{ t: 0, v: 0 }, { t: 50, v: -50 }], 60)).toBeCloseTo(-1)
  })
})

describe('rubberBand', () => {
  it('starts at 0, grows, and never reaches the limit', () => {
    expect(rubberBand(0, 100)).toBe(0)
    expect(rubberBand(50, 100)).toBeGreaterThan(0)
    expect(rubberBand(50, 100)).toBeLessThan(50)
    expect(rubberBand(5000, 100)).toBeLessThan(100)
    expect(rubberBand(200, 100)).toBeGreaterThan(rubberBand(100, 100))
  })
  it('ignores negative offsets and empty limits', () => {
    expect(rubberBand(-10, 100)).toBe(0)
    expect(rubberBand(10, 0)).toBe(0)
  })
})

describe('helpers', () => {
  it('parallax goes from -30 % to 0', () => {
    expect(parallaxPercent(0)).toBe(-30)
    expect(parallaxPercent(0.5)).toBe(-15)
    expect(parallaxPercent(1)).toBe(0)
    expect(parallaxPercent(2)).toBe(0)
  })
  it('swipe left = next month, right = previous', () => {
    expect(monthStep(-120)).toBe(1)
    expect(monthStep(120)).toBe(-1)
  })
  it('reduced motion shortens transitions to a quick fade', () => {
    expect(animationMs(300, false)).toBe(300)
    expect(animationMs(300, true)).toBe(120)
    expect(animationMs(80, true)).toBe(80)
  })
})
