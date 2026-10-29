/** Shown on every settings page when the last save failed (the error comes from `useFinance().saveError`). */
export function SaveError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="error" role="alert">
      {message}
    </div>
  )
}
