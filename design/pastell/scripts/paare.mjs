// Bildpaare Jetzt | Entwurf je Bildschirm (geordnet). NODE_PATH=$(npm root -g) node paare.mjs
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
const S = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../screens')
const ROWS = [['sperre', 'Sperrbildschirm'], ['start', 'Startseite oben'], ['startunten', 'Startseite unten'], ['budgets', 'Budgets']]
const img = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(S, f + '.png')).toString('base64')
const b = await chromium.launch()
for (const mode of ['hell', 'dunkel']) {
  const dark = mode === 'dunkel'
  for (const [i, [k, l]] of ROWS.entries()) {
    const html = `<meta charset=utf-8><style>body{margin:0;padding:20px 24px 24px;background:${dark ? '#0b0f1a' : '#e5e7eb'};color:${dark ? '#e2e8f0' : '#111'};font-family:system-ui,sans-serif;width:max-content}
h1{font-size:22px;margin:0 0 12px}.g{display:grid;grid-template-columns:repeat(2,330px);gap:8px 28px}.h{font-weight:700;text-align:center;font-size:16px}
img{width:330px;border-radius:16px;display:block;box-shadow:0 0 0 1px rgba(128,128,128,.35)}</style>
<h1>${i + 1}. ${l} – ${mode}</h1><div class=g><div class=h>Jetzt</div><div class=h>Entwurf</div><img src="${img(`jetzt-${k}-${mode}`)}"><img src="${img(`${k}-${mode}`)}"></div>`
    const p = await b.newPage({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 1.5 })
    await p.setContent(html); await p.locator('body').screenshot({ path: path.join(S, `paar-${mode}-${i + 1}-${k}.png`) }); await p.close()
  }
}
await b.close()
