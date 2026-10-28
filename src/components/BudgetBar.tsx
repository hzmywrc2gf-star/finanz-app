import type { BudgetStatus } from '../domain/budget'
import { formatPercent } from '../domain/money'

/** Budget bar, tone-in-tone gradient per status (CSS `.bar-fill[data-status]`). With a label it is a progressbar, otherwise decoration. */
export function BudgetBar({ percent, status, label }: { percent: number; status: BudgetStatus; label?: string }) {
  const fill = <div className="bar-fill" data-status={status} style={{ width: `${Math.min(percent, 100)}%` }} />
  if (!label) {
    return (
      <div className="bar-track budget-track" data-status={status} aria-hidden="true">
        {fill}
      </div>
    )
  }
  return (
    <div
      className="bar-track budget-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-valuetext={`${formatPercent(percent)} verbraucht`}
      data-status={status}
    >
      {fill}
    </div>
  )
}
