import { memo } from 'react'
import { useFinance } from '../../state/FinanceContext'
import { AppLockSettings } from '../../components/AppLockSettings'
import { SaveError } from '../../components/SaveError'
import { SubPageHeader } from '../../components/SubPageHeader'

/** Settings > Sicherheit: auto-lock, Face ID, password, recovery key, lock now. */
export const SecurityPage = memo(function SecurityPage({ onBack }: { onBack: () => void }) {
  const { saveError } = useFinance()
  return (
    <>
      <SubPageHeader title="Sicherheit" parent="Einstellungen" onBack={onBack} />
      <SaveError message={saveError} />
      <AppLockSettings />
    </>
  )
})
