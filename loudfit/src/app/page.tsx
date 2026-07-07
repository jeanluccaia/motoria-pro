import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { OfferBanner } from '@/components/sections/OfferBanner'
import { PlansSection } from '@/components/sections/PlansSection'
import { CollectiveClassesSection } from '@/components/sections/CollectiveClassesSection'
import { BrandVideo } from '@/components/sections/BrandVideo'
import { ModalitiesTeaser } from '@/components/sections/ModalitiesTeaser'
import { ExpansionBanner } from '@/components/sections/ExpansionBanner'
import { FinalCta } from '@/components/sections/FinalCta'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { StickyCta } from '@/components/ui/StickyCta'
import { WhatsAppFloat } from '@/components/ui/WhatsAppFloat'

export const metadata: Metadata = {
  title: { absolute: 'LoudFit | O melhor ainda está por vir' },
  description:
    'Rede de academias com estrutura completa, aulas coletivas inclusas e matrícula 100% online.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LoudFit | O melhor ainda está por vir',
    description:
      'Rede de academias com estrutura completa, aulas coletivas inclusas e matrícula 100% online.',
    url: '/',
    images: ['/assets/images/campaign-gym-16x9.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoudFit | O melhor ainda está por vir',
    description:
      'Rede de academias com estrutura completa, aulas coletivas inclusas e matrícula 100% online.',
    images: ['/assets/images/campaign-gym-16x9.png'],
  },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <OfferBanner />
      <CollectiveClassesSection />
      <PlansSection />
      <BrandVideo />
      <HomeUnitsCta />
      <ModalitiesTeaser />
      <ExpansionBanner />
      <FinalCta />
      <StickyCta />
      <WhatsAppFloat />
    </>
  )
}

const unitStats = [
  '5 unidades em operação',
  '1 em inauguração',
  '4 cidades',
]

function HomeUnitsCta() {
  return (
    <Section id="unidades" bg="graphite" className="relative py-14 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
        <Reveal>
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                Unidades
              </p>
            </div>
            <h2 className="text-4xl font-black leading-[1.02] text-lf-text md:text-5xl">
              Encontre sua LoudFit
            </h2>
            <p className="mt-4 max-w-[54ch] text-base leading-relaxed text-lf-muted md:text-lg">
              Veja unidades em operação, inauguração e a grade disponível em cada endereço.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:justify-self-end">
          <Button href="/unidades" variant="volt" size="lg">
            Ver todas as unidades
          </Button>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className="mt-8 grid gap-[1px] bg-lf-line sm:grid-cols-3 md:mt-10">
          {unitStats.map((stat) => (
            <div key={stat} className="bg-lf-surface px-5 py-4">
              <span className="block text-sm font-black text-lf-text">{stat}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  )
}
