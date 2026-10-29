import { describe, expect, it } from 'vitest'
import { TITLE_COLLAPSE_PX, barProgress, glowOffset, heroShift, titleStyle } from './scrollFx'

describe('scroll effects', () => {
  it('collapses the bar over the first 44 px and clamps outside', () => {
    expect(barProgress(0)).toBe(0)
    expect(barProgress(22)).toBeCloseTo(0.5)
    expect(barProgress(TITLE_COLLAPSE_PX)).toBe(1)
    expect(barProgress(900)).toBe(1)
    expect(barProgress(-50)).toBe(0) // overscroll at the top
  })
  it('the large title rises slower, shrinks and fades', () => {
    expect(titleStyle(0)).toEqual({ y: 0, scale: 1, opacity: 1 })
    const half = titleStyle(22)
    expect(half.y).toBeCloseTo(5.5)
    expect(half.scale).toBeCloseTo(0.91)
    expect(half.opacity).toBeCloseTo(0.5)
    expect(titleStyle(44).opacity).toBe(0)
    expect(titleStyle(-20).y).toBe(0)
  })
  it('reduced motion only fades the title', () => {
    expect(titleStyle(22, true)).toEqual({ y: 0, scale: 1, opacity: 0.5 })
  })
  it('the gradient layer lags by 45 % of the scroll', () => {
    expect(glowOffset(100)).toBeCloseTo(45)
    expect(glowOffset(-30)).toBe(0)
  })
  it('the hero gradient shifts up to 100 %', () => {
    expect(heroShift(0)).toBe(0)
    expect(heroShift(150)).toBeCloseTo(50)
    expect(heroShift(5000)).toBe(100)
  })
})
