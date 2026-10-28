// Ist-Zustand der echten App: Sperrbildschirm, Startseite, Begrüßung. Aufruf: NODE_PATH=$(npm root -g) node current.mjs (App auf :4173)
import { createRequire } from 'node:module'
const { chromium, devices } = createRequire(import.meta.url)('playwright')
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../screens')
const URL = process.env.APP_URL || 'http://localhost:4173/'
const PW = 'Testpasswort123'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch()
const nav = (p, name) => p.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name, exact: true })

async function mk(faceId) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block' })
  const p = await ctx.newPage()
  await p.clock.install({ time: new Date('2026-10-28T10:00:00+01:00') })
  let cdp
  if (faceId) {
    cdp = await ctx.newCDPSession(p)
    await cdp.send('WebAuthn.enable')
    await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', ctap2Version: 'ctap2_1', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, hasPrf: true, automaticPresenceSimulation: true } })
  }
  await p.goto(URL)
  await p.getByTestId('balance').waitFor()
  await nav(p, 'Einstellungen').click()
  await p.fill('#start-balance', '2400'); await p.getByRole('button', { name: 'Speichern' }).click()
  await p.fill('#display-name', 'Felix'); await p.press('#display-name', 'Enter')
  await nav(p, 'Start').click()
  const tx = async ({ kind = 'Ausgabe', amount, category, date, note }) => {
    await p.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
    await p.getByRole('button', { name: kind, exact: true }).click()
    await p.fill('#tx-amount', amount); await p.fill('#tx-date', date)
    await p.selectOption('#tx-cat', { label: category }); await p.fill('#tx-note', note)
    await p.getByRole('button', { name: 'Sichern' }).click()
    await p.getByRole('dialog').waitFor({ state: 'detached' })
  }
  await tx({ kind: 'Einnahme', amount: '2.850,00', category: 'Gehalt', date: '2026-10-01', note: 'Gehalt Oktober' })
  await tx({ amount: '860', category: 'Fixkosten', date: '2026-10-02', note: 'Miete' })
  await tx({ amount: '64,35', category: 'Lebensmittel', date: '2026-10-14', note: 'Wocheneinkauf' })
  await tx({ amount: '23,50', category: 'Freizeit', date: '2026-10-20', note: 'Kino' })
  // Kontostand: 2400 + 2850 - 860 - 64,35 - 23,50 = 4.302,15 €
  await nav(p, 'Einstellungen').click()
  await p.getByRole('button', { name: 'App-Sperre einrichten' }).click()
  const dlg = p.getByRole('dialog', { name: 'App-Sperre einrichten' })
  await dlg.waitFor(); await sleep(500)
  await p.fill('#lock-pw', PW); await p.fill('#lock-pw2', PW)
  await dlg.getByRole('button', { name: 'Weiter', exact: true }).click()
  await p.getByTestId('recovery-key').waitFor()
  const key = (await p.getByTestId('recovery-key').innerText()).trim()
  await dlg.getByRole('checkbox', { name: /Ich habe den Schlüssel sicher notiert/ }).check()
  await dlg.getByRole('button', { name: 'Weiter', exact: true }).click()
  if (faceId) {
    await dlg.getByText('Face ID hinzufügen?').waitFor({ timeout: 30000 })
    await dlg.getByRole('button', { name: 'Face ID hinzufügen' }).click()
    await dlg.getByText('App-Sperre ist aktiv').waitFor({ timeout: 15000 })
  } else {
    const skip = dlg.getByRole('button', { name: /Nicht jetzt|Überspringen|Ohne Face ID/ })
    if (await skip.count()) await skip.first().click()
    else await dlg.getByText('App-Sperre ist aktiv').waitFor({ timeout: 15000 })
  }
  await dlg.getByRole('button', { name: 'Fertig' }).click()
  await dlg.waitFor({ state: 'detached' })
  console.log('Wiederherstellungsschlüssel (nur Test):', key)
  return { ctx, p }
}
const lock = async (p) => {
  await nav(p, 'Einstellungen').click()
  await p.locator('button.row', { hasText: 'Jetzt sperren' }).click()
  await p.locator('main.lock-screen').waitFor()
  await sleep(500)
}
const shot = async (p, name, w, h, scheme) => {
  await p.setViewportSize({ width: w, height: h })
  await p.emulateMedia({ colorScheme: scheme })
  await sleep(250)
  await p.screenshot({ path: `${OUT}/${name}.png` })
  console.log('->', name)
}

// ---- mit Face ID ----
{
  const { ctx, p } = await mk(true)
  await lock(p)
  await shot(p, 'ist-sperre-390-hell', 390, 844, 'light')
  await shot(p, 'ist-sperre-390-dunkel', 390, 844, 'dark')
  await shot(p, 'ist-sperre-375-hell', 375, 667, 'light')
  await shot(p, 'ist-sperre-430-dunkel', 430, 932, 'dark')
  // Passwortweg: Eingabe + falsches Passwort
  await shot(p, 'ist-sperre-390-hell', 390, 844, 'light')
  await p.fill('#lock-secret', 'falsch-falsch')
  await p.getByRole('button', { name: 'Mit Passwort entsperren' }).click()
  await p.getByRole('alert').waitFor({ timeout: 20000 })
  await shot(p, 'ist-sperre-passwort-390-hell', 390, 844, 'light')
  // Face ID -> Begrüßung (Mitte der Haltephase) -> Start
  await p.setViewportSize({ width: 390, height: 844 }); await p.emulateMedia({ colorScheme: 'light' })
  await p.getByRole('button', { name: 'Mit Face ID entsperren' }).click()
  await p.locator('.greeting').waitFor({ timeout: 15000 })
  await sleep(900)
  await p.screenshot({ path: `${OUT}/ist-begruessung-390-hell.png` }); console.log('-> begruessung')
  await p.locator('.greeting').waitFor({ state: 'detached', timeout: 15000 })
  await p.getByTestId('balance').waitFor(); await sleep(300)
  await shot(p, 'ist-start-390-hell', 390, 844, 'light')
  await shot(p, 'ist-start-390-dunkel', 390, 844, 'dark')
  await ctx.close()
}
// ---- ohne Face ID ----
{
  const { ctx, p } = await mk(false)
  await lock(p)
  await shot(p, 'ist-sperre-ohne-faceid-390-hell', 390, 844, 'light')
  await ctx.close()
}
await browser.close()
