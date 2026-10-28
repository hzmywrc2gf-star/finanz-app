// Vergleichsbögen: Zeilen = Bildschirme, Spalten = Jetzt | Pastell-Entwurf. NODE_PATH=$(npm root -g) node contact.mjs
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
const S = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../screens')
const ROWS = [['sperre', 'Sperrbildschirm'], ['start', 'Start oben'], ['startunten', 'Start unten'], ['budgets', 'Budgets']]
const img = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(S, f + '.png')).toString('base64')
const b = await chromium.launch()
for (const mode of ['hell', 'dunkel']) {
  const dark = mode === 'dunkel'
  const html = `<meta charset=utf-8><style>body{margin:0;padding:24px;background:${dark ? '#05080f' : '#d9dde3'};font-family:system-ui,sans-serif;color:${dark ? '#e2e8f0' : '#111'};width:max-content}
h1{font-size:20px;margin:0 0 14px}.g{display:grid;grid-template-columns:repeat(4,230px);gap:12px 14px}.h{font-weight:700;font-size:15px;text-align:center;grid-column:span 2}
img{width:230px;border-radius:12px;display:block;box-shadow:0 0 0 1px rgba(128,128,128,.35)}.l{font-size:12px;text-align:center;opacity:.7;margin-top:-6px}</style>
<h1>Pastell-Entwurf ${dark ? 'dunkel' : 'hell'} (Jetzt = App aus main, ohne gezeichnete Statusleiste)</h1><div class=g><div class=h>Jetzt</div><div class=h>Pastell-Entwurf</div>
${ROWS.map(([k]) => `<img src="${img(`jetzt-${k}-${mode}`)}"><div></div><img src="${img(`${k}-${mode}`)}"><div></div>`).join('')}</div>`
  // 2 Zeilen je Paar: Jetzt links, Entwurf rechts → Raster 2 Spalten, Zeile je Bildschirm
  const html2 = html.replace(/<img src="([^"]+)"><div><\/div><img src="([^"]+)"><div><\/div>/g, '<div style="grid-column:span 2;display:flex;justify-content:center"><img src="$1"></div><div style="grid-column:span 2;display:flex;justify-content:center"><img src="$2"></div>')
  const p = await b.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 1.5 })
  await p.setContent(html2.replace('repeat(4,230px)', 'repeat(4,230px)'))
  await p.locator('body').screenshot({ path: path.join(S, `vergleich-${mode}.png`) })
  await p.close()
}
await b.close()
