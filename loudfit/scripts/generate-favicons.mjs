/**
 * Gera ícones/favicon oficiais da Loud Fit a partir do símbolo amarelo.
 *
 * Saída em public/:
 *  - favicon.ico       32x32+16x16 (multi-size)
 *  - icon.png          512x512 (Next.js metadata icon)
 *  - apple-icon.png    180x180 (touch icon iOS)
 *  - og-image.jpg      1200x630 (copiado do og-loudfit-logo-v3.jpg oficial)
 *
 * Base:
 *  - public/assets/images/loudfit-logo-official-symbol-yellow.png (276x324)
 *  - public/og-loudfit-logo-v3.jpg (1200x630, já é o OG oficial)
 *
 * O símbolo é composto sobre fundo preto (identidade LF) para garantir
 * contraste nos tabs claros do navegador (Chrome/Safari nova aba).
 */
import { readFile, writeFile, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const publicDir = resolve(root, 'public')

const SYMBOL = resolve(publicDir, 'assets/images/loudfit-logo-official-symbol-yellow.png')
const OG_SOURCE = resolve(publicDir, 'og-loudfit-logo-v3.jpg')

const BG = { r: 10, g: 10, b: 10, alpha: 1 } // #0a0a0a preto Loud Fit

// O PNG oficial do símbolo (276x324) traz fragmentos das primeiras letras
// do lockup à direita. Cropamos o bounding box real do "A" antes de usar:
// colunas 17..235 x rows 86..298 (219x213, apenas o triângulo estilizado).
const SYMBOL_CROP = { left: 17, top: 86, width: 219, height: 213 }

async function renderSymbolOnBlack(size, paddingRatio = 0.14) {
  const pad = Math.round(size * paddingRatio)
  const inner = size - pad * 2
  const symbol = await sharp(SYMBOL)
    .extract(SYMBOL_CROP)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: symbol, top: pad, left: pad }])
    .png()
    .toBuffer()
}

async function main() {
  // icon.png 512x512
  const icon512 = await renderSymbolOnBlack(512)
  await writeFile(resolve(publicDir, 'icon.png'), icon512)
  console.log('  ✓ public/icon.png (512x512)')

  // apple-icon.png 180x180
  const apple = await renderSymbolOnBlack(180, 0.12)
  await writeFile(resolve(publicDir, 'apple-icon.png'), apple)
  console.log('  ✓ public/apple-icon.png (180x180)')

  // favicon.ico multi-size (16, 32, 48)
  const sizes = [16, 32, 48]
  const pngs = await Promise.all(sizes.map((s) => renderSymbolOnBlack(s, 0.08)))
  const ico = await pngToIco(pngs)
  await writeFile(resolve(publicDir, 'favicon.ico'), ico)
  console.log('  ✓ public/favicon.ico (16+32+48)')

  // og-image.jpg 1200x630 - copia do og oficial existente
  await copyFile(OG_SOURCE, resolve(publicDir, 'og-image.jpg'))
  console.log('  ✓ public/og-image.jpg (copiado de og-loudfit-logo-v3.jpg)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
