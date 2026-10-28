// Erzeugt die statischen Mockup-HTML-Dateien (A, B, C). Aufruf: node build-mockups.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../mockups')

const FACE = (s = 22, sw = 1.8) => `<svg class="glyph" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9.5v1.5M15 9.5v1.5M12 9.5v3.5h-1M9 16c1.7 1.3 4.3 1.3 6 0"/></svg>`
const LOCK = (s = 14, sw = 2.2) => `<svg class="glyph" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9.5" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`
const SCALE = `<svg class="c-glyph" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="10" r="2.6" fill="currentColor" stroke="none"/><path d="M32 13v37M13 19h38M21 53h22"/><path d="M13 19 6 37M13 19l7 18M51 19l-7 18M51 19l7 18"/><path d="M5 37h16a8 6.5 0 0 1-16 0zM43 37h16a8 6.5 0 0 1-16 0z" fill="currentColor"/></svg>`
const ICON = (i) => `<svg class="glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${i}</svg>`
const I_LIST = '<path d="M9 7h10M9 12h10M9 17h10"/><path d="M5 7h.01M5 12h.01M5 17h.01" stroke-width="2.4"/>'
const I_CASH = '<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.4"/><path d="M6.5 12h.01M17.5 12h.01" stroke-width="2.4"/>'
const I_DOC = '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4"/><path d="M9.5 12.5h5M9.5 16h5"/>'
const CHEV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>'
const TABS = `<nav class="tabbar" aria-label="Hauptnavigation"><div class="tabbar-inner">
<button class="tab" aria-current="page"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg><span>Start</span></button>
<button class="tab"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="12" width="4" height="8" rx="1"/><rect x="10" y="5" width="4" height="15" rx="1"/><rect x="16" y="9" width="4" height="11" rx="1"/></svg><span>Monat</span></button>
<button class="tab"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17a8 8 0 0 1 16 0"/><path d="m12 17 3-5"/></svg><span>Budgets</span></button>
<button class="tab"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h16M4 16h16"/><circle cx="15" cy="8" r="2.2" fill="var(--bg)"/><circle cx="9" cy="16" r="2.2" fill="var(--bg)"/></svg><span>Einstellungen</span></button>
</div></nav>`

const SB = `<div class="sb"><span>9:41</span><span class="sb-r">
<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
<svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a10 10 0 0 1 14 0M4 7a6.4 6.4 0 0 1 9 0"/><circle cx="8.5" cy="10" r="1.3" fill="currentColor" stroke="none"/></svg>
<svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.6" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2.4" fill="currentColor"/><path d="M25 4.5v4c.9-.3 1.6-1.1 1.6-2s-.7-1.7-1.6-2z" fill="currentColor" opacity=".45"/></svg></span></div>`

const page = (cls, body, { bodyCls = '' } = {}) => `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mockup</title><link rel="stylesheet" href="app.css"><link rel="stylesheet" href="mock.css">
<script>const w=innerWidth;const r=document.documentElement.style;r.setProperty('--sat',w<=375?'20px':w>=430?'59px':'47px');r.setProperty('--sab',w<=375?'0px':'34px');if(w<=375)document.addEventListener('DOMContentLoaded',()=>document.body.classList.add('no-home'))</script>
</head><body class="${bodyCls}"><div class="phone ${cls}">${SB}${body}<div class="home"></div></div></body></html>`

const x = (a, b, t) => (t <= 0 ? a : t >= 1 ? b : `<div class="stack-cell"><div style="opacity:${1 - t}">${a}</div><div style="opacity:${t}">${b}</div></div>`)

