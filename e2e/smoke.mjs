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
// Alle erwarteten Werte gehen von „heute = Di, 27.10.2026“ aus – Uhr festsetzen, damit der Test an jedem Tag läuft.
await page.clock.install({ time: new Date('2026-10-27T10:00:00+01:00') })
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(e.message))

const tab = (name) => page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name, exact: true })
const tabOn = (p, name) => p.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name, exact: true })
const bodyText = async () => nbsp(await page.locator('body').innerText())
async function expectText(t) {
  for (let i = 0; i < 20; i++) { if ((await bodyText()).includes(t)) return; await page.waitForTimeout(100) }
  throw new Error(`Text nicht gefunden: "${t}"`)
}
async function expectNoText(t) {
  if ((await bodyText()).includes(t)) throw new Error(`Text sollte fehlen: "${t}"`)
}
async function addTx({ kind = 'Ausgabe', amount, category, date, note, account }) {
  await page.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
  await page.getByRole('button', { name: kind, exact: true }).click()
  if (account) await page.getByRole('dialog').getByRole('button', { name: account, exact: true }).click()
  await page.fill('#tx-amount', amount)
  if (date) await page.fill('#tx-date', date)
  await page.selectOption('#tx-cat', { label: category })
  if (note) await page.fill('#tx-note', note)
  await page.getByRole('button', { name: 'Sichern' }).click()
}
// Zeilen der Start-Übersicht und die Unterseiten dahinter (Start → Alle Buchungen / Bargeld / Verträge)
// Push/Pop dauern ~300 ms; währenddessen liegen Übersicht und Unterseite gleichzeitig im DOM
const settled = (p = page) => p.waitForFunction(() => !document.querySelector('.stack[data-phase]:not([data-phase="idle"])'))
const hubRow = (name) => page.getByRole('button', { name: new RegExp(`^${name}`) })
async function openStartPage(name) {
  await tab('Start').click()
  await hubRow(name).click(); await settled()
  await page.getByRole('button', { name: 'Zurück', exact: true }).waitFor()
}
const openBookings = () => openStartPage('Alle Buchungen')
const openCash = () => openStartPage('Bargeld')
const openContracts = () => openStartPage('Verträge')
// Datensicherung: „Exportieren“ öffnet das Passwort-Sheet; unverschlüsselt geht es über „Ohne Passwort exportieren“ + Bestätigung
async function plainExport(p = page) {
  await p.getByRole('button', { name: 'Exportieren', exact: true }).click()
  await p.getByRole('dialog', { name: 'Backup exportieren' }).getByRole('button', { name: 'Ohne Passwort exportieren' }).click()
  const [d] = await Promise.all([p.waitForEvent('download'), p.getByRole('alertdialog').getByRole('button', { name: 'Unverschlüsselt exportieren' }).click()])
  return d
}
// Kontostand steht auf der Start-Übersicht – der Aufruf wechselt dorthin zurück
async function balance() {
  await tab('Start').click()
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
await page.getByRole('dialog').waitFor({ state: 'detached' }) // Sheets animieren beim Schließen aus
if ((await balance()) !== '2.642,00 €') throw new Error('Ungültige Buchung wurde gespeichert')
ok('Betrag 0 wird mit Fehlermeldung abgelehnt')

// Bearbeiten
await openBookings()
await page.getByRole('button', { name: /Wocheneinkauf/ }).click()
await page.fill('#tx-amount', '50,00')
await page.getByRole('button', { name: 'Sichern' }).click()
if ((await balance()) !== '2.637,99 €') throw new Error('Nach Bearbeiten falsch: ' + (await balance()))
ok('Bearbeiten 45,99 → 50,00, Kontostand 2.637,99 €')

// Löschen
await openBookings()
await page.getByRole('button', { name: /Mobilität/ }).first().click()
await page.getByRole('button', { name: 'Buchung löschen' }).click()
await page.getByRole('alertdialog').getByRole('button', { name: /Löschen/ }).click()
if ((await balance()) !== '2.650,00 €') throw new Error('Nach Löschen falsch: ' + (await balance()))
ok('Löschen 12,01, Kontostand 2.650,00 €')

// Kino liegt im selben Monat, aber in der Vorwoche – gehört in die Monatsauswertung
await addTx({ amount: '20', category: 'Freizeit', date: '2026-10-20', note: 'Kino' })
if ((await balance()) !== '2.630,00 €') throw new Error('Kino-Buchung: ' + (await balance()))

// Monatsübersicht (Summen, Prozent, Navigation; die Details folgen weiter unten)
await tab('Monat').click()
await expectText('Oktober 2026')
await expectText('2.500,00 €'); await expectText('870,00 €'); await expectText('1.630,00 €')
await expectText('92,0 %'); await expectText('5,7 %'); await expectText('2,3 %')
await expectText('Kino')
const mo = await bodyText()
const catPos = (n) => mo.indexOf(n, mo.indexOf('AUSGABEN NACH KATEGORIE'))
if (catPos('Fixkosten') < 0 || catPos('Fixkosten') > catPos('Lebensmittel') || catPos('Lebensmittel') > catPos('Freizeit')) throw new Error('Kategorie-Sortierung falsch')
await page.screenshot({ path: `${SHOTS}/4-monat.png`, fullPage: true })
ok('Monat Oktober 2026: Einnahmen 2.500, Ausgaben 870, Saldo 1.630, Fixkosten 92,0 %, Lebensmittel 5,7 %, Freizeit 2,3 % (Kino aus der Vorwoche zählt mit)')
await page.getByRole('button', { name: 'Vorheriger Monat' }).click()
await expectText('September 2026'); await expectText('Keine Buchungen im September 2026.')
await expectNoText('Miete'); await expectNoText('Kino')
ok('Pfeil zurück: September 2026 ist leer („Keine Buchungen im September 2026.“), keine Oktober-Buchungen sichtbar')
await page.getByRole('button', { name: 'Aktueller Monat' }).click()
await expectText('Oktober 2026'); await expectNoText('Aktueller Monat')
await page.getByRole('button', { name: 'Nächster Monat' }).click()
await expectText('November 2026'); await expectText('Keine Buchungen im November 2026.')
await page.getByRole('button', { name: 'Aktueller Monat' }).click()
await expectText('Oktober 2026')
ok('„Aktueller Monat“-Button und Pfeil vor (November 2026, leer) funktionieren')

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
await tab('Monat').click()
await expectNoText('Tiere')
await expectText('Futter')
const futter = page.locator('.section-title', { hasText: 'Alle Buchungen' }).locator('xpath=following-sibling::*[1]').locator('.row', { hasText: 'Futter' })
const futterText = nbsp(await futter.innerText()).replace(/\s*\n\s*/g, ' | ')
if (!/^Sonstiges \| .*Futter.* \| −30,00 €$/.test(futterText)) throw new Error('Futter nicht in Sonstiges: ' + futterText)
ok('Kategorie mit Buchung gelöscht → Buchung landet in Sonstiges (Monat → Alle Buchungen: Sonstiges, Futter, −30,00 €)')

// Persistenz
await page.reload(); await tab('Start').click()
if ((await balance()) !== '2.600,00 €') throw new Error('Nach Reload: ' + (await balance()))
ok('Daten nach Neuladen erhalten (Kontostand 2.600,00 €)')

// Export / Import
await tab('Einstellungen').click()
const dl = await plainExport()
const file = `${SHOTS}/../backup-test.json`
await dl.saveAs(file)
const json = JSON.parse(fs.readFileSync(file, 'utf8'))
if (dl.suggestedFilename() !== 'finanz-backup-2026-10-27.json' || json.transactions.length !== 5 || json.settings.startBalanceCents !== 100000)
  throw new Error('Export unvollständig ' + dl.suggestedFilename())
if (json.version !== 5 || json.settings.startCashCents !== 0 || json.transfers.length !== 0 || json.transactions.some((t) => t.account !== 'konto'))
  throw new Error('Export: Version 5 / Bargeld-Felder fehlen')
ok(`Export ${dl.suggestedFilename()}: Version 5, 5 Buchungen (alle auf dem Konto), Startguthaben 100000 Cent, Startbestand Bargeld 0, keine Umbuchungen`)
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

// ---------- Verschlüsselte Backups (Passwort-Sheets, AES-GCM + PBKDF2 600k) ----------
{
  const rawStore = () => page.evaluate(() => localStorage.getItem('finanz-app:v1'))
  const pwSheet = () => page.getByRole('dialog', { name: 'Backup exportieren' })
  await tab('Einstellungen').click()
  const before = await rawStore()
  const plain = JSON.parse(fs.readFileSync(file, 'utf8'))
  await page.getByRole('button', { name: 'Exportieren', exact: true }).click()
  await pwSheet().waitFor()
  await page.waitForTimeout(400) // Sheet ist eingeglitten
  await page.screenshot({ path: `${SHOTS}/42-backup-export-passwort.png` })
  // Eingabeprüfung: zu kurz, ungleich
  await page.fill('#bk-pw', 'kurz'); await page.fill('#bk-pw2', 'kurz')
  await pwSheet().getByRole('button', { name: 'Verschlüsselt exportieren' }).click()
  await expectText('Das Passwort braucht mindestens 10 Zeichen.')
  await page.fill('#bk-pw', 'GeheimesPasswort1'); await page.fill('#bk-pw2', 'GeheimesPasswort2')
  await pwSheet().getByRole('button', { name: 'Verschlüsselt exportieren' }).click()
  await expectText('Die Passwörter stimmen nicht überein.')
  if (await page.getByRole('alert').count() !== 1) throw new Error('Genau eine Fehlermeldung erwartet')
  ok('Verschlüsselter Export: zu kurzes Passwort („mindestens 10 Zeichen“) und ungleiche Wiederholung werden abgelehnt, Sheet bleibt offen')
  // Felder sind Passwortfelder mit new-password; Anzeigen-Knopf schaltet um
  if ((await page.getAttribute('#bk-pw', 'type')) !== 'password' || (await page.getAttribute('#bk-pw', 'autocomplete')) !== 'new-password') throw new Error('Passwortfeld falsch')
  await pwSheet().getByRole('button', { name: 'Passwort anzeigen' }).click()
  if ((await page.getAttribute('#bk-pw', 'type')) !== 'text') throw new Error('Anzeigen schaltet nicht um')
  await pwSheet().getByRole('button', { name: 'Passwort verbergen' }).click()
  // Export mit Passwort: Fortschritt, Dateiname, Inhalt
  await page.fill('#bk-pw2', 'GeheimesPasswort1')
  await page.evaluate(() => { window.__vibes = []; navigator.vibrate = (n) => { window.__vibes.push(n); return true } })
  const [encDl] = await Promise.all([page.waitForEvent('download'), pwSheet().getByRole('button', { name: 'Verschlüsselt exportieren' }).click()])
  if (encDl.suggestedFilename() !== 'finanz-backup-2026-10-27-verschluesselt.json') throw new Error('Dateiname: ' + encDl.suggestedFilename())
  const encFile = `${SHOTS}/../backup-test-verschluesselt.json`
  await encDl.saveAs(encFile)
  const encText = fs.readFileSync(encFile, 'utf8')
  const env = JSON.parse(encText)
  if (env.format !== 'finanzklar-encrypted' || env.version !== 1 || env.kdf.name !== 'PBKDF2' || env.kdf.hash !== 'SHA-256' || env.kdf.iterations !== 600000 || env.cipher.name !== 'AES-GCM' || !env.data)
    throw new Error('Umschlag: ' + encText.slice(0, 200))
  if (Buffer.from(env.kdf.salt, 'base64').length !== 16 || Buffer.from(env.cipher.iv, 'base64').length !== 12) throw new Error('Salt/IV Länge')
  const secrets = [...new Set(plain.transactions.map((t) => t.note).filter(Boolean))]
  if (!secrets.length) throw new Error('Testdaten ohne Notizen')
  for (const sec of secrets) if (encText.includes(sec)) throw new Error('Klartext in verschlüsselter Datei: ' + sec)
  for (const needle of ['amountCents', 'transactions', 'startBalanceCents', 'Lebensmittel', '100000']) if (encText.includes(needle)) throw new Error('Klartext: ' + needle)
  await pwSheet().waitFor({ state: 'detached' })
  await expectText('Verschlüsselte Sicherung wurde exportiert.')
  const vibes = await page.evaluate(() => window.__vibes)
  if (vibes.length !== 1) throw new Error('Haptik beim Export: ' + JSON.stringify(vibes))
  ok(`Verschlüsselter Export ${encDl.suggestedFilename()}: Umschlag finanzklar-encrypted v1, PBKDF2-SHA-256 600000, AES-GCM, Salt 16 / IV 12 Byte, kein Klartext (${secrets.length} Notizen, Beträge, Schlüsselnamen fehlen), Haptik 1×`)

  // Import: falsches Passwort → Fehler, Sheet bleibt, Daten unverändert
  await page.locator('input[type=file]').setInputFiles(encFile)
  const openSheet = page.getByRole('dialog', { name: 'Backup entschlüsseln' })
  await openSheet.waitFor()
  await page.waitForTimeout(400)
  await page.fill('#bk-open-pw', 'FalschesPasswort')
  await openSheet.getByRole('button', { name: 'Entschlüsseln' }).click()
  await page.getByRole('alert').filter({ hasText: 'Passwort falsch oder Datei beschädigt.' }).waitFor({ timeout: 15000 })
  await page.screenshot({ path: `${SHOTS}/43-backup-import-passwort.png` })
  if ((await page.getAttribute('#bk-open-pw', 'autocomplete')) !== 'current-password') throw new Error('autocomplete')
  if (await page.getByRole('alertdialog').count()) throw new Error('Bestätigung trotz falschem Passwort')
  if ((await rawStore()) !== before) throw new Error('Daten bei falschem Passwort verändert')
  if (!(await openSheet.isVisible())) throw new Error('Sheet nach falschem Passwort nicht mehr offen')
  await openSheet.getByRole('button', { name: 'Abbrechen' }).click()
  await openSheet.waitFor({ state: 'detached' })
  ok('Import verschlüsselt: falsches Passwort → „Passwort falsch oder Datei beschädigt.“, Sheet bleibt offen, Daten unverändert')
  // richtiges Passwort → „Alle Daten ersetzen?“ → Daten exakt wie vorher
  await tab('Start').click()
  await addTx({ amount: '777', category: 'Sonstiges', note: 'Nach dem Export' })
  await tab('Einstellungen').click()
  if ((await rawStore()) === before) throw new Error('Testbuchung fehlt')
  await page.locator('input[type=file]').setInputFiles(encFile)
  await openSheet.waitFor()
  await page.fill('#bk-open-pw', 'GeheimesPasswort1')
  await openSheet.getByRole('button', { name: 'Entschlüsseln' }).click()
  await page.getByRole('alertdialog', { name: 'Alle Daten ersetzen?' }).waitFor({ timeout: 15000 })
  await openSheet.waitFor({ state: 'detached' })
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ersetzen' }).click()
  await expectText('Import erfolgreich: 5 Buchungen')
  if ((await rawStore()) !== before) throw new Error('Daten nach verschlüsseltem Import nicht identisch')
  ok('Import verschlüsselt: richtiges Passwort → „Alle Daten ersetzen?“ → Ersetzen; gespeicherte Daten sind byte-genau wie vor dem Export')
  // beschädigte verschlüsselte Datei
  const broken = JSON.stringify({ ...env, kdf: { ...env.kdf, iterations: 1000 } })
  fs.writeFileSync(`${SHOTS}/../kaputt.json`, broken)
  await page.locator('input[type=file]').setInputFiles(`${SHOTS}/../kaputt.json`)
  await openSheet.waitFor()
  await page.fill('#bk-open-pw', 'GeheimesPasswort1')
  await openSheet.getByRole('button', { name: 'Entschlüsseln' }).click()
  await page.getByRole('alert').filter({ hasText: 'Die Datei ist beschädigt.' }).waitFor({ timeout: 5000 })
  await openSheet.getByRole('button', { name: 'Abbrechen' }).click()
  await openSheet.waitFor({ state: 'detached' })
  ok('Import verschlüsselt: Datei mit manipulierten Parametern (Iterationen 1000) → „Die Datei ist beschädigt.“, Abbrechen schließt')
  // unverschlüsselt weiterhin möglich: Warnung, Dateiname unverändert
  await page.getByRole('button', { name: 'Exportieren', exact: true }).click()
  await pwSheet().getByRole('button', { name: 'Ohne Passwort exportieren' }).click()
  const warn = page.getByRole('alertdialog')
  await warn.waitFor()
  await expectText('Die Datei ist dann für jeden lesbar, der sie öffnet (z. B. in iCloud oder als Mail-Anhang). Trotzdem unverschlüsselt exportieren?')
  await warn.getByRole('button', { name: 'Abbrechen' }).click(); await warn.waitFor({ state: 'detached' })
  await pwSheet().waitFor()
  await pwSheet().getByRole('button', { name: 'Ohne Passwort exportieren' }).click()
  const [plainDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('alertdialog').getByRole('button', { name: 'Unverschlüsselt exportieren' }).click()])
  if (plainDl.suggestedFilename() !== 'finanz-backup-2026-10-27.json') throw new Error('Dateiname: ' + plainDl.suggestedFilename())
  JSON.parse(fs.readFileSync(await plainDl.path(), 'utf8')).transactions.length === 5 || (() => { throw new Error('Klartext-Export') })()
  await pwSheet().waitFor({ state: 'detached' })
  // ältere Klartext-Datei (ohne Passwortabfrage)
  await page.locator('input[type=file]').setInputFiles(file)
  await page.getByRole('alertdialog', { name: 'Alle Daten ersetzen?' }).waitFor()
  if (await page.getByRole('dialog', { name: 'Backup entschlüsseln' }).count()) throw new Error('Passwortabfrage für Klartext-Datei')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ersetzen' }).click()
  await expectText('Import erfolgreich: 5 Buchungen')
  ok('Ohne Passwort exportieren: Warnung (Abbrechen kehrt zurück), danach Klartext-Datei finanz-backup-2026-10-27.json; ältere Klartext-Backups importieren weiter ohne Passwortabfrage')
  // Dunkel-Screenshot
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.getByRole('button', { name: 'Exportieren', exact: true }).click()
  await pwSheet().waitFor(); await page.waitForTimeout(400)
  await page.fill('#bk-pw', 'GeheimesPasswort1')
  await page.screenshot({ path: `${SHOTS}/44-backup-export-dunkel.png` })
  await page.keyboard.press('Escape'); await pwSheet().waitFor({ state: 'detached' })
  await page.emulateMedia({ colorScheme: 'light' })
  await tab('Start').click()
}

