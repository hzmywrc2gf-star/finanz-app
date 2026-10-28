/**
 * Light haptic tick. Android/Chrome: `navigator.vibrate`. iOS Safari has no vibrate API, but since iOS 18 toggling a
 * `<input type="checkbox" switch>` plays the system haptic, so a hidden switch is clicked instead. Older iPhones and
 * desktops: silent no-op. Call it synchronously from the event handler (browsers want a user gesture); it never throws.
 */
let toggle: HTMLLabelElement | null = null

/** One hidden switch for the whole app: invisible, out of the tab order and the accessibility tree, never focused. */
function hapticSwitch(): HTMLLabelElement {
  if (toggle?.isConnected) return toggle
  const label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  label.setAttribute('data-haptic', '')
  label.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  input.tabIndex = -1
  label.appendChild(input)
  document.body.appendChild(label)
  toggle = label
  return label
}

export function haptic(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10)
      return
    }
    if (typeof document === 'undefined' || !document.body) return
    const before = document.activeElement
    hapticSwitch().click()
    // some browsers focus a clicked label's checkbox: give the focus back (no keyboard or scroll jump)
    if (document.activeElement !== before) {
      if (before instanceof HTMLElement) before.focus({ preventScroll: true })
      else if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    }
  } catch {
    // no haptics on this device
  }
}
