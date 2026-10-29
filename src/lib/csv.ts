export type Delimiter = ';' | ',' | '\t'

export interface DecodedText {
  text: string
  encoding: 'utf-8' | 'utf-16' | 'windows-1252'
}

// Windows-1252 differs from Latin-1 in 0x80-0x9F. Browsers map them correctly; some runtimes (Node) return C1 controls.
const CP1252_HIGH = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ'

function decodeWindows1252(bytes: Uint8Array): string {
  return new TextDecoder('windows-1252').decode(bytes).replace(/[\u0080-\u009f]/g, (c) => CP1252_HIGH[c.charCodeAt(0) - 0x80])
}

/**
 * Bytes -> text. A BOM decides (UTF-8, UTF-16); otherwise strict UTF-8, and if the bytes are not valid UTF-8
 * (typical for Excel's "CSV" and German bank exports) Windows-1252.
 */
export function decodeText(bytes: Uint8Array): DecodedText {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { text: new TextDecoder('utf-16le').decode(bytes.subarray(2)), encoding: 'utf-16' }
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { text: new TextDecoder('utf-16be').decode(bytes.subarray(2)), encoding: 'utf-16' }
  }
  const start = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(start)), encoding: 'utf-8' }
  } catch {
    return { text: decodeWindows1252(bytes.subarray(start)), encoding: 'windows-1252' }
  }
}

/** Splits CSV text into rows of cells (quotes, "" escapes and line breaks inside quotes are handled). At most `limit` rows. */
export function parseCsv(text: string, delimiter: Delimiter, limit = Infinity): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let i = 0
  const n = text.length
  const endRow = () => {
    row.push(cell)
    cell = ''
    // drop completely empty lines
    if (row.length > 1 || row[0].trim() !== '') rows.push(row)
    row = []
  }
  while (i < n && rows.length < limit) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === delimiter) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      endRow()
    } else cell += ch
    i++
  }
  if (rows.length < limit && (cell !== '' || row.length > 0)) endRow()
  return rows
}

/** Picks the delimiter whose columns line up best over the first rows (ties: ; before TAB before ,). */
export function detectDelimiter(text: string): Delimiter {
  const sample = text.slice(0, 20_000)
  let best: Delimiter = ';'
  let bestScore = -1
  for (const d of [';', '\t', ','] as const) {
    const counts = parseCsv(sample, d, 50).map((r) => r.length)
    const freq = new Map<number, number>()
    for (const c of counts) if (c > 1) freq.set(c, (freq.get(c) ?? 0) + 1)
    let score = 0
    for (const [cols, rows] of freq) score = Math.max(score, cols * rows)
    if (score > bestScore) {
      best = d
      bestScore = score
    }
  }
  return best
}

export function parseCsvText(text: string): string[][] {
  return parseCsv(text, detectDelimiter(text))
}
