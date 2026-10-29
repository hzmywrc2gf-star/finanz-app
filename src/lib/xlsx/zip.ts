/** Minimal ZIP reader/writer (enough for .xlsx): writes STORE entries, reads STORE and deflate (via DecompressionStream). */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export interface ZipEntry {
  name: string
  data: Uint8Array
}

const encoder = new TextEncoder()
/** 1980-01-01 00:00 in DOS format: a fixed stamp keeps the output reproducible. */
const DOS_DATE = 0x0021
const DOS_TIME = 0

/** Builds a ZIP archive with uncompressed (STORE) entries. */
export function writeZip(entries: ZipEntry[]): Uint8Array {
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const local = new Uint8Array(30 + name.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true) // version needed
    lv.setUint16(6, 0x0800, true) // flags: UTF-8 names
    lv.setUint16(8, 0, true) // method: stored
    lv.setUint16(10, DOS_TIME, true)
    lv.setUint16(12, DOS_DATE, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, entry.data.length, true)
    lv.setUint32(22, entry.data.length, true)
    lv.setUint16(26, name.length, true)
    lv.setUint16(28, 0, true)
    local.set(name, 30)
    parts.push(local, entry.data)

    const head = new Uint8Array(46 + name.length)
    const cv = new DataView(head.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true) // version made by
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, DOS_TIME, true)
    cv.setUint16(14, DOS_DATE, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, entry.data.length, true)
    cv.setUint32(24, entry.data.length, true)
    cv.setUint16(28, name.length, true)
    cv.setUint32(42, offset, true)
    head.set(name, 46)
    central.push(head)
    offset += local.length + entry.data.length
  }
  const centralSize = central.reduce((n, p) => n + p.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)
  const all = [...parts, ...central, end]
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0))
  let pos = 0
  for (const p of all) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}

/** Upper bound for one unpacked entry (protects against zip bombs). */
export const MAX_ENTRY_BYTES = 100 * 1024 * 1024

const CORRUPT = 'Die Datei ist beschädigt.'

async function inflateRaw(data: Uint8Array, expected: number): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') throw new Error('Dieser Browser kann komprimierte Excel-Dateien nicht öffnen.')
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > MAX_ENTRY_BYTES || total > expected) {
      await reader.cancel()
      throw new Error(CORRUPT)
    }
    chunks.push(value)
  }
  if (total !== expected) throw new Error(CORRUPT)
  const out = new Uint8Array(total)
  let pos = 0
  for (const c of chunks) {
    out.set(c, pos)
    pos += c.length
  }
  return out
}

interface CentralEntry {
  name: string
  method: number
  crc: number
  compressedSize: number
  size: number
  localOffset: number
}

function readCentral(bytes: Uint8Array): CentralEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Das ist keine gültige Excel-Datei.')
  const count = view.getUint16(eocd + 10, true)
  let pos = view.getUint32(eocd + 16, true)
  if (count === 0xffff || pos === 0xffffffff) throw new Error('Diese Datei ist zu groß (ZIP64 wird nicht unterstützt).')
  const decoder = new TextDecoder()
  const list: CentralEntry[] = []
  for (let i = 0; i < count; i++) {
    if (pos + 46 > bytes.length || view.getUint32(pos, true) !== 0x02014b50) throw new Error(CORRUPT)
    const nameLen = view.getUint16(pos + 28, true)
    const extraLen = view.getUint16(pos + 30, true)
    const commentLen = view.getUint16(pos + 32, true)
    if (pos + 46 + nameLen > bytes.length) throw new Error(CORRUPT)
    list.push({
      name: decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLen)),
      method: view.getUint16(pos + 10, true),
      crc: view.getUint32(pos + 16, true),
      compressedSize: view.getUint32(pos + 20, true),
      size: view.getUint32(pos + 24, true),
      localOffset: view.getUint32(pos + 42, true),
    })
    pos += 46 + nameLen + extraLen + commentLen
  }
  return list
}

/** Lists the entry names without unpacking anything. */
export function zipNames(bytes: Uint8Array): string[] {
  return readCentral(bytes).map((e) => e.name)
}

/** Unpacks the named entries (missing ones are left out of the result). Verifies size and CRC32. */
export async function readZip(bytes: Uint8Array, wanted?: (name: string) => boolean): Promise<Map<string, Uint8Array>> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const out = new Map<string, Uint8Array>()
  for (const entry of readCentral(bytes)) {
    if (entry.name.endsWith('/') || (wanted && !wanted(entry.name))) continue
    if (entry.size > MAX_ENTRY_BYTES) throw new Error('Die Datei ist zu groß.')
    const at = entry.localOffset
    if (at + 30 > bytes.length || view.getUint32(at, true) !== 0x04034b50) throw new Error(CORRUPT)
    const start = at + 30 + view.getUint16(at + 26, true) + view.getUint16(at + 28, true)
    const raw = bytes.subarray(start, start + entry.compressedSize)
    if (raw.length !== entry.compressedSize) throw new Error(CORRUPT)
    let data: Uint8Array
    if (entry.method === 0) data = raw
    else if (entry.method === 8) data = await inflateRaw(raw, entry.size)
    else throw new Error('Diese Excel-Datei verwendet ein nicht unterstütztes Format.')
    if (data.length !== entry.size || crc32(data) !== entry.crc) throw new Error(CORRUPT)
    out.set(entry.name, data)
  }
  return out
}
