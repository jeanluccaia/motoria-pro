import { Section, SectionHeader } from '@/components/ui/Section'
import { PlanCard } from '@/components/ui/PlanCard'
import { Reveal } from '@/components/ui/Reveal'
import { getPlans } from '@/lib/plans'

export function PlansSection() {
  const plans = getPlans()

  return (
    <Section id="planos" bg="light" className="relative overflow-hidden lg:py-32">
      <div className="relative">
        <Reveal>
          <SectionHeader
            dark
            label="Planos"
            title="Escolha o seu plano."
            subtitle="Todos incluem musculação, aulas coletivas e acesso por reconhecimento facial."
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {plans.map((plan, i) => (
            <Reveal key={plan.slug} delay={i * 0.08} className="h-full flex flex-col">
              <PlanCard plan={plan} />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 border-t border-gray-200 pt-5 flex flex-col sm:flex-row gap-2 justify-between text-xs text-gray-400">
          <p>Valores podem variar conforme a unidade. Ipiranga possui tabela própria.</p>
          <p>R$9,90 na primeira mensalidade apenas no Power Anual Recorrente.</p>
        </div>
      </div>
    </Section>
  )
}
