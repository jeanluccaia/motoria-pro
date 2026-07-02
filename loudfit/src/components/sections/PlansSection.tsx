import { Section, SectionHeader } from '@/components/ui/Section'
import { PlanCard } from '@/components/ui/PlanCard'
import { getPlans } from '@/lib/plans'

export function PlansSection() {
  const plans = getPlans()

  return (
    <Section id="planos" bg="light" className="relative overflow-hidden">
      <div className="relative">
        <SectionHeader
          dark
          label="Planos"
          title="Escolha como treinar."
          subtitle="Escolha seu plano. Escolha sua unidade. Comece a treinar."
        />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>

        <div className="mt-8 grid gap-2 border-t border-gray-200 pt-6 text-sm text-gray-500 md:grid-cols-2">
          <p>Incluso em todos: musculação, aulas coletivas, estrutura completa e acesso por reconhecimento facial.</p>
          <p className="md:text-right">Valores podem variar conforme a unidade. Ipiranga possui tabela própria.</p>
        </div>
      </div>
    </Section>
  )
}
