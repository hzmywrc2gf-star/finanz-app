// Rendert alle Mockups zu PNGs (Maßstab 3). Aufruf: NODE_PATH=$(npm root -g) node shots.mjs
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const D = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SIZES = { 375: [375, 667], 390: [390, 844], 430: [430, 932] }
const main = ['390-hell', '390-dunkel', '375-hell', '430-dunkel']
const states = {
  A: [['A-lock', main, 'A'], ['A-ohne-faceid', ['390-hell', '390-dunkel']], ['A-passwort', ['390-hell', '390-dunkel']], ['A-passwort-fehler', ['390-hell']], ['A-passwort-wartezeit', ['390-hell']], ['A-uebergang-1', ['390-hell']], ['A-uebergang-2', ['390-hell']], ['A-uebergang-3', ['390-hell']], ['A-uebergang-4', ['390-hell']]],
  B: [['B-lock', main, 'B'], ['B-passwort', ['390-hell', '390-dunkel']], ['B-uebergang-1', ['390-hell']], ['B-uebergang-2', ['390-hell']], ['B-uebergang-3', ['390-hell']], ['B-uebergang-4', ['390-hell']]],
  C: [['C-lock', main, 'C'], ['C-passwort', ['390-hell', '390-dunkel']], ['C-uebergang-1', ['390-hell']], ['C-uebergang-2', ['390-hell']], ['C-uebergang-3', ['390-hell']], ['C-uebergang-4', ['390-hell']], ['C-uebergang-5', ['390-hell']]],
}
const only = process.argv[2]
const browser = await chromium.launch()
for (const [dir, list] of Object.entries(states)) for (const [file, variants, alias] of list) for (const v of variants) {
  if (only && !file.startsWith(only)) continue
  const [w, scheme] = v.split('-'); const [vw, vh] = SIZES[w]
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 3, colorScheme: scheme === 'dunkel' ? 'dark' : 'light', locale: 'de-DE' })
  const p = await ctx.newPage()
  await p.goto('file://' + path.join(D, 'mockups', file + '.html'))
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150)
  const name = alias ? `${alias}-${v}` : `${file}-${v}`
  await p.screenshot({ path: path.join(D, 'screens', name + '.png') })
  await ctx.close()
}
// Startseite zum Vergleich (aus Mockup-HTML, gleiche Daten wie Ist-Zustand)
await browser.close()
console.log('fertig')
