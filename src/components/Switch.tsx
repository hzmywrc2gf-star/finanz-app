import { haptic } from '../lib/haptics'

/** iOS-style switch (a checkbox with role="switch", styled by `.field input.switch`); every toggle gives a light haptic tick. */
export function Switch({ id, checked, onChange }: { id: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <input
      id={id}
      className="switch"
      type="checkbox"
      role="switch"
      checked={checked}
      onChange={(e) => {
        haptic() // inside the change event, which a tap or key press just caused
        onChange(e.target.checked)
      }}
    />
  )
}
