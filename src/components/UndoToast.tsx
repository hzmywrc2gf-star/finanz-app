import { useEffect } from 'react'

/** How long "Rückgängig" stays available. */
export const UNDO_MS = 5000

/** Bottom toast above the tab bar after a delete; disappears on its own. */
export function UndoToast({
  id,
  message,
  onUndo,
  onExpire,
}: {
  /** Changes with every delete, so a newer toast restarts the timer. */
  id: number
  message: string
  onUndo: () => void
  onExpire: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onExpire, UNDO_MS)
    return () => clearTimeout(timer)
  }, [id, onExpire])

  return (
    <div key={id} className="toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onUndo}>
        Rückgängig
      </button>
    </div>
  )
}
