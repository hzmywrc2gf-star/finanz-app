// Berechnet WCAG-Kontraste und schreibt ../kontraste.md
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const L = (h) => { const [r, g, b] = rgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) }
const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const mix = (fg, a, bg) => '#' + rgb(fg).map((c, i) => Math.round(c * a + rgb(bg)[i] * (1 - a)).toString(16).padStart(2, '0')).join('')
// [Variante, Modus, Rolle, Vordergrund, Hintergrund, Art: T=Text 4,5 / G=Großtext oder UI 3]
const P = []
const add = (v, m, role, fg, bg, k) => P.push({ v, m, role, fg: fg.toUpperCase(), bg: bg.toUpperCase(), k })
for (const v of ['V1', 'V2']) {
  const hell = v === 'V1'
  // Hell
  const lg = { bg: '#F4F6F8', card: '#FFFFFF' }
  const link = v === 'V1' ? '#10B981' : '#047857'
  const btn = v === 'V1' ? '#10B981' : '#1E293B'
  const inc = v === 'V1' ? '#10B981' : '#047857'
  const bar = v === 'V1' ? '#10B981' : '#059669'
  const tab = v === 'V1' ? '#10B981' : '#1E293B'
  const tabIn = v === 'V1' ? '#94A3B8' : '#64748B'
  add(v, 'hell', 'Text auf Karte', '#1E293B', lg.card, 'T'); add(v, 'hell', 'Text auf Hintergrund', '#1E293B', lg.bg, 'T')
  const t2 = v === 'V1' ? '#64748B' : '#5B6B80'
  add(v, 'hell', 'Sekundärtext auf Karte', t2, lg.card, 'T'); add(v, 'hell', 'Sekundärtext auf Hintergrund (Abschnittstitel)', t2, lg.bg, 'T')
  add(v, 'hell', 'Sekundärtext auf Eingabe-/Knopffläche (#F1F5F9)', t2, '#F1F5F9', 'T')
  add(v, 'hell', 'Primärknopf: Text auf Knopf', '#FFFFFF', btn, 'T')
  add(v, 'hell', 'Primärknopf gegen Karte/Hintergrund (UI-Fläche)', btn, lg.bg, 'G')
  add(v, 'hell', 'Link/Sekundäraktion auf Karte', link, lg.card, 'T'); add(v, 'hell', 'Link auf Hintergrund (Sperrbildschirm „Passwort verwenden“)', link, lg.bg, 'T')
  add(v, 'hell', 'Link auf Knopffläche #F1F5F9 („Überspringen“)', link, '#F1F5F9', 'T')
  add(v, 'hell', 'Einnahme-Betrag (Text) auf Karte', inc, lg.card, 'T')
  add(v, 'hell', 'Ausgabe-Betrag (Text) auf Karte', '#DC2626', lg.card, 'T')
  add(v, 'hell', 'Ok-Text (Budget) auf Karte', inc, lg.card, 'T'); add(v, 'hell', 'Warn-Text auf Karte', '#B45309', lg.card, 'T')
  add(v, 'hell', 'Diagramm/Balken Einnahme gegen Karte', bar, lg.card, 'G'); add(v, 'hell', 'Diagramm/Balken Ausgabe gegen Karte', '#DC2626', lg.card, 'G')
  add(v, 'hell', 'Budget-Balken ok gegen Spur (#F1F5F9)', bar, '#F1F5F9', 'G'); add(v, 'hell', 'Budget-Balken warn gegen Karte', '#D97706', lg.card, 'G')
  add(v, 'hell', 'Schalter AN: Spur gegen Karte', v === 'V1' ? '#10B981' : '#059669', lg.card, 'G')
  add(v, 'hell', 'Schalter AN: weißer Knauf gegen Spur', '#FFFFFF', v === 'V1' ? '#10B981' : '#059669', 'G')
  add(v, 'hell', 'Tab aktiv (Symbol+Text 10 px) auf Tab-Leiste', tab, mix('#FFFFFF', .86, '#F4F6F8'), 'T')
  add(v, 'hell', 'Tab inaktiv (Text 10 px)', tabIn, mix('#FFFFFF', .86, '#F4F6F8'), 'T')
  add(v, 'hell', 'Löschen: weißer Text auf Rot', '#FFFFFF', '#DC2626', 'T')
  add(v, 'hell', 'Toast: weißer Text auf Slate', '#FFFFFF', '#1E293B', 'T'); add(v, 'hell', 'Toast: „Rückgängig“ (#34D399) auf Slate', '#34D399', '#1E293B', 'T')
  add(v, 'hell', 'Kachel Alle Buchungen: Symbol auf Kachel', '#FFFFFF', v === 'V1' ? '#10B981' : '#1E293B', 'G')
  add(v, 'hell', 'Kachel Bargeld: Symbol auf Kachel', '#FFFFFF', v === 'V1' ? '#1E293B' : '#059669', 'G')
  add(v, 'hell', 'Kachel Verträge: Symbol auf Kachel', v === 'V1' ? '#1E293B' : '#FFFFFF', v === 'V1' ? '#D9B46A' : '#64748B', 'G')
  add(v, 'hell', 'Kachel Verträge gegen Karte (nur Deko)', v === 'V1' ? '#D9B46A' : '#64748B', lg.card, 'G')
  add(v, 'hell', 'Icon: Gold #D9B46A auf Slate #1E293B', '#D9B46A', '#1E293B', 'G')
  add(v, 'hell', 'Gold #D9B46A als Text auf Weiß (nicht verwendet)', '#D9B46A', '#FFFFFF', 'T')
  // Dunkel
  const dc = { bg: '#0F172A', card: '#1E293B', c2: '#273449' }
  const dlink = v === 'V1' ? '#10B981' : '#34D399'
  const dbtn = v === 'V1' ? '#10B981' : '#34D399'
  const dbtnTxt = v === 'V1' ? '#FFFFFF' : '#0F172A'
  const dbar = v === 'V1' ? '#10B981' : '#34D399'
  const dtab = v === 'V1' ? '#10B981' : '#F1F5F9'
  const dtabbar = mix('#1E293B', .86, '#0F172A')
  add(v, 'dunkel', 'Text auf Karte', '#F1F5F9', dc.card, 'T'); add(v, 'dunkel', 'Text auf Hintergrund', '#F1F5F9', dc.bg, 'T')
  add(v, 'dunkel', 'Sekundärtext auf Karte', '#94A3B8', dc.card, 'T'); add(v, 'dunkel', 'Sekundärtext auf Hintergrund', '#94A3B8', dc.bg, 'T')
  add(v, 'dunkel', 'Sekundärtext auf erhöhter Fläche (#273449)', '#94A3B8', dc.c2, 'T')
  add(v, 'dunkel', 'Primärknopf: Text auf Knopf', dbtnTxt, dbtn, 'T'); add(v, 'dunkel', 'Primärknopf gegen Karte (UI-Fläche)', dbtn, dc.card, 'G')
  add(v, 'dunkel', 'Link auf Karte', dlink, dc.card, 'T'); add(v, 'dunkel', 'Link auf Hintergrund', dlink, dc.bg, 'T'); add(v, 'dunkel', 'Link auf erhöhter Fläche (#273449)', dlink, dc.c2, 'T')
  add(v, 'dunkel', 'Einnahme-Betrag auf Karte', dlink, dc.card, 'T'); add(v, 'dunkel', 'Ausgabe-Betrag auf Karte', '#F87171', dc.card, 'T')
  add(v, 'dunkel', 'Warn-Text auf Karte', '#FBBF24', dc.card, 'T')
  add(v, 'dunkel', 'Balken Einnahme gegen Karte', dbar, dc.card, 'G'); add(v, 'dunkel', 'Balken Ausgabe gegen Karte', '#F87171', dc.card, 'G'); add(v, 'dunkel', 'Budget-Balken warn gegen Karte', '#FBBF24', dc.card, 'G')
  add(v, 'dunkel', 'Schalter AN: Spur gegen Karte', v === 'V1' ? '#10B981' : '#059669', dc.card, 'G'); add(v, 'dunkel', 'Schalter AN: weißer Knauf gegen Spur', '#FFFFFF', v === 'V1' ? '#10B981' : '#059669', 'G')
  add(v, 'dunkel', 'Tab aktiv auf Tab-Leiste', dtab, dtabbar, 'T'); add(v, 'dunkel', 'Tab inaktiv (#94A3B8)', '#94A3B8', dtabbar, 'T')
  add(v, 'dunkel', 'Löschen: weißer Text auf Rot #DC2626', '#FFFFFF', '#DC2626', 'T')
  add(v, 'dunkel', 'Toast: Text auf #273449', '#F1F5F9', '#273449', 'T'); add(v, 'dunkel', 'Toast: „Rückgängig“ auf #273449', '#34D399', '#273449', 'T')
  add(v, 'dunkel', 'Kachel Alle Buchungen: Symbol', v === 'V1' ? '#FFFFFF' : '#F1F5F9', v === 'V1' ? '#10B981' : '#334155', 'G')
  add(v, 'dunkel', 'Kachel Bargeld: Symbol', v === 'V1' ? '#F1F5F9' : '#FFFFFF', v === 'V1' ? '#334155' : '#059669', 'G')
  add(v, 'dunkel', 'Kachel Verträge: Symbol', v === 'V1' ? '#0F172A' : '#FFFFFF', v === 'V1' ? '#E5C886' : '#64748B', 'G')
}
const rows = (v, m) => P.filter((p) => p.v === v && p.m === m).map((p) => { const r = cr(p.fg, p.bg); const need = p.k === 'T' ? 4.5 : 3; return `| ${p.role} | ${p.fg} | ${p.bg} | ${r.toFixed(2)}:1 | ${p.k === 'T' ? 'Text 4,5' : 'UI/Groß 3'} | ${r >= need ? 'bestanden' : '**FEHLER**'} |` })
let md = `# Kontraste Farbversuch (WCAG 2.1)\n\nBerechnet mit \`design/farben/scripts/kontraste.mjs\` (relative Luminanz, sRGB). Grenzen: Text 4,5:1, großer Text und UI-Komponenten/Grafiken 3:1. Halbtransparente Flächen (Tab-Leiste) sind gegen den Hintergrund verrechnet.\n\n`
const fails = {}
for (const v of ['V1', 'V2']) for (const m of ['hell', 'dunkel']) {
  md += `## ${v} ${v === 'V1' ? 'wörtlich' : 'angepasst'} – ${m}\n\n| Paar | Vordergrund | Hintergrund | Verhältnis | Anforderung | Ergebnis |\n|---|---|---|---|---|---|\n${rows(v, m).join('\n')}\n\n`
  fails[`${v} ${m}`] = rows(v, m).filter((r) => r.includes('FEHLER')).length
}
md += `## Zusammenfassung Fehler\n\n${Object.entries(fails).map(([k, n]) => `- ${k}: ${n} Paar(e) unter Grenze`).join('\n')}\n\nHinweis: Zeilen wie „Gold als Text auf Weiß“ und „Kachel gegen Karte (nur Deko)“ dokumentieren bewusst, warum Gold nie Text trägt und Kacheln nur Zierde sind; sie zählen in der Summe mit.\n`
fs.writeFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../kontraste.md'), md)
console.log(fails); console.log(md.split('\n').filter((l) => l.includes('FEHLER')).join('\n'))
