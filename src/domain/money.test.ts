import { describe, expect, it } from 'vitest'
import { centsToInputString, formatCents, formatPercent, formatSigned, parseEuroInput } from './money'

const nb = ' '

describe('formatCents', () => {
  it('formats values', () => {
    expect(formatCents(0)).toBe(`0,00${nb}€`)
    expect(formatCents(5)).toBe(`0,05${nb}€`)
    expect(formatCents(123456)).toBe(`1.234,56${nb}€`)
    expect(formatCents(-123456)).toBe(`-1.234,56${nb}€`)
    expect(formatCents(100000000)).toBe(`1.000.000,00${nb}€`)
  })
  it('formats signed list amounts and percent', () => {
    expect(formatSigned(1250, 'income')).toBe(`+12,50${nb}€`)
    expect(formatSigned(1250, 'expense')).toBe(`−12,50${nb}€`)
    expect(formatPercent(66.7)).toBe(`66,7${nb}%`)
  })
})

describe('parseEuroInput', () => {
  it('parses common formats', () => {
    expect(parseEuroInput('0,29')).toBe(29)
    expect(parseEuroInput('1.234,56')).toBe(123456)
    expect(parseEuroInput('12.5')).toBe(1250)
    expect(parseEuroInput('12')).toBe(1200)
    expect(parseEuroInput('12,5')).toBe(1250)
    expect(parseEuroInput(' 12,50 € ')).toBe(1250)
    expect(parseEuroInput('1.234')).toBe(123400)
    expect(parseEuroInput('19,99')).toBe(1999)
    expect(parseEuroInput('1.005,10')).toBe(100510)
  })
  it('rejects invalid input', () => {
    expect(parseEuroInput('abc')).toBeNull()
    expect(parseEuroInput('')).toBeNull()
    expect(parseEuroInput('-5')).toBeNull()
    expect(parseEuroInput('1,234')).toBeNull()
    expect(parseEuroInput('1,2,3')).toBeNull()
    expect(parseEuroInput('12,345')).toBeNull()
    expect(parseEuroInput('1.2.3')).toBeNull()
    expect(parseEuroInput(',')).toBeNull()
  })
  it('allows negative values only on request', () => {
    expect(parseEuroInput('-5,50', { allowNegative: true })).toBe(-550)
    expect(parseEuroInput('0')).toBe(0)
  })
})

describe('centsToInputString', () => {
  it('formats for input', () => {
    expect(centsToInputString(1250)).toBe('12,50')
    expect(centsToInputString(5)).toBe('0,05')
    expect(centsToInputString(-123456)).toBe('-1234,56')
  })
})
