// Realistische Testdaten (AppData v6), "heute" = 2026-10-28.
import { createRequire } from 'node:module'
const cents = (e) => Math.round(e * 100)
export function seedData() {
  const cat = (k, n) => `${k}-${n.toLowerCase()}`
  const cats = [['expense', ['Lebensmittel', 'Fixkosten', 'Mobilität', 'Freizeit', 'Kleidung', 'Gesundheit', 'Sonstiges']], ['income', ['Gehalt', 'Nebeneinkünfte', 'Sonstiges']]]
    .flatMap(([k, ns]) => ns.map((n) => ({ id: cat(k, n), name: n, kind: k, builtIn: n === 'Sonstiges' })))
  const budget = { Lebensmittel: 300, Fixkosten: 1000, Mobilität: 120, Freizeit: 60, Gesundheit: 40 }
  for (const c of cats) if (c.kind === 'expense' && budget[c.name]) c.monthlyBudgetCents = cents(budget[c.name])
  let n = 0
  const tx = []
  const add = (kind, amount, date, category, note, recurringId) =>
    tx.push({ id: `t${++n}`, kind, amountCents: cents(amount), date, categoryId: cat(kind, category), note, account: 'konto', createdAt: Date.parse(date + 'T12:00:00') + n, ...(recurringId ? { recurringId } : {}) })
  const hist = { 5: [262.4, 51.2, 74.0, 0, 0], 6: [281.7, 68.9, 96.5, 79.9, 0], 7: [247.3, 120.0, 61.0, 0, 35.5], 8: [296.8, 44.9, 83.2, 0, 0], 9: [271.1, 87.3, 102.4, 129.0, 22.4] }
  for (const m of [5, 6, 7, 8, 9]) {
    const mm = String(m).padStart(2, '0')
    const [lm, fz, mo, kl, ge] = hist[m]
    add('income', 2850, `2026-${mm}-01`, 'Gehalt', 'Gehalt', 'r-gehalt')
    if (m === 7) add('income', 180, `2026-${mm}-12`, 'Nebeneinkünfte', 'Nachhilfe')
    add('expense', 860, `2026-${mm}-02`, 'Fixkosten', 'Miete', 'r-miete')
    add('expense', lm, `2026-${mm}-09`, 'Lebensmittel', 'Einkäufe')
    add('expense', fz, `2026-${mm}-17`, 'Freizeit', 'Freizeit')
    add('expense', mo, `2026-${mm}-21`, 'Mobilität', 'Mobilität')
    if (kl) add('expense', kl, `2026-${mm}-24`, 'Kleidung', 'Kleidung')
    if (ge) add('expense', ge, `2026-${mm}-26`, 'Gesundheit', 'Apotheke')
  }
  add('income', 2850, '2026-10-01', 'Gehalt', 'Gehalt Oktober', 'r-gehalt')
  add('expense', 860, '2026-10-02', 'Fixkosten', 'Miete', 'r-miete')
  add('expense', 64.35, '2026-10-06', 'Lebensmittel', 'Wocheneinkauf')
  add('expense', 82.1, '2026-10-13', 'Lebensmittel', 'Wocheneinkauf')
  add('expense', 58.9, '2026-10-20', 'Lebensmittel', 'Wocheneinkauf')
  add('expense', 71.2, '2026-10-27', 'Lebensmittel', 'Wocheneinkauf')
  add('expense', 45.0, '2026-10-08', 'Mobilität', 'Tanken')
  add('expense', 38.5, '2026-10-22', 'Mobilität', 'Deutschlandticket-Rest')
  add('expense', 23.5, '2026-10-11', 'Freizeit', 'Kino')
  add('expense', 34.9, '2026-10-18', 'Freizeit', 'Restaurant')
  add('expense', 24.0, '2026-10-25', 'Freizeit', 'Konzert')
  add('expense', 12.95, '2026-10-16', 'Gesundheit', 'Apotheke')
  add('expense', 19.99, '2026-10-01', 'Fixkosten', 'Handyvertrag', 'r-handy')
  const rule = (id, kind, amount, category, note, day, start, through, autoBook) =>
    ({ id, kind, amountCents: cents(amount), categoryId: cat(kind, category), note, interval: 'monthly', dayOfMonth: day, startDate: start, bookedThrough: through, autoBook })
  return {
    version: 6,
    settings: { startBalanceCents: cents(2400), startCashCents: cents(50), displayName: 'Felix' },
    categories: cats,
    transactions: tx,
    recurring: [
      rule('r-gehalt', 'income', 2850, 'Gehalt', 'Gehalt', 1, '2026-01-01', '2026-10-28', true),
      rule('r-miete', 'expense', 860, 'Fixkosten', 'Miete', 2, '2026-01-02', '2026-10-28', true),
      rule('r-handy', 'expense', 19.99, 'Fixkosten', 'Handyvertrag', 30, '2026-01-30', '2026-09-30', true),
      rule('r-strom', 'expense', 62, 'Fixkosten', 'Strom', 1, '2026-01-01', '2026-10-01', true),
      rule('r-gym', 'expense', 29.9, 'Freizeit', 'Fitnessstudio', 15, '2026-01-15', '2026-09-15', false),
    ],
    transfers: [{ id: 'x1', direction: 'withdrawal', amountCents: cents(100), date: '2026-10-05', note: 'Bargeld', createdAt: Date.parse('2026-10-05T12:00:00') }],
  }
}
