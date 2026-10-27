// E2E: Playwright-Durchklicktest. Lokal: `npm run preview` starten, dann `NODE_PATH=$(npm root -g) npm run e2e`
// End-to-end Durchklick-Test: node e2e/smoke.mjs (erwartet `npm run preview` auf Port 4173)
import { createRequire } from 'node:module'
const { chromium, devices } = createRequire(import.meta.url)('playwright')
import fs from 'node:fs'

const URL = process.env.APP_URL ?? 'http://localhost:4173/'
const SHOTS = process.env.SHOTS ?? 'e2e/screenshots'
fs.mkdirSync(SHOTS, { recursive: true })
const errors = []
let step = 0
const ok = (msg) => console.log(`✔ ${++step}. ${msg}`)
const nbsp = (s) => s.replace(/ /g, ' ')

const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['iPhone 13'], acceptDownloads: true, locale: 'de-DE', timezoneId: 'Europe/Berlin' })
const page = await ctx.newPage()
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(e.message))

const tab = (name) => page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name })
const bodyText = async () => nbsp(await page.locator('body').innerText())
async function expectText(t) {
  for (let i = 0; i < 20; i++) { if ((await bodyText()).includes(t)) return; await page.waitForTimeout(100) }
  throw new Error(`Text nicht gefunden: "${t}"`)
}
async function expectNoText(t) {
  if ((await bodyText()).includes(t)) throw new Error(`Text sollte fehlen: "${t}"`)
}
async function addTx({ kind = 'Ausgabe', amount, category, date, note }) {
  await page.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
  await page.getByRole('button', { name: kind, exact: true }).click()
  await page.fill('#tx-amount', amount)
  if (date) await page.fill('#tx-date', date)
  await page.selectOption('#tx-cat', { label: category })
  if (note) await page.fill('#tx-note', note)
  await page.getByRole('button', { name: 'Sichern' }).click()
}
async function balance() {
  const t = await bodyText()
  return t.match(/Kontostand\s*\n?\s*(-?[\d.]+,\d\d €)/)?.[1]
}

await page.goto(URL)
await page.evaluate(() => navigator.serviceWorker.ready)
await page.screenshot({ path: `${SHOTS}/1-start-leer.png` })
if ((await balance()) !== '0,00 €') throw new Error('Startwert falsch: ' + (await balance()))
ok('Start leer, Kontostand 0,00 €')

// Startguthaben
await tab('Einstellungen').click()
await page.fill('#start-balance', '1.000,00')
await page.getByRole('button', { name: 'Speichern' }).click()
await expectText('Startguthaben gespeichert.')
await page.fill('#start-balance', 'abc')
await page.getByRole('button', { name: 'Speichern' }).click()
await expectText('Bitte einen gültigen Betrag')
await page.fill('#start-balance', '1000')
await page.getByRole('button', { name: 'Speichern' }).click()
ok('Startguthaben 1.000,00 gespeichert, ungültige Eingabe abgelehnt')

// Buchungen
await tab('Start').click()
await addTx({ kind: 'Einnahme', amount: '2.500,00', category: 'Gehalt', note: 'Oktober' })
await addTx({ amount: '45,99', category: 'Lebensmittel', note: 'Wocheneinkauf' })
await addTx({ amount: '12,01', category: 'Mobilität' })
await addTx({ amount: '800', category: 'Fixkosten', note: 'Miete' })
if ((await balance()) !== '2.642,00 €') throw new Error('Kontostand falsch: ' + (await balance()))
await page.screenshot({ path: `${SHOTS}/2-start-mit-buchungen.png` })
ok('4 Buchungen angelegt, Kontostand 1000 + 2500 − 45,99 − 12,01 − 800 = 2.642,00 €')

// Validierung
await page.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
await page.fill('#tx-amount', '0')
await page.getByRole('button', { name: 'Sichern' }).click()
await expectText('Betrag')
const alert = await page.getByRole('alert').count()
if (!alert) throw new Error('Keine Fehlermeldung bei Betrag 0')
await page.screenshot({ path: `${SHOTS}/3-formular-fehler.png` })
await page.keyboard.press('Escape')
await page.getByRole('button', { name: 'Abbrechen' }).count().then(async (n) => { if (n) await page.getByRole('button', { name: 'Abbrechen' }).first().click() })
await page.waitForTimeout(300)
if ((await balance()) !== '2.642,00 €') throw new Error('Ungültige Buchung wurde gespeichert')
ok('Betrag 0 wird mit Fehlermeldung abgelehnt')

