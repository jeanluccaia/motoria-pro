import sharp from 'sharp'
import { readdir, mkdir, stat, copyFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

const SRC_ROOT = 'C:/Users/DELL/Desktop/jean IA/loudfit/public/media'
const DST_ROOT = 'public/media/unidades'

// Mapping: unit slug (matches supabase data) -> source folder inside SRC_ROOT
const units = [
  { slug: 'carrefour-valinhos', srcDir: 'unidade carrefour valinhos -' },
  { slug: 'amoreiras',          srcDir: 'unidade amoreiras - cps' },
  { slug: 'anchieta-sp',        srcDir: 'unidade - anchieta - sp' },
  { slug: 'mogi-mirim',         srcDir: 'unidade - mogi mirim' },
  { slug: 'vila-industrial',    srcDir: 'undiade vila industrial - cps' },
]

const MAX_WIDTH = 2000
const WEBP_QUALITY = 85

for (const { slug, srcDir } of units) {
  const srcFotosDir = join(SRC_ROOT, srcDir, 'fotos')
  if (!existsSync(srcFotosDir)) {
    console.warn(`SKIP  ${slug}: source folder not found (${srcFotosDir})`)
    continue
  }
  const files = (await readdir(srcFotosDir)).filter((f) => /\.(png|jpe?g)$/i.test(f))
  if (!files.length) {
    console.warn(`SKIP  ${slug}: no PNG/JPG in ${srcFotosDir}`)
    continue
  }
  const src = join(srcFotosDir, files[0])
  const dstDir = join(DST_ROOT, slug, 'fotos')
  const dst = join(dstDir, 'fachada-01.webp')

  await mkdir(dstDir, { recursive: true })

  const meta = await sharp(src).metadata()
  const pipeline = sharp(src).rotate().withMetadata({ exif: {} })
  if (meta.width && meta.width > MAX_WIDTH) pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  await pipeline.webp({ quality: WEBP_QUALITY, effort: 6 }).toFile(dst)

  const srcSize = (await stat(src)).size
  const dstSize = (await stat(dst)).size
  const savings = (((srcSize - dstSize) / srcSize) * 100).toFixed(1)
  console.log(`${slug.padEnd(20)} ${(srcSize/1024).toFixed(0).padStart(5)}KB -> ${(dstSize/1024).toFixed(0).padStart(5)}KB (-${savings}%) ${meta.width}x${meta.height}  ${files[0]}`)
}

// Move existing Ipiranga gallery from public/media/ipiranga-sp/fotos/ -> public/media/unidades/ipiranga-sp/fotos/
const ipirangaOld = 'public/media/ipiranga-sp/fotos'
const ipirangaNew = join(DST_ROOT, 'ipiranga-sp', 'fotos')
if (existsSync(ipirangaOld)) {
  await mkdir(ipirangaNew, { recursive: true })
  for (const f of await readdir(ipirangaOld)) {
    await copyFile(join(ipirangaOld, f), join(ipirangaNew, f))
  }
  console.log(`ipiranga-sp         copied ${(await readdir(ipirangaOld)).length} files to ${ipirangaNew}`)
  await rm('public/media/ipiranga-sp', { recursive: true, force: true })
  console.log(`ipiranga-sp         old folder removed`)
}

// Also create empty videos folder for consistency
for (const { slug } of [...units, { slug: 'ipiranga-sp' }]) {
  const v = join(DST_ROOT, slug, 'videos')
  await mkdir(v, { recursive: true })
}
console.log('videos/ folders ready')
