export const MIN_PASSWORD_LENGTH = 10

export type PasswordStrength = 'weak' | 'medium' | 'strong'

export const STRENGTH_LABEL: Record<PasswordStrength, string> = { weak: 'Schwach', medium: 'Mittel', strong: 'Stark' }

/** Simple hint by length and character classes (lower, upper, digit, other); not a guarantee, just guidance. */
export function passwordStrength(password: string): PasswordStrength {
  const classes = [/[a-zß-ÿ]/, /[A-ZÀ-Þ]/, /[0-9]/, /[^A-Za-zÀ-ÿ0-9]/].filter((re) => re.test(password)).length
  if (password.length < 12 || classes < 2) return 'weak'
  if (password.length >= 16 && classes >= 3) return 'strong'
  return 'medium'
}

/** German error for the "new password" forms, or null when the pair is acceptable. */
export function validateNewPassword(password: string, repeat: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Das Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`
  if (password !== repeat) return 'Die Passwörter stimmen nicht überein.'
  return null
}
