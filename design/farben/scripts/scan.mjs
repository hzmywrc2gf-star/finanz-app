// Sucht in V1/V2 nach Resten der alten Farben (iOS-Blau/Grün/Orange/Rot) in berechneten Stilen aller Seiten.
import { createRequire } from 'node:module'
const { chromium, devices } = createRequire(import.meta.url)('playwright')
import { PALETTES, overrideCSS } from './palettes.mjs'
import { seedData } from './seed.mjs'
const OLD = ['rgb(0, 122, 255)','rgb(10, 132, 255)','rgb(52, 199, 89)','rgb(48, 209, 88)','rgb(36, 138, 61)','rgb(255, 149, 0)','rgb(255, 159, 10)','rgb(201, 52, 0)','rgb(255, 59, 48)','rgb(255, 69, 58)','rgb(215, 0, 21)','rgb(255, 105, 97)','rgb(100, 168, 255)','rgb(44, 44, 46)','rgb(58, 58, 60)','rgb(242, 242, 247)','rgb(28, 28, 30)']
const b = await chromium.launch(); const res = {}
for (const v of ['V1', 'V2']) for (const mode of ['hell', 'dunkel']) {
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', colorScheme: mode === 'dunkel' ? 'dark' : 'light' })
  await ctx.addInitScript(([s, t]) => { localStorage.setItem('finanz-app:v1', s); localStorage.setItem('finanz-app:theme', t) }, [JSON.stringify(seedData()), mode === 'dunkel' ? 'dark' : 'light'])
  const p = await ctx.newPage(); await p.clock.install({ time: new Date('2026-10-28T10:00:00+01:00') })
  await p.goto('http://localhost:4173/'); await p.getByTestId('balance').waitFor(); await p.addStyleTag({ content: overrideCSS(PALETTES[v][mode]) })
  const nav = (n) => p.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name: n, exact: true })
  const hits = new Set()
  const scan = async (tag) => { const r = await p.evaluate((OLD) => { const o = []; for (const el of document.querySelectorAll('body *')) { const c = getComputedStyle(el); for (const k of ['color', 'backgroundColor', 'borderTopColor', 'fill', 'stroke']) { if (OLD.includes(c[k]) && (k !== 'borderTopColor' || c.borderTopWidth !== '0px')) o.push(`${el.tagName}.${el.className && el.className.baseVal === undefined ? el.className : ''}:${k}=${c[k]}`) } } return [...new Set(o)] }, OLD); r.forEach((x) => hits.add(tag + ' ' + x)) }
  for (const n of ['Start', 'Monat', 'Budgets', 'Einstellungen']) { await nav(n).click(); await p.waitForTimeout(250); await scan(n) }
  await nav('Start').click(); await p.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click(); await p.getByRole('dialog').waitFor(); await p.waitForTimeout(400); await scan('Sheet')
  res[v + '-' + mode] = [...hits]; await ctx.close()
}
console.log(JSON.stringify(res, null, 1)); await b.close()
