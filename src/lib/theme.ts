/** Darstellung (Automatisch / Hell / Dunkel): Geräte-Einstellung, bewusst außerhalb von AppData und Backup. */

export type ThemePref = 'system' | 'light' | 'dark'

/** Eigener localStorage-Key; der Inline-Skript in index.html liest denselben Key. */
export const THEME_KEY = 'finanz-app:theme'

const PREFS: readonly ThemePref[] = ['system', 'light', 'dark']
const CHROME_COLOR = { light: '#F2F2F7', dark: '#000000' } as const

/** Welches Erscheinungsbild gilt tatsächlich? Nur „Automatisch“ folgt dem System. */
export function resolveTheme(pref: ThemePref, systemDark: boolean): 'light' | 'dark' {
  if (pref === 'system') return systemDark ? 'dark' : 'light'
  return pref
}

/** Gespeicherte Wahl; bei fehlendem/ungültigem Wert oder gesperrtem Speicher „Automatisch“. */
export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return PREFS.includes(v as ThemePref) ? (v as ThemePref) : 'system'
  } catch {
    return 'system'
  }
}

export function setThemePref(pref: ThemePref): void {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, pref)
  } catch {
    // Speicher gesperrt: die Wahl gilt dann nur bis zum Neuladen
  }
  applyTheme(pref)
}

/** Setzt `data-theme` (nur bei erzwungenem Thema) und passt die theme-color-Metas an die Statusleiste an. */
export function applyTheme(pref: ThemePref): void {
  const root = document.documentElement
  if (pref === 'system') delete root.dataset.theme
  else root.dataset.theme = pref
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    // „Automatisch“: die beiden Metas behalten ihre Farbe passend zu ihrer media-Bedingung
    const own = (meta.media ?? '').includes('dark') ? CHROME_COLOR.dark : CHROME_COLOR.light
    meta.content = pref === 'system' ? own : CHROME_COLOR[pref]
  })
}
