import { describe, expect, it } from 'vitest'
import { isAppleTouchWebKit } from './platform'

const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const SAFARI_IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const SAFARI_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'

describe('isAppleTouchWebKit', () => {
  it('erkennt iPhone', () => {
    expect(isAppleTouchWebKit({ userAgent: SAFARI_IOS, platform: 'iPhone', maxTouchPoints: 5 })).toBe(true)
  })
  it('erkennt iPad (Mobilansicht)', () => {
    expect(isAppleTouchWebKit({ userAgent: SAFARI_IPAD, platform: 'iPad', maxTouchPoints: 5 })).toBe(true)
  })
  it('erkennt iPadOS im Desktop-Modus (MacIntel mit Touch)', () => {
    expect(isAppleTouchWebKit({ userAgent: SAFARI_MAC, platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true)
  })
  it('Mac ohne Touch ist kein Apple-Touch-Gerät', () => {
    expect(isAppleTouchWebKit({ userAgent: SAFARI_MAC, platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false)
  })
  it('Android ist kein Apple-Touch-Gerät', () => {
    expect(isAppleTouchWebKit({ userAgent: CHROME_ANDROID, platform: 'Linux armv81', maxTouchPoints: 5 })).toBe(false)
  })
})
