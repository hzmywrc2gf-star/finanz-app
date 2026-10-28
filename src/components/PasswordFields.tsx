import { useState } from 'react'
import { MIN_PASSWORD_LENGTH, STRENGTH_LABEL, passwordStrength } from '../lib/password'

/** Password + repeat with show/hide and a simple strength hint (for lock setup, password change, recovery reset). */
export function PasswordFields({
  idPrefix,
  password,
  repeat,
  onPassword,
  onRepeat,
  disabled,
  autoFocus,
  label = 'Passwort',
}: {
  idPrefix: string
  password: string
  repeat: string
  onPassword: (v: string) => void
  onRepeat: (v: string) => void
  disabled?: boolean
  autoFocus?: boolean
  label?: string
}) {
  const [show, setShow] = useState(false)
  const type = show ? 'text' : 'password'
  const strength = passwordStrength(password)
  return (
    <>
      <div className="card wide-labels pw-fields">
        <div className="field">
          <label htmlFor={`${idPrefix}-pw`}>{label}</label>
          <input
            id={`${idPrefix}-pw`}
            type={type}
            autoComplete="new-password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={password}
            disabled={disabled}
            onChange={(e) => onPassword(e.target.value)}
            autoFocus={autoFocus}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-pw2`}>Wiederholen</label>
          <input
            id={`${idPrefix}-pw2`}
            type={type}
            autoComplete="new-password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={repeat}
            disabled={disabled}
            onChange={(e) => onRepeat(e.target.value)}
          />
        </div>
      </div>
      <div className="pw-meta">
        <button type="button" className="link-btn" style={{ padding: 0 }} aria-pressed={show} onClick={() => setShow(!show)}>
          {show ? 'Passwort verbergen' : 'Passwort anzeigen'}
        </button>
        {password && (
          <span className="strength" data-level={strength} role="status">
            {STRENGTH_LABEL[strength]}
          </span>
        )}
      </div>
      <div className="footnote">Mindestens {MIN_PASSWORD_LENGTH} Zeichen. Länger und gemischt ist besser.</div>
    </>
  )
}
