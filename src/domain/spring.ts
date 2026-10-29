/**
 * Damped harmonic oscillator for the release animations (no DOM, no React). Mass 1; the stiffness comes from `response`
 * (the period of the undamped oscillation in seconds, iOS "response"), the damping from `dampingFraction`
 * (1 = critical: no overshoot, < 1 = rings out a little). Positions are in px, `velocity` in px/s inside the state.
 * Callers use `springStart` with the finger speed in px/ms and step it with `stepSpring` once per frame.
 */

export type SpringParams = { response: number; dampingFraction: number }

/** Lets go with a small, calm overshoot: the default feel of sheets, rows and the segmented pill (one place to retune). */
export const SPRING_BOUNCY: SpringParams = { response: 0.415, dampingFraction: 0.86 }
/** Same speed, no overshoot: pushes, back swipes, the incoming month, closing sheets. */
export const SPRING_CALM: SpringParams = { response: 0.415, dampingFraction: 1 }

/** `offset` = position minus target (px), `velocity` in px/s. */
export type SpringState = { offset: number; velocity: number }

/** Largest integration step; a frame is split into steps of at most this (semi-implicit Euler stays accurate and stable). */
export const MAX_STEP_S = 1 / 240
/** A long frame (tab in the background, GC pause) is treated as at most this long, so the motion never jumps. */
export const MAX_FRAME_S = 0.064
/** At rest when closer than this (px) and slower than REST_VELOCITY (px/s). */
export const REST_OFFSET_PX = 0.3
export const REST_VELOCITY = 4

/** The state at the start: `from` and `to` are positions (px), `velocityPxPerMs` the finger speed along the same axis. */
export function springStart(from: number, to: number, velocityPxPerMs: number): SpringState {
  return { offset: from - to, velocity: velocityPxPerMs * 1000 }
}

/** Advances the spring by `dt` seconds (clamped to MAX_FRAME_S); returns a new state. */
export function stepSpring(state: SpringState, dt: number, { response, dampingFraction }: SpringParams): SpringState {
  const omega = (2 * Math.PI) / response
  const stiffness = omega * omega
  const damping = 2 * dampingFraction * omega
  let remaining = Math.min(Math.max(dt, 0), MAX_FRAME_S)
  let { offset, velocity } = state
  while (remaining > 1e-9) {
    const h = Math.min(remaining, MAX_STEP_S)
    velocity += (-stiffness * offset - damping * velocity) * h
    offset += velocity * h
    remaining -= h
  }
  return { offset, velocity }
}

/** Close enough to the target and slow enough to stop (and jump to the target). */
export const isSettled = (state: SpringState, restOffset = REST_OFFSET_PX): boolean =>
  Math.abs(state.offset) < restOffset && Math.abs(state.velocity) < REST_VELOCITY

/** Position at time `t` seconds after the start (steps of MAX_STEP_S; for tests and previews). */
export function springSample(from: number, to: number, velocityPxPerMs: number, t: number, params: SpringParams): number {
  let state = springStart(from, to, velocityPxPerMs)
  let left = Math.max(0, t)
  while (left > 1e-9) {
    const h = Math.min(left, MAX_STEP_S)
    state = stepSpring(state, h, params)
    left -= h
  }
  return to + state.offset
}
