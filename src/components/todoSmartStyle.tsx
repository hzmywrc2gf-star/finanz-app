import type { ReactNode } from 'react'
import type { TodoColor } from '../domain/types'
import type { SmartListId } from '../domain/todos'
import { PlannedIcon, StarIcon, SunIcon, TasksIcon } from './Icons'

/** Colour and symbol of the smart lists (own lists carry theirs). */
export const SMART_STYLE: Record<SmartListId, { color: TodoColor; glyph: (size?: number) => ReactNode }> = {
  myday: { color: 'amber', glyph: (s) => <SunIcon size={s} /> },
  important: { color: 'violet', glyph: (s) => <StarIcon size={s} /> },
  planned: { color: 'sky', glyph: (s) => <PlannedIcon size={s} /> },
  tasks: { color: 'slate', glyph: (s) => <TasksIcon size={s} /> },
}
