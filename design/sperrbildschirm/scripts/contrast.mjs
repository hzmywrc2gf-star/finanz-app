export const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
export const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
export const mix = (fg, bg, a) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)))
if (process.argv[1].endsWith('contrast.mjs')) {
  for (const h of ['#2E9BFF', '#1F7BEA', '#1A70E0', '#1668D8', '#0060DF', '#0A4FB0', '#0B3F8F', '#052A66']) console.log(h, 'weiß', ratio([255, 255, 255], hex(h)).toFixed(2))
}
