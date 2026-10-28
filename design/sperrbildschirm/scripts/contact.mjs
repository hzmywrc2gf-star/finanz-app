// Übersichtsbilder (Kontaktbögen) aus den Screens. Aufruf: NODE_PATH=$(npm root -g) node contact.mjs
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
const D = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const S = (n) => 'file://' + path.join(D, 'screens', n + '.png')
const CSS = `body{margin:0;padding:24px;background:#e9e9ee;font-family:-apple-system,system-ui,'Inter',sans-serif;color:#111;width:max-content}
h1{font-size:20px;margin:0 0 16px}.g{display:grid;gap:14px 14px}.c{display:flex;flex-direction:column;gap:6px;align-items:center}
.c img{width:210px;border-radius:14px;box-shadow:0 0 0 1px rgba(0,0,0,.12);display:block}.c span{font-size:13px;font-weight:600;text-align:center}.c small{font-size:11px;color:#555;text-align:center}
.h{font-size:15px;font-weight:700;align-self:center;text-align:center}`
const cell = (n, l, sub = '') => `<div class="c"><img src="${S(n)}"><span>${l}</span>${sub ? `<small>${sub}</small>` : ''}</div>`
const sheets = {
  uebersicht: `<h1>Sperrbildschirm: Ist und drei Richtungen (iPhone 13, 390 px)</h1><div class="g" style="grid-template-columns:repeat(4,210px)">
${cell('ist-sperre-390-hell', 'Ist · hell')}${cell('A-390-hell', 'A Ruhig · hell')}${cell('B-390-hell', 'B Wie Startseite · hell')}${cell('C-390-hell', 'C Verlauf · hell')}
${cell('ist-sperre-390-dunkel', 'Ist · dunkel')}${cell('A-390-dunkel', 'A · dunkel')}${cell('B-390-dunkel', 'B · dunkel')}${cell('C-390-dunkel', 'C · dunkel')}
${cell('ist-start-390-hell', 'Startseite danach · hell', 'bleibt in allen Richtungen gleich')}${cell('A-passwort-390-hell', 'A · Passwort-Sheet')}${cell('B-passwort-390-hell', 'B · Passwort-Sheet')}${cell('C-passwort-390-hell', 'C · Passwort-Sheet')}</div>`,
  'uebersicht-groessen': `<h1>Größen: SE 375 hell, Pro Max 430 dunkel</h1><div class="g" style="grid-template-columns:repeat(3,210px)">
${['A', 'B', 'C'].map((d) => cell(d + '-375-hell', d + ' · SE 375 hell')).join('')}${['A', 'B', 'C'].map((d) => cell(d + '-430-dunkel', d + ' · Pro Max 430 dunkel')).join('')}</div>`,
  'uebergang-A': `<h1>A: Übergang beim Entsperren mit Face ID</h1><div class="g" style="grid-template-columns:repeat(4,210px)">
${cell('A-uebergang-1-390-hell', '1 Gesperrt')}${cell('A-uebergang-2-390-hell', '2 Face ID (System)')}${cell('A-uebergang-3-390-hell', '3 „Moin, Felix“ am Titelplatz')}${cell('A-uebergang-4-390-hell', '4 Startseite')}</div>`,
  'uebergang-B': `<h1>B: Der Kontostand blendet auf</h1><div class="g" style="grid-template-columns:repeat(4,210px)">
${cell('B-uebergang-1-390-hell', '1 Gesperrt')}${cell('B-uebergang-2-390-hell', '2 Face ID (System)')}${cell('B-uebergang-3-390-hell', '3 Beträge blenden ein')}${cell('B-uebergang-4-390-hell', '4 Startseite')}</div>`,
  'uebergang-C': `<h1>C: Verlauf blendet in die Startseite aus</h1><div class="g" style="grid-template-columns:repeat(5,210px)">
${cell('C-uebergang-1-390-hell', '1 Gesperrt')}${cell('C-uebergang-2-390-hell', '2 Face ID (System)')}${cell('C-uebergang-3-390-hell', '3 Begrüßung auf Verlauf')}${cell('C-uebergang-4-390-hell', '4 Verlauf blendet aus')}${cell('C-uebergang-5-390-hell', '5 Startseite')}</div>`,
  'zustaende-A': `<h1>A: Zustände</h1><div class="g" style="grid-template-columns:repeat(4,210px)">
${cell('A-ohne-faceid-390-hell', 'Ohne Face ID')}${cell('A-passwort-390-hell', 'Passwort-Sheet')}${cell('A-passwort-fehler-390-hell', 'Falsches Passwort')}${cell('A-passwort-wartezeit-390-hell', 'Wartezeit')}</div>`,
}
const browser = await chromium.launch()
for (const [name, body] of Object.entries(sheets)) {
  const p = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 800 } })
  fs.writeFileSync(path.join(D, 'mockups', `_contact-${name}.html`), `<!doctype html><meta charset=utf-8><style>${CSS}</style>${body}`)
  await p.goto('file://' + path.join(D, 'mockups', `_contact-${name}.html`))
  await p.waitForLoadState('load')
  await p.locator('body').screenshot({ path: path.join(D, 'screens', name + '.png') })
  await p.close()
}
await browser.close()
