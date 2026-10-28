/** Greeting after unlocking with Face ID: always "Moin" (no time-of-day variants), with the name if there is one. */
export function greetingText(name?: string): string {
  const n = name?.trim()
  return n ? `Moin, ${n}` : 'Moin'
}
