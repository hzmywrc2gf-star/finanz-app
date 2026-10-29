import type { RawCell } from './types'
import { child, childrenNamed, parseXml } from './xml'
import type { XmlNode } from './xml'
import { readZip } from './zip'

const decoder = new TextDecoder()
const MAX_COLUMNS = 200
const MAX_ROWS = 100_000

export interface XlsxFile {
  sheetNames: string[]
  /** Reads one sheet as rows of cells (completely empty rows are dropped, rows are padded with null on the left). */
  readSheet(index: number): RawCell[][]
}

/** 'A' -> 0, 'Z' -> 25, 'AA' -> 26 */
export function columnIndex(letters: string): number {
  let n = 0
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function textOf(node: XmlNode): string {
  // rich text runs (<r><t>) and plain <t>; phonetic hints (<rPh>) are not part of the value
  let out = ''
  for (const c of node.children) {
    if (c.name === 't') out += c.text
    else if (c.name === 'r') out += textOf(c)
  }
  return out
}

function resolveTarget(target: string): string {
  if (target.startsWith('/')) return target.slice(1)
  const parts = ['xl']
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg && seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

function parseCell(c: XmlNode, shared: string[]): RawCell {
  const type = c.attrs.t ?? 'n'
  if (type === 'inlineStr') {
    const is = child(c, 'is')
    return is ? textOf(is) : null
  }
  const v = child(c, 'v')?.text
  if (v === undefined || v === '') return null
  switch (type) {
    case 's': {
      const s = shared[Number(v)]
      return s === undefined ? null : s
    }
    case 'str':
    case 'd':
    case 'e':
      return v
    case 'b':
      return v === '1'
    default: {
      const num = Number(v)
      return Number.isFinite(num) ? num : v
    }
  }
}

/** Opens an .xlsx file (Excel, Numbers, LibreOffice, Google Sheets). Reads all worksheets' names; cell data on demand. */
export async function openXlsx(bytes: Uint8Array): Promise<XlsxFile> {
  const files = await readZip(bytes, (n) => (n.startsWith('xl/') && n.endsWith('.xml')) || n.endsWith('.rels'))
  const workbookBytes = files.get('xl/workbook.xml')
  if (!workbookBytes) throw new Error('Das ist keine gültige Excel-Datei.')
  const workbook = parseXml(decoder.decode(workbookBytes))
  const relsBytes = files.get('xl/_rels/workbook.xml.rels')
  const rels = new Map<string, string>()
  if (relsBytes) {
    for (const r of childrenNamed(parseXml(decoder.decode(relsBytes)), 'Relationship')) rels.set(r.attrs.Id, r.attrs.Target)
  }
  const sheetsNode = child(workbook, 'sheets')
  const sheetDefs = (sheetsNode ? childrenNamed(sheetsNode, 'sheet') : []).map((s, i) => {
    const target = rels.get(s.attrs.id)
    return { name: s.attrs.name || `Tabelle ${i + 1}`, path: target ? resolveTarget(target) : `xl/worksheets/sheet${i + 1}.xml` }
  })
  if (sheetDefs.length === 0) throw new Error('Die Excel-Datei enthält keine Tabelle.')

  let shared: string[] | null = null
  const sharedStrings = (): string[] => {
    if (!shared) {
      const bytes = files.get('xl/sharedStrings.xml')
      shared = bytes ? childrenNamed(parseXml(decoder.decode(bytes)), 'si').map(textOf) : []
    }
    return shared
  }

  return {
    sheetNames: sheetDefs.map((s) => s.name),
    readSheet(index) {
      const def = sheetDefs[index]
      const sheetBytes = def && files.get(def.path)
      if (!sheetBytes) throw new Error('Die Tabelle konnte nicht gelesen werden.')
      const data = child(parseXml(decoder.decode(sheetBytes)), 'sheetData')
      const strings = sharedStrings()
      const rows: RawCell[][] = []
      for (const row of data ? childrenNamed(data, 'row') : []) {
        if (rows.length >= MAX_ROWS) break
        const cells: RawCell[] = []
        let col = 0
        for (const c of childrenNamed(row, 'c')) {
          const ref = /^([A-Za-z]+)\d*$/.exec(c.attrs.r ?? '')
          if (ref) col = columnIndex(ref[1])
          if (col < 0 || col >= MAX_COLUMNS) {
            col++
            continue
          }
          const value = parseCell(c, strings)
          while (cells.length < col) cells.push(null)
          cells[col] = value
          col++
        }
        if (cells.some((v) => v !== null && !(typeof v === 'string' && v.trim() === ''))) rows.push(cells)
      }
      return rows
    },
  }
}
