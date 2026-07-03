import { Button } from './Button'
import { cn } from '@/lib/utils'
import { planBenefits, type Plan } from '@/lib/plans'

interface PlanCardProps {
  plan: Plan
  ctaBase?: string
  ctaLabel?: string
}

function buildHref(base: string, planSlug: string): string {
  if (base.includes('?') || base.includes('#')) return base
  return `${base}?plano=${planSlug}`
}

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="7" fill="currentColor" fillOpacity="0.15"/>
    <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export function PlanCard({ plan, ctaBase = '/unidades', ctaLabel }: PlanCardProps) {
  const href = plan.checkoutUrl ?? buildHref(ctaBase, plan.slug)

  if (plan.featured) {
    return (
      <article className={cn(
        'group relative flex flex-col overflow-hidden bg-lf-black',
        'ring-1 ring-lf-volt/60',
        'transition duration-200 hover:-translate-y-1',
        'order-first md:order-none md:-mt-4',
      )}>
        {/* Faixa topo — MELHOR VALOR */}
        <div className="bg-lf-volt px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lf-black">
            {plan.badge}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-lf-black/70">
            Mais popular
          </span>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-black text-lf-text">{plan.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-lf-muted">{plan.description}</p>

          {/* Preço principal */}
          <div className="mt-5">
            <p className="flex items-end gap-1.5 text-lf-text">
              <strong className="text-4xl font-black leading-none">{plan.price}</strong>
              <span className="pb-0.5 text-sm text-lf-muted">{plan.period}</span>
            </p>
          </div>

          {/* Destaque R$9,90 */}
          {plan.firstPayment && (
            <div className="mt-4 border-l-2 border-lf-volt bg-lf-graphite px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                {plan.firstPayment.label}
              </p>
              <p className="text-2xl font-black text-lf-volt">{plan.firstPayment.value}</p>
              <p className="mt-0.5 text-[10px] text-lf-muted">na primeira cobrança</p>
            </div>
          )}

          <ul className="mt-5 space-y-2 text-sm text-lf-muted">
            {planBenefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2.5 text-lf-text/80">
                <span className="text-lf-volt shrink-0">{CHECK}</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-7">
            <Button href={href} variant="volt" className="w-full justify-center">
              {ctaLabel ?? 'Começar com este plano'}
            </Button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={cn(
      'group relative flex flex-col overflow-hidden bg-white border border-gray-200',
      'transition duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-md',
    )}>
      <div className="px-4 py-2 border-b border-gray-100">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
          {plan.badge}
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{plan.description}</p>

        <p className="mt-5 flex items-end gap-1.5 text-gray-900">
          <strong className="text-4xl font-black leading-none">{plan.price}</strong>
          <span className="pb-0.5 text-sm text-gray-400">{plan.period}</span>
        </p>

        <ul className="mt-5 space-y-2 text-sm text-gray-500">
          {planBenefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2.5">
              <span className="text-lf-volt shrink-0">{CHECK}</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-7">
          <Button href={href} variant="volt" className="w-full justify-center">
            {ctaLabel ?? 'Começar matrícula'}
          </Button>
        </div>
      </div>
    </article>
  )
}
