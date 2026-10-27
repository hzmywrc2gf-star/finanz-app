import { useEffect } from 'react'

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  secondaryLabel,
  onSecondary,
  onConfirm,
  onCancel,
}: {
  title: string
  message?: string
  confirmLabel: string
  danger?: boolean
  /** Optional middle choice; the dialog then stacks its buttons. */
  secondaryLabel?: string
  onSecondary?: () => void
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="backdrop center" style={{ zIndex: 60 }} onClick={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="body">
          <h3>{title}</h3>
          {message && <p>{message}</p>}
        </div>
        <div className={secondaryLabel ? 'actions stacked' : 'actions'}>
          <button onClick={onCancel}>Abbrechen</button>
          {secondaryLabel && <button onClick={onSecondary}>{secondaryLabel}</button>}
          <button className={danger ? 'danger' : undefined} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
