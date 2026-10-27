import { useCallback, useState } from 'react'
import type { Transaction } from './domain/types'
import { FinanceProvider } from './state/FinanceContext'
import { TabBar } from './components/TabBar'
import type { TabId } from './components/TabBar'
import { TransactionForm } from './components/TransactionForm'
import { StartPage } from './pages/StartPage'
import { WeekPage } from './pages/WeekPage'
import { SettingsPage } from './pages/SettingsPage'

type FormState = { transaction?: Transaction; defaultDate?: string } | null

export default function App() {
  const [tab, setTab] = useState<TabId>('start')
  const [form, setForm] = useState<FormState>(null)
  const closeForm = useCallback(() => setForm(null), [])

  return (
    <FinanceProvider>
      <main className="app">
        {tab === 'start' && (
          <StartPage onAdd={() => setForm({})} onEdit={(transaction) => setForm({ transaction })} />
        )}
        {tab === 'week' && (
          <WeekPage
            onAdd={(defaultDate) => setForm({ defaultDate })}
            onEdit={(transaction) => setForm({ transaction })}
          />
        )}
        {tab === 'settings' && <SettingsPage />}
      </main>
      <TabBar active={tab} onChange={setTab} />
      {form && (
        <TransactionForm
          key={form.transaction?.id ?? 'new'}
          transaction={form.transaction}
          defaultDate={form.defaultDate}
          onClose={closeForm}
        />
      )}
    </FinanceProvider>
  )
}
