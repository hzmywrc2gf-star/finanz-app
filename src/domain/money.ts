const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const percentFmt = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** 66.7 -> "66,7 %" */
export function formatPercent(p: number): string {
  return `${percentFmt.format(p)}\u00a0%`
}

/** 123456 -> "1.234,56 €" (non-breaking space before €), negative "-1.234,56 €". */
export function formatCents(cents: number): string {
  return eur.format(cents / 100).replace('−', '-')
}

/** Absolute amount with explicit sign for lists: "+12,50 €" / "−12,50 €". */
export function formatSigned(cents: number, kind: 'income' | 'expense'): string {
  const body = formatCents(Math.abs(cents))
  return (kind === 'income' ? '+' : '−') + body
}

/** 1250 -> "12,50" (for prefilling inputs, no grouping). */
export function centsToInputString(cents: number): string {
  const neg = cents < 0
  const abs = Math.abs(cents)
  const euros = Math.floor(abs / 100)
  const rest = abs % 100
  return `${neg ? '-' : ''}${euros},${String(rest).padStart(2, '0')}`
}

const MAX_CENTS = 100_000_000_000_00 // 100 billion euros, keeps everything within safe integers

/**
 * Parses German-style (and tolerant English-style) money input to cents using integer math.
 * "12,50" "1.234,56" "12.5" "12" "1.234" (=1234 €) are accepted. Returns null for invalid input.
 * Zero is returned as 0; callers decide whether that is acceptable.
 */
export function parseEuroInput(
  input: string,
  options: { allowNegative?: boolean } = {},
): number | null {
  let s = input.replace(/[\s €]/g, '')
  let negative = false
  if (options.allowNegative && /^[-−]/.test(s)) {
    negative = true
    s = s.slice(1)
  }
  if (!s || !/^[0-9.,]+$/.test(s)) return null

  let intPart: string
  let fracPart = ''
  const commaCount = (s.match(/,/g) ?? []).length
  if (commaCount > 1) return null

  if (commaCount === 1) {
    const [left, right] = s.split(',')
    // dots in the integer part must be proper thousands separators
    if (left.includes('.') && !/^\d{1,3}(\.\d{3})+$/.test(left)) return null
    intPart = left.replace(/\./g, '')
    fracPart = right
  } else if (s.includes('.')) {
    const dots = (s.match(/\./g) ?? []).length
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
      intPart = s.replace(/\./g, '') // thousands grouping
    } else if (dots === 1) {
      const [left, right] = s.split('.')
      intPart = left
      fracPart = right // "12.5", ".5"
    } else {
      return null
    }
  } else {
    intPart = s
  }

  if (intPart === '' && fracPart === '') return null
  if (intPart === '') intPart = '0'
  if (!/^\d+$/.test(intPart) || intPart.length > 12) return null
  if (fracPart !== '' && !/^\d{1,2}$/.test(fracPart)) return null

  const cents = Number(intPart) * 100 + Number(fracPart.padEnd(2, '0') || '0')
  if (cents > MAX_CENTS) return null
  return negative ? -cents : cents
}
