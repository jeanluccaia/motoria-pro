import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'
import { planBenefits, plans } from '@/lib/plans'

export function PlansSection() {
  return (
    <Section id="planos" bg="graphite" className="relative overflow-hidden pt-16 md:pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(242,226,5,0.1),transparent_22%),linear-gradient(180deg,rgba(10,10,10,0),rgba(10,10,10,0.28))]" />
      <div className="relative">
        <SectionHeader
          label="Planos"
          title="Comece pelo plano certo."
          subtitle="Escolha seu plano, escolha sua unidade e avance para a página de venda EVO quando os links estiverem conectados."
        />

        <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`group relative flex min-h-[500px] flex-col overflow-hidden rounded-lg border p-6 transition duration-500 hover:-translate-y-1 ${
                plan.featured
                  ? 'border-lf-volt bg-lf-black shadow-[0_0_70px_rgba(242,226,5,0.13)] lg:-mt-5 lg:min-h-[540px]'
                  : 'border-lf-line bg-lf-surface/90 hover:border-lf-volt/45 hover:shadow-[0_24px_70px_rgba(0,0,0,0.28)]'
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-lf-volt to-transparent opacity-0 transition group-hover:opacity-100" />
              {plan.featured && (
                <div className="absolute -right-16 top-10 h-32 w-32 rounded-full bg-lf-volt/15 blur-2xl" />
              )}

              <div className="relative flex min-h-10 items-start justify-between gap-4">
                <h3 className="text-2xl font-black text-lf-text">{plan.name}</h3>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                  plan.featured
                    ? 'bg-lf-volt text-lf-black'
                    : 'border border-lf-volt/45 text-lf-volt'
                }`}>
                  {plan.badge}
                </span>
              </div>

              <p className="relative mt-5 text-sm leading-relaxed text-lf-muted">{plan.description}</p>

              <div className="relative mt-7 rounded-lg border border-lf-line bg-lf-black/70 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-lf-volt">
                  Primeiro mês por R$ 9,90
                </p>
                <p className="mt-5 flex items-end gap-2 text-lf-text">
                  <strong className="text-5xl font-black leading-none md:text-6xl">{plan.price}</strong>
                  <span className="pb-1 text-sm text-lf-muted">{plan.period}</span>
                </p>
              </div>

              <ul className="relative mt-7 space-y-3 text-sm text-lf-muted">
                {planBenefits.map((benefit) => (
                  <li key={benefit} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lf-volt shadow-[0_0_12px_rgba(242,226,5,0.65)]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="relative mt-auto pt-8">
                <Button href="/unidades" variant={plan.featured ? 'volt' : 'outline'} className="w-full justify-center">
                  Começar por R$ 9,90
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-2 border-t border-lf-line pt-6 text-sm text-lf-muted md:grid-cols-2">
          <p>Incluso em todos: musculação, aulas coletivas, estrutura completa e acesso por reconhecimento facial.</p>
          <p className="md:text-right">Após o primeiro mês, aplica-se o valor do plano escolhido.</p>
        </div>
      </div>
    </Section>
  )
}
