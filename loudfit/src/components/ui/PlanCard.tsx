import { Button } from './Button'
import { cn } from '@/lib/utils'
import { planBenefits, type Plan } from '@/lib/plans'

interface PlanCardProps {
  plan: Plan
  ctaBase?: string
  ctaLabel?: string
  tone?: 'dark' | 'light'
  showBenefits?: boolean
  homePricing?: boolean
}

function buildHref(base: string, planSlug: string): string {
  if (base.includes('?') || base.includes('#')) return base
  return `${base}?plano=${planSlug}`
}

export function PlanCard({
  plan,
  ctaBase = '/unidades',
  ctaLabel,
  tone = 'dark',
  showBenefits = false,
  homePricing = false,
}: PlanCardProps) {
  const href = plan.checkoutUrl ?? buildHref(ctaBase, plan.slug)
  const isLight = tone === 'light'
  const titleClass = isLight ? 'text-[#111111]' : 'text-lf-text'
  const mutedClass = isLight ? 'text-[#5E5B54]' : 'text-lf-muted'
  const lineClass = isLight ? 'border-[#E2DACB]' : 'border-lf-line'
  const defaultCta = homePricing ? 'Começar matrícula' : plan.featured ? 'Começar com este plano' : 'Escolher este plano'
  const cta = ctaLabel ?? defaultCta

  const benefits = showBenefits ? (
    <ul
      className={cn(
        'mt-5 grid gap-2.5 border-t pt-5 text-sm',
        isLight ? 'border-[#E2DACB] text-[#3B3832]' : 'border-lf-line text-lf-muted',
      )}
    >
      {planBenefits.map((benefit) => (
        <li key={benefit} className="flex items-start gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-lf-volt" />
          <span className="leading-snug">{benefit}</span>
        </li>
      ))}
    </ul>
  ) : null

  if (plan.featured) {
    return (
      <article className={cn(
        'group relative flex h-full flex-col overflow-hidden',
        showBenefits ? 'min-h-[560px]' : 'min-h-[420px]',
        isLight
          ? 'border border-lf-volt bg-white shadow-[0_22px_70px_rgba(20,20,20,0.12)] ring-2 ring-lf-volt/70'
          : 'bg-lf-black ring-2 ring-lf-volt shadow-[0_8px_48px_rgba(255,229,0,0.12)]',
        'transition duration-200 hover:-translate-y-1',
        'order-first md:order-none',
      )}>
        {/* Faixa topo */}
        <div className={cn(
          'flex min-h-11 items-center justify-between gap-3 border-b px-4 py-2',
          isLight ? 'border-[#E2DACB] bg-white' : 'border-transparent bg-lf-volt',
        )}>
          <span className={cn(
            'text-[10px] font-black uppercase tracking-[0.04em]',
            isLight ? 'bg-lf-volt px-2.5 py-1 text-lf-black' : 'text-lf-black',
          )}>
            {plan.badge}
          </span>
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-wider',
            isLight ? 'text-[#6B6557]' : 'text-lf-black/70',
          )}>
            Mais popular
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6">
          {/* Nome */}
          <h3 className={cn('text-xl font-black', titleClass)}>{plan.name}</h3>

          {/* Descrição curta */}
          <p className={cn('mt-2 text-sm leading-[1.6]', mutedClass)}>{plan.description}</p>

          {/* Preço — homePricing mostra R$9,90 em destaque */}
          {homePricing && plan.firstPayment ? (
            <div className="mt-5">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-lf-volt">
                1ª MENSALIDADE
              </p>
              <p className={cn('flex items-baseline gap-0.5', titleClass)}>
                <strong className="text-5xl font-black leading-none">{plan.firstPayment.value}</strong>
                <span className="text-xl font-black">*</span>
              </p>
              <p className={cn('mt-2 text-xs leading-snug', mutedClass)}>
                Depois, mensalidade conforme a unidade escolhida.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5">
                <p className={cn('flex items-end gap-1.5', titleClass)}>
                  <strong className="text-5xl font-black leading-none">{plan.price}</strong>
                  <span className={cn('pb-1 text-sm', mutedClass)}>{plan.period}</span>
                </p>
              </div>
              {plan.firstPayment && (
                <div className={cn(
                  'mt-4 min-h-[94px] border-l-2 border-lf-volt px-4 py-3',
                  isLight ? 'bg-[#FFF7B8]' : 'bg-lf-graphite',
                )}>
                  <p className={cn(
                    'text-[10px] font-bold uppercase tracking-[0.18em]',
                    isLight ? 'text-[#6B5F00]' : 'text-lf-volt',
                  )}>
                    {plan.firstPayment.label}
                  </p>
                  <p className={cn('text-2xl font-black', isLight ? 'text-[#111111]' : 'text-lf-volt')}>{plan.firstPayment.value}</p>
                  <p className={cn('mt-0.5 text-[10px]', mutedClass)}>na primeira cobrança</p>
                </div>
              )}
            </>
          )}

          {benefits}

          <div className="mt-auto pt-7">
            <Button href={href} variant="volt" className="w-full justify-center">
              {cta}
            </Button>
          </div>
        </div>
      </article>
    )
  }

  /* Planos não-destaque */
  return (
    <article className={cn(
      'group relative flex h-full flex-col overflow-hidden border',
      showBenefits ? 'min-h-[560px]' : 'min-h-[420px]',
      isLight
        ? 'border-[#E2DACB] bg-white shadow-[0_16px_44px_rgba(20,20,20,0.06)]'
        : 'border-lf-line bg-lf-surface',
      'transition duration-200 hover:-translate-y-1',
      isLight ? 'hover:border-[#CFC5B2]' : 'hover:border-lf-text/20',
    )}>
      <div className={cn('flex min-h-11 items-center border-b px-4 py-2', lineClass)}>
        <span className={cn(
          'text-[10px] font-black uppercase tracking-[0.04em]',
          isLight ? 'text-[#756F62]' : 'text-lf-muted/60',
        )}>
          {plan.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        {/* Nome */}
        <h3 className={cn('text-xl font-black', titleClass)}>{plan.name}</h3>

        {/* Condição/descrição */}
        <p className={cn('mt-2 text-sm leading-[1.6]', mutedClass)}>{plan.description}</p>

        {/* Preço */}
        <p className="mt-5 flex items-end gap-1.5">
          <strong className={cn('text-5xl font-black leading-none', titleClass)}>{plan.price}</strong>
          <span className={cn('pb-1 text-sm', mutedClass)}>{plan.period}</span>
        </p>

        {/* Espaçador para alinhamento com card destaque */}
        {!homePricing && (
          <div className="mt-4 hidden min-h-[94px] lg:block" aria-hidden="true" />
        )}

        {benefits}

        <div className="mt-auto pt-7">
          <Button
            href={href}
            variant="ghost"
            className={cn(
              'w-full justify-center',
              isLight && 'border-[#D8D0C0] text-[#111111] hover:border-[#111111]/30 hover:bg-[#EFE9DA]',
            )}
          >
            {cta}
          </Button>
        </div>
      </div>
    </article>
  )
}
