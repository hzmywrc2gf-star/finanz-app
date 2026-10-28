// Performance-Messung der Gesten und Taps (kein Teil von smoke.mjs).
// Lokal: `npm run build && npm run preview`, dann `NODE_PATH=$(npm root -g) node e2e/perf.mjs`
// Umgebung: APP_URL (Standard http://localhost:4173/), REPS (Wiederholungen, Standard 3), OUT (JSON-Datei für Vergleiche)
// iPhone-13-Kontext, CPU 4× gedrosselt, ~300 Buchungen über 12 Monate, 6 Verträge, Budgets. Echte Touch-Events per CDP;
// im Seitenkontext zählt eine rAF-Schleife die Frames, ein PerformanceObserver die Long Tasks.
import { createRequire } from 'node:module'
const { chromium, devices } = createRequire(import.meta.url)('playwright')
import fs from 'node:fs'

const URL = process.env.APP_URL ?? 'http://localhost:4173/'
const REPS = Number(process.env.REPS ?? 3)
const THROTTLE = Number(process.env.THROTTLE ?? 4)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// Frames über dem 60-Hz-Takt (16,7 ms); 1 ms Toleranz für die Zeitstempel-Quantisierung
const JANK_MS = 17.7
const BAD_MS = 33.4

const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin' })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const cdp = await ctx.newCDPSession(page)

// ---------- Testdaten ----------
await page.goto(URL)
await page.evaluate(() => navigator.serviceWorker.ready)
await page.evaluate(() => {
  let seed = 12345
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
  const pick = (a) => a[Math.floor(rnd() * a.length)]
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date()
  const day = (back) => iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - back))
  const expense = ['lebensmittel', 'fixkosten', 'mobilität', 'freizeit', 'kleidung', 'gesundheit', 'sonstiges']
  const names = ['Lebensmittel', 'Fixkosten', 'Mobilität', 'Freizeit', 'Kleidung', 'Gesundheit', 'Sonstiges']
  const categories = [
    ...names.map((name, i) => ({ id: `expense-${expense[i]}`, name, kind: 'expense', builtIn: name === 'Sonstiges', ...(i < 4 ? { monthlyBudgetCents: [40000, 90000, 15000, 8000][i] } : {}) })),
    ...['Gehalt', 'Nebeneinkünfte', 'Sonstiges'].map((name) => ({ id: `income-${name.toLowerCase()}`, name, kind: 'income', builtIn: name === 'Sonstiges' })),
  ]
  const notes = ['', '', 'Wocheneinkauf', 'Bahn', 'Kino', 'Apotheke', 'Tanken', 'Geschenk', '']
  const transactions = []
  for (let i = 0; i < 300; i++) {
    const income = rnd() < 0.08
    transactions.push({
      id: `t${i}`,
      kind: income ? 'income' : 'expense',
      amountCents: Math.round(income ? 80000 + rnd() * 200000 : 300 + rnd() * 24000),
      date: day(Math.floor(rnd() * 365)),
      categoryId: income ? pick(['income-gehalt', 'income-nebeneinkünfte']) : `expense-${pick(expense)}`,
      note: pick(notes) || undefined,
      account: rnd() < 0.15 ? 'bargeld' : 'konto',
      createdAt: 1700000000000 + i,
    })
  }
  const transfers = Array.from({ length: 10 }, (_, i) => ({ id: `x${i}`, direction: i % 3 === 2 ? 'deposit' : 'withdrawal', amountCents: 5000 + i * 1000, date: day(10 + i * 30), createdAt: 1700000000000 + i }))
  const rule = (i, title, cat, cents, interval) => ({ id: `r${i}`, kind: 'expense', amountCents: cents, categoryId: cat, note: title, interval, dayOfMonth: 1 + i * 4, startDate: day(400), bookedThrough: iso(today), autoBook: true })
  const recurring = [
    rule(0, 'Miete', 'expense-fixkosten', 85000, 'monthly'), rule(1, 'Strom', 'expense-fixkosten', 7500, 'monthly'), rule(2, 'Handy', 'expense-fixkosten', 2999, 'monthly'),
    rule(3, 'Versicherung', 'expense-fixkosten', 24000, 'quarterly'), rule(4, 'Streaming', 'expense-freizeit', 1299, 'monthly'), rule(5, 'Haftpflicht', 'expense-fixkosten', 6500, 'yearly'),
  ]
  const data = { version: 6, settings: { startBalanceCents: 150000, startCashCents: 20000 }, categories, transactions, recurring, transfers }
  localStorage.setItem('finanz-app:v1', JSON.stringify(data))
})
await page.reload()
await page.getByRole('navigation', { name: 'Hauptnavigation' }).waitFor()

