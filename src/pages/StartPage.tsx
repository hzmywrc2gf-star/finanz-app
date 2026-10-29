import { memo, useRef, useState } from 'react'
import { accountBalance, totalBalance } from '../domain/calc'
import { todayISO, formatDayMonth, formatShortDay, monthLabel } from '../domain/dates'
import { formatCents, formatPercent, formatSigned } from '../domain/money'
import { budgetAlerts } from '../domain/budget'
import { builtInId } from '../domain/defaults'
import { dueInvoices, dueText, invoiceTitle, isOverdue, openInvoicesTotal } from '../domain/invoices'
import type { PendingConfirmation } from '../domain/recurring'
import { monthlyEquivalent, pendingConfirmations, recurringTitle, upcoming } from '../domain/recurring'
import { heroShift } from '../domain/scrollFx'
import { useScrollEffect } from '../hooks/useScrollEffect'
import { haptic } from '../lib/haptics'
import { reducedMotion } from '../lib/motion'
import { useFinance } from '../state/FinanceContext'
import { useLock } from '../state/LockContext'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { TransactionForm } from '../components/TransactionForm'
import { BalanceChart } from '../components/BalanceChart'
import { BudgetBar } from '../components/BudgetBar'
import { InvoiceFlowDialogs, InvoiceListSheet } from '../components/InvoiceSheets'
import type { InvoiceFlow } from '../components/InvoiceSheets'
import { CashIcon, ChevronRight, ContractIcon, ListIcon, LockIcon, PlusIcon, ReceiptIcon, RefreshIcon } from '../components/Icons'
import { LargeTitleHeader } from '../components/LargeTitleHeader'

export type StartView = 'hub' | 'bookings' | 'cash' | 'contracts'

/** Salary is expected anyway, so it stays out of "Demnächst fällig". */
const HIDDEN_FROM_UPCOMING = [builtInId('income', 'Gehalt')]

