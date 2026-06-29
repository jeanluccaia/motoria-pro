import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'
import { cn } from '@/lib/utils'
import { membershipPlans } from '@/lib/plans'

export function PlansSection() {
  return (
    <Section bg="black" id="planos" className="border-t border-lf-line">
      <SectionHeader
        label="Planos"
        title="Escolha seu Power"
        subtitle="A proposta comercial da LoudFit, simples de entender e pronta para começar pela unidade mais perto de você."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {membershipPlans.map((plan) => (
          <article
            key={plan.slug}
            className={cn(
              'relative flex min-h-[360px] flex-col border bg-lf-surface p-6 transition-colors',
              plan.economical
                ? 'border-lf-volt shadow-[0_0_0_1px_rgba(242,226,5,0.25)]'
                : 'border-lf-line'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-widest px-3 py-1',
                  plan.economical
                    ? 'bg-lf-volt text-lf-black'
                    : 'border border-lf-line text-lf-muted'
                )}
              >
                {plan.badge}
              </span>
              {plan.economical && (
                <span className="text-[10px] uppercase tracking-widest text-lf-volt">
                  menor mensalidade
                </span>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-3xl font-black text-lf-text">{plan.name}</h3>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-5xl font-black text-lf-volt leading-none">
                  {plan.price}
                </span>
                <span className="pb-1 text-sm uppercase tracking-widest text-lf-muted">
                  /mês
                </span>
              </div>
              <p className="mt-5 min-h-[56px] text-sm leading-relaxed text-lf-muted">
                {plan.description}
              </p>
            </div>

            <div className="mt-auto pt-8">
              <Button
                href={`/unidades?plano=${plan.slug}`}
                variant={plan.economical ? 'volt' : 'outline'}
                className="w-full justify-center"
              >
                Escolher unidade
              </Button>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-7 text-center text-sm text-lf-muted">
        Incluso em todos: musculação, aulas coletivas e acesso por reconhecimento facial.
      </p>
    </Section>
  )
}
