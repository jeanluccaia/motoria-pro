import type { Metadata } from 'next'
import { getUnits } from '@/lib/supabase'
import { UnitCard } from '@/components/ui/UnitCard'
import { Section, SectionHeader } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Unidades',
  description: 'Encontre uma LoudFit perto de você. Rede de academias premium.',
}

export default async function UnidadesPage() {
  const units = await getUnits().catch(() => [])

  return (
    <div className="pt-16">
      <Section bg="black">
        <SectionHeader
          label="Nossa Rede"
          title="Unidades LoudFit"
          subtitle="Encontre a unidade mais próxima de você. Mais cidades chegando em breve."
        />

        {units.length === 0 ? (
          <p className="text-lf-muted text-center py-16">
            Carregando unidades...
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
