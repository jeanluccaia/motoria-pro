import { Section } from '@/components/ui/Section'
import { PlanCard } from '@/components/ui/PlanCard'
import { Reveal } from '@/components/ui/Reveal'
import { getPlans } from '@/lib/plans'

const allPlansBenefits = [
  'Musculação + cardio',
  'Aulas coletivas',
  'Acesso às unidades',
  'Reconhecimento facial',
  'Aula experimental grátis',
  'Convidados: até 5 acessos',
]

export function PlansSection() {
  const plans = getPlans()

  return (
    <Section id="planos" bg="cream" className="relative overflow-hidden py-16 md:py-24 lg:py-28">
      <Reveal>
        <div className="mb-3 flex items-center gap-3">
          <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Planos
          </p>
        </div>
        <h2 className="text-4xl font-black leading-[1.02] text-[#141414] md:text-5xl">
          Escolha o seu plano.
        </h2>
      </Reveal>

      {/* Strip: benefícios comuns a todos os planos */}
      <Reveal delay={0.1}>
        <div className="mt-6 rounded-xl border border-[#E2DACB] bg-white p-4 md:mt-8 md:p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A7267]">
            Incluso em todos os planos
          </p>
          <div className="flex flex-wrap gap-2">
            {allPlansBenefits.map((b) => (
              <span
                key={b}
                className="flex items-center gap-1.5 rounded-full border border-[#E2DACB] bg-[#FAFAF8] px-3 py-1 text-[12px] font-medium text-[#3B3832]"
              >
                <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-lf-volt" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-10 md:gap-5 xl:grid-cols-4 xl:items-stretch">
        {plans.map((plan, i) => (
          <Reveal key={plan.slug} delay={i * 0.07} className="flex h-full flex-col">
            <PlanCard plan={plan} tone="light" homePricing />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.28}>
        <div className="mt-6 flex flex-col gap-1.5 border-t border-[#D8D0C0] pt-5 text-xs text-[#6E675C] sm:flex-row sm:justify-between">
          <p>*R$9,90 na primeira mensalidade apenas no Power Anual Recorrente.</p>
          <p>Valores e condições podem variar conforme a unidade. Ipiranga possui tabela própria.</p>
        </div>
        <p className="mt-1.5 text-[11px] text-[#8A8478]">
          Confira os planos e condições na página da sua unidade antes de finalizar a matrícula.
        </p>
      </Reveal>
    </Section>
  )
}
