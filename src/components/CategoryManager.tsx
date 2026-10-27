import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Category, Kind } from '../domain/types'
import { countRecurringInCategory, countTransactionsInCategory } from '../state/actions'
import { useFinance } from '../state/FinanceContext'
import { ConfirmDialog } from './ConfirmDialog'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Unbekannter Fehler.'
}

function CategorySection({ kind, title }: { kind: Kind; title: string }) {
  const { data, addCategory, renameCategory, deleteCategory } = useFinance()
  const cats = data.categories.filter((c) => c.kind === kind)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [toDelete, setToDelete] = useState<Category | null>(null)
  const [error, setError] = useState<string | null>(null)

  function add(e: FormEvent) {
    e.preventDefault()
    try {
      addCategory(kind, newName)
      setNewName('')
      setError(null)
    } catch (err) {
      setError(errMsg(err))
    }
  }

  function saveRename(e: FormEvent) {
    e.preventDefault()
    if (!editId) return
    try {
      renameCategory(editId, editName)
      setEditId(null)
      setError(null)
    } catch (err) {
      setError(errMsg(err))
    }
  }

  const deleteCount = toDelete ? countTransactionsInCategory(data, toDelete.id) : 0
  const ruleCount = toDelete ? countRecurringInCategory(data, toDelete.id) : 0

  return (
    <>
      <div className="section-title">{title}</div>
      <ul className="list card">
        {cats.map((c) => (
          <li key={c.id}>
            {editId === c.id ? (
              <form className="inline-form" onSubmit={saveRename}>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  aria-label="Neuer Name"
                  autoFocus
                />
                <button type="submit">Sichern</button>
                <button type="button" onClick={() => { setEditId(null); setError(null) }}>
                  Abbrechen
                </button>
              </form>
            ) : (
              <div className="row-static">
                <span className="row-main row-title">{c.name}</span>
                {c.builtIn ? (
                  <span className="muted" style={{ fontSize: 13 }}>Fest</span>
                ) : (
                  <span className="cat-actions">
                    <button
                      onClick={() => { setEditId(c.id); setEditName(c.name); setError(null) }}
                      aria-label={`${c.name} umbenennen`}
                    >
                      Ändern
                    </button>
                    <button className="danger" onClick={() => setToDelete(c)} aria-label={`${c.name} löschen`}>
                      Löschen
                    </button>
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
        <li>
          <form className="inline-form" onSubmit={add} style={{ borderTop: '0.5px solid var(--sep)' }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Neue Kategorie"
              aria-label={kind === 'expense' ? 'Neue Ausgaben-Kategorie' : 'Neue Einnahmen-Kategorie'}
              maxLength={40}
            />
            <button type="submit">Hinzufügen</button>
          </form>
        </li>
      </ul>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {toDelete && (
        <ConfirmDialog
          title={`„${toDelete.name}“ löschen?`}
          message={
            deleteCount + ruleCount > 0
              ? `${[
                  deleteCount > 0 && `${deleteCount} ${deleteCount === 1 ? 'Buchung' : 'Buchungen'}`,
                  ruleCount > 0 && `${ruleCount} wiederkehrende ${ruleCount === 1 ? 'Buchung' : 'Buchungen'}`,
                ]
                  .filter(Boolean)
                  .join(' und ')} ${deleteCount + ruleCount === 1 ? 'wird' : 'werden'} der Kategorie „Sonstiges“ zugeordnet.`
              : 'Die Kategorie wird entfernt.'
          }
          confirmLabel="Löschen"
          danger
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            try {
              deleteCategory(toDelete.id)
              setError(null)
            } catch (err) {
              setError(errMsg(err))
            }
            setToDelete(null)
          }}
        />
      )}
    </>
  )
}

export function CategoryManager() {
  return (
    <>
      <CategorySection kind="expense" title="Kategorien · Ausgaben" />
      <CategorySection kind="income" title="Kategorien · Einnahmen" />
    </>
  )
}
