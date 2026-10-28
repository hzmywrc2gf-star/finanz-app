/** The few Navigator fields the detection needs (also lets tests pass plain objects). */
export type NavigatorInfo = Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>

/**
 * iPhone, iPod, iPad and iPadOS in "desktop mode" (reports itself as a Mac but has a touch screen).
 * All of them run WebKit with the system's own edge-swipe back gesture, in Safari and in the
 * home-screen app alike. Real Macs report no touch points.
 */
export function isAppleTouchWebKit(nav: NavigatorInfo): boolean {
  if (/iPad|iPhone|iPod/.test(nav.userAgent)) return true
  return nav.platform === 'MacIntel' && nav.maxTouchPoints > 1
}

/**
 * Whether sub-pages create history entries. On Apple touch devices they must not: iOS would run its
 * own snapshot back animation on top of our edge swipe (double animation). Evaluated once.
 */
export const USE_HISTORY: boolean = typeof navigator === 'undefined' ? true : !isAppleTouchWebKit(navigator)
