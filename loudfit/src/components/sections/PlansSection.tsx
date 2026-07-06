import { Section, SectionHeader } from '@/components/ui/Section'
import { PlanCard } from '@/components/ui/PlanCard'
import { Reveal } from '@/components/ui/Reveal'
import { getPlans } from '@/lib/plans'

export function PlansSection() {
  const plans = getPlans()

  return (
    <Section id="planos" bg="light" className="relative overflow-hidden bg-[#f7f5ee] py-16 text-[#111111] md:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-lf-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-lf-black/25 to-transparent" />
      <div className="relative">
        <Reveal>
          <SectionHeader
            label="Planos"
            title="Escolha o seu plano."
            subtitle="Compare valores, benefícios e escolha a unidade para finalizar a matrícula online."
            dark
            className="mb-8 md:mb-12"
          />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mb-8 h-px w-full bg-gradient-to-r from-transparent via-[#D8D0C0] to-transparent md:mb-10">
            <span className="sr-only">Separador visual dos planos</span>
          </div>
        </Reveal>

        <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {plans.map((plan, i) => (
            <Reveal key={plan.slug} delay={i * 0.08} className="h-full flex flex-col">
              <PlanCard plan={plan} tone="light" showBenefits />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.25}>
          <div className="mt-8 flex flex-col justify-between gap-2 border-t border-[#D8D0C0] pt-5 text-xs text-[#6E675C] sm:flex-row">
            <p>Valores podem variar conforme a unidade. Ipiranga possui tabela própria.</p>
            <p>R$9,90 na primeira mensalidade apenas no Power Anual Recorrente.</p>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
