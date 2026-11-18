import { startTransition, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Transaction } from './domain/types'
import { todayISO } from './domain/dates'
import type { DaySegment, FinanceEntry } from './domain/calendar'
import { USE_HISTORY } from './lib/platform'
import { LockProvider } from './state/LockProvider'
import { NavStack } from './components/NavStack'
import type { StackAnim } from './components/NavStack'
import { TabBar } from './components/TabBar'
import type { TabId } from './components/TabBar'
import { EventSheet } from './components/EventSheet'
import type { EventSheetProps } from './components/EventSheet'
import { FinanceEntrySheet } from './components/FinanceEntrySheet'
import { TransactionForm } from './components/TransactionForm'
import type { AddPreset } from './components/TransactionForm'
import { StartPage } from './pages/StartPage'
import type { StartView } from './pages/StartPage'
import { BookingsPage } from './pages/BookingsPage'
import { CashPage } from './pages/CashPage'
import { ContractsPage } from './pages/ContractsPage'
import { MonthPage } from './pages/MonthPage'
import { BudgetPage } from './pages/BudgetPage'
import { CalendarPage } from './pages/CalendarPage'
import { DayPage } from './pages/DayPage'
import { TodoPage } from './pages/TodoPage'
import { TodoListPage } from './pages/TodoListPage'
import { TodoDetailSheet } from './components/TodoDetailSheet'
import type { CalendarMode } from './components/CalendarModeSwitch'
import type { TodoViewId } from './domain/todos'
import { SettingsPage } from './pages/SettingsPage'
import type { SettingsSub, SettingsView } from './pages/SettingsPage'
import { ProfilePage } from './pages/settings/ProfilePage'
import { BalancePage } from './pages/settings/BalancePage'
import { CategoriesPage } from './pages/settings/CategoriesPage'
import { ExcelPage } from './pages/settings/ExcelPage'
import { SecurityPage } from './pages/settings/SecurityPage'
import { BackupPage } from './pages/settings/BackupPage'

type FormState = (AddPreset & { transaction?: Transaction }) | null
/** Sub-page of the active tab (`hub` = its overview); only the start and settings tabs have sub-pages. */
type SubView = StartView | SettingsView | CalendarView
/** The calendar tab's sub-pages: the day view (calendar mode) and one to-do list (to-do mode). */
type CalendarView = 'hub' | 'day' | 'todo'
type Nav = { view: SubView; anim: StackAnim }

const START_SUBS: readonly SubView[] = ['bookings', 'cash', 'contracts']
const SETTINGS_SUBS: readonly SubView[] = ['profile', 'balance', 'categories', 'excel', 'security', 'backup']
const CALENDAR_SUBS: readonly SubView[] = ['day', 'todo']
const tabOf = (view: SubView): TabId => (SETTINGS_SUBS.includes(view) ? 'settings' : CALENDAR_SUBS.includes(view) ? 'calendar' : 'start')

/** The sub-page a history entry belongs to (entries pushed by `openSub` carry it in their state). */
const subOf = (state: unknown): SubView => {
  const sub = (state as { sub?: unknown } | null)?.sub
  return typeof sub === 'string' && (START_SUBS.includes(sub as SubView) || SETTINGS_SUBS.includes(sub as SubView) || CALENDAR_SUBS.includes(sub as SubView))
    ? (sub as SubView)
    : 'hub'
}

