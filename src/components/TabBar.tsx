import type { ReactNode } from 'react'
import { HomeIcon, SettingsIcon, WeekIcon } from './Icons'

export type TabId = 'start' | 'week' | 'settings'

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'start', label: 'Start', icon: <HomeIcon /> },
  { id: 'week', label: 'Woche', icon: <WeekIcon /> },
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
