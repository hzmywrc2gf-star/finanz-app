import { afterEach, describe, expect, it, vi } from 'vitest'
import { IMPORT_MAPPING_KEY, getSavedMapping, saveMapping } from './importMapping'

function stubStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  })
  return store
}

describe('importMapping', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('remembers a mapping per header layout', () => {
    stubStorage()
    saveMapping('datum|betrag', { date: 0, amount: 1 })
    saveMapping('buchungstag|umsatz', { date: 0, amount: 2, note: 1 })
    expect(getSavedMapping('datum|betrag')).toEqual({ date: 0, amount: 1 })
    expect(getSavedMapping('buchungstag|umsatz')).toEqual({ date: 0, amount: 2, note: 1 })
    expect(getSavedMapping('unbekannt')).toBeNull()
  })

  it('keeps at most 20 layouts and drops the oldest', () => {
    const store = stubStorage()
    for (let i = 0; i < 25; i++) saveMapping(`spalte${i}|b`, { date: 0, amount: 1 })
    expect(Object.keys(JSON.parse(store.get(IMPORT_MAPPING_KEY) as string))).toHaveLength(20)
    expect(getSavedMapping('spalte0|b')).toBeNull()
    expect(getSavedMapping('spalte24|b')).not.toBeNull()
  })

  it('ignores damaged storage and blocked storage', () => {
    stubStorage({ [IMPORT_MAPPING_KEY]: '{kaputt' })
    expect(getSavedMapping('a|b')).toBeNull()
    stubStorage({ [IMPORT_MAPPING_KEY]: JSON.stringify({ 'a|b': { date: -1, amount: 'x', foo: 3 }, 'c|d': { date: 2 } }) })
    expect(getSavedMapping('a|b')).toBeNull()
    expect(getSavedMapping('c|d')).toEqual({ date: 2 })
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(getSavedMapping('a|b')).toBeNull()
    expect(() => saveMapping('a|b', { date: 0 })).not.toThrow()
  })
})