// Bearbeiten
await page.getByRole('button', { name: /Wocheneinkauf/ }).click()
await page.fill('#tx-amount', '50,00')
await page.getByRole('button', { name: 'Sichern' }).click()
if ((await balance()) !== '2.637,99 €') throw new Error('Nach Bearbeiten falsch: ' + (await balance()))
ok('Bearbeiten 45,99 → 50,00, Kontostand 2.637,99 €')

// Löschen
await page.getByRole('button', { name: /Mobilität/ }).first().click()
await page.getByRole('button', { name: 'Buchung löschen' }).click()
await page.getByRole('alertdialog').getByRole('button', { name: /Löschen/ }).click()
if ((await balance()) !== '2.650,00 €') throw new Error('Nach Löschen falsch: ' + (await balance()))
ok('Löschen 12,01, Kontostand 2.650,00 €')

// Vorwoche
await addTx({ amount: '20', category: 'Freizeit', date: '2026-10-20', note: 'Kino' })
if ((await balance()) !== '2.630,00 €') throw new Error('Vorwoche-Buchung: ' + (await balance()))

// Wochenübersicht
await tab('Woche').click()
await expectText('KW 44 · 26.10. – 01.11.2026')
await expectText('2.500,00 €'); await expectText('850,00 €'); await expectText('1.650,00 €')
await expectText('94,1 %'); await expectText('5,9 %')
await expectNoText('Kino')
const wk = await bodyText()
if (wk.indexOf('Miete') < 0 || wk.indexOf('Fixkosten') > wk.indexOf('Lebensmittel')) throw new Error('Kategorie-Sortierung falsch')
await page.screenshot({ path: `${SHOTS}/4-woche.png`, fullPage: true })
ok('Woche KW 44: Einnahmen 2.500, Ausgaben 850, Saldo 1.650, Fixkosten 94,1 %, Lebensmittel 5,9 %')
await page.getByRole('button', { name: 'Vorherige Woche' }).click()
await expectText('KW 43 · 19.10. – 25.10.2026'); await expectText('Kino'); await expectText('20,00 €'); await expectText('100,0 %')
await expectNoText('Miete')
ok('Pfeil zurück: KW 43 zeigt nur Kino 20,00 € (100,0 %)')
await page.getByRole('button', { name: 'Heute' }).click()
await expectText('KW 44')
await page.getByRole('button', { name: 'Nächste Woche' }).click()
await expectText('KW 45 · 02.11. – 08.11.2026'); await expectText('Keine Buchungen in dieser Woche.')
ok('Heute-Button und Pfeil vor (KW 45, leer) funktionieren')
await page.getByRole('button', { name: 'Vorherige Woche' }).click()

// Kategorien
await tab('Einstellungen').click()
await page.getByLabel('Neue Ausgaben-Kategorie').fill('Haustier')
await page.getByLabel('Neue Ausgaben-Kategorie').press('Enter')
await expectText('Haustier')
await page.getByLabel('Neue Ausgaben-Kategorie').fill('haustier')
await page.getByLabel('Neue Ausgaben-Kategorie').press('Enter')
if (!(await page.getByRole('alert').count())) throw new Error('Duplikat nicht abgelehnt')
await page.getByLabel('Neue Ausgaben-Kategorie').fill('')
await page.getByRole('button', { name: 'Haustier umbenennen' }).click()
await page.getByLabel('Neuer Name').fill('Tiere')
await page.getByLabel('Neuer Name').press('Enter')
await expectText('Tiere')
if (await page.getByRole('button', { name: 'Sonstiges löschen' }).count()) throw new Error('Sonstiges löschbar')
ok('Kategorie hinzugefügt, Duplikat abgelehnt, umbenannt; Sonstiges geschützt')
await tab('Start').click()
await addTx({ amount: '30', category: 'Tiere', note: 'Futter' })
await tab('Einstellungen').click()
await page.getByRole('button', { name: 'Tiere löschen' }).click()
await page.getByRole('alertdialog').getByRole('button', { name: /Löschen/ }).click()
await tab('Woche').click()
await expectNoText('Tiere')
await expectText('Futter')
const wk2 = await bodyText()
if (!/Sonstiges\s*\n?.*30,00 €/s.test(wk2)) throw new Error('Futter nicht in Sonstiges')
ok('Kategorie mit Buchung gelöscht → Buchung landet in Sonstiges')

