import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { OfferBanner } from '@/components/sections/OfferBanner'
import { PlansSection } from '@/components/sections/PlansSection'
import { CollectiveClassesSection } from '@/components/sections/CollectiveClassesSection'
import { BrandVideo } from '@/components/sections/BrandVideo'
import { ModalitiesTeaser } from '@/components/sections/ModalitiesTeaser'
import { ExpansionBanner } from '@/components/sections/ExpansionBanner'
import { FinalCta } from '@/components/sections/FinalCta'
import { Section, SectionHeader } from '@/components/ui/Section'
import { UnitCard } from '@/components/ui/UnitCard'
import { Button } from '@/components/ui/Button'
import { getUnits } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'LoudFit | O melhor ainda está por vir',
  description:
    'Rede de academias com estrutura completa, aulas coletivas inclusas e matrícula 100% online.',
}

export default async function HomePage() {
  const units = await getUnits().catch(() => [])

  return (
    <>
      <Hero />
      <OfferBanner />
      <PlansSection />
      <CollectiveClassesSection />

      {units.length > 0 && (
        <Section id="unidades" bg="lighter" className="relative overflow-hidden">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              dark
              label="Unidades"
              title="Escolha sua LoudFit."
              subtitle="5 unidades em operação — Campinas, Valinhos, São Paulo e Mogi Mirim."
              className="mb-0"
            />
            <Button href="/unidades" variant="volt" size="md" className="shrink-0 mb-10 md:mb-14">
              Ver todas as unidades
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        </Section>
      )}

      <BrandVideo />
      <ModalitiesTeaser />
      <ExpansionBanner />
      <FinalCta />
    </>
  )
}
