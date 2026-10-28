import { ChevronLeft } from './Icons'

/** iOS-style navigation bar for the sub-pages of the start tab: back button plus large title. */
export function SubPageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <>
      <div className="subnav">
        <button className="back-btn" onClick={onBack} aria-label="Zurück">
          <ChevronLeft />
          <span aria-hidden="true">Start</span>
        </button>
      </div>
      <h1 className="page-title sub-title">{title}</h1>
    </>
  )
}