// Persistenz
await page.reload(); await tab('Start').click()
if ((await balance()) !== '2.600,00 €') throw new Error('Nach Reload: ' + (await balance()))
ok('Daten nach Neuladen erhalten (Kontostand 2.600,00 €)')

// Export / Import
await tab('Einstellungen').click()
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportieren' }).click()])
const file = `${SHOTS}/../backup-test.json`
await dl.saveAs(file)
const json = JSON.parse(fs.readFileSync(file, 'utf8'))
if (dl.suggestedFilename() !== 'finanz-backup-2026-10-27.json' || json.transactions.length !== 5 || json.settings.startBalanceCents !== 100000)
  throw new Error('Export unvollständig ' + dl.suggestedFilename())
ok(`Export ${dl.suggestedFilename()}: 5 Buchungen, Startguthaben 100000 Cent`)
// Daten ändern, dann Backup wieder einspielen
await tab('Start').click()
await addTx({ amount: '999', category: 'Sonstiges' })
await tab('Einstellungen').click()
fs.writeFileSync(`${SHOTS}/../kaputt.json`, '{"version":1,"foo":1}')
await page.locator('input[type=file]').setInputFiles(`${SHOTS}/../kaputt.json`)
await page.getByRole('alert').waitFor({ timeout: 3000 }); console.log('   Meldung: ' + await page.getByRole('alert').innerText())
await page.locator('input[type=file]').setInputFiles(file)
await page.getByRole('alertdialog').waitFor()
await page.getByRole('alertdialog').getByRole('button').last().click()
await expectText('Import erfolgreich: 5 Buchungen')
await tab('Start').click()
if ((await balance()) !== '2.600,00 €') throw new Error('Nach Import: ' + (await balance()))
ok('Ungültiges Backup abgelehnt; Import stellt Stand wieder her (2.600,00 €)')

// Offline
await ctx.setOffline(true)
await page.reload()
await tab('Woche').click()
await expectText('KW 44')
await ctx.setOffline(false)
ok('Offline: App lädt aus dem Service Worker inklusive Daten')

// Desktop + Dark Mode Screenshots
await tab('Start').click()
await page.emulateMedia({ colorScheme: 'dark' })
await page.screenshot({ path: `${SHOTS}/5-start-dark.png` })
await page.emulateMedia({ colorScheme: 'light' })
await tab('Einstellungen').click()
await page.screenshot({ path: `${SHOTS}/6-einstellungen.png`, fullPage: true })
await tab('Start').click()
await page.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
await page.screenshot({ path: `${SHOTS}/7-neue-buchung.png` })

await page.keyboard.press('Escape')

// ---------- Wiederkehrende Buchungen (Datum der Umgebung: 2026-10-27, Stand vorher 2.600,00 €) ----------
const txCount = () => page.locator('[aria-label="wiederkehrend"]').count()
async function addRule({ kind = 'Ausgabe', amount, category, note, interval, day, start, end }) {
  await page.getByRole('button', { name: 'Wiederkehrende Buchung hinzufügen' }).click()
  await page.getByRole('button', { name: kind, exact: true }).click()
  await page.fill('#rc-amount', amount)
  await page.selectOption('#rc-cat', { label: category })
  if (note) await page.fill('#rc-note', note)
  if (interval) await page.getByRole('button', { name: interval, exact: true }).click()
  if (start) await page.fill('#rc-start', start)
  if (day) await page.fill('#rc-day', day)
  if (end) await page.fill('#rc-end', end)
  await page.getByRole('button', { name: 'Sichern' }).click()
}
const mustBalance = async (expected, what) => {
  const b = await balance()
  if (b !== expected) throw new Error(`${what}: erwartet ${expected}, war ${b}`)
}

await tab('Einstellungen').click()
await expectText('WIEDERKEHRENDE BUCHUNGEN'); await expectText('Noch keine wiederkehrenden Buchungen.')
await addRule({ amount: '800', category: 'Fixkosten', note: 'Miete', start: '2026-08-01' })
await page.getByRole('alertdialog').waitFor()
await expectText('Vergangene Termine nachbuchen?'); await expectText('3 Termine seit 01.08.2026 liegen in der Vergangenheit.')
await page.getByRole('alertdialog').getByRole('button', { name: 'Nachbuchen' }).click()
await expectText('monatlich am 1.'); await expectText('nächste: 01.11.')
await tab('Start').click()
await mustBalance('200,00 €', 'Nach Nachbuchen (2.600 − 3 × 800)')
for (const d of ['Sa, 01.08.', 'Di, 01.09.', 'Do, 01.10.']) await expectText(d)
if ((await txCount()) !== 3) throw new Error('Erwartet 3 Buchungen mit ↻, gefunden: ' + (await txCount()))
ok('Regel „Miete“ 800,00 € ab 01.08.: Dialog „3 Termine“, Nachbuchen → Kontostand genau −2.400,00 € (200,00 €), 3 Buchungen mit ↻')

