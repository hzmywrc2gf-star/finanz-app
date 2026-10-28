// Erzeugt die statischen Mockups (design/pastell/mockups/*.html) aus echten Zahlen. node build-mockups.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
import { seedData } from './seed.mjs'
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../mockups')
const eur = (c, o = {}) => (c < 0 ? '−' : o.plus ? '+' : '') + (Math.abs(c) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const eur0 = (c) => Math.round(c / 100).toLocaleString('de-DE') + ' €'

// ---- echte Daten: Monatsende-Kontostand (nur Konto) aus dem Seed ----
const d = seedData()
const sign = (t) => (t.kind === 'income' ? 1 : -1) * t.amountCents
const bal = (upTo) => d.settings.startBalanceCents + d.transactions.filter((t) => t.account === 'konto' && t.date <= upTo).reduce((a, t) => a + sign(t), 0)
  + d.transfers.filter((x) => x.date <= upTo).reduce((a, x) => a + (x.direction === 'withdrawal' ? -x.amountCents : x.amountCents), 0)
const MONTHS = [['Mai', '2026-05-31'], ['Jun', '2026-06-30'], ['Jul', '2026-07-31'], ['Aug', '2026-08-31'], ['Sep', '2026-09-30'], ['Okt', '2026-10-28']]
const pts = MONTHS.map(([m, last]) => ({ m, v: bal(last) }))
if (pts[5].v !== 1152911) throw new Error('Kontostand weicht ab: ' + pts[5].v)

// ---- glatte Kurve (monotone kubische Interpolation, kein Überschwingen) ----
function curve(xs, ys) {
  const n = xs.length, dx = [], m = [], t = []
  for (let i = 0; i < n - 1; i++) { dx[i] = xs[i + 1] - xs[i]; m[i] = (ys[i + 1] - ys[i]) / dx[i] }
  t[0] = m[0]; t[n - 1] = m[n - 2]
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2
  for (let i = 0; i < n - 1; i++) { if (m[i] === 0) { t[i] = t[i + 1] = 0; continue } const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i] } }
  let p = `M${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) { const h = dx[i] / 3; p += ` C${(xs[i] + h).toFixed(1)} ${(ys[i] + t[i] * h).toFixed(1)} ${(xs[i + 1] - h).toFixed(1)} ${(ys[i + 1] - t[i + 1] * h).toFixed(1)} ${xs[i + 1].toFixed(1)} ${ys[i + 1].toFixed(1)}` }
  return p
}
const W = 1000, H = 100, LO = 2400_00, HI = 12600_00
const px = (i) => ((i + 0.5) / 6) * W
const py = (v) => H - ((v - LO) / (HI - LO)) * H
const xs = pts.map((_, i) => px(i)), ys = pts.map((p) => py(p.v))
const line = curve(xs, ys)
const area = `${line} L${xs[5].toFixed(1)} ${H + 20} L${xs[0].toFixed(1)} ${H + 20} Z`
const pc = (i) => `left:${((i + 0.5) / 6) * 100}%;top:${(ys[i] / H) * 104}px`

// ---- Symbole ----
const svg = (inner, s = 22, sw = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
const I = {
  home: svg('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>', 26),
  month: svg('<rect x="4" y="11" width="4" height="9" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="16" y="8" width="4" height="12" rx="1"/>', 26),
  budget: svg('<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 3.5-5"/><circle cx="12" cy="16" r="1.2"/>', 26),
  settings: svg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>', 26),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 22, 2.4),
  list: svg('<path d="M9 7h10M9 12h10M9 17h10"/><path d="M5 7h.01M5 12h.01M5 17h.01" stroke-width="2.4"/>', 22),
  cash: svg('<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.4"/><path d="M6.5 12h.01M17.5 12h.01" stroke-width="2.4"/>', 22),
  doc: svg('<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4"/><path d="M9.5 12.5h5M9.5 16h5"/>', 22),
  repeat: svg('<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>', 20, 2),
  lock: svg('<rect x="5" y="11" width="14" height="9.5" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 20, 2),
  lockS: svg('<rect x="5" y="11" width="14" height="9.5" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 16, 2.2),
  chev: svg('<path d="m9 5 7 7-7 7"/>', 20, 2.2),
  left: svg('<path d="m15 5-7 7 7 7"/>', 22, 2.2),
  right: svg('<path d="m9 5 7 7-7 7"/>', 22, 2.2),
  face: svg('<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9.5v1.5M15 9.5v1.5M12 9.5v3.5h-1M9 16c1.7 1.3 4.3 1.3 6 0"/>', 24),
}
const status = `<div class="sb"><span>9:41</span><span class="sb-r">
<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
<svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a10 10 0 0 1 14 0M4 7a6.4 6.4 0 0 1 9 0"/><circle cx="8.5" cy="10" r="1.3" fill="currentColor" stroke="none"/></svg>
<svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.6" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2.4" fill="currentColor"/><path d="M25 4.5v4c.9-.3 1.6-1.1 1.6-2s-.7-1.7-1.6-2z" fill="currentColor" opacity=".45"/></svg></span></div>`
const tabbar = (cur) => `<nav class="tabbar" aria-label="Hauptnavigation"><div class="tabbar-in">${[['Start', I.home], ['Monat', I.month], ['Budgets', I.budget], ['Einstellungen', I.settings]].map(([n, ic]) => `<span class="tab" ${n === cur ? 'aria-current="page"' : ''}><span class="ind">${ic}</span>${n}</span>`).join('')}</div></nav>`
const page = (title, body, cls = '', inner = '') => `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="pastell.css">
<script>const w=innerWidth;const r=document.documentElement.style;r.setProperty('--sat',w<=375?'20px':'47px');r.setProperty('--sab',w<=375?'0px':'34px');if(w<=375)document.addEventListener('DOMContentLoaded',()=>document.body.classList.add('no-home'))</script>
</head><body><div class="phone ${cls}">${status}${body}<div class="home"></div></div></body></html>`
const w = (name, html) => fs.writeFileSync(path.join(OUT, name + '.html'), html)

// ---- 1 Sperrbildschirm ----
w('sperre', page('Sperrbildschirm', `<div class="lock-top"><img src="icon-192.png" alt=""><h1>Finanzklar</h1><p>${I.lockS}<span>Gesperrt</span></p></div>
<div class="lock-panel"><p class="hint">Deine Daten sind auf diesem Gerät verschlüsselt.</p><button class="btn">${I.face}Mit Face ID entsperren</button><button class="text-btn">Passwort verwenden</button></div>`, 'tall'))

// ---- 2 Start oben ----
const hero = `<section class="card hero t-sky" aria-label="Kontostand"><div class="eyebrow">Kontostand</div><div class="amount num" data-testid="balance">${eur(1152911)}</div>
<div class="pills"><span class="pill">Bargeld<b class="num">${eur(15000)}</b></span><span class="pill">Gesamt<b class="num">${eur(1167911)}</b></span></div>
<div class="chart-head"><span class="eyebrow">Kontostand-Verlauf</span><span class="pill" style="min-height:28px;font-size:13px">Monatsende</span></div>
<div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Kontostand am Monatsende: ${pts.map((p) => p.m + ' ' + eur0(p.v)).join(', ')}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--fill-a)"/><stop offset="1" style="stop-color:var(--fill-b)"/></linearGradient></defs>
<path d="${area}" fill="url(#g)"/><path d="${line}" fill="none" stroke="var(--line)" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
<span class="pt" style="left:${((0.5) / 6) * 100}%;top:${(ys[0] / H) * 104 - 24}px">${eur0(pts[0].v)}</span><span class="pt r" style="left:calc(${(5.5 / 6) * 100}% + 4px);top:${(ys[5] / H) * 104 + 18}px">${eur0(pts[5].v)}</span>
<span class="dot" style="${pc(0).replace(/top:[^;]+/, `top:${(ys[0] / H) * 104}px`)};width:10px;height:10px;margin:-5px 0 0 -5px;box-shadow:0 0 0 3px var(--dot-ring)"></span><span class="dot" style="${pc(5)}"></span></div>
<div class="months">${pts.map((p, i) => `<span class="${i === 5 ? 'now' : ''}">${p.m}</span>`).join('')}</div></section>`
const confirm = `<section class="card section t-lav" aria-label="Zu bestätigen"><div class="sec-head"><h2>Zu bestätigen</h2></div>
<div class="row" style="padding-top:2px"><span class="ico">${I.repeat}</span><div class="main"><div class="t">Fitnessstudio</div><div class="s">fällig 15.10.</div></div><span class="amt expense num">${eur(-2990)}</span></div>
<div class="actions"><button class="btn-sm">Buchen</button><button class="btn-sm soft">Überspringen</button></div></section>`
w('start', page('Start oben', `<div class="page"><div class="titlebar"><h1 class="title">Finanzklar</h1><button class="round" aria-label="Jetzt sperren">${I.lock}</button></div>${hero}
<button class="btn" style="margin-top:14px">${I.plus}Buchung hinzufügen</button>${confirm}</div>${tabbar('Start')}`))

// ---- 3 Start unten ----
const bud = (name, sub, pct, w, st) => `<div class="bud"><div class="bud-top"><div><div class="t">${name}</div><div class="s c-${st}">${sub}</div></div><span class="pct num c-${st}">${pct}</span></div><div class="bar ${st}"><i style="width:${Math.min(w, 100)}%"></i></div></div>`
const upc = (t, s, a) => `<div class="row"><span class="ico">${I.repeat}</span><div class="main"><div class="t">${t}</div><div class="s">${s}</div></div><span class="amt expense num">${a}</span></div>`
w('startunten', page('Start unten', `<div class="page scrolled snug">
<section class="card section compact" aria-label="Budgets" style="margin-top:0"><div class="sec-head"><h2>Budgets</h2><span class="s muted" style="font-size:13px">Oktober</span></div>
${bud('Freizeit', '22,40 € drüber', '137,3 %', 100, 'over')}${bud('Lebensmittel', 'noch 23,45 €', '92,2 %', 92.2, 'warn')}${bud('Fixkosten', 'noch 120,01 €', '88,0 %', 88, 'warn')}</section>
<section class="card section compact plain" aria-label="Demnächst fällig" style="padding-bottom:8px;margin-top:10px"><div class="sec-head"><h2>Demnächst fällig</h2></div>
${upc('Handyvertrag', 'Fr, 30.10.', eur(-1999))}${upc('Strom', 'So, 01.11.', eur(-6200))}${upc('Miete', 'Mo, 02.11.', eur(-86000))}</section>
<div class="tiles compact"><button class="tile t-lav"><span class="ico">${I.list}</span><span><div class="l">Alle Buchungen</div><div class="v num">43</div></span></button>
<button class="tile t-sand"><span class="ico">${I.cash}</span><span><div class="l">Bargeld</div><div class="v num">${eur(15000)}</div></span></button>
<button class="tile t-sky wide"><span class="ico">${I.doc}</span><span class="main"><div class="l">Verträge</div><div class="v num">5 · 971,89 €/Monat</div></span><span class="chev">${I.chev}</span></button></div></div>${tabbar('Start')}`, 'no-tint'))

// ---- 4 Budgets ----
const BUD = [['Lebensmittel', 27655, 30000, 'lav'], ['Fixkosten', 87999, 100000, 'sage'], ['Mobilität', 8350, 12000, 'sand'], ['Freizeit', 8240, 6000, 'sky'], ['Gesundheit', 1295, 4000, 'lav']]
const stat = (s, b) => (s > b ? 'over' : s * 100 >= b * 80 ? 'warn' : 'ok')
const pctS = (s, b) => (Math.round((s * 1000) / b) / 10).toFixed(1).replace('.', ',') + ' %'
const bcard = ([n, s, b, tint]) => { const st = stat(s, b); const rem = b - s; return `<section class="card t-${tint}" style="padding:14px 18px 16px;margin-top:10px"><div class="bud-top"><div style="min-width:0"><div class="t" style="font-size:17px;font-weight:600">${n}</div><div class="s muted num" style="font-size:13px;margin-top:1px">${eur(s)} von ${eur(b)}</div></div><span class="pct num c-${st}" style="font-size:26px">${pctS(s, b)}</span></div>
<div class="bar ${st}"><i style="width:${Math.min((s / b) * 100, 100)}%"></i></div><div class="s c-${st}" style="font-size:13px;margin-top:6px;font-weight:500">${rem >= 0 ? 'noch ' + eur(rem) : eur(-rem) + ' drüber'}</div></section>` }
const tot = { s: 133539, b: 152000 }
w('budgets', page('Budgets', `<div class="page"><div class="titlebar"><h1 class="title">Budgets</h1></div>
<div style="display:flex;align-items:center;justify-content:space-between;margin:8px 0 12px"><button class="round" aria-label="Vorheriger Monat">${I.left}</button><span class="pill" style="min-height:40px;padding:0 20px;font-size:17px;font-weight:600;color:var(--text);background:var(--chip)">Oktober 2026</span><button class="round" aria-label="Nächster Monat">${I.right}</button></div>
<section class="card t-sky" style="padding:18px 20px 18px" aria-label="Gesamt"><div class="bud-top"><div class="eyebrow" style="color:var(--text)">Gesamt</div><span class="pct num nowrap c-warn" style="font-size:44px;line-height:48px">${pctS(tot.s, tot.b)}</span></div><div class="muted num" style="font-size:14px;margin-top:2px">${eur(tot.s)} von ${eur(tot.b)}</div>
<div class="bar warn" style="height:10px;border-radius:5px;margin-top:12px"><i style="width:${(tot.s / tot.b) * 100}%"></i></div><div class="c-warn num" style="font-size:15px;font-weight:600;margin-top:8px">noch ${eur(tot.b - tot.s)}</div></section>
<div class="eyebrow" style="margin:18px 8px 0">Kategorien</div>${BUD.map(bcard).join('')}</div>${tabbar('Budgets')}`))
console.log('Mockups geschrieben', pts.map((p) => p.m + ' ' + p.v).join(' | '))