export const StartPage = memo(function StartPage({
  onAdd,
  onOpenBudgets,
  onNavigate,
}: {
  onAdd: () => void
  onOpenBudgets: () => void
  onNavigate: (view: StartView) => void
}) {
  const { data, confirmOccurrence, skipOccurrence, snoozeInvoice } = useFinance()
  const { lockNow } = useLock()
  const [booking, setBooking] = useState<PendingConfirmation | null>(null)
  const [skipping, setSkipping] = useState<PendingConfirmation | null>(null)
  const [invoiceList, setInvoiceList] = useState(false)
  const [invoiceFlow, setInvoiceFlow] = useState<InvoiceFlow | null>(null)
  // the lighter corner of the hero gradient slides away while the page scrolls (cheap: one background-position per frame)
  const heroRef = useRef<HTMLElement>(null)
  useScrollEffect(heroRef, (y) => {
    if (heroRef.current && !reducedMotion()) heroRef.current.style.backgroundPosition = `0 ${heroShift(y)}%`
  })
  const today = todayISO()
  const balance = accountBalance(data, 'konto')
  const cash = accountBalance(data, 'bargeld')
  const alerts = budgetAlerts(data, today)
  const due = upcoming(data, today, 7, { excludeCategoryIds: HIDDEN_FROM_UPCOMING })
  const contracts = monthlyEquivalent(data.recurring, today)
  // per contract only the oldest open occurrence is shown (it has to be handled first), plus a count of the rest
  const invoicesDue = dueInvoices(data, today)
  const openTotal = openInvoicesTotal(data)
  const pending = pendingConfirmations(data, today)
  const toConfirm = pending
    .filter((p, i) => pending.findIndex((q) => q.rule.id === p.rule.id) === i)
    .map((p) => ({ ...p, more: pending.filter((q) => q.rule.id === p.rule.id).length - 1 }))

  return (
    <>
      <LargeTitleHeader title="Finanzklar" action={{ label: 'Jetzt sperren', icon: <LockIcon />, onClick: lockNow }} />
      <section ref={heroRef} className="hero tint-sky" aria-label="Kontostand">
        <div className="balance-label">Kontostand</div>
        <div
          className={`balance-value num ${balance < 0 ? 'expense-text' : ''}`}
          data-testid="balance"
        >
          {formatCents(balance)}
        </div>
        <div className="chip-row" data-testid="balance-sub">
          <span className="chip num">
            Bargeld <b>{formatCents(cash)}</b>
          </span>
          <span className="chip num">
            Gesamt <b>{formatCents(totalBalance(data))}</b>
          </span>
        </div>
        {data.invoices.length > 0 && (
          <div className="chip-row">
            <button className="chip chip-btn num" data-testid="open-invoices" onClick={() => setInvoiceList(true)}>
              Offene Rechnungen <b>{formatCents(openTotal)}</b>
            </button>
          </div>
        )}
        <BalanceChart data={data} today={today} />
      </section>
      {/* Inline instead of the floating Fab: the start page is short, a Fab would cover the last row. */}
      <button className="btn add-btn" onClick={onAdd} aria-label="Buchung hinzufügen">
        <PlusIcon /> Buchung hinzufügen
      </button>

      {toConfirm.length > 0 && (
        <section className="pcard tint-lav" aria-label="Zu bestätigen">
          <div className="pcard-head">
            <h2>Zu bestätigen</h2>
          </div>
          {toConfirm.map(({ rule, date, more }) => {
            const title = recurringTitle(rule, data.categories)
            return (
              <div key={rule.id} className="confirm-item">
                <div className="prow">
                  <span className="pico">
                    <RefreshIcon />
                  </span>
                  <span className="pmain">
                    <div className="t">{title}</div>
                    <div className="s">fällig {formatDayMonth(date)}</div>
                    {more > 0 && (
                      <div className="s">+{more} {more === 1 ? 'weiterer offener Termin' : 'weitere offene Termine'}</div>
                    )}
                  </span>
                  <span className={`pamt num ${rule.kind === 'income' ? 'income-text' : 'expense-text'}`}>
                    {formatSigned(rule.amountCents, rule.kind)}
                  </span>
                </div>
                <div className="pactions">
                  <button className="pbtn" aria-label={`Buchen: ${title}`} onClick={() => setBooking({ rule, date })}>
                    Buchen
                  </button>
                  <button className="pbtn soft" aria-label={`Überspringen: ${title}`} onClick={() => setSkipping({ rule, date })}>
                    Überspringen
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {invoicesDue.length > 0 && (
        <section className="pcard tint-mist" aria-label="Offene Rechnungen">
          <div className="pcard-head">
            <h2>Offene Rechnungen</h2>
          </div>
          {invoicesDue.map((inv) => {
            const title = invoiceTitle(inv, data.categories)
            return (
              <div key={inv.id} className="confirm-item">
                <div className="prow">
                  <span className="pico">
                    <ReceiptIcon />
                  </span>
                  <span className="pmain">
                    <div className="t">{title}</div>
                    <div className={isOverdue(inv, today) ? 's overdue-text' : 's'}>{dueText(inv, today)}</div>
                  </span>
                  <span className="pamt num expense-text">{`\u2212${formatCents(inv.amountCents)}`}</span>
                </div>
                <div className="pactions">
                  <button className="pbtn" aria-label={`Bezahlt: ${title}`} onClick={() => setInvoiceFlow({ type: 'pay', invoice: inv })}>
                    Bezahlt
                  </button>
                  <button className="pbtn soft" aria-label={`Später: ${title}`} onClick={() => snoozeInvoice(inv.id)}>
                    Später
                  </button>
                </div>
                <div className="pactions inv-actions-2">
                  <button className="pbtn soft" aria-label={`Betrag ändern: ${title}`} onClick={() => setInvoiceFlow({ type: 'amount', invoice: inv })}>
                    Betrag ändern
                  </button>
                  <button className="pbtn soft" aria-label={`Zurückgeschickt: ${title}`} onClick={() => setInvoiceFlow({ type: 'return', invoice: inv })}>
                    Zurückgeschickt
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {alerts.length > 0 && (
        <button className="card pcard budgets budget-alert" onClick={onOpenBudgets}>
          <span className="pcard-head">
            <h2>Budgets</h2>
            <span className="muted" style={{ fontSize: 13 }}>{monthLabel(today).split(' ')[0]}</span>
          </span>
          {alerts.map((a) => (
            <span key={a.categoryId} className="budget-mini" data-status={a.status}>
              <span className="budget-top">
                <span>
                  <span className="t" style={{ display: 'block', fontSize: 17, fontWeight: 500 }}>{a.name}</span>
                  <span className={`s c-${a.status}`} style={{ display: 'block', fontSize: 13, lineHeight: '18px' }}>
                    {a.status === 'over' ? `${formatCents(-a.remainingCents)} drüber` : `noch ${formatCents(a.remainingCents)}`}
                  </span>
                </span>
                <span className={`pct num c-${a.status}`} style={{ fontSize: 22, fontWeight: 700 }}>{formatPercent(a.percent)}</span>
              </span>
              <BudgetBar percent={a.percent} status={a.status} />
            </span>
          ))}
        </button>
      )}

      {due.length > 0 && (
        <section className="card pcard plain" aria-label="Demnächst fällig">
          <div className="pcard-head">
            <h2>Demnächst fällig</h2>
          </div>
          {due.map(({ rule, date }) => (
            <div key={`${rule.id}:${date}`} className="prow">
              <span className="pico">
                <RefreshIcon />
              </span>
              <span className="pmain">
                <div className="t">{recurringTitle(rule, data.categories)}</div>
                <div className="s">{formatShortDay(date)}</div>
              </span>
              <span className={`pamt num ${rule.kind === 'income' ? 'income-text' : 'expense-text'}`}>
                {formatSigned(rule.amountCents, rule.kind)}
              </span>
            </div>
          ))}
        </section>
      )}

      <div className="tiles">
        <button className="tile tint-lav" onClick={() => onNavigate('bookings')}>
          <span className="pico">
            <ListIcon />
          </span>
          <span>
            <div className="l">Alle Buchungen</div>
            <div className="v num">{data.transactions.length}</div>
          </span>
        </button>
        <button className="tile tint-sand" onClick={() => onNavigate('cash')}>
          <span className="pico">
            <CashIcon />
          </span>
          <span>
            <div className="l">Bargeld</div>
            <div className="v num">{formatCents(cash)}</div>
          </span>
        </button>
        <button className="tile wide tint-sky" onClick={() => onNavigate('contracts')}>
          <span className="pico">
            <ContractIcon />
          </span>
          <span className="pmain">
            <div className="l">Verträge</div>
            <div className="v num">
              {contracts.activeCount === 0
                ? 'Keine'
                : contracts.monthlyCents === 0
                  ? `${contracts.activeCount} ${contracts.activeCount === 1 ? 'Vertrag' : 'Verträge'}`
                  : `${contracts.activeCount} · ${formatCents(contracts.monthlyCents)}/Monat`}
            </div>
          </span>
          <span className="chev">
            <ChevronRight />
          </span>
        </button>
      </div>
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
      {invoiceList && <InvoiceListSheet onClose={() => setInvoiceList(false)} />}
      <InvoiceFlowDialogs flow={invoiceFlow} onClose={() => setInvoiceFlow(null)} />
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
