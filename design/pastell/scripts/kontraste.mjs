// WCAG-Kontraste der Pastell-Palette → ../kontraste.md. node kontraste.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2] }
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05) }
const mix = (fg, bg, a) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(fg.slice(i, i + 2), 16) * a + parseInt(bg.slice(i, i + 2), 16) * (1 - a)).toString(16).padStart(2, '0')).join('')
const P = {
  hell: { bg: '#F4F6F8', top: '#ECEAF7', card: '#FFFFFF', lav: '#ECEAFB', sky: '#E3EDFA', sage: '#E8EDF2', sand: '#F5EEE2', text: '#1E293B', t2: '#5B6B80', inc: '#047857', exp: '#DC2626', expT: '#C81E1E', warn: '#A84E06', over: '#B8390A', btn: '#1E293B', btnT: '#FFFFFF', tabInactive: '#64748B', tabbar: '#FFFFFF', warnBar: '#B95F05', overBar: '#C2410C', okBar: '#475569', warnHi: '#C96F08', overHi: '#CC4A12', chipW: 0.72 },
  dunkel: { bg: '#0F172A', top: '#22264A', card: '#1E293B', lav: '#282C47', sky: '#1F2E44', sage: '#253140', sand: '#2E2E36', text: '#F1F5F9', t2: '#94A3B8', inc: '#34D399', exp: '#F87171', expT: '#F87171', warn: '#FBBF24', over: '#FB923C', btn: '#F1F5F9', btnT: '#0F172A', tabInactive: '#94A3B8', tabbar: '#1E293B', warnBar: '#FBBF24', overBar: '#FB923C', okBar: '#94A3B8', warnHi: '#FCD66B', overHi: '#FDB27A', chipW: 0.09 },
}
let md = '# Kontraste Pastell-Entwurf (WCAG 2.x)\n\nAbweichungen von der Vorgabe (nötig, damit alles besteht): Warn-Text hell #A84E06 statt #B45309 und Über-Text hell #B8390A statt #C2410C (auf Pastellflächen 4,2–4,5 → ≥ 4,7); Warn-Balken hell #B95F05→#C96F08 statt #D97706 (Amber unter 3:1 auf den Tönen); Ausgaben-Rot auf Pastell hell #C81E1E statt #DC2626 (4,1 → ≥ 4,5). Rote/grüne Beträge stehen im Entwurf nie direkt auf dem Seitenhintergrund (dort wäre #DC2626 4,46:1), deshalb ist diese Zeile nicht aufgeführt.\n\nGeneriert von `scripts/kontraste.mjs`. Text ≥ 4,5:1 (große Schrift ≥ 24 px bzw. fett ≥ 19 px: ≥ 3:1 genügt, wird hier trotzdem gegen 4,5 geprüft); Balken/Symbole (nicht Text) ≥ 3:1.\n'
let fails = 0
for (const [mode, p] of Object.entries(P)) {
  const chip = mix(mode === 'hell' ? '#FFFFFF' : '#FFFFFF', p.sky, p.chipW)
  const surf = { 'Hintergrund': p.bg, 'Verlauf oben (Spitze)': p.top, 'Karte': p.card, 'Lavendel': p.lav, 'Himmel': p.sky, 'Nebel': p.sage, 'Sand': p.sand }
  md += `\n## ${mode === 'hell' ? 'Hell' : 'Dunkel'}\n\n| Text | auf | Verhältnis | Soll | Ergebnis |\n|---|---|---|---|---|\n`
  const rows = []
  for (const [sn, s] of Object.entries(surf)) {
    rows.push(['Haupttext ' + p.text, sn, p.text, s, 4.5]); rows.push(['Sekundärtext ' + p.t2, sn, p.t2, s, 4.5])
    if (sn === 'Hintergrund') continue
    if (sn !== 'Verlauf oben (Spitze)') { rows.push(['Beitrag Einnahme ' + p.inc, sn, p.inc, s, 4.5]); rows.push(['Betrag Ausgabe ' + (['Lavendel', 'Himmel', 'Nebel', 'Sand'].includes(sn) ? p.expT : p.exp), sn, ['Lavendel', 'Himmel', 'Salbei', 'Sand'].includes(sn) ? p.expT : p.exp, s, 4.5]); rows.push(['Warn-Text ' + p.warn, sn, p.warn, s, 4.5]); rows.push(['Über-Text ' + p.over, sn, p.over, s, 4.5]) }
  }
  const chipOn = (t, label, bg, a) => rows.push([label, `Chip (${Math.round(a * 100)} % Weiß auf ${bg})`, t, mix('#FFFFFF', bg, a), 4.5])
  chipOn(p.text, 'Chip-Text ' + p.text, p.sky, p.chipW); chipOn(mode === 'hell' ? p.t2 : '#CBD5E1', 'Pillen-Text ' + (mode === 'hell' ? p.t2 : '#CBD5E1'), p.sky, p.chipW); chipOn(p.text, 'Chip-Text ' + p.text, p.lav, p.chipW); chipOn(p.text, 'Soft-Pille „Überspringen“ ' + p.text, p.lav, p.chipW)
  rows.push(['Hauptknopf-Text ' + p.btnT, 'Hauptknopf ' + p.btn, p.btnT, p.btn, 4.5])
  rows.push(['Tab inaktiv ' + p.tabInactive, 'Tab-Leiste (Karte)', p.tabInactive, p.tabbar, 4.5])
  rows.push(['Haupttext Tab aktiv', 'Tab-Leiste', p.text, mix(p.text, p.tabbar, 0.08), 4.5])
  for (const [t, label, fg, bg, min] of rows) { const r = cr(fg, bg); const ok = r >= min; if (!ok) fails++; md += `| ${t} | ${label} | ${r.toFixed(2)}:1 | ${min}:1 | ${ok ? 'ok' : '**FEHLER**'} |\n` }
  md += '\n**Balken (Nicht-Text, ≥ 3:1 gegen die Karte; Spur ist zusätzlich nicht allein Träger, Prozent steht daneben):**\n\n| Balken | auf | Verhältnis | Ergebnis |\n|---|---|---|---|\n'
  for (const [bn, c] of [['ok neutral', p.okBar], ['warn', p.warnBar], ['warn (heller Verlaufsende)', p.warnHi], ['über', p.overBar], ['über (Verlaufsende)', p.overHi]]) for (const sn of ['Lavendel', 'Himmel', 'Nebel', 'Sand']) { const r = cr(c, surf[sn]); const ok = r >= 3; if (!ok) fails++; md += `| ${bn} ${c} | ${sn} | ${r.toFixed(2)}:1 | ${ok ? 'ok' : 'unter 3:1'} |\n` }
}
md += `\n**Fehler/Warnungen gesamt: ${fails}**\n`
fs.writeFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../kontraste.md'), md); console.log(fails); 
