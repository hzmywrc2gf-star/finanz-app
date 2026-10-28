// Rendert die Mockups. NODE_PATH=$(npm root -g) node shots.mjs [Name]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import path from 'node:path'; import { fileURLToPath } from 'node:url'
const D = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const JOBS = [['sperre', 390, 844, ['hell', 'dunkel']], ['start', 390, 844, ['hell', 'dunkel']], ['startunten', 390, 844, ['hell', 'dunkel']], ['budgets', 390, 844, ['hell', 'dunkel']], ['start', 375, 667, ['hell']]]
const only = process.argv[2]
const b = await chromium.launch()
for (const [name, vw, vh, modes] of JOBS) for (const m of modes) {
  if (only && only !== name) continue
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 3, locale: 'de-DE' })
  const p = await ctx.newPage()
  await p.goto('file://' + path.join(D, 'mockups', name + '.html'))
  await p.evaluate((t) => { document.documentElement.dataset.theme = t }, m === 'dunkel' ? 'dark' : 'light')
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150)
  await p.screenshot({ path: path.join(D, 'screens', `${name}${vw === 375 ? '-375' : ''}-${m}.png`) })
  await ctx.close()
}
await b.close()
