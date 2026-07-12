import type { Metadata } from 'next'
import { getUnits } from '@/lib/supabase'
import { FranchiseHero } from '@/components/franchise/FranchiseHero'
import { FranchiseNetwork } from '@/components/franchise/FranchiseNetwork'
import { FranchiseWhy } from '@/components/franchise/FranchiseWhy'
import { FranchiseAceleracao } from '@/components/franchise/FranchiseAceleracao'
import { FranchiseModel } from '@/components/franchise/FranchiseModel'
import { FranchiseSupport } from '@/components/franchise/FranchiseSupport'
import { FranchiseProfile } from '@/components/franchise/FranchiseProfile'
import { FranchiseProcess } from '@/components/franchise/FranchiseProcess'
import { FranchiseFaq } from '@/components/franchise/FranchiseFaq'
import { FranchiseClosing } from '@/components/franchise/FranchiseClosing'
import { FranchiseStickyCta } from '@/components/franchise/FranchiseStickyCta'
import { QualifyFormPro } from '@/components/franchise/QualifyFormPro'

export const metadata: Metadata = {
  title: { absolute: 'Franquias LoudFit — Sua cidade pode ser a próxima' },
  description:
    'Expansão LoudFit: rede em movimento, com estrutura completa, aulas coletivas inclusas e Aceleração LoudFit. Candidate-se para abrir uma unidade na sua cidade.',
  alternates: { canonical: '/franquias' },
  openGraph: {
    title: 'Franquias LoudFit — Sua cidade pode ser a próxima',
    description:
      'Expansão LoudFit: rede em movimento, com estrutura completa, aulas coletivas inclusas e Aceleração LoudFit. Candidate-se para abrir uma unidade na sua cidade.',
    url: '/franquias',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Franquias LoudFit — Sua cidade pode ser a próxima',
    description:
      'Expansão LoudFit: rede em movimento, com estrutura completa e Aceleração LoudFit.',
    images: ['/opengraph-image'],
  },
}

export default async function FranquiasPage() {
  const allUnits = await getUnits().catch(() => [])
  const orderedUnits = [...allUnits].sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99))
  const operatingCount = orderedUnits.filter((u) => u.status === 'ativa').length
  const uniqueCities = new Set(orderedUnits.map((u) => `${u.cidade}-${u.estado}`))
  const proof = {
    total: orderedUnits.length,
    operating: operatingCount,
    cities: uniqueCities.size,
  }

  return (
    <>
      <FranchiseHero units={proof} />
      <FranchiseNetwork units={orderedUnits} />
      <FranchiseWhy />
      <FranchiseAceleracao />
      <FranchiseModel />
      <FranchiseSupport />
      <FranchiseProfile />
      <FranchiseProcess />
      <FranchiseFaq />
      <FranchiseClosing />

      <section
        id="candidatura"
        className="relative bg-[#EFEDE6] py-20 md:py-28 lg:py-32"
        aria-labelledby="candidatura-title"
      >
        <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16 lg:gap-20">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-[#0B0B0C]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
                  Candidatura
                </p>
              </div>
              <h2
                id="candidatura-title"
                className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-[#0B0B0C]"
                style={{ fontSize: 'clamp(2.2rem, 4.4vw, 4rem)' }}
              >
                Envie sua<br />candidatura
              </h2>
              <p className="mt-6 max-w-[52ch] text-base leading-[1.65] text-[#3f3f42] md:text-lg">
                Duas etapas. Na primeira, contamos com dados básicos e a região de interesse. Na segunda, você conta sobre o seu momento e o time de expansão analisa a candidatura.
              </p>
              <ul className="mt-8 flex flex-col gap-3 text-[14px] leading-[1.55] text-[#0B0B0C]">
                {['O time de expansão analisa o perfil.', 'Se houver aderência, seguimos para a etapa de qualificação.', 'O processo segue conforme apresentado nesta página.'].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span aria-hidden="true" className="mt-[6px] inline-block h-1.5 w-3 shrink-0 bg-lf-volt" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <QualifyFormPro />
          </div>
        </div>
      </section>

      <FranchiseStickyCta />
    </>
  )
}
