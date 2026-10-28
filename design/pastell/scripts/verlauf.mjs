// Monatsenden-Kontostand (nur Konto) aus dem Seed: Startsaldo + Einnahmen − Ausgaben − Abhebungen + Einzahlungen bis Monatsende.
import { seedData } from './seed.mjs'
const d = seedData()
const sign = (t) => (t.kind === 'income' ? 1 : -1) * t.amountCents
const bal = (upTo) => d.settings.startBalanceCents
  + d.transactions.filter((t) => t.account === 'konto' && t.date <= upTo).reduce((a, t) => a + sign(t), 0)
  + d.transfers.filter((x) => x.date <= upTo).reduce((a, x) => a + (x.direction === 'withdrawal' ? -x.amountCents : x.amountCents), 0)
const out = []
for (const [m, last] of [['Mai','2026-05-31'],['Jun','2026-06-30'],['Jul','2026-07-31'],['Aug','2026-08-31'],['Sep','2026-09-30'],['Okt (heute 28.10.)','2026-10-28']]) out.push({ m, cents: bal(last) })
console.log(JSON.stringify(out))
const cash = d.settings.startCashCents + d.transfers.reduce((a, x) => a + (x.direction === 'withdrawal' ? x.amountCents : -x.amountCents), 0)
console.log('Bargeld', cash)
