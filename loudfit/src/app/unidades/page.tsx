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
          subtitle="Escolha sua unidade LoudFit e comece a treinar."
        />

        <div className="mb-10 grid gap-3 border border-lf-volt/25 bg-lf-graphite p-5 text-sm text-lf-muted md:grid-cols-3">
          <span className="font-bold uppercase tracking-[0.18em] text-lf-volt">1. Escolha o plano</span>
          <span className="font-bold uppercase tracking-[0.18em] text-lf-volt">2. Escolha a unidade</span>
          <span className="font-bold uppercase tracking-[0.18em] text-lf-volt">3. Finalize no EVO</span>
        </div>

        {units.length === 0 ? (
          <p className="border border-lf-line py-16 text-center text-lf-muted">
            Não foi possível listar as unidades neste momento. Tente novamente em instantes.
          </p>
        ) : (
          <div id="rede" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