// ---------- Sheet (gemeinsam) ----------
const sheet = (state) => {
  const dots = '••••••••••••'
  const field = state === 'wait'
    ? `<input type="password" disabled placeholder="Gesperrt" value="">`
    : `<input type="password" value="${state === 'empty' ? '' : dots}" placeholder="${state === 'empty' ? 'Passwort eingeben' : ''}">`
  const msg = state === 'error' ? '<div class="error" role="alert">Passwort falsch.</div>'
    : state === 'wait' ? '<div class="error">Zu viele Versuche. Noch 0:28 warten.</div>' : ''
  return `<div class="backdrop"><div class="backdrop-dim"></div><div class="sheet"><div class="sheet-grab"><div class="grabber"></div>
<div class="sheet-head"><button class="link-btn" style="padding-left:0">Abbrechen</button><h2>Mit Passwort entsperren</h2><span></span></div></div>
<div class="card wide-labels" style="margin-top:8px"><div class="field"><label for="p">Passwort</label>${field}</div></div>${msg}
<button class="btn"${state === 'wait' ? ' disabled' : ''}>Entsperren</button>
<button class="link-btn" style="display:block;margin:8px auto 0;font-size:15px">Wiederherstellungsschlüssel verwenden</button></div></div>`
}
const hud = (cap = true) => `<div class="dim"></div><div class="hud">${FACE(64, 1.5)}</div>${cap ? '<div class="hud-cap"><span>Platzhalter für die Face-ID-Anzeige des Systems</span></div>' : ''}`

// ---------- A ----------
const aTop = ({ title = 1, greet = 0, icon = 1, sub = 1 } = {}) => `<div class="a-top"><img src="icon-192.png" alt="" style="opacity:${icon}">
<div class="stack-cell" style="margin-top:18px"><h1 class="a-title" style="margin:0;opacity:${title}">Finanzklar</h1><h1 class="a-title" style="margin:0;opacity:${greet}">Moin, Felix</h1></div>
<div class="a-sub" style="opacity:${sub}">${LOCK(14)}<span>Gesperrt</span></div></div>`
const aBottom = (face = true, o = 1) => `<div class="a-bottom" style="opacity:${o}">
<button class="pill-btn">${face ? FACE(24, 1.8) + 'Mit Face ID entsperren' : LOCK(20, 2) + 'Mit Passwort entsperren'}</button>${face ? '<button class="text-btn">Passwort verwenden</button>' : '<div style="height:50px"></div>'}</div>`
const A = {
  'A-lock': aTop() + aBottom(),
  'A-ohne-faceid': aTop() + aBottom(false),
  'A-passwort': aTop() + aBottom() + sheet('filled'),
  'A-passwort-fehler': aTop() + aBottom() + sheet('error'),
  'A-passwort-wartezeit': aTop() + aBottom() + sheet('wait'),
  'A-uebergang-1': aTop() + aBottom(),
  'A-uebergang-2': aTop() + aBottom() + hud(),
  'A-uebergang-3': aTop({ title: 0, greet: 1, icon: 0, sub: 0 }) + aBottom(true, 0),
}

