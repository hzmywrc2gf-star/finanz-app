import type { ReactNode } from 'react'
import { accountBalance, totalBalance } from '../domain/calc'
import { todayISO, formatShortDay } from '../domain/dates'
import { formatCents, formatPercent, formatSigned } from '../domain/money'
import { budgetAlerts } from '../domain/budget'
import { builtInId } from '../domain/defaults'
import { monthlyEquivalent, recurringTitle, upcoming } from '../domain/recurring'
import { useFinance } from '../state/FinanceContext'
import { Fab } from '../components/Fab'
import { CashIcon, ChevronRight, ContractIcon, ListIcon } from '../components/Icons'

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

export function StartPage({
  onAdd,
  onOpenBudgets,
  onNavigate,
}: {
  onAdd: () => void
  onOpenBudgets: () => void
  onNavigate: (view: StartView) => void
}) {
  const { data } = useFinance()
  const today = todayISO()
  const balance = accountBalance(data, 'konto')
  const cash = accountBalance(data, 'bargeld')
  const alerts = budgetAlerts(data, today)
  const due = upcoming(data, today, 7, { excludeCategoryIds: HIDDEN_FROM_UPCOMING })
  const contracts = monthlyEquivalent(data.recurring, today)

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
          value={contracts.activeCount === 0 ? 'Keine' : `${contracts.activeCount} · ${formatCents(contracts.monthlyCents)}/Monat`}
          onClick={() => onNavigate('contracts')}
        />
      </ul>
      <Fab onClick={onAdd} />
    </>
  )
}