// ---------- Messfunktionen im Seitenkontext ----------
await page.evaluate(() => {
  const frames = []
  const longs = []
  let on = false
  let last = 0
  const loop = (t) => {
    if (on) {
      if (last) frames.push(t - last)
      last = t
    }
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
  new PerformanceObserver((list) => {
    if (on) for (const e of list.getEntries()) longs.push(e.duration)
  }).observe({ type: 'longtask' })
  window.__perf = {
    start() { frames.length = 0; longs.length = 0; last = 0; on = true },
    stop() { on = false; return { frames: [...frames], longs: [...longs] } },
  }
  // Tippen: Zeit ab pointerdown bis der Zustand `window.__tap.cond()` nach zwei Frames (≈ gemalt) erfüllt ist
  window.__tap = { t0: 0, ms: null, cond: null }
  document.addEventListener('pointerdown', (e) => {
    const tap = window.__tap
    if (!tap.cond || tap.ms !== null) return
    tap.t0 = e.timeStamp
    const poll = () => {
      if (tap.cond()) requestAnimationFrame(() => requestAnimationFrame((t) => (tap.ms = t - tap.t0)))
      else requestAnimationFrame(poll)
    }
    requestAnimationFrame(poll)
  }, true)
})
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE })

const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
async function swipe({ x0, y0, x1, y1, steps = 24, durationMs = 400 }) {
  await touch('touchStart', x0, y0)
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps)
    await sleep(durationMs / steps)
  }
  await touch('touchEnd')
}
async function tapAt(x, y) {
  await touch('touchStart', x, y)
  await sleep(30)
  await touch('touchEnd')
}
const center = async (loc) => {
  const b = await loc.boundingBox()
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}
const tapLoc = async (loc) => {
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center' })) // nicht unter der Tab-Leiste antippen
  await sleep(100)
  const { x, y } = await center(loc)
  await tapAt(x, y)
}
const settled = () => page.waitForFunction(() => !document.querySelector('.stack[data-phase]:not([data-phase="idle"])'))
const tab = (name) => page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name, exact: true })
// eine ungültige Messung (z. B. Geste nicht erkannt) bricht den Lauf nicht ab, sondern wird unten gemeldet
const warnings = []
const must = (cond, what) => { if (!cond) warnings.push(what) }

/** Misst `fn` (Geste + Ausschwingen) mit der Frame-Schleife; liefert Rohdaten. */
async function record(fn) {
  await page.evaluate(() => window.__perf.start())
  await fn()
  await sleep(60)
  return page.evaluate(() => window.__perf.stop())
}
async function openBookings(measure = false) {
  await tab('Start').click()
  await sleep(200)
  const hubRow = page.getByRole('button', { name: /^Alle Buchungen/ })
  // (h) Antippen der Zeile → Unterseite mit 300 Zeilen steht (Zeit bis zum gemalten Frame mit der letzten Zeile)
  if (measure) times.openList.push(await tapTime(`() => document.querySelectorAll('.swipe-li').length >= 300`, () => tapLoc(hubRow)))
  else await hubRow.click()
  await settled()
  await page.locator('.swipe-li').first().waitFor()
  await sleep(300)
}
async function tapTime(cond, action) {
  await page.evaluate((c) => { window.__tap.ms = null; window.__tap.cond = new Function(`return (${c})()`) }, cond)
  await action()
  await page.waitForFunction(() => window.__tap.ms !== null, null, { timeout: 15000 })
  return page.evaluate(() => { const v = window.__tap.ms; window.__tap.cond = null; return v })
}
const median = (a) => [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)]

// ---------- Szenarien ----------
const results = {}
const gesture = async (name, run) => {
  const raw = await run()
  const acc = (results[name] ??= { frames: 0, jank: 0, bad: 0, max: 0, longCount: 0, longMs: 0 })
  acc.frames += raw.frames.length
  acc.jank += raw.frames.filter((f) => f > JANK_MS).length
  acc.bad += raw.frames.filter((f) => f > BAD_MS).length
  acc.max = Math.max(acc.max, ...raw.frames, 0)
  acc.longCount += raw.longs.length
  acc.longMs += raw.longs.reduce((s, d) => s + d, 0)
}
const times = { openList: [], tapSheet: [], saveClosed: [], tab: [] }

