import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'
import { planBenefits, plans } from '@/lib/plans'

export function PlansSection() {
  return (
    <Section id="planos" bg="graphite" className="pt-16 md:pt-20">
      <SectionHeader
        label="Planos"
        title="Comece pelo plano certo."
        subtitle="Escolha seu plano, escolha sua unidade e avance para a página de venda EVO quando os links estiverem conectados."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`flex min-h-[460px] flex-col border p-6 transition-colors ${
              plan.featured
                ? 'border-lf-volt bg-lf-black'
                : 'border-lf-line bg-lf-surface hover:border-lf-volt/40'
            }`}
          >
            <div className="flex min-h-10 items-start justify-between gap-4">
              <h3 className="text-2xl font-black text-lf-text">{plan.name}</h3>
              <span className="shrink-0 border border-lf-volt/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-lf-volt">
                {plan.badge}
              </span>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-lf-muted">{plan.description}</p>

            <div className="mt-6 border-y border-lf-line py-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-lf-volt">
                Primeiro mês por R$ 9,90
              </p>
              <p className="mt-4 flex items-end gap-2 text-lf-text">
                <strong className="text-5xl font-black leading-none">{plan.price}</strong>
                <span className="pb-1 text-sm text-lf-muted">{plan.period}</span>
              </p>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-lf-muted">
              {planBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-lf-volt" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <Button href="/unidades" variant={plan.featured ? 'volt' : 'outline'} className="w-full justify-center">
                Começar por R$ 9,90
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-2 text-sm text-lf-muted md:grid-cols-2">
        <p>Incluso em todos: musculação, aulas coletivas, estrutura completa e acesso por reconhecimento facial.</p>
        <p className="md:text-right">Após o primeiro mês, aplica-se o valor do plano escolhido.</p>
      </div>
    </Section>
  )
}
