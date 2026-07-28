import sharp from 'sharp'
import { mkdir, stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

const SRC_ROOT = 'C:/Users/DELL/Desktop/jean IA/loudfit/public/media'
const DST_ROOT = 'public/media/unidades'
const MAX_WIDTH = 2000
const WEBP_QUALITY = 85

const units = [
  {
    slug: 'vila-industrial',
    srcDir: 'undiade vila industrial - cps',
    mapping: [
      ['6CC785C9-E920-4731-B9C6-8B274A63688F.png', 'fachada-01.webp'],
      ['B1C0D2B9-4523-4853-BAA2-81844F1B93EF.png', 'musculacao-visao-geral-01.webp'],
      ['109D612F-671B-4270-86F7-973C73A0209E.png', 'musculacao-01.webp'],
      ['13FADF11-B04B-4D90-81C8-8B24130260A8.png', 'musculacao-02.webp'],
      ['80E33EC2-E9AA-4F26-A8F3-A7385C02FCDF.png', 'musculacao-03.webp'],
      ['D1CB3235-FA87-4924-BDA7-266D8946EB21.png', 'peso-livre-01.webp'],
      ['84BA6639-9D85-4589-9A52-239410D03038.png', 'cardio-esteiras-01.webp'],
      ['13297E20-A79E-4697-B327-145E9EB8D847.png', 'cardio-spinning-01.webp'],
      ['755EA466-CE9C-4367-852C-DCEC62D4A18E.png', 'cardio-bikes-01.webp'],
      ['0CDC3B5D-C7F0-4D61-9BAC-ABABE1CB6311.png', 'sala-coletiva-01.webp'],
      ['4A0AC0B3-0066-4BCA-9A55-133378387980.png', 'estrutura-lounge-01.webp'],
    ],
  },
  {
    slug: 'amoreiras',
    srcDir: 'unidade amoreiras - cps',
    mapping: [
      ['01.png', 'fachada-01.webp'],
      ['DD17180D-7098-4939-A976-8A8825C5A18E.png', 'musculacao-visao-geral-01.webp'],
      ['2040FE0E-C9FC-40D2-9577-A4D171BB29A3.png', 'musculacao-01.webp'],
      ['5B7561FB-CBC3-4E32-94F2-023B400AEABA.png', 'musculacao-02.webp'],
      ['92D112FE-91A2-4798-BB1C-9A4E0DAB9396.png', 'musculacao-03.webp'],
      ['6F459D97-2B87-485C-8724-4435FE762422.png', 'peso-livre-01.webp'],
      ['75C253EA-11F7-49CE-83F9-9D973C23FF0F.png', 'peso-livre-02.webp'],
      ['38612FC0-8B4F-40BE-9870-274714667BCA.png', 'cardio-esteiras-01.webp'],
      ['E87CD018-FC56-401E-8860-CD0A8AC7BF04.png', 'cardio-spinning-01.webp'],
      ['01FB1225-336F-47C4-A078-3CFA1013D01F.png', 'sala-coletiva-01.webp'],
      ['02.png', 'estrutura-kids-01.webp'],
    ],
  },
]

for (const { slug, srcDir, mapping } of units) {
  const srcFotosDir = join(SRC_ROOT, srcDir, 'fotos')
  const dstDir = join(DST_ROOT, slug, 'fotos')
  await mkdir(dstDir, { recursive: true })

  if (!existsSync(srcFotosDir)) {
    console.warn(`SKIP  ${slug}: source folder not found (${srcFotosDir})`)
    continue
  }

  console.log(`\n=== ${slug} ===`)
  for (const [srcName, dstName] of mapping) {
    const src = join(srcFotosDir, srcName)
    const dst = join(dstDir, dstName)
    if (!existsSync(src)) {
      console.warn(`  MISS ${srcName}`)
      continue
    }
    if (existsSync(dst)) await unlink(dst)

    const meta = await sharp(src).metadata()
    const pipeline = sharp(src).rotate().withMetadata({ exif: {} })
    if (meta.width && meta.width > MAX_WIDTH) {
      pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
    }
    await pipeline.webp({ quality: WEBP_QUALITY, effort: 6 }).toFile(dst)

    const srcSize = (await stat(src)).size
    const dstSize = (await stat(dst)).size
    const savings = (((srcSize - dstSize) / srcSize) * 100).toFixed(1)
    console.log(
      `  ${dstName.padEnd(34)} ${(srcSize / 1024).toFixed(0).padStart(5)}KB -> ${(dstSize / 1024).toFixed(0).padStart(5)}KB (-${savings}%) ${meta.width}x${meta.height}`
    )
  }
}
