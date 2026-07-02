import { Button } from './Button'
import { cn } from '@/lib/utils'
import { planBenefits, type Plan } from '@/lib/plans'

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article
      className={cn(
        'group relative flex min-h-[500px] flex-col overflow-hidden p-6 transition duration-500 hover:-translate-y-1',
        plan.featured
          ? 'border border-lf-volt bg-lf-black shadow-[0_0_70px_rgba(242,226,5,0.13)] lg:-mt-5 lg:min-h-[540px]'
          : 'border-t-2 border-lf-line bg-lf-surface/70 hover:border-lf-volt/60'
      )}
    >
      {plan.featured ? (
        <div className="absolute -right-11 top-7 w-40 rotate-45 bg-lf-volt py-1 text-center text-[10px] font-black uppercase tracking-widest text-lf-black shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
          {plan.badge}
        </div>
      ) : (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lf-volt">{plan.badge}</span>
      )}

      <h3 className="mt-4 text-2xl font-black text-lf-text">{plan.name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-lf-muted">{plan.description}</p>

      {plan.firstPayment && (
        <div className="mt-6 border-l-2 border-lf-volt bg-lf-black/60 py-3 pl-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            {plan.firstPayment.label}
          </p>
          <p className="mt-1 text-2xl font-black text-lf-text">{plan.firstPayment.value}</p>
        </div>
      )}

      <p className="mt-6 flex flex-wrap items-end gap-x-2 gap-y-1 text-lf-text">
        <strong className="text-4xl font-black leading-none whitespace-nowrap">{plan.price}</strong>
        <span className="pb-1 text-sm text-lf-muted">{plan.period}</span>
      </p>

      <ul className="mt-7 space-y-3 text-sm text-lf-muted">
        {planBenefits.map((benefit) => (
          <li key={benefit} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lf-volt shadow-[0_0_12px_rgba(242,226,5,0.65)]" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <Button href="/unidades" variant={plan.featured ? 'volt' : 'outline'} className="w-full justify-center">
          Começar matrícula
        </Button>
      </div>
    </article>
  )
}
