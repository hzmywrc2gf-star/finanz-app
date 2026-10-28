/**
 * Pure decisions for touch/mouse gestures (no DOM, no React): which drags count, when they commit,
 * how far the content follows the finger. Distances in px, velocities in px/ms.
 */

/** A back swipe has to start this close to the left screen edge. */
export const EDGE_PX = 24
/** Minimum finger travel before the direction of a drag is judged. */
export const INTENT_PX = 8
/** The main axis must beat the cross axis by this factor ("clearly horizontal"). */
export const INTENT_RATIO = 1.5
/** A flick faster than this commits even over a short distance ... */
export const FLICK_VELOCITY = 0.5
/** ... as long as it travelled at least this far. */
export const FLICK_MIN_PX = 30
/** Share of the width/height that commits a drag without a flick. */
export const BACK_FRACTION = 0.35
export const SHEET_FRACTION = 0.3
export const MONTH_FRACTION = 0.25
/** The page content may follow a month swipe by at most this share of the width. */
export const MONTH_MAX_FRACTION = 0.4
/** The start page underneath moves from -30 % to 0 while the sub-page leaves. */
export const PARALLAX_PERCENT = 30
/** How far a sheet may be pulled up (rubber band). */
export const SHEET_PULL_UP_PX = 80
/** Width of the red "Löschen" action behind a swiped list row. */
export const ROW_ACTION_PX = 80
/** Released past this share of the action width, a row stays open (otherwise it springs closed). */
export const ROW_OPEN_FRACTION = 0.5
/** Dragged beyond this share of the row width, releasing deletes the row immediately. */
export const ROW_DELETE_FRACTION = 0.6
/** Over this travel after the direction is clear, the 8 px dead zone is absorbed (no jump when the content starts to follow). */
export const FOLLOW_RAMP_PX = 24
/** Release animations last between these bounds, depending on the finger speed. */
export const RELEASE_MIN_MS = 150
export const RELEASE_MAX_MS = 350
/** Initial speed of EASE_IOS relative to distance/duration (cubic-bezier y1 / x1 = 0.8 / 0.2). */
const EASE_START_SLOPE = 4
/** Below this finger speed (px/ms) a release counts as "resting": the duration then only depends on the distance. */
const REST_VELOCITY = 0.3
/** Velocity is measured over the last 100 ms before release. */
const VELOCITY_WINDOW_MS = 100
/** With "reduce motion" nothing slides; changes become a quick fade of at most this long. */
const REDUCED_MAX_MS = 120

export type Axis = 'x' | 'y'
export type Sample = { t: number; v: number }

/** `pending` = not decided yet, `match` = a drag along the wanted axis, `reject` = clearly something else (scrolling). */
export type Intent = 'pending' | 'match' | 'reject'

/** Judges a drag from its main-axis and cross-axis travel since pointer down. */
export function gestureIntent(main: number, cross: number): Intent {
  if (Math.hypot(main, cross) < INTENT_PX) return 'pending'
  if (Math.abs(main) > Math.abs(cross) * INTENT_RATIO) return 'match'
  if (Math.abs(cross) > Math.abs(main) * INTENT_RATIO) return 'reject'
  return 'pending'
}

/** Has the finger moved far enough that a press turned into a scroll or drag (the pressed highlight goes away)? */
export const pressCancelled = (dx: number, dy: number): boolean => Math.hypot(dx, dy) >= INTENT_PX

/** Does a pointer-down at `x` (relative to the left edge of the page) start an edge swipe? */
export const isEdgeStart = (x: number): boolean => x >= 0 && x <= EDGE_PX

/** Commit or spring back? `distance` and `velocity` are measured in the commit direction (positive = committing). */
export function swipeDecision({
  distance,
  velocity,
  size,
  fraction,
}: {
  distance: number
  velocity: number
  size: number
  fraction: number
}): boolean {
  if (distance > size * fraction) return true
  return velocity > FLICK_VELOCITY && distance > FLICK_MIN_PX
}

/** Velocity at release from the recent positions; a finger that rested before lifting counts as 0. */
export function releaseVelocity(samples: Sample[], endTime: number): number {
  const recent = samples.filter((s) => endTime - s.t <= VELOCITY_WINDOW_MS)
  if (recent.length < 2) return 0
  const first = recent[0]
  const last = recent[recent.length - 1]
  return last.t > first.t ? (last.v - first.v) / (last.t - first.t) : 0
}

