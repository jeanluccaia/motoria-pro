// Composes a portrait mobile hero from the wide desktop source.
// - Extracts atleta from source, scales her to fit right ~60% of canvas
// - Left ~40% is a dark gradient blended from source's dark gym area
// - Output: 780x1400 (2x retina of 390x700 mobile hero viewport)
//
// Run: node scripts/build-mobile-hero.mjs

import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const SRC = 'public/media/hero/hero-power-plus.png'
const OUT = 'public/media/hero/hero-power-plus-mobile.png'

// Target canvas dimensions
// - Match mobile hero aspect ~0.478-0.5 (iPhone SE 375×784 up to iPhone 15 Pro Max 430×784)
// - 780×1600 (aspect 0.4875) sits inside the range, so cover crops very little either side.
// - 2x retina scale for sharp rendering.
const TW = 780
const TH = 1600

const meta = await sharp(SRC).metadata()
console.log('source:', meta.width, 'x', meta.height)

// 1) Extract atleta region from source (roughly X 900-2350, full Y)
const atletaCrop = { left: 900, top: 0, width: 1450, height: meta.height }
const atletaBuf = await sharp(SRC).extract(atletaCrop).toBuffer()
const atletaMeta = await sharp(atletaBuf).metadata()
console.log('atleta crop:', atletaMeta.width, 'x', atletaMeta.height)

// 2) Scale atleta to fit TH tall, preserve aspect
const scale = TH / atletaMeta.height
const scaledW = Math.round(atletaMeta.width * scale)
const scaledAtleta = await sharp(atletaBuf).resize(scaledW, TH, { kernel: 'lanczos3' }).toBuffer()
console.log('scaled atleta:', scaledW, 'x', TH)

// 3) Take right slice of scaled atleta to position her face at ~78% target width
// Face in the atleta crop is at roughly X = (1500 - 900) = 600 within crop.
// Scaled: 600 * scale. We want face at TW*0.78 in output.
const faceInCropX = 600
const faceInScaledX = Math.round(faceInCropX * scale)
const targetFaceX = Math.round(TW * 0.78)
let sliceStart = faceInScaledX - targetFaceX
if (sliceStart < 0) sliceStart = 0
if (sliceStart + TW > scaledW) sliceStart = scaledW - TW
console.log('slice start:', sliceStart, 'end:', sliceStart + TW)

const atletaSlice = await sharp(scaledAtleta)
  .extract({ left: sliceStart, top: 0, width: TW, height: TH })
  .toBuffer()

// 4) Build a horizontal alpha mask: left 25% opaque black, 25%-55% fade, right full atleta
// Sharp doesn't do per-pixel loops fast. Use SVG mask as an image.
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="1"/>
        <stop offset="0.30" stop-color="#000" stop-opacity="1"/>
        <stop offset="0.58" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${TW}" height="${TH}" fill="url(#g)"/>
  </svg>`,
)

// 5) Composite: dark bg → atleta → mask on top
const darkBg = await sharp({
  create: { width: TW, height: TH, channels: 3, background: { r: 6, g: 6, b: 6 } },
}).png().toBuffer()

// Add subtle vignette by darkening bottom
const bottomShade = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}">
    <defs>
      <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset="0.65" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
      </linearGradient>
    </defs>
    <rect width="${TW}" height="${TH}" fill="url(#v)"/>
  </svg>`,
)

const composited = await sharp(darkBg)
  .composite([
    { input: atletaSlice }, // atleta full on top of dark
    { input: mask, blend: 'dest-in' }, // wait — dest-in keeps only where mask is opaque
  ])
  .toBuffer()

// Actually we need: dark canvas as base, then atleta on top BUT ONLY where mask says
// so atleta = image with alpha channel derived from mask
const atletaWithAlpha = await sharp(atletaSlice)
  .ensureAlpha()
  // Invert mask so atleta is visible on right (where mask is transparent black),
  // and hidden on left (where mask is opaque black).
  // Use joinChannel with the alpha extracted from the inverted mask.
  .toBuffer()

// Build alpha from a linear gradient: dark on left half, atleta opaque on right half.
// Text area (0-55%) stays pure dark. Fade from 55% to 68%. Atleta full-op after 68%.
const alphaMask = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}">
      <defs>
        <linearGradient id="a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000"/>
          <stop offset="0.48" stop-color="#000"/>
          <stop offset="0.72" stop-color="#fff"/>
          <stop offset="1" stop-color="#fff"/>
        </linearGradient>
      </defs>
      <rect width="${TW}" height="${TH}" fill="url(#a)"/>
    </svg>`,
  ),
)
  .greyscale()
  .toColourspace('b-w')
  .raw()
  .toBuffer()

const atletaMasked = await sharp(atletaSlice)
  .ensureAlpha()
  .joinChannel(alphaMask, { raw: { width: TW, height: TH, channels: 1 } })
  .png()
  .toBuffer()

const finalImage = await sharp(darkBg)
  .composite([
    { input: atletaMasked, blend: 'over' },
    { input: bottomShade, blend: 'over' },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer()

writeFileSync(OUT, finalImage)
console.log('wrote', OUT, finalImage.length, 'bytes')