// ---------- Startseite (wie die App heute) ----------
const BAL = '4.302,15 €'
const menuRows = (locked) => `<ul class="list card menu-list ${locked ? 'b-lockrow' : ''}">
<li><div class="row menu-row"><span class="menu-icon blue">${ICON(I_LIST)}</span><span class="row-main"><div class="row-title">Alle Buchungen</div></span>${locked ? `<span class="chev" style="opacity:.45">${LOCK(16, 2)}</span>` : `<span class="row-value num">4</span><span class="chev">${CHEV}</span>`}</div></li>
<li><div class="row menu-row"><span class="menu-icon green">${ICON(I_CASH)}</span><span class="row-main"><div class="row-title">Bargeld</div></span>${locked ? `<span class="chev" style="opacity:.45">${LOCK(16, 2)}</span>` : `<span class="row-value num">0,00 €</span><span class="chev">${CHEV}</span>`}</div></li>
<li><div class="row menu-row"><span class="menu-icon orange">${ICON(I_DOC)}</span><span class="row-main"><div class="row-title">Verträge</div></span>${locked ? `<span class="chev" style="opacity:.45">${LOCK(16, 2)}</span>` : `<span class="row-value num">Keine</span><span class="chev">${CHEV}</span>`}</div></li></ul>`
const plus = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
// reveal t: 0 = gesperrt (Richtung B), 1 = echte Startseite; dazwischen Überblendung
function startB(T, { sheetHtml = '', foot = true } = {}) {
  const t = typeof T === 'number' ? { bal: T, sub: T, btn: T, rows: T, tabs: T, link: T } : T
  const balance = x(`<div class="balance-value num b-dots">••••••&nbsp;€</div>`, `<div class="balance-value num">${BAL}</div>`, t.bal)
  const sub = x(`<div class="balance-sub b-sub">${LOCK(15, 2)}<span>Entsperren, um Beträge zu sehen</span></div>`, `<div class="balance-sub num">Bargeld 0,00 € · Gesamt ${BAL}</div>`, t.sub)
  const btn = x(`<button class="btn add-btn">${FACE(22)} Mit Face ID entsperren</button>`, `<button class="btn add-btn">${plus} Buchung hinzufügen</button>`, t.btn)
  // „Passwort verwenden“ liegt unten in der Daumenzone, damit die Zeilen beim Entsperren nicht springen
  const link = t.link < 1 ? `<div class="b-bottom" style="opacity:${1 - t.link}"><button class="text-btn">Passwort verwenden</button></div>` : ''
  return `<div class="app"><h1 class="page-title">Finanzklar</h1>
<div class="card card-pad"><div class="balance-label">Kontostand</div>${balance}${sub}</div>${btn}
${x(menuRows(true), menuRows(false), t.rows)}</div>
${t.tabs > 0 ? `<div style="opacity:${t.tabs}">${TABS}</div>` : ''}${link}${sheetHtml}`
}
const B = {
  'B-lock': startB(0),
  'B-passwort': startB(0, { sheetHtml: sheet('filled') }),
  'B-uebergang-1': startB(0),
  'B-uebergang-2': startB(0) + hud(),
  'B-uebergang-3': startB({ bal: 0.7, sub: 1, btn: 1, rows: 0.5, tabs: 0.5, link: 1 }),
  'B-uebergang-4': startB(1),
}

// ---------- C ----------
const cTop = ({ title = 1, greet = 0, icon = 1, sub = 1 } = {}) => `<div class="a-top"><div style="opacity:${icon}">${SCALE}</div>
<div class="stack-cell" style="margin-top:14px"><h1 class="a-title" style="margin:0;opacity:${title}">Finanzklar</h1><h1 class="a-title" style="margin:0;opacity:${greet}">Moin, Felix</h1></div>
<div class="a-sub" style="opacity:${sub}">${LOCK(14)}<span>Gesperrt</span></div></div>`
const C = {
  'C-lock': cTop() + aBottom(),
  'C-passwort': cTop() + aBottom() + sheet('filled'),
  'C-uebergang-1': cTop() + aBottom(),
  'C-uebergang-2': cTop() + aBottom() + hud(),
  'C-uebergang-3': cTop({ title: 0, greet: 1, icon: 0, sub: 0 }) + aBottom(true, 0),
}
const write = (name, html, cls = '', opts) => fs.writeFileSync(path.join(OUT, name + '.html'), page(cls, html, opts))
for (const [n, h] of Object.entries(A)) write(n, h)
for (const [n, h] of Object.entries(B)) write(n, h)
for (const [n, h] of Object.entries(C)) write(n, h, 'c')
write('A-uebergang-4', startB(1))
// C-Frame 4: Verlauf blendet über der Startseite aus, Titel noch sichtbar; Frame 5: Startseite
write('C-uebergang-4', startB(1) + `<div class="c-layer" style="opacity:.4"></div>`, 'c-over')
write('C-uebergang-5', startB(1))
// Start-Seite (Vergleich)
write('start', startB(1))
console.log('ok')
