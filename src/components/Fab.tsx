import { PlusIcon } from './Icons'

export function Fab({ onClick, label = 'Buchung hinzufügen', className }: { onClick: () => void; label?: string; className?: string }) {
  return (
    <button className={className ? `fab ${className}` : 'fab'} onClick={onClick} aria-label={label}>
      <PlusIcon />
    </button>
  )
}
