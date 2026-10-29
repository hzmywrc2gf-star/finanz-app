import { afterEach, describe, expect, it, vi } from 'vitest'
import { RECURRING_DISMISSED_KEY, dismissKey, getDismissedKeys } from './recurringDismissed'

function stubStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  })
  return store
}

describe('recurringDismissed', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('remembers keys without duplicates', () => {
    stubStorage()
    dismissKey('abc')
    dismissKey('def')
    dismissKey('abc')
    expect([...getDismissedKeys()]).toEqual(['def', 'abc'])
  })

  it('keeps at most 200 and drops the oldest', () => {
    const store = stubStorage()
    for (let i = 0; i < 205; i++) dismissKey(`k${i}`)
    expect(JSON.parse(store.get(RECURRING_DISMISSED_KEY) as string)).toHaveLength(200)
    expect(getDismissedKeys().has('k0')).toBe(false)
    expect(getDismissedKeys().has('k204')).toBe(true)
  })

  it('ignores garbage and never throws', () => {
    stubStorage({ [RECURRING_DISMISSED_KEY]: '{"a":1}' })
    expect(getDismissedKeys().size).toBe(0)
    stubStorage({ [RECURRING_DISMISSED_KEY]: '[1,"ok",""]' })
    expect([...getDismissedKeys()]).toEqual(['ok'])
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } })
    expect(getDismissedKeys().size).toBe(0)
    expect(() => dismissKey('x')).not.toThrow()
  })
})
