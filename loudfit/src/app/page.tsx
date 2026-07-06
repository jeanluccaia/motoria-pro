import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { OfferBanner } from '@/components/sections/OfferBanner'
import { BrandMarquee } from '@/components/sections/BrandMarquee'
import { PlansSection } from '@/components/sections/PlansSection'
import { CollectiveClassesSection } from '@/components/sections/CollectiveClassesSection'
import { BrandVideo } from '@/components/sections/BrandVideo'
import { ModalitiesTeaser } from '@/components/sections/ModalitiesTeaser'
import { ExpansionBanner } from '@/components/sections/ExpansionBanner'
import { FinalCta } from '@/components/sections/FinalCta'
import { Section, SectionHeader } from '@/components/ui/Section'
import { UnitCard } from '@/components/ui/UnitCard'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { StickyCta } from '@/components/ui/StickyCta'
import { WhatsAppFloat } from '@/components/ui/WhatsAppFloat'
import { getUnits } from '@/lib/supabase'

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
}

export default async function HomePage() {
  const units = await getUnits().catch(() => [])

  return (
    <>
      <Hero />
      <OfferBanner />
      <CollectiveClassesSection />
      <BrandMarquee />
      <PlansSection />

      {units.length > 0 && (
        <Section id="unidades" bg="graphite" className="relative">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <Reveal>
              <SectionHeader
                label="Unidades"
                title="Escolha sua LoudFit."
                subtitle="5 unidades em operação — Campinas, Valinhos, São Paulo e Mogi Mirim."
                className="mb-0"
              />
            </Reveal>
            <Reveal delay={0.1} className="shrink-0 mb-10 md:mb-14">
              <Button href="/unidades" variant="volt" size="md">
                Ver todas as unidades
              </Button>
            </Reveal>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit, i) => (
              <Reveal key={unit.id} delay={i * 0.07}>
                <UnitCard unit={unit} />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      <BrandVideo />
      <ModalitiesTeaser />
      <ExpansionBanner />
      <FinalCta />
      <StickyCta />
      <WhatsAppFloat />
    </>
  )
}
