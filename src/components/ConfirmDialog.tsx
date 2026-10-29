import { useCallback, useEffect, useRef, useState } from 'react'

/** Length of the scale-out when a dialog is dismissed (matches `.dialog.closing` in index.css). */
const EXIT_MS = 150

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Abbrechen',
  danger,
  secondaryLabel,
  onSecondary,
  onConfirm,
  onCancel,
}: {
  title: string
  message?: string
  confirmLabel: string
  /** Text of the cancel button, default „Abbrechen“. */
  cancelLabel?: string
  danger?: boolean
  /** Optional middle choice; the dialog then stacks its buttons. */
  secondaryLabel?: string
  onSecondary?: () => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const [closing, setClosing] = useState(false)
  const latest = useRef(onCancel)
  useEffect(() => {
    latest.current = onCancel
  })
  // Abbrechen, Escape and a tap outside play the exit animation first, then call onCancel
  const closingNow = useRef(false)
  const cancel = useCallback(() => {
    if (closingNow.current) return
    closingNow.current = true
    setClosing(true)
    window.setTimeout(() => latest.current(), EXIT_MS)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cancel])

  return (
    <div className={closing ? 'backdrop center closing' : 'backdrop center'} style={{ zIndex: 60 }} onClick={cancel}>
      <div className="backdrop-dim" />
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="body">
          <h3>{title}</h3>
          {message && <p>{message}</p>}
        </div>
        <div className={secondaryLabel ? 'actions stacked' : 'actions'}>
          <button onClick={cancel}>{cancelLabel}</button>
          {secondaryLabel && <button onClick={() => !closingNow.current && onSecondary?.()}>{secondaryLabel}</button>}
          <button className={danger ? 'danger' : undefined} onClick={() => !closingNow.current && onConfirm()} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
