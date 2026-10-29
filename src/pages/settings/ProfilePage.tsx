import { memo, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useFinance } from '../../state/FinanceContext'
import { SaveError } from '../../components/SaveError'
import { SegmentedControl } from '../../components/SegmentedControl'
import { SubPageHeader } from '../../components/SubPageHeader'
import { useThemePref } from '../../hooks/useThemePref'
import { THEME_OPTIONS } from '../../lib/theme'

/** Settings > Profil: name for the greeting and the appearance (light/dark/automatic). */
export const ProfilePage = memo(function ProfilePage({ onBack }: { onBack: () => void }) {
  const { data, setDisplayName, saveError } = useFinance()
  const [name, setName] = useState(data.settings.displayName ?? '')
  const [nameMsg, setNameMsg] = useState<string | null>(null)
  const [theme, setTheme] = useThemePref()
  // the edge swipe unmounts the page without a blur, so the latest input is also saved when leaving
  const latest = useRef({ name, stored: data.settings.displayName ?? '', save: setDisplayName })
  useEffect(() => {
    latest.current = { name, stored: data.settings.displayName ?? '', save: setDisplayName }
  })
  useEffect(
    () => () => {
      const { name: typed, stored, save } = latest.current
      if (typed.trim() === stored) return
      try {
        save(typed)
      } catch {
        // an invalid name is simply not saved when leaving
      }
    },
    [],
  )

  // Later (with sync) the name will come from the login instead of being typed here.
  function saveName(e?: FormEvent) {
    e?.preventDefault()
    try {
      setDisplayName(name)
      setName(name.trim())
      setNameMsg(null)
    } catch (err) {
      setNameMsg(err instanceof Error ? err.message : 'Name konnte nicht gespeichert werden.')
    }
  }

  return (
    <>
      <SubPageHeader title="Profil" parent="Einstellungen" onBack={onBack} />
      <SaveError message={saveError} />

      <div className="section-title">Persönlich</div>
      <form className="card" onSubmit={saveName} noValidate>
        <div className="field">
          <label htmlFor="display-name">Dein Name</label>
          <input
            id="display-name"
            autoComplete="given-name"
            placeholder="Für die Begrüßung"
            maxLength={40}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameMsg(null)
            }}
            onBlur={() => saveName()}
          />
        </div>
      </form>
      {nameMsg && (
        <div className="error" role="alert">
          {nameMsg}
        </div>
      )}
      <div className="footnote">Mit diesem Namen begrüßt dich Finanzklar, wenn du es mit Face ID entsperrst.</div>

      <div className="section-title">Darstellung</div>
      <div className="card" style={{ padding: 12 }}>
        <SegmentedControl label="Darstellung" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      </div>
      <div className="footnote">Automatisch folgt der Einstellung des iPhones.</div>
    </>
  )
})
