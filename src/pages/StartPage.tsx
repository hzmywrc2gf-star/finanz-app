import { memo, useState } from 'react'
import type { ReactNode } from 'react'
import { accountBalance, totalBalance } from '../domain/calc'
import { todayISO, formatDayMonth, formatShortDay } from '../domain/dates'
import { formatCents, formatPercent, formatSigned } from '../domain/money'
import { budgetAlerts } from '../domain/budget'
import { builtInId } from '../domain/defaults'
import type { PendingConfirmation } from '../domain/recurring'
import { monthlyEquivalent, pendingConfirmations, recurringTitle, upcoming } from '../domain/recurring'
import { haptic } from '../lib/haptics'
import { useFinance } from '../state/FinanceContext'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { TransactionForm } from '../components/TransactionForm'
import { CashIcon, ChevronRight, ContractIcon, ListIcon, PlusIcon } from '../components/Icons'

export type StartView = 'hub' | 'bookings' | 'cash' | 'contracts'

/** Salary is expected anyway, so it stays out of "Demnächst fällig". */
const HIDDEN_FROM_UPCOMING = [builtInId('income', 'Gehalt')]

function MenuRow({
  icon,
  tone,
  title,
  value,
  onClick,
}: {
  icon: ReactNode
  tone: 'blue' | 'green' | 'orange'
  title: string
  value: string
  onClick: () => void
}) {
  return (
    <li>
      <button className="row menu-row" onClick={onClick}>
        <span className={`menu-icon ${tone}`}>{icon}</span>
        <span className="row-main">
          <div className="row-title">{title}</div>
        </span>
        <span className="row-value num">{value}</span>
        <span className="chev">
          <ChevronRight />
        </span>
      </button>
    </li>
  )
}