for (let rep = 0; rep < REPS; rep++) {
  // (a) Kanten-Wischen zurück auf „Alle Buchungen“ (300 Zeilen)
  await openBookings(true)
  await gesture('a Kanten-Wischen zurück', async () => {
    const raw = await record(async () => {
      await swipe({ x0: 5, y0: 400, x1: 300, y1: 405, steps: 24, durationMs: 400 })
      await settled()
    })
    must((await page.locator('.stack-sub').count()) === 0, 'Wischen hat nicht zurückgeführt')
    return raw
  })

  // (g) senkrechtes Scrollen durch die lange Liste
  await openBookings()
  await gesture('g Liste scrollen (Flick)', async () => {
    const raw = await record(async () => {
      for (let i = 0; i < 3; i++) {
        await swipe({ x0: 200, y0: 650, x1: 200, y1: 150, steps: 15, durationMs: 200 })
        await sleep(250)
      }
    })
    must((await page.evaluate(() => window.scrollY)) > 200, 'Liste hat nicht gescrollt')
    return raw
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(800)

  // (b) Zeile: Löschen-Aktion öffnen, danach zurückfedern
  await gesture('b Zeile öffnen + zurück', async () => {
    const li = page.locator('.swipe-li').nth(2)
    const { x, y } = await center(li)
    const raw = await record(async () => {
      await swipe({ x0: x + 100, y0: y, x1: x + 5, y1: y, steps: 20, durationMs: 300 })
      await sleep(450)
      must((await li.getAttribute('data-swipe')) === 'open', `Zeile ist nicht aufgegangen (Wiederholung ${rep}, Zustand ${await li.getAttribute('data-swipe')}, scrollY ${await page.evaluate(() => scrollY)})`)
      await swipe({ x0: x, y0: y, x1: x + 90, y1: y, steps: 20, durationMs: 300 })
      await sleep(450)
    })
    must((await li.getAttribute('data-swipe')) === 'closed', 'Zeile ist nicht zugegangen')
    return raw
  })

  // (e) Tippen → Sheet sichtbar, Sichern → Sheet weg + Liste aktualisiert
  const row = page.locator('.swipe-li .row').first()
  times.tapSheet.push(await tapTime(`() => !!document.querySelector('.sheet')`, () => tapLoc(row)))
  await page.locator('.sheet').waitFor()
  await sleep(700)
  await page.fill('#tx-amount', `${100 + rep},45`)
  times.saveClosed.push(
    await tapTime(
      `() => !document.querySelector('.sheet') && document.querySelector('.swipe-li .row-amount').textContent.includes('${100 + rep},45')`,
      () => tapLoc(page.getByRole('button', { name: 'Sichern' })),
    ),
  )
  await sleep(500)

  // (d) Sheet nach unten wischen (über „Buchung hinzufügen“ geöffnet, Griff ziehen)
  await tab('Start').click()
  await sleep(300)
  await page.getByRole('button', { name: 'Buchung hinzufügen', exact: true }).first().click()
  await page.locator('.sheet').waitFor()
  await sleep(900)
  await gesture('d Sheet nach unten wischen', async () => {
    const g = await center(page.locator('.sheet-grab'))
    return record(async () => {
      await swipe({ x0: g.x, y0: g.y, x1: g.x, y1: g.y + 320, steps: 24, durationMs: 400 })
      await page.locator('.sheet').waitFor({ state: 'detached' })
    })
  })

  // (c) Monat: zum nächsten und wieder zurück wischen
  await tab('Monat').click()
  await page.getByRole('heading', { name: 'Monat', exact: true }).waitFor()
  await sleep(500)
  await gesture('c Monat wischen (vor + zurück)', async () =>
    record(async () => {
      await swipe({ x0: 330, y0: 420, x1: 90, y1: 425, steps: 24, durationMs: 350 })
      await sleep(600)
      await swipe({ x0: 90, y0: 420, x1: 330, y1: 425, steps: 24, durationMs: 350 })
      await sleep(600)
    }),
  )

  // (f) Tab-Wechsel: Zeit von pointerdown bis die neue Seite gemalt ist
  for (const [name, heading] of [['Budgets', 'Budgets'], ['Einstellungen', 'Einstellungen'], ['Monat', 'Monat'], ['Start', null]]) {
    const cond = heading
      ? `() => document.querySelector('h1.page-title')?.textContent === '${heading}'`
      : `() => !!document.querySelector('.balance-value')`
    times.tab.push(await tapTime(cond, () => tapLoc(tab(name))))
    await sleep(400)
  }
}

// ---------- Ausgabe ----------
const f1 = (n) => n.toFixed(1)
const rows = Object.entries(results).sort(([a], [b]) => a.localeCompare(b)).map(([name, r]) => ({ name, ...r }))
console.log(`\nPerf (${URL}, iPhone 13, CPU ${THROTTLE}× gedrosselt, ${REPS} Wiederholungen je Szenario)\n`)
console.log('| Szenario | Frames | > 16,7 ms | > 33 ms | max Frame ms | Long Tasks (Anzahl / ms) |')
console.log('|---|---|---|---|---|---|')
for (const r of rows) console.log(`| ${r.name} | ${r.frames} | ${r.jank} | ${r.bad} | ${f1(r.max)} | ${r.longCount} / ${f1(r.longMs)} |`)
const summary = {
  'h Alle Buchungen öffnen, 300 Zeilen (Median ms)': median(times.openList),
  'e Tippen → Sheet sichtbar (Median ms)': median(times.tapSheet),
  'e Sichern → Sheet weg + Liste neu (Median ms)': median(times.saveClosed),
  'f Tab-Wechsel (Median ms)': median(times.tab),
}
console.log('\n| Zeit | ms |\n|---|---|')
for (const [k, v] of Object.entries(summary)) console.log(`| ${k} | ${f1(v)} |`)
console.log(`\nEinzelwerte: Öffnen ${times.openList.map(f1)} · Tippen→Sheet ${times.tapSheet.map(f1)} · Sichern ${times.saveClosed.map(f1)} · Tab ${times.tab.map(f1)}`)
if (warnings.length) console.log('\nUngültige Messungen (nicht abgebrochen):', warnings)
if (errors.length) console.log('\nSeitenfehler:', errors)
if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({ rows, summary, times }, null, 2))
await browser.close()
