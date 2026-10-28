import { afterEach, describe, expect, it, vi } from 'vitest'
import { getThemePref, resolveTheme, THEME_KEY } from './theme'

describe('resolveTheme', () => {
  it('folgt bei „Automatisch“ dem System', () => {
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('system', true)).toBe('dark')
  })
  it('erzwungenes Thema ignoriert das System', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('light', false)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('dark', true)).toBe('dark')
  })
})

describe('getThemePref', () => {
  afterEach(() => vi.unstubAllGlobals())
  const stub = (getItem: () => string | null) => vi.stubGlobal('localStorage', { getItem })

  it('liefert gespeicherte gültige Werte', () => {
    for (const v of ['system', 'light', 'dark']) {
      stub(() => v)
      expect(getThemePref()).toBe(v)
    }
  })
  it('fällt bei fehlendem oder ungültigem Wert auf „system“ zurück', () => {
    stub(() => null)
    expect(getThemePref()).toBe('system')
    stub(() => 'blau')
    expect(getThemePref()).toBe('system')
    stub(() => '')
    expect(getThemePref()).toBe('system')
  })
  it('fällt bei werfendem Speicher auf „system“ zurück', () => {
    stub(() => {
      throw new Error('gesperrt')
    })
    expect(getThemePref()).toBe('system')
  })
  it('nutzt den eigenen Key', () => {
    const getItem = vi.fn(() => null)
    stub(getItem)
    getThemePref()
    expect(getItem).toHaveBeenCalledWith(THEME_KEY)
    expect(THEME_KEY).toBe('finanz-app:theme')
  })
})