export const StartPage = memo(function StartPage({
  onAdd,
  onOpenBudgets,
  onNavigate,
}: {
  onAdd: () => void
  onOpenBudgets: () => void
  onNavigate: (view: StartView) => void
}) {
  const { data, confirmOccurrence, skipOccurrence } = useFinance()
  const [booking, setBooking] = useState<PendingConfirmation | null>(null)
  const [skipping, setSkipping] = useState<PendingConfirmation | null>(null)
  const today = todayISO()
  const balance = accountBalance(data, 'konto')
  const cash = accountBalance(data, 'bargeld')
  const alerts = budgetAlerts(data, today)
  const due = upcoming(data, today, 7, { excludeCategoryIds: HIDDEN_FROM_UPCOMING })
  const contracts = monthlyEquivalent(data.recurring, today)
  // per contract only the oldest open occurrence is shown (it has to be handled first), plus a count of the rest
  const pending = pendingConfirmations(data, today)
  const toConfirm = pending
    .filter((p, i) => pending.findIndex((q) => q.rule.id === p.rule.id) === i)
    .map((p) => ({ ...p, more: pending.filter((q) => q.rule.id === p.rule.id).length - 1 }))

  return (
    <>
      <h1 className="page-title">Finanzklar</h1>
      <div className="card card-pad">
        <div className="balance-label">Kontostand</div>
        <div
          className={`balance-value num ${balance < 0 ? 'expense-text' : ''}`}
          data-testid="balance"
        >
          {formatCents(balance)}
        </div>
        <div className="balance-sub num" data-testid="balance-sub">
          Bargeld {formatCents(cash)} · Gesamt {formatCents(totalBalance(data))}
        </div>
      </div>
      {/* Inline instead of the floating Fab: the start page is short, a Fab would cover the last row. */}
      <button className="btn add-btn" onClick={onAdd} aria-label="Buchung hinzufügen">
        <PlusIcon /> Buchung hinzufügen
      </button>

      {toConfirm.length > 0 && (
        <>
          <div className="section-title">Zu bestätigen</div>
          <ul className="list card">
            {toConfirm.map(({ rule, date, more }) => {
              const title = recurringTitle(rule, data.categories)
              return (
                <li key={rule.id}>
                  <div className="row-static confirm-row">
                    <div className="confirm-info">
                      <span className="dot" style={{ background: rule.kind === 'income' ? 'var(--income)' : 'var(--expense)' }} />
                      <span className="row-main">
                        <div className="row-title">{title}</div>
                        <div className="row-sub">fällig {formatDayMonth(date)}</div>
                        {more > 0 && (
                          <div className="row-sub">+{more} {more === 1 ? 'weiterer offener Termin' : 'weitere offene Termine'}</div>
                        )}
                      </span>
                      <span className={`row-amount num ${rule.kind === 'income' ? 'income-text' : 'expense-text'}`}>
                        {formatSigned(rule.amountCents, rule.kind)}
                      </span>
                    </div>
                    <div className="confirm-actions">
                      <button className="primary" aria-label={`Buchen: ${title}`} onClick={() => setBooking({ rule, date })}>
                        Buchen
                      </button>
                      <button aria-label={`Überspringen: ${title}`} onClick={() => setSkipping({ rule, date })}>
                        Überspringen
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {alerts.length > 0 && (
        <>
          <div className="section-title">Budgets</div>
          <button className="list card budget-alert" onClick={onOpenBudgets}>
            {alerts.map((a) => (
              <span key={a.categoryId} className="row-static budget-alert-row">
                <span className="dot" style={{ background: `var(--${a.status})` }} />
                <span className="row-main">
                  <span className="row-title">{a.name}</span>
                  <span className="row-sub" style={{ color: `var(--${a.status}-text)` }}>
                    {a.status === 'over'
                      ? `${formatPercent(a.percent)} · ${formatCents(-a.remainingCents)} drüber`
                      : `${formatPercent(a.percent)} verbraucht · noch ${formatCents(a.remainingCents)}`}
                  </span>
                </span>
              </span>
            ))}
          </button>
        </>
      )}

      {due.length > 0 && (
        <>
          <div className="section-title">Demnächst fällig</div>
          <ul className="list card">
            {due.map(({ rule, date }) => (
              <li key={`${rule.id}:${date}`}>
                <div className="row-static">
                  <span
                    className="dot"
                    style={{ background: rule.kind === 'income' ? 'var(--income)' : 'var(--expense)' }}
                  />
                  <span className="row-main">
                    <div className="row-title">{recurringTitle(rule, data.categories)}</div>
                    <div className="row-sub">{formatShortDay(date)}</div>
                  </span>
                  <span className={`row-amount num ${rule.kind === 'income' ? 'income-text' : 'expense-text'}`}>
                    {formatSigned(rule.amountCents, rule.kind)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ul className="list card menu-list">
        <MenuRow
          icon={<ListIcon />}
          tone="blue"
          title="Alle Buchungen"
          value={String(data.transactions.length)}
          onClick={() => onNavigate('bookings')}
        />
        <MenuRow
          icon={<CashIcon />}
          tone="green"
          title="Bargeld"
          value={formatCents(cash)}
          onClick={() => onNavigate('cash')}
        />
        <MenuRow
          icon={<ContractIcon />}
          tone="orange"
          title="Verträge"
          value={
            contracts.activeCount === 0
              ? 'Keine'
              : contracts.monthlyCents === 0
                ? `${contracts.activeCount} ${contracts.activeCount === 1 ? 'Vertrag' : 'Verträge'}`
                : `${contracts.activeCount} · ${formatCents(contracts.monthlyCents)}/Monat`
          }
          onClick={() => onNavigate('contracts')}
        />
      </ul>
      {booking && (
        <TransactionForm
          key={`${booking.rule.id}:${booking.date}`}
          booking={{
            title: 'Termin buchen',
            submitLabel: 'Buchen',
            initial: {
              kind: booking.rule.kind,
              amountCents: booking.rule.amountCents,
              date: booking.date,
              categoryId: booking.rule.categoryId,
              note: booking.rule.note,
            },
            onSubmit: (input) => confirmOccurrence(booking.rule.id, booking.date, input),
          }}
          onClose={() => setBooking(null)}
        />
      )}
      {skipping && (
        <ConfirmDialog
          title="Termin überspringen?"
          message={`„${recurringTitle(skipping.rule, data.categories)}“ vom ${formatDayMonth(skipping.date)} wird nicht gebucht.`}
          confirmLabel="Überspringen"
          onCancel={() => setSkipping(null)}
          onConfirm={() => {
            haptic()
            skipOccurrence(skipping.rule.id, skipping.date)
            setSkipping(null)
          }}
        />
      )}
    </>
  )
})
