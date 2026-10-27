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

const tab = (name) => page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name, exact: true })
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
  return t.match(/Kontostand\s*\n?\s*([-−]?[\d.]+,\d\d €)/)?.[1]
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

// ---------- Budgets (Stand: Oktober 2026, Daten aus den Schritten oben) ----------
// Lebensmittel im Oktober: nur „Wocheneinkauf“ (45,99 → auf 50,00 bearbeitet) = 5.000 Cent.
// Fixkosten im Oktober: manuelle Miete 800,00 (27.10.) + gebuchte Regel-Miete 01.10. 800,00 = 1.600,00 €.
// Freizeit im Oktober: Kino 20,00 € (20.10.); das „Streaming“-Abo wurde nicht gebucht.
{
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('finanz-app:v1')))
  const octSum = async (catId) =>
    (await stored()).transactions.filter((t) => t.kind === 'expense' && t.categoryId === catId && t.date.startsWith('2026-10')).reduce((s, t) => s + t.amountCents, 0)
  const LEBENSMITTEL = 5000, FIXKOSTEN = 160000, FREIZEIT = 2000
  if ((await octSum('expense-lebensmittel')) !== LEBENSMITTEL || (await octSum('expense-fixkosten')) !== FIXKOSTEN || (await octSum('expense-freizeit')) !== FREIZEIT)
    throw new Error('Budget-Ausgangsdaten stimmen nicht mit dem erwarteten Oktober überein')
  const row = (name) => page.getByRole('button', { name: new RegExp(`^${name}`) })
  const rowText = async (name) => nbsp(await row(name).innerText()).trim().replace(/\s*\n\s*/g, ' | ')
  const mustRow = async (name, expected, what) => {
    const t = await rowText(name)
    if (t !== expected) throw new Error(`${what}: erwartet "${expected}", war "${t}"`)
  }
  const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop)
  async function setBudget(name, amount) {
    await row(name).click()
    await page.fill('#budget-amount', amount)
    await page.getByRole('button', { name: 'Sichern' }).click()
    await page.getByRole('dialog').waitFor({ state: 'detached' })
  }

  await tab('Budgets').click()
  await expectText('Budgets'); await expectText('Oktober 2026')
  await expectText('Tippe auf eine Kategorie, um ein Monatsbudget festzulegen.')
  await expectNoText('Gesamt')
  await mustRow('Lebensmittel', 'Lebensmittel | 50,00 € | Budget festlegen', 'Lebensmittel ohne Budget')
  await mustRow('Sonstiges', 'Sonstiges | 30,00 € | Budget festlegen', 'Sonstiges ohne Budget')
  ok('Budgets-Tab: Oktober 2026, Hinweis ohne Budgets, Lebensmittel 50,00 € / Sonstiges 30,00 € mit „Budget festlegen“')

  // Formular: Validierung, dann 400,00
  await row('Lebensmittel').click()
  await page.getByRole('dialog', { name: 'Budget · Lebensmittel' }).waitFor()
  await expectNoText('Budget entfernen')
  await page.fill('#budget-amount', 'abc')
  await page.getByRole('button', { name: 'Sichern' }).click()
  await expectText('Bitte einen gültigen Betrag eingeben, z. B. 400,00.')
  await page.fill('#budget-amount', '0')
  await page.getByRole('button', { name: 'Sichern' }).click()
  await expectText('Das Budget muss größer als 0 sein.')
  await page.fill('#budget-amount', '400,00')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOTS}/14-budget-formular.png` })
  await page.getByRole('button', { name: 'Sichern' }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })
  await mustRow('Lebensmittel', 'Lebensmittel | 50,00 € von 400,00 € | noch 350,00 € | 12,5 %', 'Lebensmittel 400,00')
  await expectText('Gesamt'); await expectText('50,00 € von 400,00 €')
  const bar = page.getByRole('progressbar', { name: 'Budget Lebensmittel' })
  if (nbsp(await bar.getAttribute('aria-valuetext')) !== '12,5 % verbraucht' || (await bar.getAttribute('aria-valuenow')) !== '13') throw new Error('Progressbar-Werte falsch')
  if (!(await page.getByRole('progressbar', { name: 'Gesamtbudget' }).count())) throw new Error('Gesamt-Fortschrittsbalken fehlt')
  ok('Budget Lebensmittel 400,00 €: Validierungsfehler angezeigt; „50,00 € von 400,00 €“, „noch 350,00 €“, 12,5 %, Gesamt-Karte, Progressbar mit aria-Werten')

  // ok → warn (genau 80 %): 50,00 + 270,00 = 320,00
  await tab('Start').click()
  await expectNoText('verbraucht')
  await addTx({ amount: '270,00', category: 'Lebensmittel', note: 'Großeinkauf' })
  await expectText('BUDGETS'); await expectText('Lebensmittel'); await expectText('80,0 % verbraucht · noch 80,00 €') // Start: exakt 80 % → Hinweis
  await tab('Budgets').click()
  await mustRow('Lebensmittel', 'Lebensmittel | 320,00 € von 400,00 € | noch 80,00 € | 80,0 %', 'Lebensmittel 80 %')
  let remaining = row('Lebensmittel').getByText('noch 80,00 €')
  if ((await css(remaining, 'color')) !== 'rgb(201, 52, 0)') throw new Error('Warn-Textfarbe falsch: ' + (await css(remaining, 'color')))
  const fill = row('Lebensmittel').locator('.bar-fill')
  if ((await css(fill, 'backgroundColor')) !== 'rgb(255, 149, 0)' || (await fill.evaluate((el) => el.style.width)) !== '80%') throw new Error('Warn-Balken falsch')
  ok('Genau 80 % (320,00 € von 400,00 €): Status warn, „noch 80,00 €“ in #C93400, Balken #FF9500 mit 80 % Breite')


  // Start-Hinweis (warn), Tippen öffnet den Budgets-Tab
  await tab('Start').click()
  const alertCard = page.getByRole('button', { name: /80,0 % verbraucht/ })
  if ((await css(alertCard.getByText('80,0 % verbraucht · noch 80,00 €'), 'color')) !== 'rgb(201, 52, 0)') throw new Error('Start-Hinweis: Warnfarbe falsch')
  const startTxt = await bodyText()
  if (startTxt.indexOf('BUDGETS') < startTxt.indexOf('Kontostand') || startTxt.indexOf('BUDGETS') > startTxt.indexOf('LETZTE BUCHUNGEN')) throw new Error('Budget-Karte steht an der falschen Stelle')
  await alertCard.click()
  await expectText('Oktober 2026')
  if ((await tab('Budgets').getAttribute('aria-current')) !== 'page') throw new Error('Tippen auf den Hinweis wechselt nicht zu Budgets')
  ok('Start-Hinweis „Lebensmittel · 80,0 % verbraucht · noch 80,00 €“ (orange) zwischen Kontostand und Buchungen; Tippen öffnet den Budgets-Tab')

  // warn → over: +103,10 = 423,10 (105,8 %, 23,10 € drüber)
  await tab('Start').click()
  await addTx({ amount: '103,10', category: 'Lebensmittel', note: 'Nachkauf' })
  await tab('Budgets').click()
  await mustRow('Lebensmittel', 'Lebensmittel | 423,10 € von 400,00 € | 23,10 € drüber | 105,8 %', 'Lebensmittel drüber')
  remaining = row('Lebensmittel').getByText('23,10 € drüber')
  if ((await css(remaining, 'color')) !== 'rgb(215, 0, 21)') throw new Error('Over-Textfarbe falsch: ' + (await css(remaining, 'color')))
  if ((await css(fill, 'backgroundColor')) !== 'rgb(255, 59, 48)' || (await fill.evaluate((el) => el.style.width)) !== '100%') throw new Error('Over-Balken falsch')
  await tab('Start').click()
  await expectText('105,8 % · 23,10 € drüber')
  ok('Über Budget (423,10 € von 400,00 €): „23,10 € drüber“ in #D70015, Balken rot und auf 100 % gekappt, Start-Hinweis „105,8 % · 23,10 € drüber“')

  // Monatsnavigation
  await tab('Budgets').click()
  await page.getByRole('button', { name: 'Nächster Monat' }).click()
  await expectText('November 2026'); await expectText('Aktueller Monat')
  await mustRow('Lebensmittel', 'Lebensmittel | 0,00 € von 400,00 € | noch 400,00 € | 0,0 %', 'November')
  const novCount = (await bodyText()).split('0,00 € von 400,00 €').length - 1
  if (novCount !== 2) throw new Error('November: Gesamt + Zeile erwartet, gefunden ' + novCount)
  await page.getByRole('button', { name: 'Vorheriger Monat' }).click()
  await page.getByRole('button', { name: 'Vorheriger Monat' }).click()
  await expectText('September 2026')
  await mustRow('Lebensmittel', 'Lebensmittel | 0,00 € von 400,00 € | noch 400,00 € | 0,0 %', 'September')
  await page.getByRole('button', { name: 'Aktueller Monat' }).click()
  await expectText('Oktober 2026')
  await mustRow('Lebensmittel', 'Lebensmittel | 423,10 € von 400,00 € | 23,10 € drüber | 105,8 %', 'Zurück im Oktober')
  ok('Monatsnavigation: November 2026 „0,00 € von 400,00 €“ / „noch 400,00 €“, September ebenso, „Aktueller Monat“ springt zurück auf Oktober (423,10 €)')

  // Weitere Budgets: ok / warn / over nebeneinander
  await setBudget('Fixkosten', '1.700,00')
  await setBudget('Freizeit', '100')
  await mustRow('Fixkosten', 'Fixkosten | 1.600,00 € von 1.700,00 € | noch 100,00 € | 94,1 %', 'Fixkosten')
  await mustRow('Freizeit', 'Freizeit | 20,00 € von 100,00 € | noch 80,00 € | 20,0 %', 'Freizeit')
  // Gesamt: 423,10 + 1.600,00 + 20,00 = 2.043,10 von 2.200,00 → noch 156,90 €, 92,9 %
  const totalCard = page.locator('.budget-total')
  const tt = nbsp(await totalCard.innerText()).trim().replace(/\s*\n\s*/g, ' | ')
  if (tt !== 'Gesamt | noch 156,90 € | 2.043,10 € von 2.200,00 €') throw new Error('Gesamt-Karte: ' + tt)
  if (nbsp(await totalCard.getByRole('progressbar').getAttribute('aria-valuetext')) !== '92,9 % verbraucht') throw new Error('Gesamt-Progressbar')
  if ((await css(row('Freizeit').locator('.bar-fill'), 'backgroundColor')) !== 'rgb(52, 199, 89)') throw new Error('Ok-Balken falsch')
  if ((await css(row('Freizeit').getByText('noch 80,00 €'), 'color')) !== 'rgb(36, 138, 61)') throw new Error('Ok-Textfarbe falsch')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${SHOTS}/12-budgets.png`, fullPage: true })
  await tab('Start').click()
  await expectText('94,1 % verbraucht · noch 100,00 €')
  const alerts = nbsp(await page.getByRole('button', { name: /drüber/ }).innerText()).trim().replace(/\s*\n\s*/g, ' | ')
  if (alerts !== 'Lebensmittel | 105,8 % · 23,10 € drüber | Fixkosten | 94,1 % verbraucht · noch 100,00 €') throw new Error('Start-Hinweise/Sortierung: ' + alerts)
  await page.screenshot({ path: `${SHOTS}/13-start-budget-hinweis.png`, fullPage: true })
  ok('3 Budgets: Fixkosten 1.600,00 € von 1.700,00 € (94,1 %, warn), Freizeit 20,00 € von 100,00 € (ok, grün), Gesamt 2.043,10 € von 2.200,00 € / noch 156,90 €; Start-Hinweise nach Prozent sortiert (Freizeit ok → kein Hinweis)')

  // iPhone SE (375 px) Layout-Check
  await page.setViewportSize({ width: 375, height: 667 })
  await page.screenshot({ path: `${SHOTS}/13b-start-budget-hinweis-se.png`, fullPage: true })
  await tab('Budgets').click()
  await page.screenshot({ path: `${SHOTS}/12b-budgets-se.png`, fullPage: true })
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('Budgets: horizontaler Überlauf bei 375 px')
  await page.setViewportSize({ width: 390, height: 664 })

  // Persistenz
  await page.reload()
  await tab('Budgets').click()
  await mustRow('Lebensmittel', 'Lebensmittel | 423,10 € von 400,00 € | 23,10 € drüber | 105,8 %', 'Nach Reload')
  const st = await stored()
  if (st.version !== 3 || st.categories.find((c) => c.id === 'expense-lebensmittel').monthlyBudgetCents !== 40000 || st.categories.find((c) => c.id === 'income-gehalt').monthlyBudgetCents !== undefined)
    throw new Error('Gespeicherte Daten: Version/Budget falsch')
  ok('Budget bleibt nach Neuladen erhalten (gespeichert als Version 3, monthlyBudgetCents 40000)')

  // Entfernen
  for (const name of ['Fixkosten', 'Freizeit', 'Lebensmittel']) {
    await row(name).click()
    await page.getByRole('button', { name: 'Budget entfernen' }).click()
    await page.getByRole('dialog').waitFor({ state: 'detached' })
  }
  await mustRow('Fixkosten', 'Fixkosten | 1.600,00 € | Budget festlegen', 'Fixkosten ohne Budget')
  await mustRow('Lebensmittel', 'Lebensmittel | 423,10 € | Budget festlegen', 'Lebensmittel ohne Budget')
  await expectNoText('Gesamt'); await expectText('Tippe auf eine Kategorie, um ein Monatsbudget festzulegen.')
  await tab('Start').click()
  await expectNoText('BUDGETS')
  await mustBalance('−173,10 €', 'Kontostand 200,00 − 270,00 − 103,10')
  if ((await stored()).categories.some((c) => 'monthlyBudgetCents' in c)) throw new Error('Budget nicht entfernt')
  ok('Budgets entfernt: Zeilen zeigen wieder „Budget festlegen“ (423,10 € / 1.600,00 €), Hinweis-Text zurück, Start-Karte weg, keine monthlyBudgetCents mehr gespeichert')
}

