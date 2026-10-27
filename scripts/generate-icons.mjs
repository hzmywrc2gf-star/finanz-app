import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public', { recursive: true })

// full-bleed (maskable / apple) and rounded variants
const svg = (rounded, scale) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2E9BFF"/><stop offset="1" stop-color="#0060DF"/></linearGradient></defs>
<rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#g)"/>
<text x="256" y="256" text-anchor="middle" dominant-baseline="central" dy="${14 * scale}" font-family="Helvetica, Arial, DejaVu Sans, sans-serif" font-weight="700" font-size="${320 * scale}" fill="#fff">€</text>
</svg>`

const out = async (name, rounded, scale, size) =>
  sharp(Buffer.from(svg(rounded, scale))).resize(size, size).png().toFile(`public/${name}`)

await out('icon-512.png', true, 1, 512)
await out('icon-192.png', true, 1, 192)
await out('apple-touch-icon.png', false, 1, 180)
await out('icon-maskable-512.png', false, 0.75, 512)
await sharp(Buffer.from(svg(true, 1))).resize(64, 64).png().toFile('public/favicon.png')
console.log('icons done')
