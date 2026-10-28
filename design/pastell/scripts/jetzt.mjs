// Ist-Zustand (App aus main, gebaut, vite preview :4173) mit Seed + Pflicht-Sperre einrichten.
// NODE_PATH=$(npm root -g) node jetzt.mjs
import { createRequire } from 'node:module'
const { chromium, devices } = createRequire(import.meta.url)('playwright')
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'
import { seedData } from './seed.mjs'
const D = path.dirname(fileURLToPath(import.meta.url)); const OUT = path.resolve(D, '../screens')
const URL = process.env.APP_URL || 'http://localhost:4173/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const SEED = JSON.stringify(seedData())
const browser = await chromium.launch()
const nav = (p, n) => p.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name: n, exact: true })
const info = {}
for (const mode of ['hell', 'dunkel']) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block', colorScheme: mode === 'dunkel' ? 'dark' : 'light' })
  await ctx.addInitScript(([seed, theme]) => { try { if (!localStorage.getItem('finanz-app:vault')) localStorage.setItem('finanz-app:v1', seed); localStorage.setItem('finanz-app:theme', theme) } catch {} }, [SEED, mode === 'dunkel' ? 'dark' : 'light'])
  const p = await ctx.newPage()
  await p.clock.install({ time: new Date('2026-10-28T10:00:00+01:00') })
  await p.goto(URL)
  await p.locator('#lock-pw').waitFor()
  await p.fill('#lock-pw', 'KorrektesPferd42!'); await p.fill('#lock-pw2', 'KorrektesPferd42!')
  await p.getByRole('button', { name: 'Weiter', exact: true }).click()
  await p.getByText('Ich habe den Schlüssel sicher notiert').click()
  await p.getByRole('button', { name: 'Weiter', exact: true }).click()
  const fertig = p.getByRole('button', { name: 'Fertig', exact: true }); await fertig.waitFor({ timeout: 60000 }); await fertig.click()
  await p.getByTestId('balance').waitFor(); await sleep(500)
  const shot = async (n) => { await sleep(400); await p.screenshot({ path: `${OUT}/jetzt-${n}-${mode}.png` }); console.log('->', n, mode) }
  await nav(p, 'Start').click(); await shot('start')
  if (mode === 'hell') info.start = await p.evaluate(() => document.body.innerText)
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await shot('startunten')
  await nav(p, 'Budgets').click(); await sleep(300); await shot('budgets')
  if (mode === 'hell') info.budgets = await p.evaluate(() => document.body.innerText)
  if (mode === 'hell') {
    await nav(p, 'Monat').click(); await sleep(400)
    info.monat = await p.evaluate(() => document.body.innerText)
    for (let i = 0; i < 5; i++) { await p.getByRole('button', { name: /Vorheriger Monat|Zurück/ }).first().click().catch(() => {}); }
  }
  await p.reload(); await p.getByText('Gesperrt').first().waitFor({ timeout: 15000 }).catch(() => {}); await sleep(600)
  await p.screenshot({ path: `${OUT}/jetzt-sperre-${mode}.png` }); console.log('-> sperre', mode)
  await ctx.close()
}
fs.writeFileSync(path.join(D, 'jetzt-text.json'), JSON.stringify(info, null, 1))
await browser.close()