// Miete ist am 01.11. fällig (innerhalb von 7 Tagen) → „Demnächst fällig“
await expectText('DEMNÄCHST FÄLLIG'); await expectText('So, 01.11.')

// Gehalt am 30., Start heute: kein Dialog, nichts gebucht, aber „Demnächst fällig“ (vor der Miete)
await tab('Einstellungen').click()
await addRule({ kind: 'Einnahme', amount: '2.000,00', category: 'Gehalt', note: 'Gehalt', day: '30', start: '2026-10-27' })
await page.getByRole('alertdialog').waitFor({ timeout: 500 }).then(() => { throw new Error('Dialog trotz keiner vergangenen Termine') }, () => {})
await expectText('Gehalt'); await expectText('nächste: 30.10.')
await tab('Start').click()
await mustBalance('200,00 €', 'Nach Gehalt-Regel (noch nichts fällig)')
await expectText('Fr, 30.10.'); await expectText('+2.000,00 €')
const startText = await bodyText()
if (startText.indexOf('Fr, 30.10.') > startText.indexOf('So, 01.11.')) throw new Error('„Demnächst fällig“ nicht nach Datum sortiert')
if (startText.indexOf('DEMNÄCHST FÄLLIG') < startText.indexOf('Kontostand') || startText.indexOf('DEMNÄCHST FÄLLIG') > startText.indexOf('LETZTE BUCHUNGEN'))
  throw new Error('„Demnächst fällig“ steht an der falschen Stelle')
await page.screenshot({ path: `${SHOTS}/11-start-demnaechst.png`, fullPage: true })
ok('Gehalt-Regel (Tag 30, Start heute): kein Dialog, Kontostand unverändert; „Demnächst fällig“: Fr, 30.10. +2.000,00 € vor So, 01.11. Miete −800,00 €')

// „Nur künftige“: 15. monatlich ab 15.09. → 2 vergangene Termine werden übersprungen
await tab('Einstellungen').click()
await addRule({ amount: '9,99', category: 'Freizeit', note: 'Streaming', day: '15', start: '2026-09-15' })
await expectText('2 Termine seit 15.09.2026 liegen in der Vergangenheit.')
await page.getByRole('alertdialog').getByRole('button', { name: 'Nur künftige' }).click()
await expectText('Streaming'); await expectText('nächste: 15.11.')
await tab('Start').click()
await mustBalance('200,00 €', 'Nach „Nur künftige“')
if ((await txCount()) !== 3) throw new Error('„Nur künftige“ hat gebucht')
ok('„Nur künftige“: 2 vergangene Termine übersprungen, Kontostand unverändert, nächste: 15.11.')

// Screenshots Einstellungen + Formular
await tab('Einstellungen').click()
await page.waitForTimeout(300)
await page.screenshot({ path: `${SHOTS}/9-einstellungen-wiederkehrend.png`, fullPage: true })
await page.getByRole('button', { name: /Miete.*monatlich am 1\./ }).click()
await page.waitForTimeout(500) // Sheet-Animation abwarten
await page.screenshot({ path: `${SHOTS}/10-formular-wiederkehrend.png` })

// Bearbeiten: Betrag nur für die Zukunft
await page.fill('#rc-amount', '850,00')
await page.getByRole('button', { name: 'Sichern' }).click()
await expectText('−850,00 €')
await tab('Start').click()
await mustBalance('200,00 €', 'Nach Bearbeiten der Regel')
const body850 = await bodyText()
const count = (needle) => body850.split(needle).length - 1
if (count('−800,00 €') !== 4 || count('−850,00 €') !== 1) throw new Error('Erwartet 4 × −800,00 € (3 gebucht + manuelle Miete) und 1 × −850,00 € (fällig), war ' + count('−800,00 €') + ' / ' + count('−850,00 €'))
if ((await txCount()) !== 3) throw new Error('Bearbeiten hat Buchungen verändert')
ok('Regel Miete auf 850,00 € geändert: 3 gebuchte Einträge bleiben bei 800,00 €, nur der nächste Termin (01.11.) zeigt 850,00 €')