// ---------- Monatsauswertung (Daten wie oben; Heute = 27.10.2026) ----------
// Oktober: Einnahmen Gehalt 2.500,00 · Ausgaben Wocheneinkauf 50,00 + Miete 800,00 (27.10.) + Miete-Regel 800,00 (01.10., ↻)
//   + Kino 20,00 + Futter 30,00 (Sonstiges) + Großeinkauf 270,00 + Nachkauf 103,10 = 2.073,10 → Saldo 426,90, Sparquote 17,1 %
// September: nur Miete-Regel 800,00 (↻); wir buchen zusätzlich Freizeit 50,00 (12.09.) → Ausgaben 850,00, Saldo −850,00
// August: nur Miete-Regel 800,00 (↻)
{
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('finanz-app:v1')))
  const flat = (s) => nbsp(s).trim().replace(/\s*\n\s*/g, ' | ')
  const after = (title) => page.locator('.section-title', { hasText: title }).locator('xpath=following-sibling::*[1]')
  const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop)
  const must = (actual, expected, what) => { if (actual !== expected) throw new Error(`${what}: erwartet "${expected}", war "${actual}"`) }
  const GREEN = 'rgb(36, 138, 61)', RED = 'rgb(215, 0, 21)'
  const noOverflow = async (what) => {
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`${what}: horizontaler Überlauf`)
  }

  await tab('Start').click()
  await addTx({ amount: '50,00', category: 'Freizeit', date: '2026-09-12', note: 'Konzert' })

  // Unabhängige Gegenrechnung aus localStorage
  const sumBy = (txs, kind, month, pred = () => true) =>
    txs.filter((t) => t.kind === kind && t.date.startsWith(month) && pred(t)).reduce((a, t) => a + t.amountCents, 0)
  const st0 = await stored()
  const oct = { inc: sumBy(st0.transactions, 'income', '2026-10'), exp: sumBy(st0.transactions, 'expense', '2026-10'), rec: sumBy(st0.transactions, 'expense', '2026-10', (t) => t.recurringId) }
  const sep = { inc: sumBy(st0.transactions, 'income', '2026-09'), exp: sumBy(st0.transactions, 'expense', '2026-09') }
  if (oct.inc !== 250000 || oct.exp !== 207310 || oct.rec !== 80000 || sep.inc !== 0 || sep.exp !== 85000) throw new Error('Monat: Ausgangsdaten stimmen nicht: ' + JSON.stringify({ oct, sep }))

  await tab('Monat').click()
  must(await tab('Monat').getAttribute('aria-current'), 'page', 'Tab Monat aktiv')
  must(await page.locator('h1').innerText(), 'Monat', 'Titel')
  await expectText('Oktober 2026'); await expectNoText('Aktueller Monat')
  must(flat(await page.locator('.summary').innerText()), 'Einnahmen | 2.500,00 € | Ausgaben | 2.073,10 € | Saldo | 426,90 €', 'Summary Oktober')
  must(flat(await page.locator('.summary-extra').innerText()), 'Sparquote | 17,1 % | davon wiederkehrend | 800,00 €', 'Sparquote / wiederkehrend')
  must(await css(page.locator('.summary .v').nth(0), 'color'), GREEN, 'Einnahmen grün')
  must(await css(page.locator('.summary .v').nth(1), 'color'), RED, 'Ausgaben rot')
  must(await css(page.locator('.summary .v').nth(2), 'color'), GREEN, 'Saldo ≥ 0 grün')
  must(await css(page.locator('.summary-extra .bar-head').nth(1), 'color'), 'rgba(60, 60, 67, 0.6)', 'wiederkehrend gedämpft')
  ok('Monat Oktober 2026: Einnahmen 2.500,00 €, Ausgaben 2.073,10 €, Saldo 426,90 € (grün), Sparquote 17,1 %, davon wiederkehrend 800,00 € (gedämpft); deckt sich mit localStorage')

  // Vergleich zum Vormonat (September: Einnahmen 0, Ausgaben 850,00, Saldo −850,00)
  const cmp = () => after('Vergleich zum Vormonat')
  const rows = async () => (await cmp().locator('li').allInnerTexts()).map(flat)
  must((await rows()).join(' // '), 'Einnahmen | Vormonat 0,00 € | ▲+2.500,00 € // Ausgaben | Vormonat 850,00 € | ▲+1.223,10 € // Saldo | Vormonat −850,00 € | ▲+1.276,90 €', 'Vergleich Oktober')
  must(await css(cmp().locator('.row-amount').nth(0), 'color'), GREEN, 'mehr Einnahmen = gut')
  must(await css(cmp().locator('.row-amount').nth(1), 'color'), RED, 'mehr Ausgaben = schlecht')
  must(await css(cmp().locator('.row-amount').nth(2), 'color'), GREEN, 'Saldo besser = gut')
  await expectText('ggü. September 2026')
  must(oct.exp - sep.exp, 122310, 'Delta Ausgaben aus localStorage'); must((oct.inc - oct.exp) - (sep.inc - sep.exp), 127690, 'Delta Saldo aus localStorage')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${SHOTS}/17-monat.png` })
  ok('Vergleich zum Vormonat: Einnahmen ▲+2.500,00 € (grün), Ausgaben ▲+1.223,10 € (rot), Saldo ▲+1.276,90 € (grün), „ggü. September 2026“')

  // Verlauf: 6 Gruppen, Einnahmen links / Ausgaben rechts
  const cols = page.locator('.trend-col')
  must(await cols.count(), 6, 'Anzahl Monatsgruppen')
  must((await page.locator('.trend-label').allInnerTexts()).join(' '), 'Mai Jun Jul Aug Sep Okt', 'Monatslabels')
  must(await css(page.locator('.trend-label').nth(5), 'fontWeight'), '700', 'gewählter Monat fett')
  must(await css(page.locator('.trend-label').nth(0), 'fontWeight'), '400', 'andere Monate nicht fett')
  const bars = async (i) => page.locator('.trend-col').nth(i).locator('.trend-bar').evaluateAll((els) => els.map((e) => ({ h: e.getBoundingClientRect().height, x: e.getBoundingClientRect().x, bg: getComputedStyle(e).backgroundColor, r: getComputedStyle(e).borderTopLeftRadius })))
  const [bMai, bAug, bOkt] = [await bars(0), await bars(3), await bars(5)]
  if (bMai[0].h !== 0 || bMai[1].h !== 0) throw new Error('Nullmonat zeigt einen Balken')
  if (bAug[0].h !== 0 || bAug[1].h <= 0) throw new Error('August: Einnahmen 0 → kein Balken, Ausgaben vorhanden')
  if (!(bOkt[0].x < bOkt[1].x) || bOkt[0].bg !== 'rgb(52, 199, 89)' || bOkt[1].bg !== 'rgb(255, 59, 48)') throw new Error('Reihenfolge/Farben Einnahmen links, Ausgaben rechts: ' + JSON.stringify(bOkt))
  if (bOkt[0].r !== '4px') throw new Error('Balken nicht oben gerundet')
  // gemeinsame Achse 0..3.000 €: 2.500 → 83,3 % und 2.073,10 → 69,1 % der Plot-Höhe (140 px)
  if (Math.abs(bOkt[0].h - 140 * 2500 / 3000) > 1 || Math.abs(bOkt[1].h - 140 * 2073.1 / 3000) > 1) throw new Error('Balkenhöhen passen nicht zur gemeinsamen Achse: ' + JSON.stringify(bOkt))
  const tickLabels = (await page.locator('.trend-line span').allInnerTexts()).map(nbsp)
  must(tickLabels.join(' '), '0 € 1.500 € 3.000 €', 'Achsenbeschriftung')
  if ((await cols.nth(0).boundingBox()).width < 44) throw new Error('Trefferfläche < 44 px')
  const legend = nbsp(await page.locator('.legend').innerText()).replace(/\s+/g, ' ')
  must(legend, 'Einnahmen Ausgaben', 'Legende')
  must(await css(page.locator('.legend span').nth(0), 'color'), 'rgb(0, 0, 0)', 'Legendentext in Normalfarbe')
  ok('Verlauf: 6 Gruppen Mai–Okt (Okt fett), Einnahmen links grün / Ausgaben rechts rot, Nullmonate ohne Balken, Höhen auf gemeinsamer Achse 0–3.000 €, Treffer ≥ 44 px, Legende')

  // Callout
  await expectText('Tippe auf einen Monat für Details.')
  await cols.nth(5).click()
  must(nbsp(await page.getByRole('status').innerText()), 'Oktober 2026 · Einnahmen 2.500,00 € · Ausgaben 2.073,10 € · Saldo 426,90 €', 'Callout Oktober')
  await cols.nth(4).click()
  must(nbsp(await page.getByRole('status').innerText()), 'September 2026 · Einnahmen 0,00 € · Ausgaben 850,00 € · Saldo −850,00 €', 'Callout September')
  must(await cols.nth(4).getAttribute('aria-pressed'), 'true', 'aria-pressed')
  await expectNoText('Tippe auf einen Monat für Details.')
  must(await page.getByRole('group', { name: /Einnahmen und Ausgaben pro Monat, Mai 2026 bis Oktober 2026/ }).count(), 1, 'Chart aria-label')
  must(await page.getByRole('button', { name: 'Oktober 2026 · Einnahmen 2.500,00 € · Ausgaben 2.073,10 € · Saldo 426,90 €' }).count(), 1, 'Gruppe als Button mit Beschriftung')
  // Tastatur: Fokus + Enter
  await cols.nth(3).focus(); await page.keyboard.press('Enter')
  must(nbsp(await page.getByRole('status').innerText()), 'August 2026 · Einnahmen 0,00 € · Ausgaben 800,00 € · Saldo −800,00 €', 'Callout August per Tastatur')
  await cols.nth(5).click()

  // Tabelle
  const table = (await page.locator('.trend-table tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => c.textContent.replace(/ /g, ' ')).join(' | '))))
  must(table.join(' // '), 'Okt 2026 | 2.500,00 € | 2.073,10 € | 426,90 € // Sep 2026 | 0,00 € | 850,00 € | −850,00 € // Aug 2026 | 0,00 € | 800,00 € | −800,00 € // Jul 2026 | 0,00 € | 0,00 € | 0,00 € // Jun 2026 | 0,00 € | 0,00 € | 0,00 € // Mai 2026 | 0,00 € | 0,00 € | 0,00 €', 'Tabelle')
  must((await page.locator('.trend-table thead th').allInnerTexts()).join(' '), 'Monat Einnahmen Ausgaben Saldo', 'Tabellenkopf')
  await page.locator('.trend-table').scrollIntoViewIfNeeded()
  await page.locator('.trend').evaluate((el) => el.scrollIntoView({ block: 'start' }))
  await page.evaluate(() => window.scrollBy(0, -90))
  await page.screenshot({ path: `${SHOTS}/18-monat-verlauf.png` })
  ok('Callout per Tippen/Tastatur („Oktober 2026 · Einnahmen 2.500,00 € · Ausgaben 2.073,10 € · Saldo 426,90 €“), Tabelle neueste zuerst Okt/Sep/Aug/Jul/Jun/Mai mit exakten Beträgen')

  // Kategorien
  const catRows = async (title) => (await after(title).locator('li').allInnerTexts()).map(flat)
  must((await catRows('Ausgaben nach Kategorie')).join(' // '), 'Fixkosten ▲ 800,00 € | 1.600,00 €77,2 % // Lebensmittel ▲ 423,10 € | 423,10 €20,4 % // Sonstiges ▲ 30,00 € | 30,00 €1,4 % // Freizeit ▼ 30,00 € | 20,00 €1,0 %', 'Ausgaben nach Kategorie')
  const fixDelta = after('Ausgaben nach Kategorie').locator('.delta')
  must(await css(fixDelta.nth(0), 'color'), RED, '▲ Kategorie rot'); must(await css(fixDelta.nth(3), 'color'), GREEN, '▼ Kategorie grün')
  const fills = await after('Ausgaben nach Kategorie').locator('.bar-fill').evaluateAll((els) => els.map((e) => e.style.width))
  if (fills[0] !== '100%' || Math.abs(parseFloat(fills[1]) - 26.4) > 0.1) throw new Error('Kategorie-Balken: ' + fills)
  must((await catRows('Einnahmen nach Kategorie')).join(' // '), 'Gehalt | 2.500,00 €100,0 %', 'Einnahmen nach Kategorie')
  await page.locator('.section-title', { hasText: 'Ausgaben nach Kategorie' }).evaluate((el) => el.scrollIntoView({ block: 'start' }))
  await page.evaluate(() => window.scrollBy(0, -16))
  await page.screenshot({ path: `${SHOTS}/19-monat-kategorien.png` })
  ok('Ausgaben nach Kategorie: Fixkosten 1.600,00 € 77,2 % (▲ 800,00 €), Lebensmittel 423,10 € 20,4 % (▲ 423,10 €), Sonstiges 30,00 € (▲ 30,00 €), Freizeit 20,00 € (▼ 30,00 € grün); Einnahmen: Gehalt 2.500,00 € 100,0 %')

  // Größte Ausgaben
  const top = after('Größte Ausgaben')
  must((await top.locator('.row-amount').allInnerTexts()).map(nbsp).join(' '), '−800,00 € −800,00 € −270,00 € −103,10 € −50,00 €', 'Größte Ausgaben Reihenfolge')
  must((await top.locator('.row-sub').allInnerTexts()).map(nbsp).join(' // '), 'Di, 27.10. · Miete // Do, 01.10. · Miete // Di, 27.10. · Großeinkauf // Di, 27.10. · Nachkauf // Di, 27.10. · Wocheneinkauf', 'Größte Ausgaben Details')
  must(await top.locator('[aria-label="wiederkehrend"]').count(), 1, 'Regel-Miete mit ↻')
  if ((await top.innerText()).includes('Kino')) throw new Error('Kino (20,00 €) gehört nicht in die Top 5')
  await top.locator('.row').first().click()
  await page.getByRole('dialog').waitFor()
  must(await page.inputValue('#tx-amount'), '800,00', 'Bearbeiten-Sheet öffnet')
  await page.keyboard.press('Escape'); await page.waitForTimeout(300)
  if (await page.getByRole('dialog').count()) await page.getByRole('button', { name: 'Abbrechen' }).first().click()
  ok('Größte Ausgaben: 800,00 (27.10.) vor 800,00 (01.10. ↻), 270,00, 103,10, 50,00; Kino fehlt; Tippen öffnet das Bearbeiten-Sheet')

  // Layout 375 px + Tab-Leiste
  await page.setViewportSize({ width: 375, height: 667 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await noOverflow('Monat 375 px')
  const tabbar = await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button').evaluateAll((els) =>
    els.map((b) => { const r = b.getBoundingClientRect(), l = b.querySelector('span').getBoundingClientRect(); return { t: b.innerText, w: r.width, h: r.height, l: l.left - r.left, rr: r.right - l.right, ls: b.querySelector('span').scrollWidth > b.querySelector('span').clientWidth + 1 } }))
  must(tabbar.map((t) => t.t).join(' '), 'Start Woche Monat Budgets Einstellungen', 'Reihenfolge der Tabs')
  for (const t of tabbar) if (t.w < 44 || t.h < 44 || t.l < 0 || t.rr < 0 || t.ls) throw new Error('Tab-Leiste 375 px: ' + JSON.stringify(t))
  await page.screenshot({ path: `${SHOTS}/21-tabbar-se.png` })
  await page.screenshot({ path: `${SHOTS}/17b-monat-se.png`, fullPage: true })
  await page.setViewportSize({ width: 390, height: 664 })
  ok('375 px: kein horizontaler Überlauf auf „Monat“, 5 Tabs (Start, Woche, Monat, Budgets, Einstellungen) ≥ 44 px, Beschriftungen nicht abgeschnitten')

  // Navigation: September, August, zurück
  await page.getByRole('button', { name: 'Vorheriger Monat' }).click()
  await expectText('September 2026'); await expectText('Aktueller Monat')
  must(flat(await page.locator('.summary').innerText()), 'Einnahmen | 0,00 € | Ausgaben | 850,00 € | Saldo | −850,00 €', 'Summary September')
  must(await css(page.locator('.summary .v').nth(2), 'color'), RED, 'Saldo < 0 rot')
  must(flat(await page.locator('.summary-extra').innerText()), 'davon wiederkehrend | 800,00 €', 'Sparquote bei Einnahmen 0 ausgeblendet')
  must((await rows()).join(' // '), 'Einnahmen | Vormonat 0,00 € | ±0,00 € // Ausgaben | Vormonat 800,00 € | ▲+50,00 € // Saldo | Vormonat −800,00 € | ▼−50,00 €', 'Vergleich September')
  must(await css(cmp().locator('.row-amount').nth(0), 'color'), 'rgba(60, 60, 67, 0.6)', '±0 gedämpft')
  must(await css(cmp().locator('.row-amount').nth(2), 'color'), RED, 'Saldo schlechter = schlecht')
  await expectText('ggü. August 2026'); await expectNoText('Einnahmen nach Kategorie')
  must((await catRows('Ausgaben nach Kategorie')).join(' // '), 'Fixkosten | 800,00 €94,1 % // Freizeit ▲ 50,00 € | 50,00 €5,9 %', 'Kategorien September (Fixkosten unverändert ohne Delta)')
  must((await page.locator('.trend-label').allInnerTexts()).join(' '), 'Apr Mai Jun Jul Aug Sep', 'Trend folgt dem Monat')
  await page.getByRole('button', { name: 'Vorheriger Monat' }).click()
  await expectText('August 2026'); await expectText('Keine Daten für Juli 2026')
  must(flat(await page.locator('.summary').innerText()), 'Einnahmen | 0,00 € | Ausgaben | 800,00 € | Saldo | −800,00 €', 'Summary August')
  await page.getByRole('button', { name: 'Aktueller Monat' }).click()
  await expectText('Oktober 2026'); await expectNoText('Aktueller Monat')
  must(flat(await page.locator('.summary').innerText()), 'Einnahmen | 2.500,00 € | Ausgaben | 2.073,10 € | Saldo | 426,90 €', 'Zurück im Oktober')
  ok('Navigation: September (Saldo −850,00 € rot, Sparquote weg, Vergleich ±0,00 / ▲+50,00 € / ▼−50,00 €), August („Keine Daten für Juli 2026“), „Aktueller Monat“ zurück auf Oktober')

  // Leerer Monat: Hinweis, Trend nur solange Daten im 6-Monats-Fenster liegen
  await page.getByRole('button', { name: 'Nächster Monat' }).click()
  await expectText('Keine Buchungen im November 2026.')
  await expectNoText('Vergleich zum Vormonat'); await expectNoText('Größte Ausgaben')
  must(await cols.count(), 6, 'Trend im leeren November weiterhin sichtbar')
  must((await page.locator('.trend-label').allInnerTexts()).join(' '), 'Jun Jul Aug Sep Okt Nov', 'Trend November')
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Nächster Monat' }).click()
  await expectText('April 2027'); await expectText('Keine Buchungen im April 2027.')
  must(await cols.count(), 0, 'Kein Trend ohne Daten im Fenster'); await expectNoText('Verlauf (6 Monate)')
  await page.getByRole('button', { name: 'Aktueller Monat' }).click()
  ok('Leerer Monat: „Keine Buchungen im November 2026.“ mit weiterhin sichtbarem Verlauf; April 2027 (keine Daten im Fenster) ohne Verlauf; Rückkehr auf Oktober')

  // Dark Mode
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${SHOTS}/20-monat-dark.png`, fullPage: true })
  must(await css(page.locator('.trend-bar').nth(10), 'backgroundColor'), 'rgb(48, 209, 88)', 'Dark: Einnahmen #30D158')
  must(await css(page.locator('.trend-bar').nth(11), 'backgroundColor'), 'rgb(255, 69, 58)', 'Dark: Ausgaben #FF453A')
  await page.emulateMedia({ colorScheme: 'light' })
  ok('Dark Mode: Balkenfarben Einnahmen #30D158 / Ausgaben #FF453A')

  // Persistenz nach Neuladen
  await page.reload(); await tab('Monat').click()
  must(flat(await page.locator('.summary').innerText()), 'Einnahmen | 2.500,00 € | Ausgaben | 2.073,10 € | Saldo | 426,90 €', 'Nach Reload')
  ok('Monat nach Neuladen unverändert (Oktober 2026, 426,90 € Saldo)')
}

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
  const nav2 = (name) => p2.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name, exact: true })
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
  await waitBal('−10,00 €')
  await p2.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await p2.clock.fastForward('01:00:00')
  await p2.waitForTimeout(300)
  let st = await stored()
  if (st.transactions.length !== 1 || st.transactions[0].date !== '2026-11-01' || st.transactions[0].amountCents !== 1000)
    throw new Error('Rollover: erwartet genau 1 Buchung am 01.11., war ' + JSON.stringify(st.transactions))
  ok('Rollover 31.10. → 01.11. (Timer): genau 1 Buchung über 10,00 €, Kontostand −10,00 €; weitere Timer/visibilitychange buchen nichts doppelt')

  await p2.clock.setSystemTime(new Date('2026-12-01T09:00:00+01:00'))
  await p2.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await waitBal('−20,00 €')
  await p2.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await p2.waitForTimeout(300)
  st = await stored()
  if (st.transactions.map((t) => t.date).join() !== '2026-11-01,2026-12-01') throw new Error('Rollover Dezember: ' + st.transactions.map((t) => t.date))
  ok('Rollover Monatswechsel (visibilitychange, 01.12.): Buchung für 01.12. genau einmal, Kontostand −20,00 €')

  await p2.reload()
  await waitBal('−20,00 €')
  st = await stored()
  if (st.transactions.length !== 2) throw new Error('Rollover: Neuladen hat doppelt gebucht')
  ok('Neuladen nach dem Datumswechsel bucht nichts doppelt (2 Buchungen, −20,00 €)')
  await ctx2.close()
}

await browser.close()
if (errors.length) { console.error('Konsolenfehler:\n' + errors.join('\n')); process.exit(1) }
console.log(`\nAlle ${step} Prüfungen bestanden, keine Konsolenfehler.`)
