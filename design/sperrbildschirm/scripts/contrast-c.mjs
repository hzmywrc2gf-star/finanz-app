import { hex, ratio, mix } from './contrast.mjs'
const W = [255, 255, 255]
const sets = { hell: { g1: '#1463D2', g2: '#00419F', btn: '#0050C0' }, dunkel: { g1: '#0A4FB0', g2: '#021A40', btn: '#0A4FB0' } }
for (const [n, s] of Object.entries(sets)) {
  const g1 = hex(s.g1), g2 = hex(s.g2)
  const rows = [
    ['Titel/Link/Button-Beschriftung weiß auf hellster Verlaufsstelle (g1)', ratio(W, g1)],
    ['Titel weiß auf dunkelster Stelle (g2)', ratio(W, g2)],
    ['„Gesperrt“ weiß 90 % auf g1', ratio(mix(W, g1, 0.9), g1)],
    ['Button-Text auf Weiß (Pille)', ratio(hex(s.btn), W)],
  ]
  console.log(`== ${n}: ${s.g1} → ${s.g2}`)
  for (const [l, r] of rows) console.log(`${r.toFixed(2)}:1  ${l}  ${r >= 4.5 ? 'OK' : 'ZU NIEDRIG'}`)
}
