import { describe, expect, it } from 'vitest'
import { greetingText } from './greeting'
import { passwordStrength } from './password'

describe('greetingText', () => {
  it('is always Moin, with the name when there is one', () => {
    expect(greetingText('Felix')).toBe('Moin, Felix')
    expect(greetingText('  Felix ')).toBe('Moin, Felix')
    expect(greetingText('')).toBe('Moin')
    expect(greetingText('   ')).toBe('Moin')
    expect(greetingText(undefined)).toBe('Moin')
  })
})

describe('passwordStrength', () => {
  it('rates by length and character classes', () => {
    expect(passwordStrength('abcdefghij')).toBe('weak')
    expect(passwordStrength('abcdefghijkl')).toBe('weak') // one class only
    expect(passwordStrength('Abcdefgh1234')).toBe('medium')
    expect(passwordStrength('Abcdefghijklmnop1')).toBe('strong')
    expect(passwordStrength('correct horse battery')).toBe('medium') // lower + space
    expect(passwordStrength('Short1!')).toBe('weak')
  })
})