/** iOS rubber band: grows with the pull but never exceeds `limit`. */
export function rubberBand(offset: number, limit: number): number {
  if (offset <= 0 || limit <= 0) return 0
  return (1 - 1 / ((offset * 0.55) / limit + 1)) * limit
}

/** Percent offset of the page underneath; `progress` 0 = sub-page fully open, 1 = fully gone. */
export const parallaxPercent = (progress: number): number => PARALLAX_PERCENT * (Math.min(1, Math.max(0, progress)) - 1)

export type RowOutcome = 'open' | 'close' | 'delete'

/**
 * What a released row swipe does. `offset` is where the row content stands (0 = closed, -ROW_ACTION_PX = open,
 * more negative = further left), `velocity` the finger speed in px/ms (negative = leftwards), `width` the row width.
 */
export function rowSwipeOutcome({ offset, velocity, width }: { offset: number; velocity: number; width: number }): RowOutcome {
  const open = Math.max(0, -offset)
  if (open > width * ROW_DELETE_FRACTION) return 'delete'
  // a fast flick to the left that already passed the action button deletes; a short one only opens
  if (velocity < -FLICK_VELOCITY && open > ROW_ACTION_PX) return 'delete'
  if (velocity < -FLICK_VELOCITY && open > FLICK_MIN_PX) return 'open'
  if (velocity > FLICK_VELOCITY) return 'close'
  return open > ROW_ACTION_PX * ROW_OPEN_FRACTION ? 'open' : 'close'
}

/** Swipe left (negative) shows the next month, swipe right the previous one. */
export const monthStep = (dx: number): 1 | -1 => (dx < 0 ? 1 : -1)

/** Duration of a transition; reduced motion shortens it to a quick fade. */
export const animationMs = (ms: number, reduced: boolean): number => (reduced ? Math.min(ms, REDUCED_MAX_MS) : ms)

/**
 * Where the content is painted while dragging. The first `startDelta` px (the dead zone before the direction was clear)
 * are absorbed over the next FOLLOW_RAMP_PX, so the content starts at its resting place instead of jumping and then
 * follows the finger exactly. Decisions on release keep using the raw delta.
 */
export function followOffset(delta: number, startDelta: number): number {
  const progress = Math.min(1, Math.abs(delta - startDelta) / FOLLOW_RAMP_PX)
  return delta - startDelta * (1 - progress)
}

/**
 * Duration of the animation after a release. `distance` is what is left to travel (px), `velocity` the finger speed
 * towards the target (px/ms, <= 0 = resting or moving away). With the iOS curve the motion starts at distance/duration
 * times its initial slope, so a fast finger gets a short animation that continues at its speed; a resting finger gets
 * a duration that grows a little with the distance. Reduced motion: a quick fade.
 */
export function releaseDuration(distance: number, velocity: number, reduced: boolean): number {
  if (reduced) return REDUCED_MAX_MS
  const d = Math.max(0, distance)
  if (velocity < REST_VELOCITY) return Math.round(Math.min(RELEASE_MAX_MS, Math.max(RELEASE_MIN_MS, 150 + d / 4)))
  return Math.round(Math.min(RELEASE_MAX_MS, Math.max(RELEASE_MIN_MS, (EASE_START_SLOPE * d) / velocity)))
}

/**
 * Timing function for a release: EASE_IOS (initial slope 4) when the duration matches the finger speed; when the duration
 * had to be clamped (a slow finger on a long way) the start slope is lowered/raised, within limits, so the motion still
 * begins at the finger speed.
 */
export function releaseCurve(distance: number, velocity: number, ms: number): string {
  if (velocity < REST_VELOCITY || distance <= 0 || ms <= 0) return 'cubic-bezier(0.2, 0.8, 0.2, 1)'
  const slope = (velocity * ms) / distance
  const y1 = Math.min(1, Math.max(0.2, 0.2 * slope))
  return `cubic-bezier(0.2, ${Number(y1.toFixed(2))}, 0.2, 1)`
}
