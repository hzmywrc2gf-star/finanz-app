import { afterEach, describe, expect, it, vi } from 'vitest'
import { haptic } from './haptics'

afterEach(() => vi.unstubAllGlobals())

describe('haptic', () => {
  it('vibrates for 10 ms where navigator.vibrate exists', () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate })
    haptic()
    expect(vibrate).toHaveBeenCalledWith(10)
  })
  it('does nothing and does not throw without vibrate and without a document', () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('document', undefined)
    expect(() => haptic()).not.toThrow()
  })
  it('swallows errors thrown by vibrate', () => {
    vi.stubGlobal('navigator', {
      vibrate: () => {
        throw new Error('blocked')
      },
    })
    expect(() => haptic()).not.toThrow()
  })
  it('falls back to a hidden switch that is clicked once per call', () => {
    const click = vi.fn()
    const attrs: Record<string, string> = {}
    const label = {
      isConnected: true,
      style: { cssText: '' },
      setAttribute: (k: string, v: string) => void (attrs[k] = v),
      appendChild: vi.fn(),
      click,
    }
    const input = { type: '', tabIndex: 0, setAttribute: vi.fn() }
    const append = vi.fn()
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('document', {
      body: { appendChild: append },
      createElement: (tag: string) => (tag === 'label' ? label : input),
    })
    haptic()
    haptic()
    expect(append).toHaveBeenCalledTimes(1) // created once
    expect(click).toHaveBeenCalledTimes(2)
    expect(attrs['aria-hidden']).toBe('true')
    expect(input.tabIndex).toBe(-1)
    expect(input.setAttribute).toHaveBeenCalledWith('switch', '')
  })
})
