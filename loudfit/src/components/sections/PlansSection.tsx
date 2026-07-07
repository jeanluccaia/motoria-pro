import { Section, SectionHeader } from '@/components/ui/Section'
import { PlanCard } from '@/components/ui/PlanCard'
import { Reveal } from '@/components/ui/Reveal'
import { getPlans } from '@/lib/plans'

export function PlansSection() {
  const plans = getPlans()

  return (
    <Section id="planos" bg="cream" className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      <div className="relative">
        <Reveal>
          <SectionHeader
            label="Planos"
            title="Escolha o seu plano."
            subtitle="Todos os planos incluem musculação, aulas coletivas e reconhecimento facial."
            dark
            className="mb-8 md:mb-12"
          />
        </Reveal>

        <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {plans.map((plan, i) => (
            <Reveal key={plan.slug} delay={i * 0.08} className="h-full flex flex-col">
              <PlanCard plan={plan} tone="light" homePricing />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.25}>
          <div className="mt-8 flex flex-col justify-between gap-2 border-t border-[#D8D0C0] pt-5 text-xs text-[#6E675C] sm:flex-row">
            <p>*R$9,90 na primeira mensalidade apenas no Power Anual Recorrente.</p>
            <p>Valores podem variar conforme a unidade. Ipiranga possui tabela própria.</p>
          </div>
          <p className="mt-2 text-[11px] text-[#8A8478]">
            Confira os planos e condições na página da sua unidade antes de finalizar a matrícula.
          </p>
        </Reveal>
      </div>
    </Section>
  )
}
