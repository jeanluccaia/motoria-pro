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
      <Section bg="lighter">
        <SectionHeader
          dark
          label="Nossa Rede"
          title="Unidades LoudFit"
          subtitle="Escolha sua unidade, escolha seu plano e comece a treinar."
        />

        <div className="mb-10 grid gap-3 border border-gray-200 bg-white p-5 text-sm text-gray-600 md:grid-cols-3">
          <span className="font-bold uppercase tracking-[0.18em] text-gray-800">1. Escolha o plano</span>
          <span className="font-bold uppercase tracking-[0.18em] text-gray-800">2. Escolha a unidade</span>
          <span className="font-bold uppercase tracking-[0.18em] text-gray-800">3. Finalize a matrícula</span>
        </div>

        {units.length === 0 ? (
          <p className="border border-gray-200 py-16 text-center text-gray-500">
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
