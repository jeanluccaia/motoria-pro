import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const W = 1200
const H = 630

// Logo lockup: 600x192 — scale to 460px wide
const LOGO_W = 460
const LOGO_H = Math.round((192 / 600) * LOGO_W) // ~147

// Vertical position: logo centered slightly above midpoint
const LOGO_X = Math.round((W - LOGO_W) / 2) // centered horizontally
const LOGO_Y = Math.round(H / 2 - LOGO_H / 2 - 40) // slightly above center

const taglineY = LOGO_Y + LOGO_H + 32

// SVG overlay with background, bars, tagline
const svgOverlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${W}" height="${H}" fill="#090909"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="${W}" height="8" fill="#FFE500"/>

  <!-- Bottom left accent bar -->
  <rect x="0" y="${H - 5}" width="240" height="5" fill="#FFE500"/>

  <!-- Tagline -->
  <text
    x="${W / 2}"
    y="${taglineY}"
    text-anchor="middle"
    font-family="Inter, Arial, sans-serif"
    font-size="24"
    font-weight="400"
    fill="#707070"
    letter-spacing="0.02em"
  >Academia com musculação e aulas inclusas</text>

  <!-- Domain bottom right -->
  <text
    x="${W - 72}"
    y="${H - 28}"
    text-anchor="end"
    font-family="Inter, Arial, sans-serif"
    font-size="17"
    font-weight="600"
    fill="#383838"
    letter-spacing="0.08em"
  >loudfit.com.br</text>
</svg>`

const logoBuffer = readFileSync(join(root, 'public/assets/images/loudfit-logo-official-lockup-yellow.png'))

const logoResized = await sharp(logoBuffer)
  .resize(LOGO_W, LOGO_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

await sharp({
  create: { width: W, height: H, channels: 4, background: { r: 9, g: 9, b: 9, alpha: 255 } },
})
  .composite([
    { input: Buffer.from(svgOverlay), top: 0, left: 0 },
    { input: logoResized, top: LOGO_Y, left: LOGO_X },
  ])
  .jpeg({ quality: 92 })
  .toFile(join(root, 'public/og-loudfit-logo-v3.jpg'))

console.log('Generated: public/og-loudfit-logo-v3.jpg')
