import sharp from 'sharp'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const FOTOS_DIR = 'public/media/unidades/ipiranga-sp/fotos'
const MAX_WIDTH = 2000
const WEBP_QUALITY = 82

const files = (await readdir(FOTOS_DIR)).filter((f) => f.toLowerCase().endsWith('.png'))

for (const file of files) {
  const src = join(FOTOS_DIR, file)
  const dst = join(FOTOS_DIR, file.replace(/\.png$/i, '.webp'))
  const meta = await sharp(src).metadata()

  const pipeline = sharp(src).rotate().withMetadata({ exif: {} })
  if (meta.width && meta.width > MAX_WIDTH) pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  await pipeline.webp({ quality: WEBP_QUALITY, effort: 6 }).toFile(dst)

  const srcSize = (await stat(src)).size
  const dstSize = (await stat(dst)).size
  const savings = (((srcSize - dstSize) / srcSize) * 100).toFixed(1)
  console.log(`${file.padEnd(36)} ${(srcSize / 1024).toFixed(0).padStart(5)}KB -> ${(dstSize / 1024).toFixed(0).padStart(5)}KB  (-${savings}%)  ${meta.width}x${meta.height}`)
}
