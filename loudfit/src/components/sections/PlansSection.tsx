import { Section, SectionHeader } from '@/components/ui/Section'
import { PlanCard } from '@/components/ui/PlanCard'
import { Reveal } from '@/components/ui/Reveal'
import { getPlans } from '@/lib/plans'

const sharedBenefits = [
  'Musculação',
  'Aulas coletivas',
  'Estrutura completa',
  'Reconhecimento facial',
]

export function PlansSection() {
  const plans = getPlans()

  return (
    <Section id="planos" bg="graphite" className="relative overflow-hidden lg:py-32">
      <div className="relative">
        <Reveal>
          <SectionHeader
            label="Planos"
            title="Escolha o seu plano."
          />
        </Reveal>

        {/* Benefícios comuns — linha única acima dos cards */}
        <Reveal delay={0.05}>
          <div className="mb-10 flex flex-wrap items-center gap-x-5 gap-y-2 border border-lf-line px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-lf-muted/50">
              Todos os planos incluem:
            </p>
            {sharedBenefits.map((b) => (
              <span key={b} className="flex items-center gap-2 text-xs text-lf-muted">
                <span className="h-1 w-1 shrink-0 bg-lf-volt" />
                {b}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {plans.map((plan, i) => (
            <Reveal key={plan.slug} delay={i * 0.08} className="h-full flex flex-col">
              <PlanCard plan={plan} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.25}>
          <div className="mt-8 pt-5 border-t border-lf-line flex flex-col sm:flex-row gap-2 justify-between text-xs text-lf-muted/50">
            <p>Valores podem variar conforme a unidade. Ipiranga possui tabela própria.</p>
            <p>R$9,90 na primeira mensalidade apenas no Power Anual Recorrente.</p>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
