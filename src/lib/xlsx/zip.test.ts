/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { crc32, readZip, writeZip, zipNames } from './zip'

const enc = new TextEncoder()

describe('zip', () => {
  it('crc32 matches the known check value', () => {
    expect(crc32(enc.encode('123456789'))).toBe(0xcbf43926)
    expect(crc32(new Uint8Array(0))).toBe(0)
  })

  it('round-trips stored entries', async () => {
    const zip = writeZip([
      { name: 'a.txt', data: enc.encode('Hallo Welt') },
      { name: 'dir/ä.xml', data: enc.encode('<x/>') },
      { name: 'leer', data: new Uint8Array(0) },
    ])
    expect(zipNames(zip)).toEqual(['a.txt', 'dir/ä.xml', 'leer'])
    const files = await readZip(zip)
    expect(new TextDecoder().decode(files.get('a.txt'))).toBe('Hallo Welt')
    expect(new TextDecoder().decode(files.get('dir/ä.xml'))).toBe('<x/>')
    expect(files.get('leer')?.length).toBe(0)
  })

  it('reads a deflate-compressed archive made by another tool', async () => {
    const { readFileSync } = await import('node:fs')
    const files = await readZip(new Uint8Array(readFileSync(new URL('./__fixtures__/haushalt.xlsx', import.meta.url))))
    expect(files.has('xl/workbook.xml')).toBe(true)
    expect(new TextDecoder().decode(files.get('xl/workbook.xml'))).toContain('Haushalt')
  })

  it('rejects garbage and damaged data', async () => {
    await expect(readZip(enc.encode('das ist kein zip'))).rejects.toThrow('keine gültige Excel-Datei')
    const zip = writeZip([{ name: 'a.txt', data: enc.encode('Hallo Welt') }])
    zip[zip.indexOf(72)] ^= 1 // flip a data byte: CRC no longer matches
    await expect(readZip(zip)).rejects.toThrow('beschädigt')
  })
})
