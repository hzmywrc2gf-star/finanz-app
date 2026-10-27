import { PlusIcon } from './Icons'

export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <button className="fab" onClick={onClick} aria-label="Buchung hinzufügen">
      <PlusIcon />
    </button>
  )
}
