import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Campanha de outubro/2026 — Plano Trimestral R$ 99/mês.
// Duas artes aprovadas: uma horizontal (desktop) e uma vertical (mobile).
// Ambas já contêm o preço, o CTA e a validade — o Hero renderiza a arte
// integralmente e sobrepõe apenas o link acessível sobre o CTA desenhado.
const SRC_DESKTOP = 'imagens apresentação/capa-outubro-desktop.png'
const SRC_MOBILE = 'imagens apresentação/capa-outubro-mobile.png'
const OUT_DIR = 'public/media/hero'

mkdirSync(OUT_DIR, { recursive: true })

// Desktop: preserva a proporção original da arte (1942x809 ≈ 2.4:1),
// escalando para 2000px de largura para retina sem estirar.
async function buildDesktop() {
  const meta = await sharp(SRC_DESKTOP).metadata()
  const targetW = 2000
  const targetH = Math.round((meta.height / meta.width) * targetW)
  await sharp(SRC_DESKTOP)
    .resize({ width: targetW, height: targetH, fit: 'inside', withoutEnlargement: false })
    .webp({ quality: 82, effort: 5 })
    .toFile(join(OUT_DIR, 'hero-outubro.webp'))
  console.log('desktop hero-outubro.webp ←', meta.width + 'x' + meta.height, '→', targetW + 'x' + targetH)
}

// Mobile: preserva a proporção original (1086x1448 ≈ 3:4), escalando
// para 1080px de largura. Sem crop — a arte precisa aparecer inteira.
async function buildMobile() {
  const meta = await sharp(SRC_MOBILE).metadata()
  const targetW = 1080
  const targetH = Math.round((meta.height / meta.width) * targetW)
  await sharp(SRC_MOBILE)
    .resize({ width: targetW, height: targetH, fit: 'inside', withoutEnlargement: false })
    .webp({ quality: 82, effort: 5 })
    .toFile(join(OUT_DIR, 'hero-outubro-mobile.webp'))
  console.log('mobile hero-outubro-mobile.webp ←', meta.width + 'x' + meta.height, '→', targetW + 'x' + targetH)
}

await buildDesktop()
await buildMobile()
console.log('done')
