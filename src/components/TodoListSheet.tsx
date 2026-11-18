import { useState } from 'react'
import type { FormEvent } from 'react'
import type { TodoColor, TodoIcon, TodoList } from '../domain/types'
import { TODO_COLORS, TODO_COLOR_NAMES, TODO_ICONS, TODO_ICON_NAMES, TODO_LIMITS } from '../domain/todos'
import { haptic } from '../lib/haptics'
import { useFinance } from '../state/FinanceContext'
import { ConfirmDialog } from './ConfirmDialog'
import { Sheet } from './Sheet'
import { ListGlyph, ListTile } from './TodoParts'

/**
 * "Neue Liste" / "Liste bearbeiten": name, colour (a fixed set of calm tones) and symbol, with a preview of the tile.
 * Editing also offers "Liste löschen" (asks first; the tasks go with it, undo in the toast).
 */
export function TodoListSheet({
  list,
  onClose,
  onCreated,
  onDeleted,
}: {
  list?: TodoList
  onClose: () => void
  onCreated?: (id: string) => void
  onDeleted?: () => void
}) {
  const { data, addList, updateList, deleteList } = useFinance()
  const [name, setName] = useState(list?.name ?? '')
  const [color, setColor] = useState<TodoColor>(list?.color ?? 'lav')
  const [icon, setIcon] = useState<TodoIcon>(list?.icon ?? 'list')
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const taskCount = list ? data.todos.filter((t) => t.listId === list.id).length : 0

  function submit(e: FormEvent) {
    e.preventDefault()
    try {
      if (list) {
        updateList(list.id, { name, color, icon })
        onClose()
      } else {
        const id = addList({ name, color, icon })
        haptic()
        onClose()
        onCreated?.(id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  return (
    <>
      <Sheet title={list ? 'Liste bearbeiten' : 'Neue Liste'} onClose={onClose}>
        <form onSubmit={submit} noValidate>
          <div className="todo-list-preview" aria-hidden="true">
            <ListTile color={color}>
              <ListGlyph icon={icon} size={26} />
            </ListTile>
            <span className="todo-list-preview-name" data-color={color}>{name.trim() || 'Neue Liste'}</span>
          </div>
          <div className="card">
            <div className="field">
              <label htmlFor="todo-list-name">Name</label>
              <input
                id="todo-list-name"
                placeholder="z. B. Einkaufsliste"
                autoComplete="off"
                maxLength={TODO_LIMITS.listName}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
              />
            </div>
          </div>
          <div className="section-title" id="todo-color-label">Farbe</div>
          <div className="card todo-swatches" role="radiogroup" aria-labelledby="todo-color-label">
            {TODO_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={TODO_COLOR_NAMES[c]}
                className="todo-swatch"
                data-color={c}
                onClick={() => setColor(c)}
              >
                <span />
              </button>
            ))}
          </div>
          <div className="section-title" id="todo-icon-label">Symbol</div>
          <div className="card todo-icons" role="radiogroup" aria-labelledby="todo-icon-label">
            {TODO_ICONS.map((i) => (
              <button key={i} type="button" role="radio" aria-checked={icon === i} aria-label={TODO_ICON_NAMES[i]} className="todo-icon-choice" onClick={() => setIcon(i)}>
                <ListGlyph icon={i} size={22} />
              </button>
            ))}
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="btn" type="submit">
            {list ? 'Sichern' : 'Liste erstellen'}
          </button>
          {list && (
            <button type="button" className="btn danger" onClick={() => setConfirming(true)}>
              Liste löschen
            </button>
          )}
        </form>
      </Sheet>
      {confirming && list && (
        <ConfirmDialog
          title="Liste löschen?"
          message={`„${list.name}“ wird mit ${taskCount === 1 ? '1 Aufgabe' : `${taskCount} Aufgaben`} gelöscht. Direkt danach kannst du das noch rückgängig machen.`}
          confirmLabel="Löschen"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            haptic()
            deleteList(list.id)
            setConfirming(false)
            onClose()
            onDeleted?.()
          }}
        />
      )}
    </>
  )
}
