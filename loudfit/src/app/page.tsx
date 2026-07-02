import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { StatsBar } from '@/components/sections/StatsBar'
import { BrandStatement } from '@/components/sections/BrandStatement'
import { ExpansionBanner } from '@/components/sections/ExpansionBanner'
import { OfferBanner } from '@/components/sections/OfferBanner'
import { PlansSection } from '@/components/sections/PlansSection'
import { Section, SectionHeader } from '@/components/ui/Section'
import { UnitCard } from '@/components/ui/UnitCard'
import { Button } from '@/components/ui/Button'
import { getUnits } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'LoudFit — A Rede que Treina Alto',
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
        <Section bg="graphite">
          <SectionHeader
            label="Unidades"
            title="Escolha sua LoudFit."
            subtitle="Escolha sua unidade LoudFit e comece seu primeiro mês por R$ 9,90."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button href="/unidades" variant="outline" size="md">
              Ver unidades
            </Button>
          </div>
        </Section>
      )}

      <StatsBar />
      <BrandStatement />
      <ExpansionBanner />
    </>
  )
}
