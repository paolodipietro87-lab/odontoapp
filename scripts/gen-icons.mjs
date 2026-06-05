// Rasterizza scripts/molar.svg nelle icone PWA. Esegui: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const dir = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(dir, 'molar.svg'))
const pub = join(dir, '..', 'public')

const out = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
]

for (const { file, size } of out) {
  await sharp(svg).resize(size, size).png().toFile(join(pub, file))
  console.log('scritto', file)
}

// favicon SVG = stessa grafica
writeFileSync(join(dir, '..', 'public', 'favicon.svg'), svg)
console.log('scritto favicon.svg')
