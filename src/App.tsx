import { useCallback, useEffect, useRef, useState } from 'react'
import type { Transaction } from './domain/types'
import { LockProvider } from './state/LockProvider'
import { StartStack } from './components/StartStack'
import type { StackAnim } from './components/StartStack'
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
type StartNav = { view: StartView; anim: StackAnim }

/** The sub-page a history entry belongs to (entries pushed by `openSub` carry it in their state). */
const subOf = (state: unknown): StartView => {
  const sub = (state as { sub?: unknown } | null)?.sub
  return sub === 'bookings' || sub === 'cash' || sub === 'contracts' ? sub : 'hub'
}

export default function App() {
  return (
    <LockProvider>
      <AppContent />
    </LockProvider>
  )
}

function AppContent() {
  const [tab, setTab] = useState<TabId>('start')
  // The start tab has one level of sub-pages; tab changes always return to its root.
  const [nav, setNav] = useState<StartNav>({ view: 'hub', anim: 'instant' })
  const [form, setForm] = useState<FormState>(null)
  const closeForm = useCallback(() => setForm(null), [])
  // how the next popstate reaches the screen (our own back = animated, system back = the OS already animated)
  const pendingAnim = useRef<StackAnim>('instant')

  // Each opened sub-page is one history entry, so the system back button (Android, desktop) returns to the hub.
  const openSub = useCallback((view: StartView) => {
    history.pushState({ sub: view }, '')
    setNav({ view, anim: 'animate' })
  }, [])
  const goBack = useCallback((anim: StackAnim) => {
    if (subOf(history.state) !== 'hub') {
      pendingAnim.current = anim
      history.back() // popstate below updates the view
    } else {
      setNav({ view: 'hub', anim })
    }
  }, [])
  const changeTab = useCallback((next: TabId) => {
    setTab(next)
    setNav({ view: 'hub', anim: 'instant' })
    if (subOf(history.state) !== 'hub') {
      pendingAnim.current = 'instant'
      history.back() // drop the sub-page entry so no stray back step remains
    }
  }, [])

  useEffect(() => {
    // after a reload the app starts on the hub, so a leftover sub-page entry would only confuse back/forward
    if (subOf(history.state) !== 'hub') history.replaceState(null, '')
    const onPop = (e: PopStateEvent) => {
      const view = subOf(e.state)
      const anim = view === 'hub' ? pendingAnim.current : 'instant'
      pendingAnim.current = 'instant'
      if (view !== 'hub') setTab('start')
      setNav({ view, anim })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // every navigation starts at the top of the new page
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab, nav.view])

  // stable, so the memoized pages and their rows are skipped when only the sheet opens or closes
  const edit = useCallback((transaction: Transaction) => setForm({ transaction }), [])
  const back = useCallback(() => goBack('animate'), [goBack])
  const addNew = useCallback(() => setForm({}), [])
  const addOn = useCallback((defaultDate: string) => setForm({ defaultDate }), [])
  const openBudgets = useCallback(() => changeTab('budgets'), [changeTab])

  return (
    <>
      <div key={tab} className="tab-fade">
        {tab === 'start' && (
          <StartStack
            view={nav.view}
            anim={nav.anim}
            onBack={goBack}
            hub={
              <main className="app">
                <StartPage onAdd={addNew} onOpenBudgets={openBudgets} onNavigate={openSub} />
              </main>
            }
            renderSub={(view) => (
              <main className="app">
                {view === 'bookings' && <BookingsPage onBack={back} onAdd={addNew} onEdit={edit} />}
                {view === 'cash' && <CashPage onBack={back} onAdd={setForm} onEdit={edit} />}
                {view === 'contracts' && <ContractsPage onBack={back} />}
              </main>
            )}
          />
        )}
        {tab === 'month' && (
          <main className="app">
            <MonthPage onAdd={addOn} onEdit={edit} />
          </main>
        )}
        {tab === 'budgets' && (
          <main className="app">
            <BudgetPage />
          </main>
        )}
        {tab === 'settings' && (
          <main className="app">
            <SettingsPage />
          </main>
        )}
      </div>
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
    </>
  )
}
