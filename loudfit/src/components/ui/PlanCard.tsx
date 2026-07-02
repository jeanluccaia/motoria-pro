import { Button } from './Button'
import { cn } from '@/lib/utils'
import { planBenefits, type Plan } from '@/lib/plans'

interface PlanCardProps {
  plan: Plan
  ctaHref?: string
}

export function PlanCard({ plan, ctaHref = '/unidades' }: PlanCardProps) {
  const href = plan.checkoutUrl ?? ctaHref

  if (plan.featured) {
    return (
      <article className={cn(
        'group relative flex flex-col overflow-hidden bg-lf-black border border-lf-volt/40',
        'shadow-[0_0_60px_rgba(242,226,5,0.1)] transition duration-500 hover:-translate-y-1',
        'order-first md:order-none md:-mt-5 md:min-h-[560px] min-h-[500px]',
      )}>
        <div className="absolute -right-10 top-6 w-36 rotate-45 bg-lf-volt py-1 text-center text-[10px] font-black uppercase tracking-widest text-lf-black shadow-lg">
          {plan.badge}
        </div>

        <div className="p-6 flex flex-col flex-1">
          <h3 className="mt-4 text-2xl font-black text-lf-text">{plan.name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-lf-muted">{plan.description}</p>

          {plan.firstPayment && (
            <div className="mt-6 border-l-2 border-lf-volt bg-lf-graphite/80 py-3 pl-4">
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
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lf-volt shadow-[0_0_8px_rgba(242,226,5,0.6)]" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-8">
            <Button href={href} variant="volt" className="w-full justify-center">
              Começar com este plano
            </Button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={cn(
      'group relative flex flex-col overflow-hidden bg-white border-t-2 border-gray-200',
      'shadow-sm transition duration-500 hover:-translate-y-1 hover:border-lf-volt/60 hover:shadow-md',
      'min-h-[500px]',
    )}>
      <div className="p-6 flex flex-col flex-1">
        <span className="inline-block bg-lf-volt text-lf-black text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 self-start">
          {plan.badge}
        </span>

        <h3 className="mt-4 text-2xl font-black text-gray-900">{plan.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">{plan.description}</p>

        <p className="mt-6 flex flex-wrap items-end gap-x-2 gap-y-1 text-gray-900">
          <strong className="text-4xl font-black leading-none whitespace-nowrap">{plan.price}</strong>
          <span className="pb-1 text-sm text-gray-400">{plan.period}</span>
        </p>

        <ul className="mt-7 space-y-3 text-sm text-gray-500">
          {planBenefits.map((benefit) => (
            <li key={benefit} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lf-volt" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <Button href={href} variant="volt" className="w-full justify-center">
            Começar matrícula
          </Button>
        </div>
      </div>
    </article>
  )
}