/** The sheet's props without the key used to restart it for another event. */
const eventFormProps = ({ key: _key, ...props }: EventSheetProps & { key: string }): EventSheetProps => props

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
  // calendar: the selected day (shared by the month and the day view) and the sheets opened from either
  const [calDay, setCalDay] = useState(() => todayISO())
  const [eventForm, setEventForm] = useState<(EventSheetProps & { key: string }) | null>(null)
  const [financeEntry, setFinanceEntry] = useState<FinanceEntry | null>(null)
  // calendar: while two fingers pinch, the page they lead to is rendered ahead of time (hidden), so the zoom only shows it
  const [calPrerender, setCalPrerender] = useState<'day' | 'hub' | null>(null)
  // calendar tab: "Kalender | To-do" (kept for the session, also across tab changes), the open to-do list and task details
  const [calMode, setCalMode] = useState<CalendarMode>('calendar')
  const [todoView, setTodoView] = useState<TodoViewId>('myday')
  const [todoDetail, setTodoDetail] = useState<string | null>(null)
  const closeForm = useCallback(() => setForm(null), [])
  // how the next popstate reaches the screen (our own back = animated, system back = the OS already animated)
  const pendingAnim = useRef<StackAnim>('instant')

  // Each opened sub-page is one history entry, so the system back button (Android, desktop) returns to the hub.
  // Not on iPhone/iPad: iOS would run its own back-swipe animation on top of ours (double animation), so
  // there the view is the only state and our own gesture and back button are the only ways back.
  const openSub = useCallback((view: SubView, anim: StackAnim = 'animate') => {
    if (USE_HISTORY) history.pushState({ sub: view }, '')
    setNav({ view, anim })
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
    setCalPrerender(null)
    if (next === 'calendar') setCalDay(todayISO())
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

  // every navigation starts at the top of the new page (in the commit, so a page that scrolls itself, the day view, comes after);
  // an animated pop leaves the sub-page where it is while it leaves, NavStack scrolls the hub to the top afterwards
  useLayoutEffect(() => {
    if (nav.view === 'hub' && (nav.anim === 'animate' || nav.anim === 'zoom')) return
    window.scrollTo(0, 0)
  }, [tab, nav.view, nav.anim])

  // stable, so the memoized pages and their rows are skipped when only the sheet opens or closes
  const edit = useCallback((transaction: Transaction) => setForm({ transaction }), [])
  const back = useCallback(() => goBack('animate'), [goBack])
  const addNew = useCallback(() => setForm({}), [])
  const addOn = useCallback((defaultDate: string) => setForm({ defaultDate }), [])
  const openBudgets = useCallback(() => changeTab('budgets'), [changeTab])
  const openDay = useCallback(
    (how?: 'zoom') => {
      setCalPrerender(null)
      openSub('day', how === 'zoom' ? 'zoom' : 'animate')
    },
    [openSub],
  )
  const zoomBack = useCallback(() => {
    setCalPrerender(null)
    goBack('zoom')
  }, [goBack])
  // low priority: the hidden page renders in slices between the frames of the pinch
  const prerenderDay = useCallback((on: boolean) => startTransition(() => setCalPrerender(on ? 'day' : null)), [])
  const prerenderMonth = useCallback((on: boolean) => startTransition(() => setCalPrerender(on ? 'hub' : null)), [])
  /** The day cell the day view zooms out of / back into. */
  const dayCell = useCallback((hub: HTMLElement) => hub.querySelector<HTMLElement>('.cal-cell[data-selected="true"]'), [])
  const newEvent = useCallback((day: string, hour?: number) => setEventForm({ key: `new-${day}-${hour}`, day, hour, onClose: () => setEventForm(null) }), [])
  const editEvent = useCallback(
    (seg: DaySegment) => setEventForm({ key: seg.occ.key, event: seg.occ.event, occurrenceDate: seg.occ.date, onClose: () => setEventForm(null) }),
    [],
  )
  const closeFinance = useCallback(() => setFinanceEntry(null), [])
  const changeCalMode = useCallback((mode: CalendarMode) => {
    setCalPrerender(null)
    setCalMode(mode)
    window.scrollTo(0, 0)
  }, [])
  const openTodoList = useCallback(
    (view: TodoViewId) => {
      setTodoView(view)
      openSub('todo')
    },
    [openSub],
  )
  const openTodo = useCallback((id: string) => setTodoDetail(id), [])
  const closeTodo = useCallback(() => setTodoDetail(null), [])
  // start page card „Heute“ → calendar tab, to-do mode, „Mein Tag“
  const openMyDay = useCallback(() => {
    changeTab('calendar')
    setCalMode('todo')
    setTodoView('myday')
    setTimeout(() => openSub('todo'), 80)
  }, [changeTab, openSub])
  const openContracts = useCallback(() => {
    setFinanceEntry(null)
    changeTab('start')
    // let the tab change (and a possible history step back) settle before pushing the sub-page
    setTimeout(() => openSub('contracts'), 80)
  }, [changeTab, openSub])

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
                <StartPage onAdd={addNew} onOpenBudgets={openBudgets} onNavigate={openSub} onOpenTodo={openTodo} onOpenMyDay={openMyDay} />
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
        {tab === 'calendar' && (
          <NavStack<'day' | 'todo'>
            view={nav.view as CalendarView}
            anim={nav.anim}
            onBack={goBack}
            zoomAnchor={dayCell}
            prerender={calPrerender}
            hub={
              calMode === 'calendar' ? (
                <main className="app app-cal">
                  <CalendarPage
                    day={calDay}
                    onDay={setCalDay}
                    onOpenDay={openDay}
                    onPinch={prerenderDay}
                    onNewEvent={newEvent}
                    onEditEvent={editEvent}
                    onOpenFinance={setFinanceEntry}
                    onOpenTodo={openTodo}
                    onMode={changeCalMode}
                  />
                </main>
              ) : (
                <main className="app">
                  <TodoPage onMode={changeCalMode} onOpenList={openTodoList} />
                </main>
              )
            }
            renderSub={(view) =>
              view === 'todo' ? (
                <main className="app app-todo">
                  <TodoListPage key={todoView} view={todoView} onBack={back} onOpenTodo={openTodo} />
                </main>
              ) : (
                <main className="app app-cal">
                  <DayPage
                    day={calDay}
                    onDay={setCalDay}
                    onBack={back}
                    onPinchBack={zoomBack}
                    onPinch={prerenderMonth}
                    onNewEvent={newEvent}
                    onEditEvent={editEvent}
                    onOpenFinance={setFinanceEntry}
                    onOpenTodo={openTodo}
                  />
                </main>
              )
            }
          />
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
                {view === 'excel' && <ExcelPage onBack={back} />}
                {view === 'security' && <SecurityPage onBack={back} />}
                {view === 'backup' && <BackupPage onBack={back} />}
              </main>
            )}
          />
        )}
      </div>
      <TabBar active={tab} onChange={changeTab} />
      {eventForm && <EventSheet key={eventForm.key} {...eventFormProps(eventForm)} />}
      {todoDetail && <TodoDetailSheet key={todoDetail} id={todoDetail} onClose={closeTodo} />}
      {financeEntry && <FinanceEntrySheet entry={financeEntry} onClose={closeFinance} onOpenContracts={openContracts} />}
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
