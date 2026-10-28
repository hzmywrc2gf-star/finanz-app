import type { ReactNode } from 'react'
import { BudgetIcon, HomeIcon, MonthIcon, SettingsIcon } from './Icons'

export type TabId = 'start' | 'month' | 'budgets' | 'settings'

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'start', label: 'Start', icon: <HomeIcon /> },
  { id: 'month', label: 'Monat', icon: <MonthIcon /> },
  { id: 'budgets', label: 'Budgets', icon: <BudgetIcon /> },
  { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
]

export function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      <div className="tabbar-inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="tab"
            aria-current={active === t.id ? 'page' : undefined}
            onClick={() => onChange(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
