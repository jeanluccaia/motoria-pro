import sharp from 'sharp'
import { stat, unlink } from 'node:fs/promises'

const SRC = 'public/media/franquias/hero/fachada-premium-franquias.png'
const DST = 'public/media/franquias/hero/fachada-premium-franquias.webp'

const meta = await sharp(SRC).metadata()

await sharp(SRC)
  .rotate()
  .withMetadata({ exif: {} })
  .webp({ quality: 88, effort: 6 })
  .toFile(DST)

const srcSize = (await stat(SRC)).size
const dstSize = (await stat(DST)).size
const savings = (((srcSize - dstSize) / srcSize) * 100).toFixed(1)
console.log(`${meta.width}x${meta.height}  ${(srcSize / 1024).toFixed(0)}KB -> ${(dstSize / 1024).toFixed(0)}KB (-${savings}%)`)

await unlink(SRC)
console.log('PNG source removed')
