/** A cell value read from a table file (.xlsx or .csv). */
export type RawCell = string | number | boolean | null

/** Cells for the .xlsx writer. Money is integer cents, dates are 'YYYY-MM-DD'. */
export type WriteCell =
  | null
  | { t: 'text'; v: string; bold?: boolean }
  | { t: 'date'; v: string }
  | { t: 'money'; v: number; bold?: boolean }

export interface WriteSheet {
  name: string
  /** Column widths in characters. */
  widths: number[]
  rows: WriteCell[][]
  /** Freeze the first row (header). */
  freezeHeader?: boolean
  /** Add a filter over the used range of the first `filterRows` rows (header + data). */
  filterRows?: number
}
