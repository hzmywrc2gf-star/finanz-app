import { useCallback, useEffect, useRef, useState } from 'react'
import type { Transaction } from './domain/types'
import { USE_HISTORY } from './lib/platform'
import { LockProvider } from './state/LockProvider'
import { NavStack } from './components/NavStack'
import type { StackAnim } from './components/NavStack'
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
import type { SettingsSub, SettingsView } from './pages/SettingsPage'
import { ProfilePage } from './pages/settings/ProfilePage'
import { BalancePage } from './pages/settings/BalancePage'
import { CategoriesPage } from './pages/settings/CategoriesPage'
import { SecurityPage } from './pages/settings/SecurityPage'
import { BackupPage } from './pages/settings/BackupPage'

type FormState = (AddPreset & { transaction?: Transaction }) | null
/** Sub-page of the active tab (`hub` = its overview); only the start and settings tabs have sub-pages. */
type SubView = StartView | SettingsView
type Nav = { view: SubView; anim: StackAnim }

const START_SUBS: readonly SubView[] = ['bookings', 'cash', 'contracts']
const SETTINGS_SUBS: readonly SubView[] = ['profile', 'balance', 'categories', 'security', 'backup']
const tabOf = (view: SubView): TabId => (SETTINGS_SUBS.includes(view) ? 'settings' : 'start')

/** The sub-page a history entry belongs to (entries pushed by `openSub` carry it in their state). */
const subOf = (state: unknown): SubView => {
  const sub = (state as { sub?: unknown } | null)?.sub
  return typeof sub === 'string' && (START_SUBS.includes(sub as SubView) || SETTINGS_SUBS.includes(sub as SubView))
    ? (sub as SubView)
    : 'hub'
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
  // The start and settings tabs have one level of sub-pages; tab changes always return to the overview.
  const [nav, setNav] = useState<Nav>({ view: 'hub', anim: 'instant' })
  const [form, setForm] = useState<FormState>(null)
  const closeForm = useCallback(() => setForm(null), [])
  // how the next popstate reaches the screen (our own back = animated, system back = the OS already animated)
  const pendingAnim = useRef<StackAnim>('instant')

  // Each opened sub-page is one history entry, so the system back button (Android, desktop) returns to the hub.
  // Not on iPhone/iPad: iOS would run its own back-swipe animation on top of ours (double animation), so
  // there the view is the only state and our own gesture and back button are the only ways back.
  const openSub = useCallback((view: SubView) => {
    if (USE_HISTORY) history.pushState({ sub: view }, '')
    setNav({ view, anim: 'animate' })
  }, [])
  const goBack = useCallback((anim: StackAnim) => {
    if (USE_HISTORY && subOf(history.state) !== 'hub') {
      pendingAnim.current = anim
      history.back() // popstate below updates the view
    } else {
      setNav({ view: 'hub', anim })
    }
  }, [])
  const changeTab = useCallback((next: TabId) => {
    setTab(next)
    setNav({ view: 'hub', anim: 'instant' })
    if (USE_HISTORY && subOf(history.state) !== 'hub') {
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
      if (view !== 'hub') setTab(tabOf(view))
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
          <NavStack<Exclude<StartView, 'hub'>>
            view={nav.view as StartView}
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
          <NavStack<SettingsSub>
            view={nav.view as SettingsView}
            anim={nav.anim}
            onBack={goBack}
            hub={
              <main className="app">
                <SettingsPage onNavigate={openSub} />
              </main>
            }
            renderSub={(view) => (
              <main className="app">
                {view === 'profile' && <ProfilePage onBack={back} />}
                {view === 'balance' && <BalancePage onBack={back} />}
                {view === 'categories' && <CategoriesPage onBack={back} />}
                {view === 'security' && <SecurityPage onBack={back} />}
                {view === 'backup' && <BackupPage onBack={back} />}
              </main>
            )}
          />
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
