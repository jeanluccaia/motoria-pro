import type { Metadata } from 'next'
import { getUnits } from '@/lib/supabase'
import { UnitCard } from '@/components/ui/UnitCard'
import { Section, SectionHeader } from '@/components/ui/Section'
import { PlanChip } from '@/components/ui/PlanChip'

export const metadata: Metadata = {
  title: 'Unidades',
  description: 'Encontre uma LoudFit perto de você. 6 unidades em SP com matrícula online.',
  alternates: { canonical: '/unidades' },
  openGraph: {
    title: 'Unidades | LoudFit',
    description: 'Encontre uma LoudFit perto de você. 6 unidades em SP com matrícula online.',
    url: '/unidades',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unidades | LoudFit',
    description: 'Encontre uma LoudFit perto de você. 6 unidades em SP com matrícula online.',
    images: ['/opengraph-image'],
  },
}

export default async function UnidadesPage() {
  const units = await getUnits().catch(() => [])

  return (
    <div className="pt-16">
      <Section bg="lighter">
        <SectionHeader
          dark
          label="Nossa Rede"
          title="Unidades Loud Fit"
          subtitle="Escolha sua unidade, escolha seu plano e comece a treinar."
        />

        <PlanChip />

        <div className="mb-10 grid gap-0 border border-gray-200 bg-white text-sm md:grid-cols-3">
          <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r">
            <span className="font-black uppercase tracking-[0.04em] text-gray-800">1. Escolha a unidade</span>
          </div>
          <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r">
            <span className="font-black uppercase tracking-[0.04em] text-gray-800">2. Escolha o plano</span>
          </div>
          <div className="p-4">
            <span className="font-black uppercase tracking-[0.04em] text-gray-800">3. Finalize a matrícula online</span>
          </div>
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
