import { useCallback, useEffect, useState } from 'react'
import type { Transaction } from './domain/types'
import { FinanceProvider } from './state/FinanceContext'
import { TabBar } from './components/TabBar'
import type { TabId } from './components/TabBar'
import { TransactionForm } from './components/TransactionForm'
import type { AddPreset } from './components/TransactionForm'
import { StartPage } from './pages/StartPage'
import type { StartView } from './pages/StartPage'
import { BookingsPage } from './pages/BookingsPage'
import { CashPage } from './pages/CashPage'
import { ContractsPage } from './pages/ContractsPage'
import { MonthPage } from './pages/MonthPage'
import { BudgetPage } from './pages/BudgetPage'
import { SettingsPage } from './pages/SettingsPage'

type FormState = (AddPreset & { transaction?: Transaction }) | null

export default function App() {
  const [tab, setTab] = useState<TabId>('start')
  // The start tab has one level of sub-pages; tab changes always return to its root.
  const [startView, setStartView] = useState<StartView>('hub')
  const [form, setForm] = useState<FormState>(null)
  const closeForm = useCallback(() => setForm(null), [])

  const changeTab = useCallback((next: TabId) => {
    setTab(next)
    setStartView('hub')
  }, [])
  const backToStart = useCallback(() => setStartView('hub'), [])

  // every navigation starts at the top of the new page
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab, startView])

  const edit = (transaction: Transaction) => setForm({ transaction })

  return (
    <FinanceProvider>
      <main className="app">
        {tab === 'start' && startView === 'hub' && (
          <StartPage onAdd={() => setForm({})} onOpenBudgets={() => changeTab('budgets')} onNavigate={setStartView} />
        )}
        {tab === 'start' && startView === 'bookings' && (
          <BookingsPage onBack={backToStart} onAdd={() => setForm({})} onEdit={edit} />
        )}
        {tab === 'start' && startView === 'cash' && <CashPage onBack={backToStart} onAdd={setForm} onEdit={edit} />}
        {tab === 'start' && startView === 'contracts' && <ContractsPage onBack={backToStart} />}
        {tab === 'month' && <MonthPage onAdd={(defaultDate) => setForm({ defaultDate })} onEdit={edit} />}
        {tab === 'budgets' && <BudgetPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>
      <TabBar active={tab} onChange={changeTab} />
      {form && (
        <TransactionForm
          key={form.transaction?.id ?? 'new'}
          transaction={form.transaction}
          defaultDate={form.defaultDate}
          defaultKind={form.defaultKind}
          defaultAccount={form.defaultAccount}
          onClose={closeForm}
        />
      )}
    </FinanceProvider>
  )
}