// Offline
await ctx.setOffline(true)
await page.reload()
await tab('Monat').click()
await expectText('Oktober 2026'); await expectText('ALLE BUCHUNGEN'); await expectText('Futter')
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

// ---------- Verträge = wiederkehrende Buchungen (Datum der Umgebung: 2026-10-27, Stand vorher 2.600,00 €) ----------
// Erreichbar über Start → Verträge. Gebuchte Einträge sieht man unter Start → Alle Buchungen.
const txCount = () => page.locator('[aria-label="wiederkehrend"]').count()
async function addRule({ kind = 'Ausgabe', amount, category, note, interval, day, start, end }) {
  await page.getByRole('button', { name: 'Vertrag hinzufügen' }).click()
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
const flatText = (s) => nbsp(s).trim().replace(/\s*\n\s*/g, ' | ')
const fixedCosts = async () => nbsp(await page.getByTestId('fixed-costs').innerText())
const mustFixed = async (expected, count, what) => {
  const f = await fixedCosts()
  if (f !== expected) throw new Error(`${what}: Fixkosten pro Monat erwartet ${expected}, war ${f}`)
  await expectText(count)
}

await openContracts()
await expectText('Fixkosten pro Monat'); await expectText('Keine aktiven Verträge'); await expectText('Noch keine Verträge.')
await mustFixed('0,00 €', 'Keine aktiven Verträge', 'Ohne Verträge')
await addRule({ amount: '800', category: 'Fixkosten', note: 'Miete', start: '2026-08-01' })
await page.getByRole('alertdialog').waitFor()
await expectText('Vergangene Termine nachbuchen?'); await expectText('3 Termine seit 01.08.2026 liegen in der Vergangenheit.')
await page.getByRole('alertdialog').getByRole('button', { name: 'Nachbuchen' }).click()
await expectText('monatlich am 1.'); await expectText('nächste: 01.11.')
await mustFixed('800,00 €', '1 aktiver Vertrag', 'Miete')
await mustBalance('200,00 €', 'Nach Nachbuchen (2.600 − 3 × 800)')
await openBookings()
for (const d of ['Sa, 01.08.', 'Di, 01.09.', 'Do, 01.10.']) await expectText(d)
if ((await txCount()) !== 3) throw new Error('Erwartet 3 Buchungen mit ↻, gefunden: ' + (await txCount()))
ok('Vertrag „Miete“ 800,00 € ab 01.08. (Start → Verträge, „Fixkosten pro Monat“ 800,00 €): Dialog „3 Termine“, Nachbuchen → Kontostand genau −2.400,00 € (200,00 €), 3 Buchungen mit ↻ unter Alle Buchungen')

// Miete ist am 01.11. fällig (innerhalb von 7 Tagen) → „Demnächst fällig“
await tab('Start').click()
await expectText('DEMNÄCHST FÄLLIG'); await expectText('So, 01.11.')
if (flatText(await hubRow('Verträge').innerText()) !== 'Verträge | 1 · 800,00 €/Monat') throw new Error('Hub Verträge: ' + flatText(await hubRow('Verträge').innerText()))

// Gehalt am 30., Start heute: kein Dialog, nichts gebucht – und Gehalt steht NICHT in „Demnächst fällig“
await openContracts()
await addRule({ kind: 'Einnahme', amount: '2.000,00', category: 'Gehalt', note: 'Gehalt', day: '30', start: '2026-10-27' })
await page.getByRole('alertdialog').waitFor({ timeout: 500 }).then(() => { throw new Error('Dialog trotz keiner vergangenen Termine') }, () => {})
await expectText('Gehalt'); await expectText('nächste: 30.10.')
await mustFixed('800,00 €', '2 aktive Verträge', 'Gehalt zählt nicht zu den Fixkosten')
await mustBalance('200,00 €', 'Nach Gehalt-Regel (noch nichts fällig)')
await expectNoText('Fr, 30.10.'); await expectNoText('+2.000,00 €')
// Nebeneinkünfte am 29. (Einnahme, aber nicht Gehalt) erscheint dagegen
await openContracts()
await addRule({ kind: 'Einnahme', amount: '150,00', category: 'Nebeneinkünfte', note: 'Nachhilfe', day: '29', start: '2026-10-27' })
await page.getByRole('alertdialog').waitFor({ timeout: 500 }).then(() => { throw new Error('Dialog trotz keiner vergangenen Termine') }, () => {})
await mustBalance('200,00 €', 'Nach Nebeneinkünfte-Regel')
await expectText('Do, 29.10.'); await expectText('+150,00 €')
await expectNoText('Fr, 30.10.'); await expectNoText('+2.000,00 €')
const startText = await bodyText()
if (startText.indexOf('Do, 29.10.') > startText.indexOf('So, 01.11.')) throw new Error('„Demnächst fällig“ nicht nach Datum sortiert')
if (startText.indexOf('DEMNÄCHST FÄLLIG') < startText.indexOf('Kontostand') || startText.indexOf('DEMNÄCHST FÄLLIG') > startText.indexOf('Alle Buchungen'))
  throw new Error('„Demnächst fällig“ steht an der falschen Stelle')
if (startText.includes('LETZTE BUCHUNGEN')) throw new Error('„Letzte Buchungen“ gehört nicht mehr auf den Start')
await page.screenshot({ path: `${SHOTS}/11-start-demnaechst.png`, fullPage: true })
ok('Gehalt-Vertrag (Tag 30, Start heute): kein Dialog, Kontostand unverändert, NICHT in „Demnächst fällig“ und nicht in den Fixkosten; Nebeneinkünfte-Vertrag (Tag 29) steht dort: Do, 29.10. +150,00 € vor So, 01.11. Miete −800,00 €')

// „Nur künftige“: 15. monatlich ab 15.09. → 2 vergangene Termine werden übersprungen
await openContracts()
await addRule({ amount: '9,99', category: 'Freizeit', note: 'Streaming', day: '15', start: '2026-09-15' })
await expectText('2 Termine seit 15.09.2026 liegen in der Vergangenheit.')
await page.getByRole('alertdialog').getByRole('button', { name: 'Nur künftige' }).click()
await expectText('Streaming'); await expectText('nächste: 15.11.')
await mustBalance('200,00 €', 'Nach „Nur künftige“')
await openBookings()
if ((await txCount()) !== 3) throw new Error('„Nur künftige“ hat gebucht')
ok('„Nur künftige“: 2 vergangene Termine übersprungen, Kontostand unverändert, nächste: 15.11.')

// Vierteljährlicher Vertrag: 100,00 € pro Quartal = 33,33 € pro Monat (gerundet)
await openContracts()
await addRule({ amount: '100,00', category: 'Fixkosten', note: 'Versicherung', interval: 'Vierteljährlich', day: '15', start: '2026-11-15' })
await expectText('vierteljährlich am 15.'); await expectText('nächste: 15.11.')
// 800,00 + 9,99 + 33,33 = 843,32 (Gehalt und Nachhilfe sind Einnahmen und zählen nicht)
await mustFixed('843,32 €', '5 aktive Verträge', 'Fixkosten mit vierteljährlichem Vertrag')
await page.waitForTimeout(300)
await page.screenshot({ path: `${SHOTS}/27-vertraege.png`, fullPage: true })
await page.setViewportSize({ width: 375, height: 667 })
await page.screenshot({ path: `${SHOTS}/27b-vertraege-se.png`, fullPage: true })
if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('Verträge: horizontaler Überlauf bei 375 px')
await page.setViewportSize({ width: 390, height: 664 })
await tab('Start').click()
if (flatText(await hubRow('Verträge').innerText()) !== 'Verträge | 5 · 843,32 €/Monat') throw new Error('Hub Verträge: ' + flatText(await hubRow('Verträge').innerText()))
ok('Verträge-Übersicht: „Fixkosten pro Monat“ 843,32 € = 800,00 + 9,99 + 33,33 (Quartal 100,00 € ÷ 3 gerundet), 5 aktive Verträge; Start-Zeile „5 · 843,32 €/Monat“')

// Formular-Screenshot
await openContracts()
await page.getByRole('button', { name: /Miete.*monatlich am 1\./ }).click()
await page.waitForTimeout(500) // Sheet-Animation abwarten
await page.screenshot({ path: `${SHOTS}/10-formular-wiederkehrend.png` })

// Bearbeiten: Betrag nur für die Zukunft
await page.fill('#rc-amount', '850,00')
await page.getByRole('button', { name: 'Sichern' }).click()
await expectText('−850,00 €')
await mustFixed('893,32 €', '5 aktive Verträge', 'Fixkosten nach Bearbeiten') // 850,00 + 9,99 + 33,33
await mustBalance('200,00 €', 'Nach Bearbeiten der Regel')
const countIn = async (needle) => (await bodyText()).split(needle).length - 1
if ((await countIn('−850,00 €')) !== 1) throw new Error('Erwartet 1 × −850,00 € (fällig am 01.11.) in „Demnächst fällig“')
await openBookings()
if ((await countIn('−800,00 €')) !== 4 || (await countIn('−850,00 €')) !== 0) throw new Error('Erwartet 4 × −800,00 € (3 gebucht + manuelle Miete) und keine −850,00 € bei den Buchungen, war ' + (await countIn('−800,00 €')) + ' / ' + (await countIn('−850,00 €')))
if ((await txCount()) !== 3) throw new Error('Bearbeiten hat Buchungen verändert')
ok('Vertrag Miete auf 850,00 € geändert (Fixkosten 893,32 €): 3 gebuchte Einträge bleiben bei 800,00 €, nur der nächste Termin (01.11.) zeigt 850,00 €')

// Löschen: Buchungen bleiben
await openContracts()
for (const name of [/Streaming/, /Miete.*monatlich/, /Gehalt.*monatlich/, /Nachhilfe/, /Versicherung/]) {
  await page.getByRole('button', { name }).click()
  await page.getByRole('button', { name: 'Löschen', exact: true }).click()
  await expectText('Bereits gebuchte Einträge bleiben erhalten.')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click()
}
await expectText('Noch keine Verträge.')
await mustFixed('0,00 €', 'Keine aktiven Verträge', 'Nach Löschen')
await tab('Start').click()
await expectNoText('DEMNÄCHST FÄLLIG')
if (flatText(await hubRow('Verträge').innerText()) !== 'Verträge | Keine') throw new Error('Hub Verträge ohne Verträge: ' + flatText(await hubRow('Verträge').innerText()))
await mustBalance('200,00 €', 'Nach Löschen der Regeln')
await openBookings()
if ((await txCount()) !== 3) throw new Error('Gebuchte Einträge sind nach Löschen der Regel weg')
ok('Verträge gelöscht: 3 gebuchte Einträge (↻) und Kontostand 200,00 € bleiben, „Demnächst fällig“ verschwindet, Start-Zeile „Keine“')

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
  if (startTxt.indexOf('BUDGETS') < startTxt.indexOf('Kontostand') || startTxt.indexOf('BUDGETS') > startTxt.indexOf('Alle Buchungen')) throw new Error('Budget-Karte steht an der falschen Stelle')
  await alertCard.click()
  await expectText('Oktober 2026')
  if ((await tab('Budgets').getAttribute('aria-current')) !== 'page') throw new Error('Tippen auf den Hinweis wechselt nicht zu Budgets')
  ok('Start-Hinweis „Lebensmittel · 80,0 % verbraucht · noch 80,00 €“ (orange) zwischen Kontostand und der Übersichtsliste; Tippen öffnet den Budgets-Tab')

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
  if (st.version !== 5 || st.categories.find((c) => c.id === 'expense-lebensmittel').monthlyBudgetCents !== 40000 || st.categories.find((c) => c.id === 'income-gehalt').monthlyBudgetCents !== undefined)
    throw new Error('Gespeicherte Daten: Version/Budget falsch')
  ok('Budget bleibt nach Neuladen erhalten (gespeichert als Version 5, monthlyBudgetCents 40000)')

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
  await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'detached' })
  if (await page.getByRole('dialog').count()) await page.getByRole('button', { name: 'Abbrechen' }).first().click()
  ok('Größte Ausgaben: 800,00 (27.10.) vor 800,00 (01.10. ↻), 270,00, 103,10, 50,00; Kino fehlt; Tippen öffnet das Bearbeiten-Sheet')

  // Alle Buchungen: Oktober komplett, neueste zuerst (Datum absteigend, am selben Tag zuletzt angelegte zuerst)
  const all = after('Alle Buchungen')
  const allSubs = async () => (await all.locator('.row-sub').allInnerTexts()).map(nbsp).join(' // ')
  const allAmounts = async () => (await all.locator('.row-amount').allInnerTexts()).map(nbsp).join(' ')
  const octSorted = [...(await stored()).transactions].filter((t) => t.date.startsWith('2026-10'))
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : b.createdAt - a.createdAt))
  must(await all.locator('.row').count(), 8, 'Anzahl Buchungen im Oktober')
  must(octSorted.length, 8, 'Anzahl Buchungen im Oktober laut localStorage')
  must(await allAmounts(), '−103,10 € −270,00 € −30,00 € −800,00 € −50,00 € +2.500,00 € −20,00 € −800,00 €', 'Alle Buchungen Beträge')
  must(await allSubs(), 'Di, 27.10. · Nachkauf // Di, 27.10. · Großeinkauf // Di, 27.10. · Futter // Di, 27.10. · Miete // Di, 27.10. · Wocheneinkauf // Di, 27.10. · Oktober // Di, 20.10. · Kino // Do, 01.10. · Miete', 'Alle Buchungen Reihenfolge')
  must(octSorted.map((t) => t.amountCents).join(' '), '10310 27000 3000 80000 5000 250000 2000 80000', 'Sortierung deckt sich mit localStorage')
  must(await all.locator('[aria-label="wiederkehrend"]').count(), 1, 'Nur die Regel-Miete trägt ↻')
  const allTop = await all.locator('.row').first().boundingBox()
  const topBottom = await after('Größte Ausgaben').boundingBox()
  if (allTop.y < topBottom.y + topBottom.height) throw new Error('„Alle Buchungen“ steht nicht unter „Größte Ausgaben“')
  await all.locator('.row').nth(6).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${SHOTS}/22-monat-alle-buchungen.png` })
  await all.locator('.row', { hasText: 'Kino' }).click()
  await page.getByRole('dialog').waitFor()
  must(await page.inputValue('#tx-amount'), '20,00', 'Kino: Betrag im Sheet'); must(await page.inputValue('#tx-date'), '2026-10-20', 'Kino: Datum im Sheet'); must(await page.inputValue('#tx-note'), 'Kino', 'Kino: Notiz im Sheet')
  await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'detached' })
  if (await page.getByRole('dialog').count()) await page.getByRole('button', { name: 'Abbrechen' }).first().click()
  ok('Alle Buchungen (unter „Größte Ausgaben“): 8 Einträge neueste zuerst −103,10 / −270,00 / −30,00 / −800,00 / −50,00 / +2.500,00 (27.10.), −20,00 (20.10.), −800,00 ↻ (01.10.); Tippen auf Kino öffnet das Bearbeiten-Sheet (20,00, 2026-10-20)')

  // Plus-Button: heute im aktuellen Monat, 1. des Monats in einem anderen Monat
  const fab = page.getByRole('button', { name: 'Buchung hinzufügen', exact: true })
  const openFab = async () => { await fab.click(); await page.getByRole('dialog').waitFor() }
  const closeSheet = async () => {
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'detached' })
  }
  await openFab(); must(await page.inputValue('#tx-date'), '2026-10-27', 'Plus im aktuellen Monat: heute'); await closeSheet()
  await page.getByRole('button', { name: 'Vorheriger Monat' }).click()
  await expectText('September 2026')
  await openFab(); must(await page.inputValue('#tx-date'), '2026-09-01', 'Plus im September: 1. des Monats'); await closeSheet()
  await page.getByRole('button', { name: 'Nächster Monat' }).click(); await page.getByRole('button', { name: 'Nächster Monat' }).click()
  await expectText('November 2026')
  await openFab(); must(await page.inputValue('#tx-date'), '2026-11-01', 'Plus im November: 1. des Monats'); await closeSheet()
  ok('Plus-Button auf „Monat“: Datum vorbelegt mit 2026-10-27 (aktueller Monat), 2026-09-01 (September), 2026-11-01 (November)')

  // September: Alle Buchungen zeigt Konzert vor der Regel-Miete
  await page.getByRole('button', { name: 'Vorheriger Monat' }).click(); await page.getByRole('button', { name: 'Vorheriger Monat' }).click()
  await expectText('September 2026')
  must(await allAmounts(), '−50,00 € −800,00 €', 'Alle Buchungen September Beträge')
  must(await allSubs(), 'Sa, 12.09. · Konzert // Di, 01.09. · Miete', 'Alle Buchungen September Reihenfolge')
  await page.getByRole('button', { name: 'Aktueller Monat' }).click()
  await expectText('Oktober 2026')
  ok('Alle Buchungen im September: Konzert −50,00 € (12.09.) vor Miete −800,00 € ↻ (01.09.)')

  // Layout 375 px + Tab-Leiste
  await page.setViewportSize({ width: 375, height: 667 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await noOverflow('Monat 375 px')
  const tabbar = await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button').evaluateAll((els) =>
    els.map((b) => { const r = b.getBoundingClientRect(), l = b.querySelector('span').getBoundingClientRect(); return { t: b.innerText, w: r.width, h: r.height, l: l.left - r.left, rr: r.right - l.right, ls: b.querySelector('span').scrollWidth > b.querySelector('span').clientWidth + 1 } }))
  must(tabbar.map((t) => t.t).join(' '), 'Start Monat Budgets Einstellungen', 'Reihenfolge der Tabs')
  must(await tab('Woche').count(), 0, 'Kein Tab „Woche“ mehr')
  const widths = tabbar.map((t) => t.w)
  if (Math.max(...widths) - Math.min(...widths) > 1 || Math.abs(widths.reduce((a, b) => a + b, 0) - 375) > 1) throw new Error('Tabs nicht gleichmäßig auf 375 px verteilt: ' + widths)
  for (const t of tabbar) if (t.w < 44 || t.h < 44 || t.l < 0 || t.rr < 0 || t.ls) throw new Error('Tab-Leiste 375 px: ' + JSON.stringify(t))
  await page.screenshot({ path: `${SHOTS}/23-tabbar-4.png` })
  await page.screenshot({ path: `${SHOTS}/17b-monat-se.png`, fullPage: true })
  await page.setViewportSize({ width: 390, height: 664 })
  ok('375 px: kein horizontaler Überlauf auf „Monat“, 4 Tabs (Start, Monat, Budgets, Einstellungen) gleich breit (je 93,75 px), ≥ 44 px, kein Tab „Woche“, Beschriftungen nicht abgeschnitten')

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

// ---------- Start-Übersicht, Alle Buchungen, Bargeld (Stand: 11 Buchungen, Konto −223,10 €) ----------
// Oktober 8 Buchungen, September 2 (Konzert, Miete ↻), August 1 (Miete ↻). Konto: 1.000 + 2.500 − 3 × 800 − 800 − 20 − 30 − 50 − 270 − 103,10 − 50 = −223,10.
{
  const flat = (s) => nbsp(s).trim().replace(/\s*\n\s*/g, ' | ')
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('finanz-app:v1')))
  const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop)
  const must = (actual, expected, what) => { if (actual !== expected) throw new Error(`${what}: erwartet "${expected}", war "${actual}"`) }
  const RED = 'rgb(215, 0, 21)', INK = 'rgb(0, 0, 0)'
  const noOverflow = async (what) => {
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`${what}: horizontaler Überlauf`)
  }
  const sub = async () => nbsp(await page.getByTestId('balance-sub').innerText())
  const mustHub = async (konto, cash, total, what) => {
    must(await balance(), konto, `${what}: Kontostand`)
    must(await sub(), `Bargeld ${cash} · Gesamt ${total}`, `${what}: Bargeld/Gesamt`)
  }
  const cashBal = async () => nbsp(await page.getByTestId('cash-balance').innerText())
  const monthSum = async () => {
    await tab('Monat').click()
    await expectText('Oktober 2026')
    return flat(await page.locator('.summary').innerText())
  }
  const heads = async () => (await page.locator('.month-head').allInnerTexts()).map(flat).join(' // ')
  const rowCount = () => page.locator('main .list .row').count()
  const dlg = () => page.getByRole('dialog')
  const search_ = (q) => page.getByRole('searchbox', { name: 'Suchen' }).fill(q)
  const pressed = async (name) => (await dlg().getByRole('button', { name, exact: true }).getAttribute('aria-pressed')) === 'true'
  const closeSheet = async () => {
    await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'detached' })
    if (await dlg().count()) await page.getByRole('button', { name: 'Abbrechen' }).first().click()
    await dlg().waitFor({ state: 'detached' })
  }

  // --- Start-Übersicht ---
  await tab('Start').click()
  must(await page.locator('h1').innerText(), 'Finanzklar', 'Titel')
  await mustHub('−223,10 €', '0,00 €', '−223,10 €', 'Start-Übersicht')
  must(flat(await hubRow('Alle Buchungen').innerText()), 'Alle Buchungen | 11', 'Zeile Alle Buchungen')
  must(flat(await hubRow('Bargeld').innerText()), 'Bargeld | 0,00 €', 'Zeile Bargeld')
  must(flat(await hubRow('Verträge').innerText()), 'Verträge | Keine', 'Zeile Verträge')
  for (const n of ['Alle Buchungen', 'Bargeld', 'Verträge']) if ((await hubRow(n).boundingBox()).height < 44) throw new Error(`Zeile ${n} < 44 px hoch`)
  await expectNoText('Letzte Buchungen'); await expectNoText('LETZTE BUCHUNGEN')
  ok('Start-Übersicht: Kontostand −223,10 €, „Bargeld 0,00 € · Gesamt −223,10 €“, Zeilen „Alle Buchungen 11“, „Bargeld 0,00 €“, „Verträge Keine“ (je ≥ 44 px), keine „Letzte Buchungen“')

  // --- Alle Buchungen ---
  await hubRow('Alle Buchungen').click(); await settled()
  must(await page.locator('h1').innerText(), 'Alle Buchungen', 'Titel Unterseite')
  must(await page.getByRole('button', { name: 'Zurück', exact: true }).innerText(), 'Start', 'Zurück-Knopf zeigt „Start“')
  if ((await page.getByRole('button', { name: 'Zurück', exact: true }).boundingBox()).height < 44) throw new Error('Zurück-Knopf < 44 px')
  must(await heads(), 'Oktober 2026 | 8 Einträge // September 2026 | 2 Einträge // August 2026 | 1 Eintrag', 'Monatsköpfe')
  must(await rowCount(), 11, 'Anzahl Zeilen')
  const ams = (await page.locator('main .row-amount').allInnerTexts()).map(nbsp).join(' ')
  must(ams, '−103,10 € −270,00 € −30,00 € −800,00 € −50,00 € +2.500,00 € −20,00 € −800,00 € −50,00 € −800,00 € −800,00 €', 'Reihenfolge neueste zuerst über alle Monate')
  const search = page.getByRole('searchbox', { name: 'Suchen' })
  must(await search.getAttribute('placeholder'), 'Suchen', 'Platzhalter')

  await search.fill('Kino')
  must(await rowCount(), 1, 'Suche „Kino“'); must(await heads(), 'Oktober 2026 | 1 Eintrag', 'Kopf bei „Kino“')
  await search.fill('kINO')
  must(await rowCount(), 1, 'Suche Groß/Klein')
  await search.fill('800')
  must(await rowCount(), 4, 'Suche „800“ (Mieten)')
  must((await page.locator('main .row-amount').allInnerTexts()).map(nbsp).join(' '), '−800,00 € −800,00 € −800,00 € −800,00 €', 'Beträge bei „800“')
  must((await page.locator('main .row-sub').allInnerTexts()).map(nbsp).join(' // '), 'Di, 27.10. · Miete // Do, 01.10. · Miete // Di, 01.09. · Miete // Sa, 01.08. · Miete', 'Zeilen bei „800“')
  must(await heads(), 'Oktober 2026 | 2 Einträge // September 2026 | 1 Eintrag // August 2026 | 1 Eintrag', 'Köpfe bei „800“')
  await search.fill('lebensmittel')
  must((await page.locator('main .row-amount').allInnerTexts()).map(nbsp).join(' '), '−103,10 € −270,00 € −50,00 €', 'Suche Kategorie')
  await search.fill('103,1')
  must(await rowCount(), 1, 'Suche Betrag „103,1“')
  await search.fill('Wocheneinkauf')
  must(await rowCount(), 1, 'Suche Notiz')
  await search.fill('xyzzy')
  must(await rowCount(), 0, 'Suche ohne Treffer'); await expectText('Keine Treffer')
  if (await page.locator('.month-head').count()) throw new Error('Monatsköpfe trotz „Keine Treffer“')
  await search.fill('800')
  await page.screenshot({ path: `${SHOTS}/25-alle-buchungen.png`, fullPage: true })
  await page.getByRole('button', { name: 'Suche löschen' }).click()
  must(await search.inputValue(), '', 'Suchfeld geleert'); must(await rowCount(), 11, 'Alle Zeilen nach Löschen')
  await page.getByRole('button', { name: /Kino/ }).click()
  await dlg().waitFor()
  must(await page.inputValue('#tx-amount'), '20,00', 'Kino: Betrag im Sheet'); must(await page.inputValue('#tx-date'), '2026-10-20', 'Kino: Datum')
  must(await pressed('Konto'), true, 'Konto-Buchung: „Konto“ gewählt')
  await closeSheet()
  must(await page.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).count(), 1, 'Plus-Knopf auf Alle Buchungen')
  await page.setViewportSize({ width: 375, height: 667 })
  await noOverflow('Alle Buchungen 375 px')
  await page.setViewportSize({ width: 390, height: 664 })
  ok('Alle Buchungen: Monatsgruppen „Oktober 2026 · 8 Einträge“, „September 2026 · 2“, „August 2026 · 1“, 11 Zeilen neueste zuerst; Suche „Kino“ → 1, „800“ → 4 Mieten (2/1/1 je Monat), „lebensmittel“ (Groß/Klein egal) → 3, „103,1“ → 1, „xyzzy“ → „Keine Treffer“; Löschen-Knopf; Tippen öffnet Bearbeiten-Sheet')

  // --- Zurück-Knopf, Tab-Wechsel, Scroll nach oben ---
  await page.evaluate(() => window.scrollTo(0, 500))
  if ((await page.evaluate(() => window.scrollY)) < 100) throw new Error('Alle Buchungen ist nicht scrollbar')
  await page.getByRole('button', { name: 'Zurück', exact: true }).click(); await settled()
  must(await page.locator('h1').innerText(), 'Finanzklar', 'Zurück → Start-Übersicht')
  must(await page.evaluate(() => window.scrollY), 0, 'Nach Navigation ganz oben')
  must(await tab('Start').getAttribute('aria-current'), 'page', 'Tab Start bleibt aktiv')
  await hubRow('Alle Buchungen').click(); await settled()
  await tab('Monat').click()
  must(await page.locator('h1').innerText(), 'Monat', 'Tab Monat')
  await tab('Start').click()
  must(await page.locator('h1').innerText(), 'Finanzklar', 'Tab-Wechsel setzt Start auf die Übersicht zurück')
  await hubRow('Alle Buchungen').click(); await settled()
  await tab('Start').click()
  must(await page.locator('h1').innerText(), 'Finanzklar', 'Start-Tab auf einer Unterseite → Übersicht')
  ok('Zurück („‹ Start“, aria-label „Zurück“) führt zur Übersicht und scrollt nach oben; Tab-Wechsel (Monat → Start) und Tippen auf „Start“ setzen die Unterseite zurück')

  // --- Bargeld: Startbestand 20,00 € ---
  await tab('Einstellungen').click()
  await page.fill('#start-cash', '20,00')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expectText('Startguthaben gespeichert.')
  must(await page.inputValue('#start-balance'), '1000,00', 'Startguthaben Konto unverändert')
  await mustHub('−223,10 €', '20,00 €', '−203,10 €', 'Startbestand Bargeld 20,00')
  must(flat(await hubRow('Bargeld').innerText()), 'Bargeld | 20,00 €', 'Zeile Bargeld mit Startbestand')
  await hubRow('Bargeld').click(); await settled()
  must(await page.locator('h1').innerText(), 'Bargeld', 'Titel Bargeld')
  await expectText('Bargeld-Bestand')
  must(await cashBal(), '20,00 €', 'Bargeld-Bestand')
  must(await css(page.getByTestId('cash-balance'), 'color'), INK, 'Positiver Bestand nicht rot')
  await expectText('Abhebungen buchen vom Konto ins Bargeld und zählen nicht als Ausgabe.'); await expectText('Noch keine Bargeld-Buchungen.')
  for (const n of ['Bar bezahlt', 'Bar erhalten', 'Abhebung', 'Einzahlung aufs Konto']) {
    const b = page.getByRole('button', { name: n, exact: true })
    if ((await b.count()) !== 1 || (await b.boundingBox()).height < 44) throw new Error(`Knopf „${n}“ fehlt oder < 44 px`)
  }
  ok('Bargeld: Startbestand 20,00 € (Einstellungen), Start „Bargeld 20,00 € · Gesamt −203,10 €“, Seite mit „Bargeld-Bestand 20,00 €“, Knöpfe Bar bezahlt / Bar erhalten / Abhebung / Einzahlung aufs Konto, Fußnote')

  // 1) Abhebung 200,00 €: Konto −200, Bargeld +200, Monat Ausgaben unverändert
  const before = await monthSum()
  must(before, 'Einnahmen | 2.500,00 € | Ausgaben | 2.073,10 € | Saldo | 426,90 €', 'Monat vor der Abhebung')
  await openCash()
  await page.getByRole('button', { name: 'Abhebung', exact: true }).click()
  await dlg().waitFor()
  must(await pressed('Abhebung'), true, 'Abhebung vorgewählt'); must(await pressed('Einzahlung'), false, 'Einzahlung nicht gewählt')
  must(await page.inputValue('#tr-date'), '2026-10-27', 'Datum heute')
  await page.fill('#tr-amount', '0')
  await page.getByRole('button', { name: 'Sichern' }).click()
  await expectText('Der Betrag muss größer als 0 sein.')
  await page.fill('#tr-amount', '200')
  await page.fill('#tr-note', 'Geldautomat')
  await page.getByRole('button', { name: 'Sichern' }).click()
  await dlg().waitFor({ state: 'detached' })
  must(await cashBal(), '220,00 €', 'Bargeld nach Abhebung')
  const wRow = page.locator('main .list .row', { hasText: 'Konto → Bargeld' })
  must(flat(await wRow.innerText()), 'Abhebung | Di, 27.10. · Konto → Bargeld · Geldautomat | 200,00 €', 'Abhebung-Zeile (ohne Vorzeichen)')
  must(await css(wRow.locator('.row-amount'), 'color'), INK, 'Abhebung in normaler Schriftfarbe')
  must(await heads(), 'Oktober 2026 | 1 Eintrag', 'Kopf Bargeld-Liste')
  await mustHub('−423,10 €', '220,00 €', '−203,10 €', 'Nach Abhebung')
  must(await monthSum(), before, 'Monat Ausgaben nach der Abhebung unverändert')
  must(await page.locator('main .section-title', { hasText: 'Alle Buchungen' }).locator('xpath=following-sibling::*[1]').locator('.row').count(), 8, 'Monat: Abhebung ist keine Buchung')
  ok('Abhebung 200,00 €: Konto −423,10 € (−200), Bargeld 220,00 € (+200), Gesamt −203,10 € unverändert; Zeile „Abhebung · Konto → Bargeld“ ohne Vorzeichen/Farbe; Monat Ausgaben 2.073,10 € unverändert; Betrag 0 abgelehnt')

  // 2) „Bar bezahlt“ 45,50 € Lebensmittel: Bargeld −45,50, Monat Ausgaben +45,50, Lebensmittel inkl. Barausgabe
  await openCash()
  await page.getByRole('button', { name: 'Bar bezahlt', exact: true }).click()
  await dlg().waitFor()
  must(await pressed('Ausgabe'), true, 'Bar bezahlt: Ausgabe'); must(await pressed('Bargeld'), true, 'Bar bezahlt: Bargeld'); must(await pressed('Konto'), false, 'Bar bezahlt: nicht Konto')
  await page.fill('#tx-amount', '45,50')
  await page.selectOption('#tx-cat', { label: 'Lebensmittel' })
  await page.fill('#tx-note', 'Bäcker')
  await page.getByRole('button', { name: 'Sichern' }).click()
  await dlg().waitFor({ state: 'detached' })
  must(await cashBal(), '174,50 €', 'Bargeld nach Bar bezahlt')
  const cRow = page.locator('main .list .row', { hasText: 'Bäcker' })
  must(flat(await cRow.innerText()), 'Lebensmittel | Di, 27.10. · Bäcker | −45,50 €', 'Barzeile auf der Bargeld-Seite (ohne Badge)')
  must(await heads(), 'Oktober 2026 | 2 Einträge', 'Kopf nach Bar bezahlt')
  await mustHub('−423,10 €', '174,50 €', '−248,60 €', 'Nach Bar bezahlt')
  must(await monthSum(), 'Einnahmen | 2.500,00 € | Ausgaben | 2.118,60 € | Saldo | 381,40 €', 'Monat nach Bar bezahlt')
  const lm = (await page.locator('main .section-title', { hasText: 'Ausgaben nach Kategorie' }).locator('xpath=following-sibling::*[1]').locator('li').allInnerTexts()).map(flat).find((t) => t.startsWith('Lebensmittel'))
  must(lm, 'Lebensmittel ▲ 468,60 € | 468,60 €22,1 %', 'Monat: Lebensmittel inkl. 45,50 € bar') // 423,10 + 45,50
  const mrow = page.locator('main .section-title', { hasText: 'Alle Buchungen' }).locator('xpath=following-sibling::*[1]').locator('.row', { hasText: 'Bäcker' })
  must(flat(await mrow.innerText()), 'Lebensmittel Bar | Di, 27.10. · Bäcker | −45,50 €', 'Monat: „Bar“-Badge')
  // Budget Lebensmittel 500,00 €: 468,60 € verbraucht (inkl. Barausgabe)
  await tab('Budgets').click()
  await page.getByRole('button', { name: /^Lebensmittel/ }).click()
  await page.fill('#budget-amount', '500,00')
  await page.getByRole('button', { name: 'Sichern' }).click()
  await dlg().waitFor({ state: 'detached' })
  must(flat(await page.getByRole('button', { name: /^Lebensmittel/ }).innerText()), 'Lebensmittel | 468,60 € von 500,00 € | noch 31,40 € | 93,7 %', 'Budget inkl. Barausgabe')
  ok('Bar bezahlt 45,50 € Lebensmittel (Bargeld vorgewählt): Bargeld 174,50 €, Konto unverändert −423,10 €; Monat Ausgaben 2.118,60 € / Saldo 381,40 €, Lebensmittel 468,60 € (22,1 %), „Bar“-Badge in Monat; Budget Lebensmittel 468,60 € von 500,00 € (93,7 %)')

  // Start-Screenshots (Budget-Hinweis + Bargeld in der Kontokarte)
  await tab('Start').click()
  await expectText('93,7 % verbraucht · noch 31,40 €')
  await page.screenshot({ path: `${SHOTS}/24-start-neu.png`, fullPage: true })
  await page.setViewportSize({ width: 375, height: 667 })
  await page.screenshot({ path: `${SHOTS}/24b-start-neu-se.png`, fullPage: true })
  await noOverflow('Start 375 px')
  await page.setViewportSize({ width: 390, height: 664 })
  await tab('Budgets').click()
  await page.getByRole('button', { name: /^Lebensmittel/ }).click()
  await page.getByRole('button', { name: 'Budget entfernen' }).click()
  await dlg().waitFor({ state: 'detached' })

  // 3) Einzahlung 50,00 €
  await openCash()
  await page.getByRole('button', { name: 'Einzahlung aufs Konto', exact: true }).click()
  await dlg().waitFor()
  must(await pressed('Einzahlung'), true, 'Einzahlung vorgewählt')
  await page.fill('#tr-amount', '50,00')
  await page.getByRole('button', { name: 'Sichern' }).click()
  await dlg().waitFor({ state: 'detached' })
  must(await cashBal(), '124,50 €', 'Bargeld nach Einzahlung')
  must(await heads(), 'Oktober 2026 | 3 Einträge', 'Kopf nach Einzahlung')
  await page.screenshot({ path: `${SHOTS}/26-bargeld.png`, fullPage: true })
  await page.setViewportSize({ width: 375, height: 667 })
  await page.screenshot({ path: `${SHOTS}/26b-bargeld-se.png`, fullPage: true })
  await noOverflow('Bargeld 375 px')
  await page.setViewportSize({ width: 390, height: 664 })
  await mustHub('−373,10 €', '124,50 €', '−248,60 €', 'Nach Einzahlung')
  ok('Einzahlung 50,00 €: Konto −373,10 € (+50), Bargeld 124,50 € (−50), Gesamt −248,60 € unverändert')

  // Alle Buchungen zeigt Abhebung, Einzahlung und die Barbuchung mit „Bar“-Badge
  await openBookings()
  must(await rowCount(), 14, 'Alle Buchungen mit Umbuchungen')
  must(await heads(), 'Oktober 2026 | 11 Einträge // September 2026 | 2 Einträge // August 2026 | 1 Eintrag', 'Köpfe mit Umbuchungen')
  must(flat(await page.locator('main .list .row', { hasText: 'Bäcker' }).innerText()), 'Lebensmittel Bar | Di, 27.10. · Bäcker | −45,50 €', 'Bar-Badge')
  must(await page.locator('main .badge').count(), 1, 'Genau ein Bar-Badge')
  await search_('Einzahlung'); must(await rowCount(), 1, 'Suche „Einzahlung“'); await search_('Geldautomat'); must(await rowCount(), 1, 'Suche Notiz der Abhebung')
  await search_('45,5'); must(await rowCount(), 1, 'Suche Barbetrag'); await search_('')
  ok('Alle Buchungen mit Umbuchungen: 14 Zeilen (11 Buchungen + Abhebung + Einzahlung + Bar), „Bar“-Badge nur bei der Barbuchung, Suche findet Umbuchungen („Einzahlung“, „Geldautomat“)')

  // 4) Umbuchung bearbeiten (Abhebung 200 → 150) und 5) Einzahlung löschen
  await openCash()
  await wRow.click()
  await dlg().waitFor()
  must(await dlg().getAttribute('aria-label'), 'Umbuchung bearbeiten', 'Titel Bearbeiten')
  must(await page.inputValue('#tr-amount'), '200,00', 'Abhebung: Betrag im Sheet'); must(await page.inputValue('#tr-note'), 'Geldautomat', 'Abhebung: Notiz im Sheet')
  await page.fill('#tr-amount', '150')
  await page.getByRole('button', { name: 'Sichern' }).click()
  await dlg().waitFor({ state: 'detached' })
  must(await cashBal(), '74,50 €', 'Bargeld nach Bearbeiten')
  await mustHub('−323,10 €', '74,50 €', '−248,60 €', 'Nach Bearbeiten der Abhebung')
  await openCash()
  await page.locator('main .list .row', { hasText: 'Bargeld → Konto' }).click()
  await dlg().waitFor()
  await page.getByRole('button', { name: 'Umbuchung löschen' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click()
  await dlg().waitFor({ state: 'detached' })
  must(await cashBal(), '124,50 €', 'Bargeld nach Löschen der Einzahlung')
  must(await heads(), 'Oktober 2026 | 2 Einträge', 'Kopf nach Löschen')
  await mustHub('−373,10 €', '124,50 €', '−248,60 €', 'Nach Löschen der Einzahlung')
  ok('Umbuchung bearbeiten (Abhebung 200,00 → 150,00 €: Konto −323,10 €, Bargeld 74,50 €) und Einzahlung löschen (Konto −373,10 €, Bargeld 124,50 €); Gesamt bleibt −248,60 €')

  // Konto einer Buchung ändern
  await openCash()
  await cRow.click()
  await dlg().waitFor()
  must(await pressed('Bargeld'), true, 'Bearbeiten behält Bargeld')
  await dlg().getByRole('button', { name: 'Konto', exact: true }).click()
  await page.getByRole('button', { name: 'Sichern' }).click()
  await dlg().waitFor({ state: 'detached' })
  must(await cashBal(), '170,00 €', 'Barbuchung aufs Konto verschoben')
  await mustHub('−418,60 €', '170,00 €', '−248,60 €', 'Nach Kontowechsel')
  await openBookings()
  await page.getByRole('button', { name: /Bäcker/ }).click()
  await dlg().waitFor()
  await dlg().getByRole('button', { name: 'Bargeld', exact: true }).click()
  await page.getByRole('button', { name: 'Sichern' }).click()
  await dlg().waitFor({ state: 'detached' })
  await mustHub('−373,10 €', '124,50 €', '−248,60 €', 'Nach Rückwechsel')
  ok('Konto einer Buchung ändern: Bäcker 45,50 € Bargeld → Konto (Konto −418,60 €, Bargeld 170,00 €) und zurück')

  // --- Backup mit Umbuchung und Konto ---
  await tab('Einstellungen').click()
  const dl2 = await plainExport()
  const file2 = `${SHOTS}/../backup-test.json`
  await dl2.saveAs(file2)
  const j2 = JSON.parse(fs.readFileSync(file2, 'utf8'))
  must(j2.version, 5, 'Export Version'); must(j2.settings.startCashCents, 2000, 'Export Startbestand Bargeld')
  must(JSON.stringify(j2.transfers.map((t) => [t.direction, t.amountCents, t.date, t.note])), '[["withdrawal",15000,"2026-10-27","Geldautomat"]]', 'Export Umbuchungen')
  must(j2.transactions.filter((t) => t.account === 'bargeld').map((t) => t.amountCents).join(), '4550', 'Export: Barbuchung')
  must(j2.transactions.length, 12, 'Export: 12 Buchungen')
  await tab('Start').click()
  await addTx({ amount: '999', category: 'Sonstiges', account: 'Bargeld' })
  await openCash()
  await page.getByRole('button', { name: 'Abhebung', exact: true }).click()
  await page.fill('#tr-amount', '10'); await page.getByRole('button', { name: 'Sichern' }).click()
  await dlg().waitFor({ state: 'detached' })
  await tab('Einstellungen').click()
  fs.writeFileSync(`${SHOTS}/../kaputt.json`, JSON.stringify({ ...j2, transfers: [{ ...j2.transfers[0], direction: 'sideways' }] }))
  await page.locator('input[type=file]').setInputFiles(`${SHOTS}/../kaputt.json`)
  await page.getByRole('alert').waitFor({ timeout: 3000 })
  await expectText('Ungültige Sicherungsdatei: Eine Umbuchung hat eine ungültige Richtung.')
  fs.writeFileSync(`${SHOTS}/../kaputt.json`, JSON.stringify({ ...j2, transactions: j2.transactions.map((t, i) => (i ? t : { ...t, account: 'tresor' })) }))
  await page.locator('input[type=file]').setInputFiles(`${SHOTS}/../kaputt.json`)
  await expectText('Ungültige Sicherungsdatei: Eine Buchung hat ein ungültiges Konto.')
  await page.locator('input[type=file]').setInputFiles(file2)
  await page.getByRole('alertdialog').waitFor()
  await page.getByRole('alertdialog').getByRole('button').last().click()
  await expectText('Import erfolgreich: 12 Buchungen')
  must(await page.inputValue('#start-cash'), '20,00', 'Startbestand Bargeld nach Import')
  await mustHub('−373,10 €', '124,50 €', '−248,60 €', 'Nach Import')
  const st2 = await stored()
  must(st2.transfers.length, 1, 'Umbuchung nach Import'); must(st2.transactions.filter((t) => t.account === 'bargeld').length, 1, 'Barbuchung nach Import')
  ok('Backup: Export Version 5 mit Umbuchung (Abhebung 150,00 €), Barbuchung und Startbestand 20,00 €; ungültige Richtung / ungültiges Konto werden abgelehnt; Import stellt Konto −373,10 € / Bargeld 124,50 € wieder her')

  // --- Negativer Bargeldbestand wird rot ---
  await openCash()
  await wRow.click()
  await dlg().waitFor()
  await page.getByRole('button', { name: 'Umbuchung löschen' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click()
  await dlg().waitFor({ state: 'detached' })
  must(await cashBal(), '−25,50 €', 'Negativer Bargeldbestand') // 20,00 − 45,50
  must(await css(page.getByTestId('cash-balance'), 'color'), RED, 'Negativer Bestand rot')
  await mustHub('−223,10 €', '−25,50 €', '−248,60 €', 'Nach Löschen der Abhebung')
  await page.screenshot({ path: `${SHOTS}/26c-bargeld-negativ.png`, fullPage: true })
  ok('Bargeld ohne Abhebung: −25,50 € (20,00 − 45,50) wird rot angezeigt; Konto −223,10 €, Gesamt −248,60 €')

  // --- Dark Mode ---
  await tab('Start').click()
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.screenshot({ path: `${SHOTS}/28-start-dark.png`, fullPage: true })
  await hubRow('Alle Buchungen').click(); await settled()
  await page.screenshot({ path: `${SHOTS}/28b-alle-buchungen-dark.png` })
  await page.emulateMedia({ colorScheme: 'light' })
  await tab('Start').click()
  ok('Dark Mode: Start-Übersicht und Alle Buchungen ohne Konsolenfehler')
}

// ---------- Verträge mit „Automatisch buchen“ aus: Bestätigen, Überspringen, Jetzt buchen (frischer Kontext, Heute = 27.10.2026) ----------
{
  const ctx5 = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block' })
  const p5 = await ctx5.newPage()
  p5.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  p5.on('pageerror', (e) => errors.push(e.message))
  await p5.clock.install({ time: new Date('2026-10-27T10:00:00+01:00') })
  await p5.goto(URL)
  const nav5 = (name) => p5.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name, exact: true })
  const text5 = async () => nbsp(await p5.locator('body').innerText())
  const has5 = async (t) => { for (let i = 0; i < 20; i++) { if ((await text5()).includes(t)) return; await p5.waitForTimeout(100) } throw new Error(`Text nicht gefunden: "${t}"`) }
  const hasNot5 = async (t) => { await p5.waitForTimeout(150); if ((await text5()).includes(t)) throw new Error(`Text sollte fehlen: "${t}"`) }
  const bal5 = async () => { await nav5('Start').click(); return nbsp(await p5.getByTestId('balance').innerText()) }
  const mustBal5 = async (expected, what) => { const b = await bal5(); if (b !== expected) throw new Error(`${what}: erwartet ${expected}, war ${b}`) }
  const stored5 = () => p5.evaluate(() => JSON.parse(localStorage.getItem('finanz-app:v1')))
  const rec5 = () => p5.locator('[aria-label="wiederkehrend"]').count()
  const open5 = async () => { await nav5('Start').click(); await p5.getByRole('button', { name: /^Verträge/ }).click(); await p5.getByRole('button', { name: 'Zurück', exact: true }).waitFor(); await settled(p5) }
  async function rule5({ kind = 'Ausgabe', amount, category, note, day, start, manual = true }) {
    await open5()
    await p5.getByRole('button', { name: 'Vertrag hinzufügen' }).click()
    await p5.getByRole('button', { name: kind, exact: true }).click()
    await p5.fill('#rc-amount', amount)
    await p5.selectOption('#rc-cat', { label: category })
    if (note) await p5.fill('#rc-note', note)
    await p5.fill('#rc-start', start)
    if (day) await p5.fill('#rc-day', day)
    const sw = p5.getByRole('switch', { name: 'Automatisch buchen' })
    if ((await sw.isChecked()) !== true) throw new Error('„Automatisch buchen“ muss bei neuen Verträgen an sein')
    if (manual) await sw.uncheck()
    await p5.getByRole('button', { name: 'Sichern' }).click()
  }
  const card5 = (title) => p5.locator('li').filter({ hasText: title }).filter({ has: p5.getByRole('button', { name: /^Buchen/ }) })

  // 1) Manueller Gehaltsvertrag, Tag 25, Start 01.10. → Termin vom 25.10. ist offen
  await rule5({ kind: 'Einnahme', amount: '2.000,00', category: 'Gehalt', note: 'Gehalt', day: '25', start: '2026-10-01' })
  await p5.getByRole('alertdialog').waitFor()
  await has5('Vergangene Termine?'); await has5('1 Termin seit 01.10.2026 liegt in der Vergangenheit.')
  await p5.getByRole('alertdialog').getByRole('button', { name: 'Als offen anzeigen' }).click()
  await has5('bestätigen'); await has5('nächste: 25.11.')
  await mustBal5('0,00 €', 'Manueller Vertrag bucht nichts von selbst')
  let t = await text5()
  if (!t.includes('ZU BESTÄTIGEN') || !t.includes('fällig 25.10.') || !t.includes('+2.000,00 €')) throw new Error('Karte „Zu bestätigen“ fehlt: ' + t.slice(0, 300))
  if (t.indexOf('ZU BESTÄTIGEN') < t.indexOf('Kontostand') || t.indexOf('ZU BESTÄTIGEN') > t.indexOf('Alle Buchungen')) throw new Error('„Zu bestätigen“ steht an der falschen Stelle')
  if ((await stored5()).transactions.length !== 0) throw new Error('Es wurde automatisch gebucht')
  await p5.waitForTimeout(200)
  await p5.screenshot({ path: `${SHOTS}/29-start-bestaetigen.png`, fullPage: true })
  await p5.setViewportSize({ width: 375, height: 667 })
  await p5.screenshot({ path: `${SHOTS}/29b-start-bestaetigen-se.png`, fullPage: true })
  if (await p5.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('Zu bestätigen: horizontaler Überlauf bei 375 px')
  await p5.setViewportSize({ width: 390, height: 664 })
  await p5.emulateMedia({ colorScheme: 'dark' })
  await p5.waitForTimeout(150)
  await p5.screenshot({ path: `${SHOTS}/32-start-bestaetigen-dark.png`, fullPage: true })
  await p5.emulateMedia({ colorScheme: 'light' })
  ok('Manueller Gehaltsvertrag (2.000,00 €, Tag 25, ab 01.10.): Dialog „Als offen anzeigen“, Start zeigt „Zu bestätigen“ direkt unter dem Kontostand mit „fällig 25.10.“ und +2.000,00 €, Kontostand unverändert 0,00 €, Vertragsliste mit Hinweis „bestätigen“')

  // 2) Buchen mit geändertem Betrag und Datum
  await p5.getByRole('button', { name: /^Buchen/ }).click()
  await p5.getByRole('dialog', { name: 'Termin buchen' }).waitFor()
  if ((await p5.inputValue('#tx-amount')) !== '2000,00' || (await p5.inputValue('#tx-date')) !== '2026-10-25' || (await p5.inputValue('#tx-note')) !== 'Gehalt')
    throw new Error('Formular nicht vorausgefüllt')
  if (await p5.getByRole('dialog').getByRole('button', { name: 'Bargeld', exact: true }).count()) throw new Error('Vertragsbuchung darf nur aufs Konto gehen')
  await p5.waitForTimeout(450)
  await p5.screenshot({ path: `${SHOTS}/31-buchen-vorausgefuellt.png` })
  await p5.fill('#tx-amount', '2.150,00')
  await p5.fill('#tx-date', '2026-10-26')
  await p5.getByRole('dialog').getByRole('button', { name: 'Buchen', exact: true }).click()
  await mustBal5('2.150,00 €', 'Nach Bestätigung mit 2.150,00')
  await hasNot5('ZU BESTÄTIGEN')
  await p5.getByRole('button', { name: /^Alle Buchungen/ }).click()
  await has5('Mo, 26.10.'); await has5('+2.150,00 €')
  if ((await rec5()) !== 1) throw new Error('Erwartet 1 Buchung mit ↻')
  const s1 = await stored5()
  if (s1.recurring[0].bookedThrough !== '2026-10-25' || s1.transactions[0].recurringId !== s1.recurring[0].id || s1.transactions[0].account !== 'konto')
    throw new Error('Gespeicherte Bestätigung falsch: ' + JSON.stringify(s1.transactions[0]))
  ok('„Buchen“ mit 2.150,00 € am 26.10.: Kontostand genau +2.150,00 € (2.150,00 €), Karte verschwindet, Alle Buchungen zeigt „Mo, 26.10.“ mit ↻, bookedThrough = 25.10.')

  // 3) Zwei offene Termine: „+1 weiterer“, Überspringen (ältester), dann Buchen
  await rule5({ amount: '10,00', category: 'Freizeit', note: 'Zeitung', day: '5', start: '2026-09-01' })
  await p5.getByRole('alertdialog').getByRole('button', { name: 'Als offen anzeigen' }).click()
  await nav5('Start').click()
  await has5('fällig 05.09.'); await has5('+1 weiterer offener Termin')
  await mustBal5('2.150,00 €', 'Zwei offene Termine buchen nichts')
  await card5('Zeitung').getByRole('button', { name: /^Überspringen/ }).click()
  await has5('Termin überspringen?'); await has5('„Zeitung“ vom 05.09. wird nicht gebucht.')
  await p5.getByRole('alertdialog').getByRole('button', { name: 'Abbrechen' }).click()
  await has5('fällig 05.09.')
  await card5('Zeitung').getByRole('button', { name: /^Überspringen/ }).click()
  await p5.getByRole('alertdialog').getByRole('button', { name: 'Überspringen' }).click()
  await has5('fällig 05.10.'); await hasNot5('fällig 05.09.'); await hasNot5('weiterer offener Termin')
  await mustBal5('2.150,00 €', 'Überspringen bucht nichts')
  await card5('Zeitung').getByRole('button', { name: /^Buchen/ }).click()
  if ((await p5.inputValue('#tx-date')) !== '2026-10-05' || (await p5.inputValue('#tx-amount')) !== '10,00') throw new Error('Zweiter Termin falsch vorausgefüllt')
  await p5.getByRole('dialog').getByRole('button', { name: 'Buchen', exact: true }).click()
  await mustBal5('2.140,00 €', 'Zeitung gebucht')
  await hasNot5('Zeitung')
  await p5.getByRole('button', { name: /^Alle Buchungen/ }).click()
  await has5('Mo, 05.10.'); await hasNot5('Sa, 05.09.')
  if ((await rec5()) !== 2) throw new Error('Erwartet 2 Buchungen mit ↻')
  ok('Vertrag „Zeitung“ mit 2 offenen Terminen: „+1 weiterer offener Termin“, Überspringen (Abbrechen ändert nichts) erledigt 05.09. ohne Buchung, danach Buchen für 05.10.: Kontostand genau 2.140,00 €, 2 Buchungen mit ↻')

  // 4) Automatisch buchen nachträglich einschalten: offene Termine werden gebucht
  await rule5({ amount: '30,00', category: 'Freizeit', note: 'Handy', day: '3', start: '2026-10-01' })
  await p5.getByRole('alertdialog').getByRole('button', { name: 'Als offen anzeigen' }).click()
  await nav5('Start').click()
  await has5('Handy'); await has5('fällig 03.10.')
  await open5()
  await p5.getByRole('button', { name: /Handy/ }).click()
  await p5.waitForTimeout(450)
  const sw5 = p5.getByRole('switch', { name: 'Automatisch buchen' })
  if (await sw5.isChecked()) throw new Error('Schalter müsste aus sein')
  await hasNot5('Offene Termine werden dann automatisch gebucht.')
  await has5('Erledigt den Termin am 03.10.2026.')
  await sw5.check()
  await has5('Offene Termine werden dann automatisch gebucht.')
  await p5.getByRole('button', { name: 'Sichern' }).click()
  await mustBal5('2.110,00 €', 'Handy automatisch nachgebucht')
  await hasNot5('ZU BESTÄTIGEN')
  const s4 = await stored5()
  if (s4.recurring.find((r) => r.note === 'Handy').autoBook !== true) throw new Error('autoBook nicht gespeichert')
  ok('Schalter „Automatisch buchen“ bei „Handy“ (offener Termin 03.10.) an: Hinweis „Offene Termine werden dann automatisch gebucht.“, nach Sichern ist 30,00 € gebucht (2.110,00 €) und die Karte weg')

  // 5) Formular-Screenshot (Schalter + Jetzt buchen), Neuladen behält den offenen Termin
  await rule5({ amount: '19,99', category: 'Freizeit', note: 'Streaming', day: '28', start: '2026-10-01' })
  await p5.getByRole('button', { name: /Streaming/ }).click()
  await p5.waitForTimeout(450)
  await p5.evaluate(() => { const sh = document.querySelector('.sheet'); sh.scrollTop = sh.scrollHeight })
  await p5.waitForTimeout(150)
  await p5.screenshot({ path: `${SHOTS}/30-vertrag-formular.png` })
  await p5.getByRole('button', { name: 'Abbrechen' }).first().click()
  await rule5({ amount: '5,00', category: 'Freizeit', note: 'Magazin', day: '1', start: '2026-10-01' })
  await p5.getByRole('alertdialog').getByRole('button', { name: 'Als offen anzeigen' }).click()
  await p5.reload()
  await p5.getByTestId('balance').waitFor()
  await has5('Magazin'); await has5('fällig 01.10.')
  await mustBal5('2.110,00 €', 'Nach Neuladen')
  ok('Formular mit Schalter und „Jetzt buchen“ (Erledigt den Termin am 28.10.2026.); offener Termin „Magazin“ bleibt nach Neuladen bestehen, Kontostand unverändert 2.110,00 €')
  await ctx5.close()
}

// ---------- Jetzt buchen und Datumswechsel mit manuellen Verträgen (frischer Kontext, Start 28.10.2026 10:00) ----------
{
  const ctx6 = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block' })
  const p6 = await ctx6.newPage()
  p6.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  p6.on('pageerror', (e) => errors.push(e.message))
  await p6.clock.install({ time: new Date('2026-10-28T10:00:00+01:00') })
  await p6.goto(URL)
  const nav6 = (name) => p6.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name, exact: true })
  const bal6 = async () => nbsp(await p6.locator('[data-testid="balance"]').innerText())
  const waitBal6 = async (expected) => {
    for (let i = 0; i < 30; i++) { if ((await bal6()) === expected) return; await p6.waitForTimeout(100) }
    throw new Error(`Jetzt buchen: Kontostand erwartet ${expected}, war ${await bal6()}`)
  }
  const stored6 = () => p6.evaluate(() => JSON.parse(localStorage.getItem('finanz-app:v1')))
  const body6 = async () => nbsp(await p6.locator('body').innerText())
  const tick6 = async () => { await p6.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await p6.waitForTimeout(250) }
  await nav6('Start').click()
  await p6.getByRole('button', { name: /^Verträge/ }).click()
  // automatischer Vertrag (Standard) und manueller Gehaltsvertrag, beide ohne vergangene Termine
  await p6.getByRole('button', { name: 'Vertrag hinzufügen' }).click()
  await p6.fill('#rc-amount', '10'); await p6.selectOption('#rc-cat', { label: 'Freizeit' }); await p6.fill('#rc-note', 'Abo'); await p6.fill('#rc-day', '1')
  await p6.getByRole('button', { name: 'Sichern' }).click()
  await p6.getByRole('button', { name: 'Vertrag hinzufügen' }).click()
  await p6.getByRole('button', { name: 'Einnahme', exact: true }).click()
  await p6.fill('#rc-amount', '2.000,00'); await p6.selectOption('#rc-cat', { label: 'Gehalt' }); await p6.fill('#rc-note', 'Gehalt'); await p6.fill('#rc-day', '30')
  await p6.getByRole('switch', { name: 'Automatisch buchen' }).uncheck()
  await p6.getByRole('button', { name: 'Sichern' }).click()
  await p6.getByRole('button', { name: /Gehalt/ }).click()
  await p6.getByText('Erledigt den Termin am 30.10.2026.').waitFor()
  await p6.getByRole('button', { name: 'Jetzt buchen', exact: true }).click()
  await p6.getByRole('dialog', { name: 'Jetzt buchen' }).waitFor()
  if ((await p6.inputValue('#tx-date')) !== '2026-10-28' || (await p6.inputValue('#tx-amount')) !== '2000,00') throw new Error('Jetzt buchen: falsch vorausgefüllt')
  await p6.keyboard.press('Escape') // schließt nur das obere Blatt
  await p6.getByRole('dialog', { name: 'Vertrag' }).waitFor()
  await p6.getByRole('button', { name: 'Jetzt buchen', exact: true }).click()
  await p6.getByRole('dialog', { name: 'Jetzt buchen' }).getByRole('button', { name: 'Buchen', exact: true }).click()
  await p6.getByRole('dialog').waitFor({ state: 'detached' })
  await nav6('Start').click()
  await waitBal6('2.000,00 €')
  let st = await stored6()
  const sal = st.recurring.find((r) => r.note === 'Gehalt')
  if (st.transactions.length !== 1 || st.transactions[0].date !== '2026-10-28' || st.transactions[0].recurringId !== sal.id || sal.bookedThrough !== '2026-10-30')
    throw new Error('Jetzt buchen: gespeicherter Stand falsch ' + JSON.stringify({ t: st.transactions, b: sal.bookedThrough }))
  if ((await body6()).includes('ZU BESTÄTIGEN')) throw new Error('Nach Jetzt buchen darf nichts offen sein')
  ok('„Jetzt buchen“ beim Gehaltsvertrag (fällig 30.10., heute 28.10.): Escape schließt nur das obere Blatt, Buchung am 28.10. mit ↻-Verknüpfung, Kontostand 2.000,00 €, Termin 30.10. erledigt')

  await p6.clock.setSystemTime(new Date('2026-10-30T12:00:00+01:00'))
  await tick6()
  await waitBal6('2.000,00 €')
  if ((await body6()).includes('ZU BESTÄTIGEN')) throw new Error('Am 30.10. darf nichts offen sein')
  await p6.clock.setSystemTime(new Date('2026-11-01T09:00:00+01:00'))
  await tick6()
  await waitBal6('1.990,00 €') // nur das automatische Abo (−10,00 €) wurde gebucht
  st = await stored6()
  if (st.transactions.length !== 2 || st.transactions.filter((x) => x.date === '2026-11-01').length !== 1 || (await body6()).includes('ZU BESTÄTIGEN'))
    throw new Error('Rollover 01.11.: ' + JSON.stringify(st.transactions.map((x) => [x.date, x.amountCents])))
  ok('Rollover 30.10./01.11.: für das vorgezogene Gehalt ist nichts offen und nichts doppelt gebucht; das automatische Abo wird am 01.11. weiter gebucht (1.990,00 €)')

  await p6.clock.setSystemTime(new Date('2026-11-30T09:00:00+01:00'))
  await tick6()
  await waitBal6('1.990,00 €')
  const b6 = await body6()
  if (!b6.includes('ZU BESTÄTIGEN') || !b6.includes('fällig 30.11.') || !b6.includes('+2.000,00 €')) throw new Error('30.11.: Gehalt müsste zur Bestätigung anstehen')
  st = await stored6()
  if (st.transactions.some((x) => x.date === '2026-11-30' && x.recurringId === sal.id)) throw new Error('Manuelles Gehalt wurde automatisch gebucht')
  ok('Rollover 30.11.: der nächste Gehaltstermin steht zur Bestätigung an („fällig 30.11.“), nichts wird automatisch gebucht (1.990,00 €)')
  await ctx6.close()
}

// ---------- Migration v3 → v4 beim Laden (frischer Kontext mit altem localStorage) ----------
{
  const ctx3 = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block' })
  const p3 = await ctx3.newPage()
  p3.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  p3.on('pageerror', (e) => errors.push(e.message))
  await p3.clock.install({ time: new Date('2026-10-27T10:00:00+01:00') })
  await p3.goto(URL)
  const cat = (kind, name, builtIn = false) => ({ id: `${kind}-${name.toLowerCase()}`, name, kind, builtIn })
  const oldData = {
    version: 3,
    settings: { startBalanceCents: 100000 },
    categories: [
      ...['Lebensmittel', 'Fixkosten', 'Mobilität', 'Freizeit', 'Kleidung', 'Gesundheit'].map((n) => cat('expense', n)),
      cat('expense', 'Sonstiges', true), cat('income', 'Gehalt'), cat('income', 'Nebeneinkünfte'), cat('income', 'Sonstiges', true),
    ],
    transactions: [{ id: 'old1', kind: 'expense', amountCents: 4599, date: '2026-10-02', categoryId: 'expense-lebensmittel', note: 'Alt', createdAt: 1 }],
    recurring: [],
  }
  await p3.evaluate((d) => localStorage.setItem('finanz-app:v1', JSON.stringify(d)), oldData)
  await p3.reload()
  await p3.getByTestId('balance').waitFor()
  const hub3 = nbsp(await p3.locator('body').innerText())
  if (!hub3.includes('954,01 €') || !hub3.includes('Bargeld 0,00 € · Gesamt 954,01 €')) throw new Error('Migration v3: Kontostand falsch: ' + hub3.slice(0, 200))
  await p3.getByRole('button', { name: /^Alle Buchungen/ }).click()
  await p3.getByRole('button', { name: /Alt/ }).click()
  if ((await p3.getByRole('dialog').getByRole('button', { name: 'Konto', exact: true }).getAttribute('aria-pressed')) !== 'true') throw new Error('Migrierte Buchung liegt nicht auf dem Konto')
  await p3.getByRole('button', { name: 'Sichern' }).click() // speichert den migrierten Stand
  await p3.waitForTimeout(200)
  const s3 = await p3.evaluate(() => JSON.parse(localStorage.getItem('finanz-app:v1')))
  if (s3.version !== 5 || s3.settings.startCashCents !== 0 || s3.transfers.length !== 0 || s3.transactions[0].account !== 'konto')
    throw new Error('Migration v3: gespeicherte Daten falsch ' + JSON.stringify(s3).slice(0, 300))
  await ctx3.close()
  ok('Migration v3 → v4 beim Laden: Kontostand 954,01 €, „Bargeld 0,00 € · Gesamt 954,01 €“, alte Buchung liegt auf dem Konto, gespeichert als Version 5 (startCashCents 0, keine Umbuchungen)')
}

// ---------- Migration v4 → v5: bestehende Verträge buchen weiter automatisch ----------
{
  const ctx4 = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block' })
  const p4 = await ctx4.newPage()
  p4.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  p4.on('pageerror', (e) => errors.push(e.message))
  await p4.clock.install({ time: new Date('2026-10-27T10:00:00+01:00') })
  await p4.goto(URL)
  const cat = (kind, name, builtIn = false) => ({ id: `${kind}-${name.toLowerCase()}`, name, kind, builtIn })
  const old4 = {
    version: 4,
    settings: { startBalanceCents: 100000, startCashCents: 0 },
    categories: [
      ...['Lebensmittel', 'Fixkosten', 'Mobilität', 'Freizeit', 'Kleidung', 'Gesundheit'].map((n) => cat('expense', n)),
      cat('expense', 'Sonstiges', true), cat('income', 'Gehalt'), cat('income', 'Nebeneinkünfte'), cat('income', 'Sonstiges', true),
    ],
    transactions: [],
    recurring: [{ id: 'rm', kind: 'expense', amountCents: 80000, categoryId: 'expense-fixkosten', note: 'Miete', interval: 'monthly', dayOfMonth: 1, startDate: '2026-09-01', bookedThrough: '2026-10-01' }],
    transfers: [],
  }
  await p4.evaluate((d) => localStorage.setItem('finanz-app:v1', JSON.stringify(d)), old4)
  await p4.reload()
  await p4.getByTestId('balance').waitFor()
  await p4.getByRole('button', { name: /^Verträge/ }).click()
  await p4.getByRole('button', { name: /Miete/ }).click()
  if (!(await p4.getByRole('switch', { name: 'Automatisch buchen' }).isChecked())) throw new Error('Migrierter Vertrag müsste automatisch buchen')
  await p4.getByRole('button', { name: 'Sichern' }).click()
  await p4.waitForTimeout(200)
  const s4m = await p4.evaluate(() => JSON.parse(localStorage.getItem('finanz-app:v1')))
  if (s4m.version !== 5 || s4m.recurring[0].autoBook !== true) throw new Error('Migration v4: ' + JSON.stringify(s4m.recurring))
  await ctx4.close()
  ok('Migration v4 → v5 beim Laden: bestehender Vertrag „Miete“ hat „Automatisch buchen“ an, gespeichert als Version 5 mit autoBook true')
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
  await nav2('Start').click()
  await p2.getByRole('button', { name: /^Verträge/ }).click()
  await p2.getByRole('button', { name: 'Vertrag hinzufügen' }).click()
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

// ---------- Gesten: Kanten-Wischen zurück, Sheet nach unten wischen, Monat wischen (echte Touch-Events per CDP) ----------
{
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const sessions = new WeakMap()
  const cdpOf = async (p) => {
    if (!sessions.has(p)) sessions.set(p, await p.context().newCDPSession(p))
    return sessions.get(p)
  }
  // Wischen mit echten Touch-Events; release:false hält den Finger unten (für Zwischenstand-Screenshots)
  async function swipe(p, { x0, y0, x1, y1, steps = 10, durationMs = 300, release = true }) {
    const cdp = await cdpOf(p)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] })
    for (let i = 1; i <= steps; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps }] })
      await sleep(durationMs / steps)
    }
    if (release) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const must = (actual, expected, what) => { if (actual !== expected) throw new Error(`${what}: erwartet "${expected}", war "${actual}"`) }
  const moveTo = async (p, x, y) => (await cdpOf(p)).send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
  const lift = async (p) => (await cdpOf(p)).send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const tapAt = async (p, x, y) => {
    const cdp = await cdpOf(p)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await sleep(40)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const h1 = async (p = page) => (await p.locator('h1').first().innerText()).trim()
  const waitH1 = async (p, text) => {
    for (let i = 0; i < 30; i++) { if ((await h1(p)) === text) return; await sleep(100) }
    throw new Error(`Überschrift erwartet "${text}", war "${await h1(p)}"`)
  }
  const stayH1 = async (p, text, what) => { await settled(p); await sleep(150); await settled(p); must(await h1(p), text, what) }
  const paneIdle = (p) => p.waitForFunction(() => { const el = document.querySelector('.swipe-pane'); return el && el.style.transform === '' && !el.hasAttribute('data-dragging') && el.style.opacity === '' })
  const stack = (p) => p.evaluate(() => { const s = document.querySelector('.stack-sub'); const h = document.querySelector('.stack-hub'); return { sub: s?.style.transform ?? null, hub: h?.style.transform ?? null, dim: document.querySelector('.stack-dim')?.style.opacity ?? null } })
  const historyState = (p) => p.evaluate(() => history.state?.sub ?? null)
  const sheetIdle = (p) => p.waitForFunction(() => { const s = document.querySelector('.sheet'); return s && s.getAnimations().length === 0 && s.style.transform === '' })

  await tab('Start').click()
  await settled()
  await page.getByRole('button', { name: 'Zurück', exact: true }).count().then(async (n) => { if (n) await tab('Start').click() })
  const startBalance = await balance()

  // 1) Kanten-Wischen zurück
  await openBookings()
  must(await historyState(page), 'bookings', 'Unterseite ist ein History-Eintrag')
  await swipe(page, { x0: 6, y0: 300, x1: 260, y1: 305 })
  await waitH1(page, 'Finanzklar'); await settled()
  if (await page.locator('.stack-sub').count()) throw new Error('Unterseite nach dem Wischen noch im DOM')
  must(await historyState(page), null, 'History nach Wischen zurück')
  ok('Kanten-Wischen (6 → 260 px, > 35 % der Breite) auf „Alle Buchungen“: zurück auf der Übersicht, History-Eintrag entfernt')

  await openBookings()
  await swipe(page, { x0: 6, y0: 300, x1: 45, y1: 300, durationMs: 900 })
  await stayH1(page, 'Alle Buchungen', 'Kurzes langsames Wischen (10 %)')
  must((await stack(page)).sub, '', 'Unterseite wieder in Ruhelage')
  ok('Kurzes, langsames Wischen (10 % der Breite) federt zurück: bleibt auf „Alle Buchungen“')

  await swipe(page, { x0: 100, y0: 300, x1: 330, y1: 300 })
  await stayH1(page, 'Alle Buchungen', 'Wischen abseits der Kante')
  await swipe(page, { x0: 30, y0: 300, x1: 330, y1: 300 })
  await stayH1(page, 'Alle Buchungen', 'Wischen ab 30 px')
  ok('Wischen ab x = 100 (und 30) px, also nicht am Rand, navigiert nicht')

  await swipe(page, { x0: 150, y0: 650, x1: 150, y1: 150, steps: 12, durationMs: 350 })
  await stayH1(page, 'Alle Buchungen', 'Vertikales Ziehen')
  if ((await page.evaluate(() => window.scrollY)) < 100) throw new Error('Vertikales Ziehen hat nicht gescrollt')
  await swipe(page, { x0: 10, y0: 650, x1: 12, y1: 300, steps: 8, durationMs: 250 })
  await stayH1(page, 'Alle Buchungen', 'Vertikales Ziehen am Rand')
  ok('Vertikales Ziehen (auch am linken Rand) scrollt die Liste und navigiert nicht')

  await page.evaluate(() => window.scrollTo(0, 0))
  await swipe(page, { x0: 6, y0: 300, x1: 56, y1: 300, steps: 5, durationMs: 40 })
  await waitH1(page, 'Finanzklar'); await settled()
  ok('Schneller Wisch (50 px = 13 % der Breite, > 0,5 px/ms) geht zurück')

  // Zwischenstand: Unterseite halb verschoben, Übersicht (Parallaxe + Abdunkeln) darunter sichtbar
  await openBookings()
  await swipe(page, { x0: 6, y0: 300, x1: 200, y1: 300, durationMs: 400, release: false })
  await sleep(100)
  const mid = await stack(page)
  const subX = parseFloat(mid.sub.match(/translate3d\(([-\d.]+)%/)[1])
  const hubX = parseFloat(mid.hub.match(/translate3d\(([-\d.]+)%/)[1])
  if (!(subX > 40 && subX < 60) || !(hubX < -10 && hubX > -20)) throw new Error('Zwischenstand: Unterseite ' + subX + ' %, Übersicht ' + hubX + ' %')
  if (!(parseFloat(mid.dim) > 0.4 && parseFloat(mid.dim) < 0.6)) throw new Error('Abdunkeln ' + mid.dim)
  must(await page.locator('.stack-hub h1').innerText(), 'Finanzklar', 'Übersicht liegt unter der Unterseite')
  await page.screenshot({ path: `${SHOTS}/33-swipe-back-mitte.png` })
  await moveTo(page, 6, 300) // Finger zurück an den Rand und loslassen: bleibt auf der Unterseite
  await sleep(100)
  await lift(page)
  await stayH1(page, 'Alle Buchungen', 'Zurückgezogen und losgelassen')
  ok(`Mitten im Wischen: Unterseite ${subX.toFixed(0)} % verschoben, Übersicht bei ${hubX.toFixed(0)} % (Parallaxe), Abdunkeln ${Number(mid.dim).toFixed(2)}; Finger zurück zum Rand → bleibt auf der Unterseite`)

  // Zurück-Knopf spielt die Pop-Animation, Browser-Zurück geht ohne Animation zur Übersicht
  await page.getByRole('button', { name: 'Zurück', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.stack')?.dataset.phase === 'pop')
  await waitH1(page, 'Finanzklar'); await settled()
  must(await historyState(page), null, 'History nach Zurück-Knopf')
  await openBookings()
  await page.goBack()
  await waitH1(page, 'Finanzklar'); await settled()
  await page.goForward()
  await waitH1(page, 'Alle Buchungen'); await settled()
  await tab('Monat').click()
  await waitH1(page, 'Monat')
  for (let i = 0; i < 20 && (await historyState(page)) !== null; i++) await sleep(50)
  must(await historyState(page), null, 'Tab-Wechsel entfernt den History-Eintrag')
  await tab('Start').click(); await hubRow('Bargeld').click(); await settled()
  await page.goBack()
  await waitH1(page, 'Finanzklar'); await settled()
  must(await historyState(page), null, 'History nach Öffnen und System-Zurück')
  ok('Zurück-Knopf animiert (Phase „pop“); Browser-Zurück (page.goBack) und Vor führen zwischen Übersicht und Unterseite; ein Tab-Wechsel räumt den History-Eintrag weg, kein doppeltes Zurück')

  // 2) Sheet nach unten wischen
  await page.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
  await page.getByRole('dialog').waitFor(); await sheetIdle(page)
  await page.fill('#tx-amount', '99,99')
  const grab = await page.locator('.grabber').boundingBox()
  const sheetBox = await page.locator('.sheet').boundingBox()
  const gx = grab.x + grab.width / 2, gy = grab.y + grab.height / 2
  await swipe(page, { x0: gx, y0: gy, x1: gx, y1: gy + 40, steps: 6, durationMs: 700 })
  await sheetIdle(page)
  if (!(await page.getByRole('dialog').count())) throw new Error('Kurzes Ziehen hat das Sheet geschlossen')
  const amountBox = await page.locator('#tx-amount').boundingBox()
  await swipe(page, { x0: amountBox.x + 40, y0: amountBox.y + amountBox.height / 2, x1: amountBox.x + 40, y1: amountBox.y + 420, durationMs: 300 })
  await sleep(300)
  if (!(await page.getByRole('dialog').count())) throw new Error('Ziehen ab einem Eingabefeld hat das Sheet geschlossen')
  ok('Sheet: kurzes langsames Ziehen am Griff (40 px) und Ziehen ab einem Eingabefeld lassen es offen')
  await swipe(page, { x0: gx, y0: gy, x1: gx, y1: gy + sheetBox.height * 0.5, durationMs: 400, release: false })
  await sleep(120)
  await page.screenshot({ path: `${SHOTS}/34-sheet-swipe-mitte.png` })
  const dimMid = await page.evaluate(() => ({ y: new DOMMatrix(getComputedStyle(document.querySelector('.sheet')).transform).m42, dim: Number(document.querySelector('.backdrop-dim').style.opacity) }))
  if (!(dimMid.y > sheetBox.height * 0.4 && dimMid.dim > 0.3 && dimMid.dim < 0.7)) throw new Error('Sheet-Zwischenstand: ' + JSON.stringify(dimMid))
  await lift(page)
  await page.getByRole('dialog').waitFor({ state: 'detached' })
  must(await balance(), startBalance, 'Kontostand nach Sheet-Wischen')
  ok(`Sheet am Griff halb (${Math.round(dimMid.y)} px) nach unten gezogen und losgelassen: schließt, verwirft die Eingabe (Kontostand unverändert ${startBalance}); Abdunkeln folgte (${dimMid.dim.toFixed(2)})`)

  await page.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
  await page.getByRole('dialog').waitFor(); await sheetIdle(page)
  const g2 = await page.locator('.grabber').boundingBox()
  await swipe(page, { x0: g2.x + g2.width / 2, y0: g2.y + 2, x1: g2.x + g2.width / 2, y1: g2.y + 70, steps: 4, durationMs: 60 })
  await page.getByRole('dialog').waitFor({ state: 'detached' })
  ok('Sheet: schneller Wisch nach unten (70 px, > 0,5 px/ms) schließt ebenfalls')

  // Sheet auf einer Unterseite (Bargeld → Abhebung) – Griff funktioniert auch dort
  await hubRow('Bargeld').click(); await settled()
  await page.getByRole('button', { name: 'Abhebung', exact: true }).click()
  await page.getByRole('dialog').waitFor(); await sheetIdle(page)
  const g3 = await page.locator('.grabber').boundingBox()
  await swipe(page, { x0: g3.x + g3.width / 2, y0: g3.y + 2, x1: g3.x + g3.width / 2, y1: g3.y + 330, durationMs: 300 })
  await page.getByRole('dialog').waitFor({ state: 'detached' })
  await tab('Start').click()

  // 3) Monat wischen
  const monthLabelText = async () => (await page.locator('.week-nav .label').innerText()).trim()
  const waitMonth = async (text) => { for (let i = 0; i < 30; i++) { if ((await monthLabelText()) === text) return; await sleep(100) } throw new Error(`Monat erwartet ${text}, war ${await monthLabelText()}`) }
  await tab('Monat').click()
  await waitMonth('Oktober 2026'); await paneIdle(page)
  await swipe(page, { x0: 320, y0: 420, x1: 70, y1: 425 })
  await waitMonth('November 2026'); await paneIdle(page)
  await swipe(page, { x0: 70, y0: 420, x1: 330, y1: 420 })
  await waitMonth('Oktober 2026'); await paneIdle(page)
  await swipe(page, { x0: 70, y0: 420, x1: 330, y1: 420 })
  await waitMonth('September 2026'); await paneIdle(page)
  ok('Monat: Wischen nach links → November 2026 (Oktober → November), zweimal nach rechts → September 2026')

  await swipe(page, { x0: 200, y0: 420, x1: 120, y1: 420, durationMs: 800 })
  await paneIdle(page); must(await monthLabelText(), 'September 2026', 'Kurzes langsames Wischen')
  await swipe(page, { x0: 4, y0: 420, x1: 300, y1: 420 })
  await sleep(300); await paneIdle(page); must(await monthLabelText(), 'September 2026', 'Wischen vom Rand')
  await swipe(page, { x0: 200, y0: 700, x1: 200, y1: 300, steps: 10, durationMs: 300 })
  await sleep(200); must(await monthLabelText(), 'September 2026', 'Vertikales Ziehen')
  await page.getByRole('button', { name: 'Aktueller Monat' }).click()
  await waitMonth('Oktober 2026')
  await page.evaluate(() => window.scrollTo(0, 0))
  await swipe(page, { x0: 300, y0: 420, x1: 130, y1: 420, durationMs: 400, release: false })
  await sleep(100)
  const paneX = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.swipe-pane')).transform).m41)
  if (!(paneX < -20 && paneX > -156)) throw new Error('Monat-Zwischenstand: ' + paneX)
  await page.screenshot({ path: `${SHOTS}/35-monat-swipe-mitte.png` })
  await moveTo(page, 300, 420)
  await sleep(100)
  await lift(page); await paneIdle(page)
  await sleep(150); must(await monthLabelText(), 'Oktober 2026', 'Zurückgezogen und losgelassen')
  ok(`Monat: kurzes langsames Wischen, Wischen vom linken Rand und vertikales Ziehen ändern den Monat nicht; mitten im Wischen folgt der Inhalt mit Widerstand (${Math.round(paneX)} px bei 170 px Fingerweg), zurückgezogen bleibt Oktober`)

  await page.locator('.trend-col').nth(3).scrollIntoViewIfNeeded()
  const colBox = await page.locator('.trend-col').nth(3).boundingBox()
  await tapAt(page, colBox.x + colBox.width / 2, colBox.y + colBox.height / 2)
  await sleep(200)
  must(await monthLabelText(), 'Oktober 2026', 'Tippen aufs Diagramm')
  if (!(await page.locator('.callout').innerText()).includes('Einnahmen')) throw new Error('Tippen aufs Diagramm zeigt keine Details')
  ok('Monat: Tippen auf eine Diagrammspalte ist kein Wischen (Details erscheinen, Monat bleibt)')

  // 4) Budgets wischen
  await tab('Budgets').click()
  await waitMonth('Oktober 2026'); await paneIdle(page)
  await swipe(page, { x0: 320, y0: 420, x1: 70, y1: 425 })
  await waitMonth('November 2026'); await paneIdle(page)
  await swipe(page, { x0: 70, y0: 420, x1: 330, y1: 420 })
  await waitMonth('Oktober 2026'); await paneIdle(page)
  await swipe(page, { x0: 70, y0: 420, x1: 330, y1: 420 })
  await waitMonth('September 2026'); await paneIdle(page)
  await page.getByRole('button', { name: 'Nächster Monat' }).click()
  await waitMonth('Oktober 2026')
  ok('Budgets: Wischen links → November 2026, zweimal rechts → September 2026; Pfeil-Knopf funktioniert weiter')
  await tab('Start').click()

  // 5) „Bewegung reduzieren“: Navigation und Gesten funktionieren, nur kurze Überblendungen
  {
    const ctxR = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', reducedMotion: 'reduce', serviceWorkers: 'block' })
    const pr = await ctxR.newPage()
    pr.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    pr.on('pageerror', (e) => errors.push(e.message))
    await pr.clock.install({ time: new Date('2026-10-27T10:00:00+01:00') })
    await pr.goto(URL)
    await pr.getByRole('button', { name: /^Verträge/ }).click()
    await pr.getByRole('button', { name: 'Zurück', exact: true }).waitFor()
    const t0 = Date.now(); await settled(pr); const pushMs = Date.now() - t0
    await pr.getByRole('button', { name: 'Zurück', exact: true }).click()
    await waitH1(pr, 'Finanzklar'); await settled(pr)
    await pr.getByRole('button', { name: /^Alle Buchungen/ }).click(); await settled(pr)
    await swipe(pr, { x0: 6, y0: 300, x1: 260, y1: 300 })
    await waitH1(pr, 'Finanzklar'); await settled(pr)
    await pr.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
    await pr.getByRole('dialog').waitFor()
    const anim = await pr.evaluate(() => getComputedStyle(document.querySelector('.sheet')).animationName)
    if (anim !== 'fade') throw new Error('Reduzierte Bewegung: Sheet nutzt Animation ' + anim)
    const g = await pr.locator('.grabber').boundingBox()
    await sleep(200)
    await swipe(pr, { x0: g.x + g.width / 2, y0: g.y + 2, x1: g.x + g.width / 2, y1: g.y + 300, durationMs: 250 })
    await pr.getByRole('dialog').waitFor({ state: 'detached' })
    await pr.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name: 'Monat', exact: true }).click()
    await swipe(pr, { x0: 320, y0: 420, x1: 70, y1: 420 })
    for (let i = 0; i < 30 && (await pr.locator('.week-nav .label').innerText()).trim() !== 'November 2026'; i++) await sleep(100)
    must((await pr.locator('.week-nav .label').innerText()).trim(), 'November 2026', 'Reduzierte Bewegung: Monat wischen')
    await ctxR.close()
    ok(`Bewegung reduzieren: Push/Pop, Kanten-Wischen, Sheet-Wischen (Überblendung statt Slide) und Monat-Wischen funktionieren (Push ${pushMs} ms)`)
  }
}

// Darstellung: Automatisch / Hell / Dunkel (eigener Key, kein Teil der Daten)
{
  const mk = async (colorScheme) => {
    const c = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', colorScheme, serviceWorkers: 'block', acceptDownloads: true })
    const p = await c.newPage()
    p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    p.on('pageerror', (e) => errors.push(e.message))
    await p.clock.install({ time: new Date('2026-10-27T10:00:00+01:00') })
    return { c, p }
  }
  const css = (p, sel, prop) => p.locator(sel).first().evaluate((el, pr) => getComputedStyle(el)[pr], prop)
  const metas = (p) => p.evaluate(() => [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content))
  const pick = async (p, name) => { await p.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name: 'Einstellungen', exact: true }).click(); await p.getByRole('group', { name: 'Darstellung' }).getByRole('button', { name, exact: true }).click() }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const mustEq = (a, b, what) => { if (a !== b) throw new Error(`${what}: ${a} ≠ ${b}`) }

  // 1) Systemhell: Dunkel wählen, sofort dunkel, nach Neuladen weiter dunkel und ohne helles Aufblitzen
  {
    const { c, p } = await mk('light')
    await p.addInitScript(() => {
      new MutationObserver((_, obs) => {
        const r = document.getElementById('root')
        if (r && r.childElementCount) { window.__themeAtMount = document.documentElement.dataset.theme ?? 'none'; obs.disconnect() }
      }).observe(document, { childList: true, subtree: true })
    })
    await p.goto(URL)
    mustEq(await css(p, 'body', 'backgroundColor'), 'rgb(242, 242, 247)', 'Hell: Hintergrund')
    await p.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name: 'Einstellungen', exact: true }).click()
    await sleep(300) // Tab-Einblenden abwarten
    await p.screenshot({ path: `${SHOTS}/36-einstellungen-darstellung.png` })
    mustEq(await p.getByRole('group', { name: 'Darstellung' }).getByRole('button', { name: 'Automatisch' }).getAttribute('aria-pressed'), 'true', 'Standard Automatisch')
    await pick(p, 'Dunkel')
    mustEq(await css(p, 'body', 'backgroundColor'), 'rgb(0, 0, 0)', 'Dunkel erzwungen: Hintergrund')
    mustEq(await css(p, '.card', 'backgroundColor'), 'rgb(28, 28, 30)', 'Dunkel erzwungen: Karte')
    mustEq(await p.evaluate(() => document.documentElement.dataset.theme), 'dark', 'data-theme')
    mustEq(await p.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'dark', 'color-scheme')
    mustEq(await p.evaluate(() => localStorage.getItem('finanz-app:theme')), 'dark', 'Key')
    const m = await metas(p)
    if (!m.every((x) => x === '#000000')) throw new Error('theme-color bei Dunkel: ' + m)
    await tabOn(p, 'Start').click()
    mustEq(await css(p, 'h1', 'color'), 'rgb(255, 255, 255)', 'Dunkel: Text')
    await sleep(300)
    await p.screenshot({ path: `${SHOTS}/37-dunkel-erzwungen.png` })
    await p.reload()
    await p.locator('h1').first().waitFor()
    mustEq(await p.evaluate(() => window.__themeAtMount), 'dark', 'Thema vor dem ersten Rendern')
    mustEq(await css(p, 'body', 'backgroundColor'), 'rgb(0, 0, 0)', 'Nach Neuladen: Hintergrund')
    ok('Darstellung: Dunkel bei hellem System sofort wirksam (Hintergrund #000, Karte #1C1C1E, Text hell, color-scheme dark, theme-color #000000), nach Neuladen weiter dunkel und data-theme schon vor dem ersten Rendern gesetzt')

    // Monat-Diagramm in den dunklen Farbvarianten, Datensicherung ohne Darstellung
    await tabOn(p, 'Start').click()
    await p.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
    await p.fill('#tx-amount', '50')
    await p.getByRole('button', { name: 'Sichern' }).click()
    await p.getByRole('dialog').waitFor({ state: 'detached' })
    await p.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name: 'Monat', exact: true }).click()
    await p.locator('.trend-bar').first().waitFor({ state: 'attached' })
    mustEq(await css(p, '.trend-bar:nth-child(1)', 'backgroundColor'), 'rgb(48, 209, 88)', 'Dunkel: Einnahmen-Balken')
    mustEq(await css(p, '.trend-bar:nth-child(2)', 'backgroundColor'), 'rgb(255, 69, 58)', 'Dunkel: Ausgaben-Balken')
    ok('Darstellung: Monat-Diagramm nutzt unter erzwungenem Dunkel #30D158 / #FF453A')
    await p.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name: 'Einstellungen', exact: true }).click()
    const dl = await plainExport(p)
    const backup = fs.readFileSync(await dl.path(), 'utf8')
    if (/theme|dark|Darstellung/i.test(backup)) throw new Error('Darstellung steckt im Backup')
    ok('Darstellung: nicht Teil des JSON-Backups')

    // Automatisch: zurück auf System, folgt emulateMedia live
    await pick(p, 'Automatisch')
    mustEq(await p.evaluate(() => document.documentElement.hasAttribute('data-theme')), false, 'data-theme entfernt')
    mustEq(await p.evaluate(() => localStorage.getItem('finanz-app:theme')), null, 'Key entfernt')
    mustEq(await css(p, 'body', 'backgroundColor'), 'rgb(242, 242, 247)', 'Automatisch + System hell')
    await p.emulateMedia({ colorScheme: 'dark' })
    mustEq(await css(p, 'body', 'backgroundColor'), 'rgb(0, 0, 0)', 'Automatisch + System dunkel')
    await p.emulateMedia({ colorScheme: 'light' })
    mustEq(await css(p, 'body', 'backgroundColor'), 'rgb(242, 242, 247)', 'Automatisch + wieder hell')
    const ms = await p.evaluate(() => [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => [m.media, m.content]))
    mustEq(JSON.stringify(ms), JSON.stringify([['(prefers-color-scheme: light)', '#F2F2F7'], ['(prefers-color-scheme: dark)', '#000000']]), 'theme-color-Metas bei Automatisch')
    ok('Darstellung: Automatisch folgt dem System live (emulateMedia hell ↔ dunkel), data-theme entfernt, beide theme-color-Metas wiederhergestellt')
    await c.close()
  }

  // 2) Systemdunkel: Hell erzwingen
  {
    const { c, p } = await mk('dark')
    await p.goto(URL)
    mustEq(await css(p, 'body', 'backgroundColor'), 'rgb(0, 0, 0)', 'System dunkel: Hintergrund')
    await pick(p, 'Hell')
    mustEq(await css(p, 'body', 'backgroundColor'), 'rgb(242, 242, 247)', 'Hell erzwungen: Hintergrund')
    mustEq(await css(p, '.card', 'backgroundColor'), 'rgb(255, 255, 255)', 'Hell erzwungen: Karte')
    mustEq(await p.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light', 'color-scheme')
    const m = await metas(p)
    if (!m.every((x) => x === '#F2F2F7')) throw new Error('theme-color bei Hell: ' + m)
    await tabOn(p, 'Start').click()
    await p.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
    await p.fill('#tx-amount', '50')
    await p.getByRole('button', { name: 'Sichern' }).click()
    await p.getByRole('dialog').waitFor({ state: 'detached' })
    await tabOn(p, 'Monat').click()
    await p.locator('.trend-bar').first().waitFor({ state: 'attached' })
    mustEq(await css(p, '.trend-bar:nth-child(1)', 'backgroundColor'), 'rgb(52, 199, 89)', 'Hell: Einnahmen-Balken')
    await sleep(300)
    await p.screenshot({ path: `${SHOTS}/38-hell-erzwungen.png` })
    await p.reload()
    await p.locator('h1').first().waitFor()
    mustEq(await css(p, 'body', 'backgroundColor'), 'rgb(242, 242, 247)', 'Hell nach Neuladen')
    ok('Darstellung: Hell bei dunklem System sofort wirksam und persistent (Hintergrund #F2F2F7, Karte weiß, Balken #34C759, theme-color #F2F2F7)')
    await c.close()
  }
}

// ---------- Wischen zum Löschen, Rückgängig-Toast, Haptik (echte Touch-Events per CDP, frischer Kontext) ----------
{
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const must = (actual, expected, what) => { if (actual !== expected) throw new Error(`${what}: erwartet "${expected}", war "${actual}"`) }
  const mk = async (extra = {}) => {
    const c = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block', ...extra })
    const p = await c.newPage()
    p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    p.on('pageerror', (e) => errors.push(e.message))
    await p.clock.install({ time: new Date('2026-10-27T10:00:00+01:00') })
    return { c, p }
  }
  const sessions = new WeakMap()
  const cdpOf = async (p) => { if (!sessions.has(p)) sessions.set(p, await p.context().newCDPSession(p)); return sessions.get(p) }
  async function swipe(p, { x0, y0, x1, y1, steps = 10, durationMs = 300 }) {
    const cdp = await cdpOf(p)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] })
    for (let i = 1; i <= steps; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps }] })
      await sleep(durationMs / steps)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const tapAt = async (p, x, y) => {
    const cdp = await cdpOf(p)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await sleep(40)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const nav = (p, name) => p.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name, exact: true })
  const idle = (p) => p.waitForFunction(() => !document.querySelector('.stack[data-phase]:not([data-phase="idle"])'))
  const stored = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('finanz-app:v1')))
  const text = async (p) => nbsp(await p.locator('body').innerText())
  async function bal(p) {
    await nav(p, 'Start').click(); await idle(p)
    return (await text(p)).match(/Kontostand\s*\n?\s*([-−]?[\d.]+,\d\d €)/)?.[1]
  }
  async function addTx(p, { kind = 'Ausgabe', amount, category, date, note }) {
    await p.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
    await p.getByRole('button', { name: kind, exact: true }).click()
    await p.fill('#tx-amount', amount)
    if (date) await p.fill('#tx-date', date)
    await p.selectOption('#tx-cat', { label: category })
    if (note) await p.fill('#tx-note', note)
    await p.getByRole('button', { name: 'Sichern' }).click()
    await p.getByRole('dialog').waitFor({ state: 'detached' })
  }
  async function seed(p) {
    await p.goto(URL)
    await nav(p, 'Einstellungen').click()
    await p.fill('#start-balance', '1000')
    await p.getByRole('button', { name: 'Speichern' }).click()
    await nav(p, 'Start').click()
    await addTx(p, { kind: 'Einnahme', amount: '2.500,00', category: 'Gehalt', date: '2026-10-05', note: 'Oktober' })
    await addTx(p, { amount: '800', category: 'Fixkosten', date: '2026-10-01', note: 'Miete' })
    await addTx(p, { amount: '45,99', category: 'Lebensmittel', date: '2026-10-10', note: 'Einkauf' })
    await addTx(p, { amount: '12,01', category: 'Mobilität', date: '2026-10-12', note: 'Bahn' })
    await addTx(p, { amount: '20', category: 'Freizeit', date: '2026-10-20', note: 'Kino' })
    for (let i = 1; i <= 8; i++) await addTx(p, { amount: '1', category: 'Sonstiges', date: `2026-10-${10 + i}`, note: `Kleinkram ${i}` })
  }
  const SEED_BAL = '2.614,00 €' // 1000 + 2500 − 800 − 45,99 − 12,01 − 20 − 8
  const row = (p, t) => p.locator('.swipe-li', { hasText: t }).first()
  const waitState = (p, t, s) => p.waitForFunction(([t, s]) => [...document.querySelectorAll('.swipe-li')].some((li) => li.textContent.includes(t) && li.getAttribute('data-swipe') === s && li.querySelector('.swipe-content').style.transition === ''), [t, s])
  const toast = (p) => p.getByRole('status').filter({ hasText: 'gelöscht' })
  // Wischt eine Zeile nach links um `dx` px (Start 20 px vom rechten Rand der Zeile)
  async function swipeRow(p, t, dx, opts = {}) {
    const loc = row(p, t)
    await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await sleep(100)
    const b = await loc.boundingBox()
    const x0 = b.x + b.width - 20
    await swipe(p, { x0, y0: b.y + b.height / 2, x1: x0 - dx, y1: b.y + b.height / 2, ...opts })
    return b
  }
  const openBookings = async (p) => { await nav(p, 'Start').click(); await idle(p); await p.getByRole('button', { name: /^Alle Buchungen/ }).click(); await idle(p); await p.getByRole('button', { name: 'Zurück', exact: true }).waitFor() }

  // ---- Hauptkontext ----
  const { c, p } = await mk()
  await seed(p)
  must(await bal(p), SEED_BAL, 'Kontostand nach dem Anlegen')
  await openBookings(p)

  // 1) Antippen-Rest: kurz halb öffnen -> Löschen-Knopf, Löschen, Rückgängig
  const kino = (await stored(p)).transactions.find((t) => t.note === 'Kino')
  const b0 = await swipeRow(p, 'Kino', 60)
  await waitState(p, 'Kino', 'open')
  const offsetOpen = (await row(p, 'Kino').locator('.swipe-content').boundingBox()).x - b0.x
  if (Math.abs(offsetOpen + 80) > 1) throw new Error('Offene Zeile steht bei ' + offsetOpen + ' px statt −80')
  const delBtn = p.getByRole('button', { name: 'Löschen: Freizeit' })
  await delBtn.waitFor()
  must(await p.getByRole('button', { name: /^Löschen: / }).count(), 1, 'Nur ein sichtbarer Löschen-Knopf (geschlossene Zeilen verborgen)')
  must(await p.getByRole('dialog').count(), 0, 'Wischen öffnet kein Sheet')
  await p.screenshot({ path: `${SHOTS}/39-zeile-offen.png` })
  ok('Alle Buchungen: 60 px nach links (mehr als die Hälfte der 80 px) lässt „Kino“ offen stehen (Inhalt bei −80 px), roter „Löschen: Freizeit“-Knopf sichtbar, geschlossene Zeilen haben keinen erreichbaren Knopf')

  await delBtn.click()
  await row(p, 'Kino').waitFor({ state: 'detached' })
  await toast(p).waitFor()
  must(nbsp(await toast(p).innerText()).replace(/\s+/g, ' '), 'Buchung gelöscht Rückgängig', 'Toast-Text')
  await sleep(400) // Einblend-Animation abwarten
  await p.screenshot({ path: `${SHOTS}/40-toast-rueckgaengig.png` })
  must((await stored(p)).transactions.some((t) => t.id === kino.id), false, 'Kino aus dem Speicher entfernt')
  must(await bal(p), '2.634,00 €', 'Kontostand nach Löschen (+20,00 €)')
  ok('Tippen auf „Löschen“: Zeile verschwindet, Toast „Buchung gelöscht“ mit „Rückgängig“ (role=status), Kontostand genau +20,00 € = 2.634,00 €')

  await p.getByRole('button', { name: 'Rückgängig' }).click()
  await toast(p).waitFor({ state: 'detached' })
  const afterUndo = (await stored(p)).transactions.find((t) => t.id === kino.id)
  must(JSON.stringify(afterUndo), JSON.stringify(kino), 'Wiederhergestellte Buchung')
  must(await bal(p), SEED_BAL, 'Kontostand nach Rückgängig')
  await openBookings(p)
  await row(p, 'Kino').waitFor()
  ok('„Rückgängig“: Buchung zurück mit gleicher id/createdAt/Notiz im Speicher, Kontostand wieder exakt 2.614,00 €, Toast weg')

  // 2) Kurz wischen federt zurück, nichts wird gelöscht
  const nTx = (await stored(p)).transactions.length
  await swipeRow(p, 'Kino', 25)
  await waitState(p, 'Kino', 'closed')
  must((await stored(p)).transactions.length, nTx, 'Kurzes Wischen löscht nichts')
  must(await toast(p).count(), 0, 'Kein Toast nach kurzem Wischen')
  must(await p.getByRole('dialog').count(), 0, 'Kurzes Wischen öffnet kein Sheet')
  ok('Kurzes Wischen (25 px, unter der Hälfte) federt zurück: Zeile geschlossen, nichts gelöscht, kein Sheet')

  // 3) Langes Wischen löscht sofort; schneller Flick über den Knopf hinaus ebenfalls
  const bDel = await swipeRow(p, 'Bahn', 260)
  await row(p, 'Bahn').waitFor({ state: 'detached' })
  await toast(p).waitFor()
  must(await bal(p), '2.626,01 €', 'Kontostand nach langem Wischen (+12,01 €)')
  ok(`Langes Wischen (260 px = ${Math.round((260 / bDel.width) * 100)} % der Zeilenbreite) löscht sofort: Zeile weg, Toast, Kontostand +12,01 € = 2.626,01 €`)
  await p.getByRole('button', { name: 'Rückgängig' }).click()
  await openBookings(p)
  await swipeRow(p, 'Einkauf', 110, { steps: 4, durationMs: 60 })
  await row(p, 'Einkauf').waitFor({ state: 'detached' })
  must(await bal(p), '2.659,99 €', 'Kontostand nach Flick (+45,99 €)')
  ok('Schneller Flick nach links (110 px in 60 ms, über den Knopf hinaus) löscht sofort; der Toast gehört nur zum jüngsten Löschen')
  await p.getByRole('button', { name: 'Rückgängig' }).click()
  must(await bal(p), SEED_BAL, 'Kontostand nach zweitem Rückgängig')
  await openBookings(p)

  // 4) Senkrecht ziehen scrollt, öffnet nichts
  await p.evaluate(() => window.scrollTo(0, 0))
  const b4 = await row(p, 'Kleinkram 3').boundingBox()
  await swipe(p, { x0: b4.x + 200, y0: Math.min(b4.y + 20, 700), x1: b4.x + 205, y1: Math.max(b4.y - 200, 60), steps: 12, durationMs: 350 })
  await sleep(200)
  if ((await p.evaluate(() => window.scrollY)) < 50) throw new Error('Senkrechtes Ziehen auf einer Zeile hat nicht gescrollt')
  must(await p.locator('.swipe-li:not([data-swipe="closed"])').count(), 0, 'Senkrechtes Ziehen öffnet keine Zeile')
  ok('Senkrechtes Ziehen auf einer Zeile scrollt die Liste und öffnet keine Zeile')

  // 5) Antippen einer offenen Zeile schließt sie, öffnet nicht das Sheet; immer nur eine offen
  await p.evaluate(() => window.scrollTo(0, 0))
  await swipeRow(p, 'Miete', 60)
  await waitState(p, 'Miete', 'open')
  const mb = await row(p, 'Miete').boundingBox()
  await tapAt(p, mb.x + 40, mb.y + mb.height / 2)
  await waitState(p, 'Miete', 'closed')
  must(await p.getByRole('dialog').count(), 0, 'Antippen der offenen Zeile öffnet kein Sheet')
  await row(p, 'Miete').getByRole('button').first().click()
  await p.getByRole('dialog').waitFor()
  await p.keyboard.press('Escape'); await p.getByRole('dialog').waitFor({ state: 'detached' })
  ok('Antippen einer offenen Zeile schließt sie ohne Sheet; eine geschlossene Zeile öffnet danach wieder normal das Bearbeiten-Sheet')

  await swipeRow(p, 'Miete', 60); await waitState(p, 'Miete', 'open')
  await swipeRow(p, 'Kleinkram 1', 60); await waitState(p, 'Kleinkram 1', 'open')
  await waitState(p, 'Miete', 'closed')
  must(await p.locator('.swipe-li[data-swipe="open"]').count(), 1, 'Nur eine offene Zeile')
  // nach rechts ziehen schließt
  const kk = await row(p, 'Kleinkram 1').boundingBox()
  await swipe(p, { x0: kk.x + 100, y0: kk.y + kk.height / 2, x1: kk.x + 200, y1: kk.y + kk.height / 2 })
  await waitState(p, 'Kleinkram 1', 'closed')
  ok('Nur eine Zeile ist offen (zweite öffnen schließt die erste); Ziehen nach rechts schließt eine offene Zeile')
  // Tippen daneben schließt, Scrollen schließt
  await p.evaluate(() => window.scrollTo(0, 0))
  await swipeRow(p, 'Kino', 60); await waitState(p, 'Kino', 'open')
  const mh = await p.locator('.month-head').first().boundingBox()
  await tapAt(p, mh.x + mh.width / 2, mh.y + mh.height / 2) // auf die Monatsüberschrift
  await waitState(p, 'Kino', 'closed')
  must(await p.getByRole('dialog').count(), 0, 'Tippen daneben öffnet kein Sheet')
  await swipeRow(p, 'Kino', 60); await waitState(p, 'Kino', 'open')
  await p.evaluate(() => window.scrollBy(0, 40))
  await waitState(p, 'Kino', 'closed')
  ok('Tippen außerhalb und Scrollen schließen eine offene Zeile')

  // 6) Kanten-Wischen zurück hat Vorrang, auch wenn es auf einer Zeile beginnt
  await p.evaluate(() => window.scrollTo(0, 0))
  const eb = await row(p, 'Kino').boundingBox()
  await swipe(p, { x0: 6, y0: eb.y + eb.height / 2, x1: 260, y1: eb.y + eb.height / 2 })
  await p.locator('h1', { hasText: 'Finanzklar' }).waitFor(); await idle(p)
  must(await p.getByRole('button', { name: 'Zurück', exact: true }).count(), 0, 'Zurück-Knopf weg')
  ok('Kanten-Wischen (x = 6 px) beginnend auf einer Zeile navigiert zurück und startet kein Zeilen-Wischen')

  // 7) Bargeld: Umbuchung per Wischen löschen
  await p.getByRole('button', { name: /^Bargeld/ }).click(); await idle(p)
  await p.getByRole('button', { name: 'Abhebung', exact: true }).click()
  await p.fill('#tr-amount', '100')
  await p.getByRole('button', { name: 'Sichern' }).click()
  await p.getByRole('dialog').waitFor({ state: 'detached' })
  const cash = () => p.getByTestId('cash-balance').innerText().then(nbsp)
  must(await cash(), '100,00 €', 'Bargeld nach Abhebung')
  await swipeRow(p, 'Abhebung', 60)
  await waitState(p, 'Abhebung', 'open')
  await p.getByRole('button', { name: 'Löschen: Abhebung' }).click()
  await row(p, 'Abhebung').waitFor({ state: 'detached' })
  must(nbsp(await p.getByRole('status').innerText()).replace(/\s+/g, ' '), 'Umbuchung gelöscht Rückgängig', 'Toast Umbuchung')
  must(await cash(), '0,00 €', 'Bargeld nach Löschen')
  const trId = (await stored(p)).transfers.length
  must(trId, 0, 'Umbuchung gelöscht')
  await p.getByRole('button', { name: 'Rückgängig' }).click()
  await row(p, 'Abhebung').waitFor()
  must(await cash(), '100,00 €', 'Bargeld nach Rückgängig')
  must((await stored(p)).transfers.length, 1, 'Umbuchung zurück')
  ok('Bargeld: Umbuchung „Abhebung“ per Wischen + „Löschen“ entfernt (Bargeld 100,00 € → 0,00 €, Toast „Umbuchung gelöscht“), „Rückgängig“ stellt sie her (100,00 €)')

  // 8) Monat: Zeilen-Wischen ändert den Monat nicht, Wischen außerhalb schon
  await nav(p, 'Monat').click()
  const label = () => p.locator('.week-nav .label').innerText().then((s) => s.trim())
  must(await label(), 'Oktober 2026', 'Monat vorher')
  const paneIdle = () => p.waitForFunction(() => { const el = document.querySelector('.swipe-pane'); return el && el.style.transform === '' && !el.hasAttribute('data-dragging') && el.style.opacity === '' })
  await swipeRow(p, 'Kleinkram 4', 60)
  await waitState(p, 'Kleinkram 4', 'open')
  await sleep(300)
  must(await label(), 'Oktober 2026', 'Monat nach Zeilen-Wischen (offen)')
  await swipeRow(p, 'Kleinkram 5', 260)
  await row(p, 'Kleinkram 5').waitFor({ state: 'detached' })
  await sleep(300)
  must(await label(), 'Oktober 2026', 'Monat nach Zeilen-Wischen (löschen)')
  must(await toast(p).count(), 1, 'Toast auf der Monat-Seite')
  await p.getByRole('button', { name: 'Rückgängig' }).click()
  await row(p, 'Kleinkram 5').waitFor()
  ok('Monat: Wischen auf einer Buchungszeile öffnet/löscht die Zeile, der Monat bleibt „Oktober 2026“; Rückgängig stellt sie wieder her')
  // „Größte Ausgaben“
  await swipeRow(p, 'Miete', 260)
  await row(p, 'Miete').waitFor({ state: 'detached' })
  await sleep(300)
  must(await label(), 'Oktober 2026', 'Monat nach Wischen in „Größte Ausgaben“')
  must((await stored(p)).transactions.some((t) => t.note === 'Miete'), false, 'Miete gelöscht')
  await p.getByRole('button', { name: 'Rückgängig' }).click()
  must((await stored(p)).transactions.some((t) => t.note === 'Miete'), true, 'Miete zurück')
  ok('Monat „Größte Ausgaben“: Zeilen-Wischen löscht ebenfalls (Monat bleibt Oktober 2026), Rückgängig stellt „Miete“ wieder her')
  await p.evaluate(() => window.scrollTo(0, 0))
  await paneIdle()
  const sb = await p.locator('.summary').first().boundingBox()
  await swipe(p, { x0: sb.x + sb.width - 30, y0: sb.y + sb.height / 2, x1: sb.x + 40, y1: sb.y + sb.height / 2 })
  for (let i = 0; i < 30 && (await label()) !== 'November 2026'; i++) await sleep(100)
  must(await label(), 'November 2026', 'Monat wischen außerhalb von Zeilen')
  await paneIdle()
  ok('Monat: Wischen auf der Zusammenfassung (nicht auf einer Zeile) wechselt weiterhin den Monat (November 2026)')
  await p.getByRole('button', { name: 'Aktueller Monat' }).click()

  // 9) Toast verschwindet nach 5 s
  await nav(p, 'Start').click(); await idle(p)
  await openBookings(p)
  await swipeRow(p, 'Kleinkram 6', 260)
  await row(p, 'Kleinkram 6').waitFor({ state: 'detached' })
  await toast(p).waitFor()
  await p.clock.fastForward(4000)
  must(await toast(p).count(), 1, 'Toast nach 4 s noch da')
  await p.clock.fastForward(1200)
  await toast(p).waitFor({ state: 'detached' })
  ok('Toast verschwindet nach 5 s von selbst (Uhr: nach 4 s noch da, nach 5,2 s weg); das Löschen bleibt bestehen')

  // 10) Löschen im Sheet bleibt mit Bestätigung, Toast + Rückgängig auch dort
  await row(p, 'Kleinkram 7').getByRole('button').first().click()
  await p.getByRole('button', { name: 'Buchung löschen' }).click()
  await p.getByRole('alertdialog').getByRole('button', { name: /Löschen/ }).click()
  await row(p, 'Kleinkram 7').waitFor({ state: 'detached' })
  await toast(p).waitFor()
  await p.getByRole('button', { name: 'Rückgängig' }).click()
  await row(p, 'Kleinkram 7').waitFor()
  ok('Löschen im Bearbeiten-Sheet (mit Bestätigung) zeigt ebenfalls den Toast, „Rückgängig“ stellt die Buchung her')

  // Zeile hat die Dunkel-Variante
  await nav(p, 'Einstellungen').click()
  await p.getByRole('button', { name: 'Dunkel', exact: true }).click()
  await openBookings(p)
  await swipeRow(p, 'Kino', 60)
  await waitState(p, 'Kino', 'open')
  await p.screenshot({ path: `${SHOTS}/41-zeile-offen-dunkel.png` })
  ok('Dunkel: offene Zeile mit rotem Löschen-Knopf (Screenshot)')
  await c.close()

  // ---- Haptik: navigator.vibrate aufzeichnen ----
  {
    const { c: ch, p: ph } = await mk()
    await ph.addInitScript(() => {
      window.__vibes = []
      Object.defineProperty(navigator, 'vibrate', { value: (ms) => { window.__vibes.push(ms); return true }, configurable: true })
    })
    await ph.goto(URL)
    const vibes = () => ph.evaluate(() => window.__vibes.length)
    must(await vibes(), 0, 'Kein Vibrieren beim Start')
    await addTx(ph, { amount: '5', category: 'Sonstiges', note: 'Haptik' })
    must(await vibes(), 1, 'Vibration beim Speichern')
    must(await ph.evaluate(() => window.__vibes[0]), 10, 'Dauer 10 ms')
    await ph.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
    await ph.getByRole('button', { name: 'Abbrechen' }).click()
    await ph.getByRole('dialog').waitFor({ state: 'detached' })
    must(await vibes(), 1, 'Abbrechen vibriert nicht')
    await ph.getByRole('button', { name: /^Alle Buchungen/ }).click(); await idle(ph)
    await swipeRow(ph, 'Haptik', 260)
    await row(ph, 'Haptik').waitFor({ state: 'detached' })
    must(await vibes(), 2, 'Vibration beim Löschen per Wischen')
    await ph.getByRole('button', { name: 'Rückgängig' }).click()
    must(await vibes(), 3, 'Vibration bei Rückgängig')
    ok('Haptik: navigator.vibrate(10) beim Speichern, Löschen per Wischen und Rückgängig (3 Aufrufe), nicht beim Abbrechen')
    await ch.close()
  }
  // ---- Haptik-Fallback: ohne vibrate (iOS) wird ein verstecktes Switch-Element umgeschaltet ----
  {
    const { c: cf, p: pf } = await mk()
    await pf.addInitScript(() => { Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true }) })
    await pf.goto(URL)
    must(await pf.locator('input[switch]').count(), 0, 'Switch erst bei Bedarf')
    await addTx(pf, { amount: '5', category: 'Sonstiges', note: 'Haptik' })
    const sw = await pf.evaluate(() => {
      const input = document.querySelector('label[data-haptic] input[switch]')
      const label = input?.closest('label')
      return input && { hidden: label.getAttribute('aria-hidden'), tab: input.tabIndex, checked: input.checked, display: getComputedStyle(label).display, focused: document.activeElement === input }
    })
    if (!sw || sw.hidden !== 'true' || sw.tab !== -1 || sw.display === 'none' || sw.focused) throw new Error('Fallback-Element falsch: ' + JSON.stringify(sw))
    must(sw.checked, true, 'Switch umgeschaltet')
    await addTx(pf, { amount: '6', category: 'Sonstiges', note: 'Haptik 2' })
    must(await pf.locator('input[switch]').count(), 1, 'Nur ein Switch')
    must(await pf.evaluate(() => document.querySelector('input[switch]').checked), false, 'Switch wieder umgeschaltet')
    ok('Haptik ohne navigator.vibrate (iOS-Fallback): ein verstecktes <label><input type=checkbox switch> (aria-hidden, tabindex −1, nicht display:none, ohne Fokus) wird bei jedem Speichern umgeschaltet')
    await cf.close()
  }
  // ---- Bewegung reduzieren ----
  {
    const { c: cr, p: pr } = await mk({ reducedMotion: 'reduce' })
    await pr.goto(URL)
    await addTx(pr, { amount: '7', category: 'Sonstiges', note: 'Reduziert' })
    await addTx(pr, { amount: '8', category: 'Sonstiges', note: 'Reduziert 2' })
    await pr.getByRole('button', { name: /^Alle Buchungen/ }).click(); await idle(pr)
    await pr.evaluate(() => { window.__runs = 0; document.addEventListener('transitionrun', () => window.__runs++, true) })
    await swipeRow(pr, 'Reduziert 2', 60)
    await waitState(pr, 'Reduziert 2', 'open')
    must(await pr.evaluate(() => window.__runs), 0, 'Reduziert: keine Slide-Animation beim Öffnen')
    await pr.getByRole('button', { name: 'Löschen: Sonstiges' }).click()
    await row(pr, 'Reduziert 2').waitFor({ state: 'detached', timeout: 2000 })
    await swipeRow(pr, 'Reduziert', 260)
    await pr.locator('.swipe-li', { hasText: 'Reduziert' }).first().waitFor({ state: 'detached', timeout: 2000 }).catch(() => {})
    must((await stored(pr)).transactions.length, 0, 'Reduziert: beide gelöscht')
    ok('Bewegung reduzieren: Zeile öffnet ohne Slide-Animation, Löschen per Knopf und per langem Wischen funktioniert (Überblendung)')
    await cr.close()
  }
}

await browser.close()
if (errors.length) { console.error('Konsolenfehler:\n' + errors.join('\n')); process.exit(1) }
console.log(`\nAlle ${step} Prüfungen bestanden, keine Konsolenfehler.`)