// Löschen: Buchungen bleiben
await tab('Einstellungen').click()
for (const name of [/Streaming/, /Miete.*monatlich/, /Gehalt.*monatlich/]) {
  await page.getByRole('button', { name }).click()
  await page.getByRole('button', { name: 'Löschen', exact: true }).click()
  await expectText('Bereits gebuchte Einträge bleiben erhalten.')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click()
}
await expectText('Noch keine wiederkehrenden Buchungen.')
await tab('Start').click()
await expectNoText('DEMNÄCHST FÄLLIG')
await mustBalance('200,00 €', 'Nach Löschen der Regeln')
if ((await txCount()) !== 3) throw new Error('Gebuchte Einträge sind nach Löschen der Regel weg')
ok('Regeln gelöscht: 3 gebuchte Einträge (↻) und Kontostand 200,00 € bleiben, „Demnächst fällig“ verschwindet')

// ---------- Datumswechsel mit page.clock (frischer Kontext, fester Start 31.10.2026 10:00) ----------
{
  const ctx2 = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block' })
  const p2 = await ctx2.newPage()
  p2.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  p2.on('pageerror', (e) => errors.push(e.message))
  await p2.clock.install({ time: new Date('2026-10-31T10:00:00+01:00') })
  await p2.goto(URL)
  const bal2 = async () => nbsp(await p2.locator('[data-testid="balance"]').innerText())
  const waitBal = async (expected) => {
    for (let i = 0; i < 30; i++) { if ((await bal2()) === expected) return; await p2.waitForTimeout(100) }
    throw new Error(`Rollover: Kontostand erwartet ${expected}, war ${await bal2()}`)
  }
  const stored = () => p2.evaluate(() => JSON.parse(localStorage.getItem('finanz-app:v1')))
  const nav2 = (name) => p2.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name })
  await nav2('Einstellungen').click()
  await p2.getByRole('button', { name: 'Wiederkehrende Buchung hinzufügen' }).click()
  await p2.fill('#rc-amount', '10')
  await p2.selectOption('#rc-cat', { label: 'Freizeit' })
  await p2.fill('#rc-note', 'Abo')
  await p2.fill('#rc-day', '1')
  await p2.getByRole('button', { name: 'Sichern' }).click() // Start = heute (31.10.), keine vergangenen Termine
  await nav2('Start').click()
  await waitBal('0,00 €')
  if ((await stored()).transactions.length !== 0) throw new Error('Rollover: am 31.10. darf nichts gebucht sein')
  ok('Rollover: Regel „Abo“ 10,00 € am 1. angelegt, am 31.10. noch nichts gebucht')

  await p2.clock.fastForward('24:00:00') // 01.11.2026 10:00, der Stunden-Timer feuert
  await waitBal('-10,00 €')
  await p2.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await p2.clock.fastForward('01:00:00')
  await p2.waitForTimeout(300)
  let st = await stored()
  if (st.transactions.length !== 1 || st.transactions[0].date !== '2026-11-01' || st.transactions[0].amountCents !== 1000)
    throw new Error('Rollover: erwartet genau 1 Buchung am 01.11., war ' + JSON.stringify(st.transactions))
  ok('Rollover 31.10. → 01.11. (Timer): genau 1 Buchung über 10,00 €, Kontostand −10,00 €; weitere Timer/visibilitychange buchen nichts doppelt')

  await p2.clock.setSystemTime(new Date('2026-12-01T09:00:00+01:00'))
  await p2.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await waitBal('-20,00 €')
  await p2.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await p2.waitForTimeout(300)
  st = await stored()
  if (st.transactions.map((t) => t.date).join() !== '2026-11-01,2026-12-01') throw new Error('Rollover Dezember: ' + st.transactions.map((t) => t.date))
  ok('Rollover Monatswechsel (visibilitychange, 01.12.): Buchung für 01.12. genau einmal, Kontostand −20,00 €')

  await p2.reload()
  await waitBal('-20,00 €')
  st = await stored()
  if (st.transactions.length !== 2) throw new Error('Rollover: Neuladen hat doppelt gebucht')
  ok('Neuladen nach dem Datumswechsel bucht nichts doppelt (2 Buchungen, −20,00 €)')
  await ctx2.close()
}

await browser.close()
if (errors.length) { console.error('Konsolenfehler:\n' + errors.join('\n')); process.exit(1) }
console.log(`\nAlle ${step} Prüfungen bestanden, keine Konsolenfehler.`)
