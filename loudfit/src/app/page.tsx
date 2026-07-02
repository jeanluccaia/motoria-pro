import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { OfferBanner } from '@/components/sections/OfferBanner'
import { PlansSection } from '@/components/sections/PlansSection'
import { BrandVideo } from '@/components/sections/BrandVideo'
import { ModalitiesTeaser } from '@/components/sections/ModalitiesTeaser'
import { ExpansionBanner } from '@/components/sections/ExpansionBanner'
import { FinalCta } from '@/components/sections/FinalCta'
import { Section, SectionHeader } from '@/components/ui/Section'
import { UnitCard } from '@/components/ui/UnitCard'
import { Button } from '@/components/ui/Button'
import { getUnits } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'LoudFit - A Rede que Treina Alto',
  description:
    'Academia premium com rede de unidades. Acima do low cost, de propósito.',
}

export default async function HomePage() {
  const units = await getUnits().catch(() => [])
  const featured = units.filter((u) => u.destaque || u.status === 'ativa').slice(0, 4)

  return (
    <>
      <Hero />
      <OfferBanner />
      <PlansSection />

      {featured.length > 0 && (
        <Section id="unidades" bg="black" className="relative overflow-hidden">
          <div className="relative">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <SectionHeader
                label="Unidades"
                title="Escolha sua LoudFit."
                subtitle="Escolha sua unidade LoudFit e comece a treinar."
              />
              <Button href="/unidades" variant="outline" size="md" className="mb-12 md:mb-16">
                Ver unidades
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((unit) => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
            </div>
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
