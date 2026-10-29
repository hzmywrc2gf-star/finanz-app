import { LargeTitleHeader } from './LargeTitleHeader'

/** iOS-style navigation bar for the sub-pages: back button (labelled with the parent page) plus large title; see LargeTitleHeader. */
export function SubPageHeader({ title, onBack, parent = 'Start' }: { title: string; onBack: () => void; parent?: string }) {
  return <LargeTitleHeader title={title} onBack={onBack} parent={parent} />
}
