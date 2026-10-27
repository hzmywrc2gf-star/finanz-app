import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public', { recursive: true })

// Logo: balance scale (Einnahmen vs. Ausgaben im Gleichgewicht), drawn as paths so no font is needed.
// full-bleed (maskable / apple) and rounded variants; scale shrinks the scale into the maskable safe zone
const pan = (cx) => `<path d="M${cx - 50} 290 H${cx + 50} A50 50 0 0 1 ${cx - 50} 290 Z" fill="#fff"/>
<path d="M${cx} 170 L${cx - 44} 290 M${cx} 170 L${cx + 44} 290" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none"/>`

const svg = (rounded, scale) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2E9BFF"/><stop offset="1" stop-color="#0060DF"/></linearGradient></defs>
<rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#g)"/>
<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
<circle cx="256" cy="130" r="18" fill="#fff"/>
<rect x="245" y="140" width="22" height="240" rx="6" fill="#fff"/>
<rect x="176" y="372" width="160" height="28" rx="14" fill="#fff"/>
<rect x="116" y="152" width="280" height="18" rx="9" fill="#fff"/>
${pan(136)}
${pan(376)}
</g>
</svg>`

const out = async (name, rounded, scale, size) =>
  sharp(Buffer.from(svg(rounded, scale))).resize(size, size).png().toFile(`public/${name}`)

await out('icon-512.png', true, 0.9, 512)
await out('icon-192.png', true, 0.9, 192)
await out('apple-touch-icon.png', false, 0.9, 180)
await out('icon-maskable-512.png', false, 0.7, 512)
await sharp(Buffer.from(svg(true, 0.95))).resize(64, 64).png().toFile('public/favicon.png')
console.log('icons done')
