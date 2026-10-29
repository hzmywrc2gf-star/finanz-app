import { describe, expect, it } from 'vitest'
import {
  MAX_FRAME_S,
  SPRING_BOUNCY,
  SPRING_CALM,
  isSettled,
  springSample,
  springStart,
  stepSpring,
} from './spring'
import type { SpringParams, SpringState } from './spring'

/** Runs a spring with a fixed frame time and returns the positions per frame until it settles (or 5 s). */
function run(from: number, to: number, velocity: number, params: SpringParams, dt: number) {
  let state = springStart(from, to, velocity)
  const positions = [from]
  let t = 0
  while (!isSettled(state) && t < 5) {
    state = stepSpring(state, dt, params)
    positions.push(to + state.offset)
    t += dt
  }
  return { positions, time: t, state }
}

describe('spring', () => {
  it('starts at the given position with the finger velocity converted to px/s', () => {
    expect(springStart(100, 0, 0.5)).toEqual({ offset: 100, velocity: 500 })
  })

  it('settles at the target', () => {
    for (const params of [SPRING_BOUNCY, SPRING_CALM]) {
      const { state, time } = run(600, 0, 0, params, 1 / 60)
      expect(isSettled(state)).toBe(true)
      expect(time).toBeLessThan(2)
    }
  })

  it('does not overshoot when critically damped', () => {
    const { positions } = run(600, 0, 0, SPRING_CALM, 1 / 240)
    expect(Math.min(...positions)).toBeGreaterThanOrEqual(-0.001)
    const up = run(0, 80, 0, SPRING_CALM, 1 / 240).positions
    expect(Math.max(...up)).toBeLessThanOrEqual(80.001)
  })

  it('overshoots a little (under 4 % of the distance) at 0.86 and comes back', () => {
    const { positions } = run(600, 0, 0, SPRING_BOUNCY, 1 / 240)
    const overshoot = -Math.min(...positions)
    expect(overshoot).toBeGreaterThan(0)
    expect(overshoot).toBeLessThan(600 * 0.04)
  })

  it('keeps the velocity of the finger at the start (continuity)', () => {
    // 0.5 px/ms = 500 px/s towards the target: after one 240th of a second it moved about 2 px
    const moved = springSample(100, 0, -0.5, 1 / 240, SPRING_CALM)
    expect(100 - moved).toBeGreaterThan(1.8)
    expect(100 - moved).toBeLessThan(2.3)
    // away from the target it first keeps going that way
    expect(springSample(100, 0, 0.5, 1 / 240, SPRING_CALM)).toBeGreaterThan(101.2)
  })

  it('a fast throw towards the target carries past it when bouncy', () => {
    const { positions } = run(300, 0, -2, SPRING_BOUNCY, 1 / 240)
    expect(Math.min(...positions)).toBeLessThan(0)
  })

  it('is independent of the frame rate', () => {
    for (const params of [SPRING_BOUNCY, SPRING_CALM]) {
      for (const t of [0.1, 0.25, 0.5]) {
        const at = (dt: number) => {
          let state: SpringState = springStart(500, 0, -0.3)
          for (let i = 0; i < Math.round(t / dt); i++) state = stepSpring(state, dt, params)
          return state.offset
        }
        expect(Math.abs(at(1 / 60) - at(1 / 120))).toBeLessThan(0.5)
        expect(Math.abs(at(1 / 60) - at(1 / 240))).toBeLessThan(0.5)
      }
    }
  })

  it('treats a long frame as at most MAX_FRAME_S', () => {
    const start = springStart(500, 0, 0)
    const long = stepSpring(start, 5, SPRING_BOUNCY)
    const capped = stepSpring(start, MAX_FRAME_S, SPRING_BOUNCY)
    expect(long).toEqual(capped)
    expect(stepSpring(start, -1, SPRING_BOUNCY)).toEqual(start)
  })

  it('a faster response settles sooner', () => {
    const slow = run(400, 0, 0, { ...SPRING_CALM, response: 0.5 }, 1 / 120).time
    const fast = run(400, 0, 0, { ...SPRING_CALM, response: 0.3 }, 1 / 120).time
    expect(fast).toBeLessThan(slow)
  })

  it('settle detection needs both a small offset and a low speed', () => {
    expect(isSettled({ offset: 0.1, velocity: 1 })).toBe(true)
    expect(isSettled({ offset: 0.1, velocity: 50 })).toBe(false)
    expect(isSettled({ offset: 2, velocity: 0 })).toBe(false)
    expect(isSettled({ offset: 0.8, velocity: 0 }, 1)).toBe(true)
  })
})
