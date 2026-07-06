import { Button } from './Button'
import { cn } from '@/lib/utils'
import type { Plan } from '@/lib/plans'

interface PlanCardProps {
  plan: Plan
  ctaBase?: string
  ctaLabel?: string
}

function buildHref(base: string, planSlug: string): string {
  if (base.includes('?') || base.includes('#')) return base
  return `${base}?plano=${planSlug}`
}

export function PlanCard({ plan, ctaBase = '/unidades', ctaLabel }: PlanCardProps) {
  const href = plan.checkoutUrl ?? buildHref(ctaBase, plan.slug)

  if (plan.featured) {
    return (
      <article className={cn(
        'group relative flex flex-col overflow-hidden bg-lf-black h-full',
        'ring-2 ring-lf-volt shadow-[0_8px_48px_rgba(255,229,0,0.12)]',
        'transition duration-200 hover:-translate-y-1',
        'order-first md:order-none md:-mt-4 lg:mt-0',
        'lg:scale-[1.03] lg:z-10',
      )}>
        {/* Faixa topo */}
        <div className="bg-lf-volt px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.04em] text-lf-black">
            {plan.badge}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-lf-black/70">
            Mais popular
          </span>
        </div>

        <div className="p-6 flex flex-col flex-1">
          {/* 1. Nome */}
          <h3 className="text-xl font-black text-lf-text">{plan.name}</h3>

          {/* 2. Descrição */}
          <p className="mt-2 text-sm leading-[1.6] text-lf-muted">{plan.description}</p>

          {/* 3. Preço */}
          <div className="mt-5">
            <p className="flex items-end gap-1.5 text-lf-text">
              <strong className="text-5xl font-black leading-none">{plan.price}</strong>
              <span className="pb-1 text-sm text-lf-muted">{plan.period}</span>
            </p>
          </div>

          {/* 4. Destaque R$9,90 */}
          {plan.firstPayment && (
            <div className="mt-4 border-l-2 border-lf-volt bg-lf-graphite px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                {plan.firstPayment.label}
              </p>
              <p className="text-2xl font-black text-lf-volt">{plan.firstPayment.value}</p>
              <p className="mt-0.5 text-[10px] text-lf-muted">na primeira cobrança</p>
            </div>
          )}

          {/* 5. CTA — único botão amarelo cheio nesta seção */}
          <div className="mt-auto pt-7">
            <Button href={href} variant="volt" className="w-full justify-center">
              {ctaLabel ?? 'Começar com este plano'}
            </Button>
          </div>
        </div>
      </article>
    )
  }

  /* Planos não-destaque — fundo escuro, CTA fantasma */
  return (
    <article className={cn(
      'group relative flex flex-col overflow-hidden bg-lf-surface border border-lf-line h-full',
      'transition duration-200 hover:-translate-y-1 hover:border-lf-text/20',
    )}>
      <div className="px-4 py-2 border-b border-lf-line">
        <span className="text-[10px] font-black uppercase tracking-[0.04em] text-lf-muted/60">
          {plan.badge}
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        {/* 1. Nome */}
        <h3 className="text-xl font-black text-lf-text">{plan.name}</h3>

        {/* 2. Descrição */}
        <p className="mt-2 text-sm leading-[1.6] text-lf-muted">{plan.description}</p>

        {/* 3. Preço */}
        <p className="mt-5 flex items-end gap-1.5">
          <strong className="text-5xl font-black leading-none text-lf-text">{plan.price}</strong>
          <span className="pb-1 text-sm text-lf-muted">{plan.period}</span>
        </p>

        {/* 5. CTA — outline fantasma (sem amarelo) */}
        <div className="mt-auto pt-7">
          <Button href={href} variant="ghost" className="w-full justify-center">
            {ctaLabel ?? 'Escolher este plano'}
          </Button>
        </div>
      </div>
    </article>
  )
}
