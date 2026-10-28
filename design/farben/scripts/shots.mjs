// Farbversuch-Screenshots. NODE_PATH=$(npm root -g) node shots.mjs [Variante] [Bildschirm]   (App auf :4173 via vite preview)
// Varianten: ist, V1, V2 (+ V2b = V2 dunkel mit Smaragd-Knopf, nur Vergleich). Bildschirme: sperre start monat budgets buchung einstellungen sperreinr schalter
import { createRequire } from 'node:module'
const { chromium, devices } = createRequire(import.meta.url)('playwright')
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
import { PALETTES, overrideCSS, iconSVG, V2_DARK_EMERALD_BTN } from './palettes.mjs'
import { seedData } from './seed.mjs'
const D = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(D, '../screens')
const MOCK = path.resolve(D, '../../sperrbildschirm/mockups/A-lock.html')
const URL = process.env.APP_URL || 'http://localhost:4173/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const onlyV = process.argv[2], onlyS = process.argv[3]
const SEED = JSON.stringify(seedData())
const browser = await chromium.launch()
const nav = (p, name) => p.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name, exact: true })

function paletteFor(v, mode) {
  if (v === 'ist') return null
  if (v === 'V2b') return { ...PALETTES.V2[mode], ...V2_DARK_EMERALD_BTN }
  return PALETTES[v][mode]
}
const iconDataUrl = (p) => p && 'data:image/png;base64,' + fs.readFileSync(path.join(D, '_icons', p.icon + '.png')).toString('base64')

async function appPage(v, mode) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block', colorScheme: mode === 'dunkel' ? 'dark' : 'light' })
  await ctx.addInitScript(([seed, theme]) => {
    try { localStorage.setItem('finanz-app:v1', seed); localStorage.setItem('finanz-app:theme', theme) } catch {}
  }, [SEED, mode === 'dunkel' ? 'dark' : 'light'])
  const p = await ctx.newPage()
  await p.clock.install({ time: new Date('2026-10-28T10:00:00+01:00') })
  await p.goto(URL)
  await p.getByTestId('balance').waitFor()
  const pal = paletteFor(v, mode)
  if (pal) await p.addStyleTag({ content: overrideCSS(pal) })
  await sleep(300)
  return { ctx, p }
}
const shot = async (p, v, name, mode) => { await sleep(350); await p.screenshot({ path: `${OUT}/${v === 'V2b' ? 'V2b' : v}-${name}-${mode}.png` }); console.log('->', v, name, mode) }

const SCREENS = {
  async start(p) { await nav(p, 'Start').click() },
  async startunten(p) { await nav(p, 'Start').click(); await sleep(200); await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await sleep(300) },
  async monat(p) { await nav(p, 'Monat').click(); await p.waitForTimeout(300) },
  async monatverlauf(p) { await nav(p, 'Monat').click(); await sleep(300); await p.evaluate(() => window.scrollTo(0, 430)); await sleep(300) },
  async budgets(p) { await nav(p, 'Budgets').click(); await p.waitForTimeout(300) },
  async buchung(p) {
    await nav(p, 'Start').click()
    await p.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
    await p.getByRole('dialog').waitFor(); await sleep(500)
    await p.fill('#tx-amount', '24,90'); await p.fill('#tx-note', 'Bäckerei')
  },
  async einstellungen(p) { await nav(p, 'Einstellungen').click(); await p.waitForTimeout(300) },
  async sperreinr(p) {
    await nav(p, 'Einstellungen').click(); await p.waitForTimeout(300)
    await p.getByRole('button', { name: 'App-Sperre einrichten' }).scrollIntoViewIfNeeded()
    await p.evaluate(() => window.scrollBy(0, 160))
  },
  async schalter(p) {
    await nav(p, 'Start').click()
    await p.locator('button.row', { hasText: 'Verträge' }).click(); await sleep(600)
    await p.getByRole('button', { name: /hinzufügen/ }).first().click()
    await p.getByRole('dialog').waitFor(); await sleep(500)
    const sw = p.getByRole('switch', { name: 'Enddatum' }); await sw.check()
  },
}

for (const v of ['ist', 'V1', 'V2', 'V2b']) {
  if (onlyV && onlyV !== v) continue
  for (const mode of ['hell', 'dunkel']) {
    if (v === 'V2b' && mode === 'hell') continue
    // Sperrbildschirm: Mockup A mit denselben Überschreibungen
    if (!onlyS || onlyS === 'sperre') {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: mode === 'dunkel' ? 'dark' : 'light', locale: 'de-DE' })
      const p = await ctx.newPage()
      await p.goto('file://' + MOCK)
      const pal = paletteFor(v, mode)
      await p.evaluate((t) => { document.documentElement.dataset.theme = t }, mode === 'dunkel' ? 'dark' : 'light')
      if (pal) { await p.addStyleTag({ content: overrideCSS(pal) }); await p.evaluate((u) => { document.querySelector('.a-top img').src = u }, iconDataUrl(pal)) }
      await p.waitForTimeout(250)
      await p.screenshot({ path: `${OUT}/${v}-sperre-${mode}.png` }); console.log('->', v, 'sperre', mode)
      await ctx.close()
    }
    for (const [name, fn] of Object.entries(SCREENS)) {
      if (onlyS ? onlyS !== name : false) continue
      const { ctx, p } = await appPage(v, mode)
      await fn(p)
      await shot(p, v, name, mode)
      await ctx.close()
    }
  }
}
await browser.close()
