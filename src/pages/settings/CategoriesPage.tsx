import { memo, useState } from 'react'
import type { Kind } from '../../domain/types'
import { useFinance } from '../../state/FinanceContext'
import { CategoryManager } from '../../components/CategoryManager'
import { SaveError } from '../../components/SaveError'
import { SegmentedControl } from '../../components/SegmentedControl'
import { SubPageHeader } from '../../components/SubPageHeader'

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'expense', label: 'Ausgaben' },
  { value: 'income', label: 'Einnahmen' },
]

/** Settings > Kategorien: switch between expense and income categories, then manage that list. */
export const CategoriesPage = memo(function CategoriesPage({ onBack }: { onBack: () => void }) {
  const { saveError } = useFinance()
  const [kind, setKind] = useState<Kind>('expense')
  return (
    <>
      <SubPageHeader title="Kategorien" parent="Einstellungen" onBack={onBack} />
      <SaveError message={saveError} />
      <div className="card" style={{ padding: 12, marginBottom: 16 }}>
        <SegmentedControl label="Art der Kategorien" options={KIND_OPTIONS} value={kind} onChange={setKind} />
      </div>
      <CategoryManager kind={kind} />
    </>
  )
})
