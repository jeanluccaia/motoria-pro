import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const OUT_DIR = 'imagens apresentação'
mkdirSync(OUT_DIR, { recursive: true })

async function patch({ src, dst, textRect, fillColor, svgText }) {
  // Build one SVG that both covers the old text with a flat fill and renders
  // the new date on top in the same stroke. Flat fill avoids seams because
  // the surrounding wall is nearly uniform there.
  const svg = Buffer.from(
    `<svg width="${textRect.width}" height="${textRect.height}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="0" y="0" width="${textRect.width}" height="${textRect.height}" fill="${fillColor}"/>` +
      `<text x="${svgText.x}" y="${svgText.y}" font-family="Arial, Helvetica, sans-serif" ` +
      `font-size="${svgText.size}" fill="#111" font-weight="${svgText.weight ?? 400}" ` +
      `letter-spacing="${svgText.letterSpacing ?? 0}">${svgText.content}</text>` +
    `</svg>`
  )

  await sharp(src)
    .composite([{ input: svg, top: textRect.top, left: textRect.left }])
    .toFile(dst)
  console.log('wrote', dst)
}

// Mobile 1086x1448 — "Até 14/10/2026" lives around y=635..665, x=20..370
// Keep the fill tight to the text footprint so edges land on near-white wall
await patch({
  src: 'imagens apresentação/capa-outubro-mobile.png',
  dst: 'imagens apresentação/capa-outubro-mobile.v2.png',
  textRect: { left: 10, top: 622, width: 320, height: 56 },
  fillColor: '#ffffff',
  svgText: { x: 12, y: 36, size: 26, weight: 400, content: 'Até 31/10/2026' },
})

// Desktop 1942x809 — "Até 14/10/2026" at ~y=735..765, x=25..260
await patch({
  src: 'imagens apresentação/capa-outubro-desktop.png',
  dst: 'imagens apresentação/capa-outubro-desktop.v2.png',
  textRect: { left: 10, top: 722, width: 320, height: 56 },
  fillColor: '#ffffff',
  svgText: { x: 12, y: 36, size: 26, weight: 400, content: 'Até 31/10/2026' },
})
