import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Fonte: capa aprovada de setembro (2400x1000, PNG do Canva).
// Saídas em /public/media/hero como WebP otimizado — desktop (paisagem) e
// mobile (recorte vertical focado nas atletas, à direita do frame).
const SRC = 'imagens apresentação/nova capa site setembro.png'
const OUT_DIR = 'public/media/hero'

mkdirSync(OUT_DIR, { recursive: true })

const DESKTOP = {
  file: 'hero-setembro.webp',
  width: 2000,
  height: 833,
  quality: 78,
}

async function buildDesktop() {
  const src = sharp(SRC)
  const meta = await src.metadata()
  await src
    .resize({ width: DESKTOP.width, height: DESKTOP.height, fit: 'cover', position: 'centre' })
    .webp({ quality: DESKTOP.quality, effort: 5 })
    .toFile(join(OUT_DIR, DESKTOP.file))
  console.log('desktop', DESKTOP.file, '←', meta.width + 'x' + meta.height)
}

// Mobile: extrai um retrato à direita da imagem, onde estão as atletas.
// Preserva rostos e a curvatura amarela; sem stretching.
async function buildMobile() {
  const src = sharp(SRC)
  const meta = await src.metadata()
  const H = meta.height ?? 1000
  const W = meta.width ?? 2400
  const cropW = Math.round(H * 0.75) // 750 (aspecto 3:4)
  const cropX = Math.max(0, W - cropW - Math.round(W * 0.02))
  await src
    .extract({ left: cropX, top: 0, width: cropW, height: H })
    .resize({ width: 900, height: 1200, fit: 'cover', position: 'centre' })
    .webp({ quality: 78, effort: 5 })
    .toFile(join(OUT_DIR, 'hero-setembro-mobile.webp'))
  console.log('mobile hero-setembro-mobile.webp ←', cropW + 'x' + H, '(crop @', cropX + ')')
}

await buildDesktop()
await buildMobile()
console.log('done')
