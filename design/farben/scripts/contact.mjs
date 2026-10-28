// Kontaktbögen: Zeilen = Bildschirme, Spalten = Ist | V1 | V2. NODE_PATH=$(npm root -g) node contact.mjs
// Optional: ROWS=a,b OUT=name (Prüfbogen mit Teilmenge, landet als _<name>.png)
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
const S = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../screens')
const ROWS = [['sperre', 'Sperrbildschirm'], ['start', 'Start oben'], ['startunten', 'Start unten (Symbol-Kacheln)'], ['monat', 'Monat oben'], ['monatverlauf', 'Monat: Verlauf + Kategorien'], ['budgets', 'Budgets'], ['buchung', 'Neue Buchung'], ['einstellungen', 'Einstellungen oben'], ['sperreinr', 'Einstellungen: App-Sperre'], ['schalter', 'Vertrag: Schalter Enddatum']]
const COLS = [['ist', 'Ist (iOS-Blau)'], ['V1', 'V1 wörtlich'], ['V2', 'V2 angepasst']]
const only = process.env.ROWS?.split(',')
const W = Number(process.env.W || 230)
const img = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(S, f + '.png')).toString('base64')
const b = await chromium.launch()
for (const mode of ['hell', 'dunkel']) {
  const dark = mode === 'dunkel'
  const rows = ROWS.filter(([k]) => !only || only.includes(k))
  const html = `<meta charset=utf-8><style>body{margin:0;padding:24px;background:${dark ? '#0b0f1a' : '#e5e7eb'};font-family:-apple-system,system-ui,Inter,sans-serif;color:${dark ? '#e2e8f0' : '#111'};width:max-content}
h1{font-size:20px;margin:0 0 14px}.g{display:grid;grid-template-columns:repeat(3,${W}px);gap:10px 14px}.h{font-weight:700;font-size:15px;text-align:center}.r{grid-column:1/-1;font-size:13px;font-weight:600;margin-top:10px;opacity:.8}
img{width:${W}px;border-radius:12px;display:block;box-shadow:0 0 0 1px rgba(128,128,128,.35)}</style>
<h1>Farbversuch ${dark ? 'dunkel' : 'hell'}: Ist | V1 wörtlich | V2 angepasst</h1><div class=g>${COLS.map(([, l]) => `<div class=h>${l}</div>`).join('')}
${rows.map(([k, l]) => `<div class=r>${l}</div>${COLS.map(([c]) => `<img src="${img(`${c}-${k}-${mode}`)}">`).join('')}`).join('')}</div>`
  const p = await b.newPage({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 1.5 })
  await p.setContent(html)
  const out = process.env.OUT ? `_${process.env.OUT}-${mode}.png` : `vergleich-${mode}.png`
  await p.locator('body').screenshot({ path: path.join(S, out) })
  await p.close()
}
await b.close()
