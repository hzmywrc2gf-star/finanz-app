import { useState } from 'react'
import { getThemePref, setThemePref } from '../lib/theme'
import type { ThemePref } from '../lib/theme'

/** Darstellung für die Einstellungen: Wahl speichern und sofort anwenden. */
export function useThemePref(): [ThemePref, (pref: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(getThemePref)
  return [
    pref,
    (next) => {
      setThemePref(next)
      setPref(next)
    },
  ]
}
