import type { Metadata } from 'next'
import { getUnits } from '@/lib/supabase'
import { FranchiseHero } from '@/components/franchise/FranchiseHero'
import { FranchiseInvestment } from '@/components/franchise/FranchiseInvestment'
import { FranchiseNetwork } from '@/components/franchise/FranchiseNetwork'
import { FranchiseGrowth } from '@/components/franchise/FranchiseGrowth'
import { FranchiseAceleracao } from '@/components/franchise/FranchiseAceleracao'
import { FranchiseFaq } from '@/components/franchise/FranchiseFaq'
import { FranchiseStickyCta } from '@/components/franchise/FranchiseStickyCta'
import { QualifyFormPro } from '@/components/franchise/QualifyFormPro'

export const metadata: Metadata = {
  title: { absolute: 'Franquias Loud Fit — Sua cidade pode ser a próxima' },
  description:
    'Expansão Loud Fit: rede em crescimento, com estrutura para abrir e suporte para crescer. Candidate-se para abrir uma unidade na sua cidade.',
  alternates: { canonical: '/franquias' },
  openGraph: {
    title: 'Franquias Loud Fit — Sua cidade pode ser a próxima',
    description:
      'Expansão Loud Fit: rede em crescimento, com estrutura para abrir e suporte para crescer.',
    url: '/franquias',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Franquias Loud Fit — Sua cidade pode ser a próxima',
    description:
      'Expansão Loud Fit: rede em crescimento, com estrutura para abrir e suporte para crescer.',
    images: ['/opengraph-image'],
  },
}

const processSteps = ['Candidatura', 'Análise da praça', 'Implantação', 'Inauguração']

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
      <FranchiseInvestment />
      <FranchiseNetwork units={orderedUnits} />
      <FranchiseGrowth />
      <FranchiseAceleracao />
      <FranchiseFaq />

      <section
        id="candidatura"
        className="relative bg-[#EFEDE6] py-16 md:py-20 lg:py-24"
        aria-labelledby="candidatura-title"
      >
        <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:gap-14 lg:gap-18">
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
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3.2rem)' }}
              >
                Quero levar a Loud Fit<br />para minha cidade
              </h2>
              <p className="mt-5 max-w-[44ch] text-[15.5px] leading-[1.6] text-[#3f3f42]">
                Buscamos parceiros com perfil empreendedor, capacidade de investimento e compromisso com a operação.
              </p>

              <ol
                aria-label="Processo de candidatura"
                className="mt-8 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B0B0C] md:gap-3"
              >
                {processSteps.map((step, i) => (
                  <li key={step} className="flex items-center gap-2 md:gap-3">
                    <span className="border border-[#0B0B0C]/25 px-3 py-1.5">{step}</span>
                    {i < processSteps.length - 1 && (
                      <span aria-hidden="true" className="text-[#0B0B0C]/40">→</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
            <QualifyFormPro />
          </div>
        </div>
      </section>

      <FranchiseStickyCta />
    </>
  )
}
