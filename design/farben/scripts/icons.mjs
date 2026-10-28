// Erzeugt die Icon-Varianten als PNG (192 px) in scripts/_icons/. NODE_PATH=$(npm root -g) node icons.mjs
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
import { iconSVG } from './palettes.mjs'
const D = path.dirname(fileURLToPath(import.meta.url)); fs.mkdirSync(path.join(D, '_icons'), { recursive: true })
const b = await chromium.launch()
for (const k of ['emerald', 'slate-gold']) {
  const p = await b.newPage({ viewport: { width: 192, height: 192 }, deviceScaleFactor: 2 })
  await p.setContent(`<body style="margin:0;background:transparent">${iconSVG(k)}</body>`)
  await p.screenshot({ path: path.join(D, '_icons', k + '.png'), omitBackground: true })
}
await b.close()
