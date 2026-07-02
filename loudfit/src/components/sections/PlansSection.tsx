import { Section, SectionHeader } from '@/components/ui/Section'
import { PlanCard } from '@/components/ui/PlanCard'
import { getPlans } from '@/lib/plans'

export function PlansSection() {
  const plans = getPlans()

  return (
    <Section id="planos" bg="graphite" className="relative overflow-hidden pt-14 md:pt-18">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lf-volt/40 to-transparent" />
      <div className="relative">
        <SectionHeader
          label="Planos"
          title="Escolha como treinar."
          subtitle="Escolha seu plano, escolha sua unidade e comece a treinar. Venda online via EVO será conectada à página de vendas."
        />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>

        <div className="mt-8 grid gap-2 border-t border-lf-line pt-6 text-sm text-lf-muted md:grid-cols-2">
          <p>Incluso em todos: musculação, aulas coletivas, estrutura completa e acesso por reconhecimento facial.</p>
          <p className="md:text-right">Valores podem variar conforme a unidade. Ipiranga possui tabela própria.</p>
        </div>
      </div>
    </Section>
  )
}
