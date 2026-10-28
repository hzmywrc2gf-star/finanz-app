import { useState } from 'react'

/** The recovery key, big and monospace, with a copy button. */
export function RecoveryKeyBox({ recoveryKey }: { recoveryKey: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(recoveryKey)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false) // clipboard blocked: the key is selectable, the user can copy it by hand
    }
  }

  return (
    <div className="recovery-box">
      <div className="recovery-key" data-testid="recovery-key" aria-label="Wiederherstellungsschlüssel">
        {recoveryKey}
      </div>
      <button type="button" className="link-btn" onClick={copy}>
        {copied ? 'Kopiert' : 'Kopieren'}
      </button>
    </div>
  )
}
