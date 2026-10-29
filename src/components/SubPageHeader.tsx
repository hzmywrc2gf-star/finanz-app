import { ChevronLeft } from './Icons'

/** iOS-style navigation bar for the sub-pages: back button (labelled with the parent page) plus large title. */
export function SubPageHeader({ title, onBack, parent = 'Start' }: { title: string; onBack: () => void; parent?: string }) {
  return (
    <>
      <div className="subnav">
        <button className="back-btn" onClick={onBack} aria-label="Zurück">
          <ChevronLeft />
          <span aria-hidden="true">{parent}</span>
        </button>
      </div>
      <h1 className="page-title sub-title">{title}</h1>
    </>
  )
}
