import type { Metadata } from 'next'
import { getUnits } from '@/lib/supabase'
import { getMembershipPlan } from '@/lib/plans'
import { UnitCard } from '@/components/ui/UnitCard'
import { Section, SectionHeader } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Unidades',
  description: 'Encontre uma LoudFit perto de você. Rede de academias premium.',
}

interface Props {
  searchParams?: Promise<{ plano?: string | string[] }>
}

export default async function UnidadesPage({ searchParams }: Props) {
  const selectedPlan = getMembershipPlan((await searchParams)?.plano)
  const units = await getUnits().catch(() => [])

  return (
    <div className="pt-16">
      <Section bg="black">
        <SectionHeader
          label="Nossa Rede"
          title="Unidades LoudFit"
          subtitle={
            selectedPlan
              ? `Plano escolhido: ${selectedPlan.name}. Escolha uma unidade.`
              : 'Encontre a unidade mais próxima de você. Mais cidades chegando em breve.'
          }
        />

        {units.length === 0 ? (
          <p className="text-lf-muted text-center py-16">
            Nenhuma unidade disponível.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} planSlug={selectedPlan?.slug} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
