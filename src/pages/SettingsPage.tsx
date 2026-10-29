import { memo } from 'react'
import type { ReactNode } from 'react'
import { formatCents } from '../domain/money'
import { useFinance } from '../state/FinanceContext'
import { useLock } from '../state/LockContext'
import { ArchiveIcon, ChevronRight, PersonIcon, ShieldIcon, TableIcon, TagIcon, WalletIcon } from '../components/Icons'
import { SaveError } from '../components/SaveError'
import { useThemePref } from '../hooks/useThemePref'
import { THEME_OPTIONS } from '../lib/theme'

/** The sub-pages of the settings tab (`hub` is the overview). */
export type SettingsView = 'hub' | 'profile' | 'balance' | 'categories' | 'excel' | 'security' | 'backup'
export type SettingsSub = Exclude<SettingsView, 'hub'>

const AUTO_LOCK_SHORT = { 0: 'Sofort', 1: '1 Min.', 5: '5 Min.', 15: '15 Min.' } as const

function Row({ icon, tone, label, value, onClick }: { icon: ReactNode; tone: string; label: string; value: string; onClick: () => void }) {
  return (
    <li>
      <button className="row menu-row" onClick={onClick}>
        <span className={`menu-icon ${tone}`}>{icon}</span>
        <span className="row-main row-title">{label}</span>
        <span className="row-value">{value}</span>
        <span className="chev">
          <ChevronRight />
        </span>
      </button>
    </li>
  )
}

/** Settings overview (iOS style): one row per topic with its current value, each opens a sub-page. */
export const SettingsPage = memo(function SettingsPage({ onNavigate }: { onNavigate: (view: SettingsSub) => void }) {
  const { data, saveError } = useFinance()
  const lock = useLock()
  const [theme] = useThemePref()

  const themeLabel = THEME_OPTIONS.find((o) => o.value === theme)?.label ?? 'Automatisch'
  const name = data.settings.displayName
  const security = `${lock.hasPasskey ? 'Face ID' : 'Passwort'} · ${AUTO_LOCK_SHORT[lock.autoLockMinutes]}`

  return (
    <>
      <h1 className="page-title">Einstellungen</h1>
      <SaveError message={saveError} />
      <ul className="list card settings-list">
        <Row icon={<PersonIcon />} tone="blue" label="Profil" value={name ? `${name} · ${themeLabel}` : themeLabel} onClick={() => onNavigate('profile')} />
        <Row icon={<WalletIcon />} tone="green" label="Startguthaben" value={formatCents(data.settings.startBalanceCents)} onClick={() => onNavigate('balance')} />
        <Row icon={<TagIcon />} tone="orange" label="Kategorien" value={`${data.categories.length} Kategorien`} onClick={() => onNavigate('categories')} />
        <Row icon={<TableIcon />} tone="green" label="Excel & CSV" value="" onClick={() => onNavigate('excel')} />
        <Row icon={<ShieldIcon />} tone="blue" label="Sicherheit" value={security} onClick={() => onNavigate('security')} />
        <Row icon={<ArchiveIcon />} tone="green" label="Datensicherung" value="" onClick={() => onNavigate('backup')} />
      </ul>
    </>
  )
})
