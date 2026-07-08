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

const homePlanDescriptions: Record<string, string> = {
  'power-mensal': 'Mês a mês.',
  'power-mensal-recorrente': 'Renovação automática mensal.',
  'power-semestral-recorrente': '6 meses com mensalidade reduzida.',
  'power-anual-recorrente': 'Plano de 12 meses recorrente.',
}

const homeCardBenefits: Record<string, string[]> = {
  'power-mensal': ['Aulas coletivas inclusas', 'Acesso às unidades'],
  'power-mensal-recorrente': ['Aulas coletivas inclusas', 'Acesso às unidades'],
  'power-semestral-recorrente': ['Aulas coletivas inclusas', 'Aula experimental grátis'],
  'power-anual-recorrente': ['Aulas coletivas inclusas', 'Acesso às unidades', 'Convidados: até 5 acessos'],
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
  const description = homePricing ? homePlanDescriptions[plan.slug] ?? plan.description : plan.description

  const cta = ctaLabel ?? 'Começar matrícula'

  /* Benefits from planBenefits — unit pages only */
  const benefits = showBenefits ? (
    <ul className={cn('mt-5 grid gap-2.5 border-t pt-5 text-sm', isLight ? 'border-[#E2DACB] text-[#3B3832]' : 'border-lf-line text-lf-muted')}>
      {planBenefits.map((b) => (
        <li key={b} className="flex items-start gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-lf-volt" />
          <span className="leading-snug">{b}</span>
        </li>
      ))}
    </ul>
  ) : null

  /* Home benefits — compact, premium */
  const homeBenefitsBlock = homePricing && homeCardBenefits[plan.slug] ? (
    <div className={cn('mt-4 flex flex-col gap-1.5 border-t pt-4', lineClass)}>
      {homeCardBenefits[plan.slug].map((b) => (
        <div key={b} className={cn('flex items-center gap-2 text-[13px]', isLight ? 'text-[#3B3832]' : 'text-lf-muted')}>
          <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-lf-volt" />
          {b}
        </div>
      ))}
    </div>
  ) : null

  /* ─── CARD DESTAQUE ─── */
  if (plan.featured) {
    return (
      <article className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl',
        showBenefits ? 'min-h-[520px]' : '',
        isLight
          ? 'border-2 border-lf-volt bg-white shadow-[0_4px_28px_rgba(255,229,0,0.14)]'
          : 'bg-lf-black ring-2 ring-lf-volt shadow-[0_8px_48px_rgba(255,229,0,0.12)]',
        'order-first md:order-none',
        'transition duration-200 hover:-translate-y-0.5',
      )}>
        {/* Faixa topo amarela */}
        <div className={cn(
          'flex min-h-10 items-center justify-between gap-3 px-5 py-2',
          isLight ? 'bg-lf-volt' : 'border-b border-transparent bg-lf-volt',
        )}>
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-lf-black">
            Mais popular
          </span>
          <span className={cn(
            'px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
            isLight ? 'bg-lf-black text-lf-volt' : 'bg-lf-black/20 text-lf-black',
          )}>
            {plan.badge}
          </span>
        </div>

        <div className={cn('flex flex-1 flex-col', homePricing ? 'p-5 md:p-6' : 'p-5')}>
          <h3 className={cn('text-[22px] font-black leading-tight', titleClass)}>{plan.name}</h3>
          <p className={cn('mt-1.5 text-[14px] leading-snug', mutedClass)}>
            {description}
          </p>

          {/* Preço */}
          {homePricing && plan.firstPayment ? (
            <div className={cn('mt-4 border-t pt-4', lineClass)}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                1ª Mensalidade
              </p>
              <p className={cn('mt-1 flex items-baseline gap-0.5', titleClass)}>
                <strong className="text-5xl font-black leading-none">{plan.firstPayment.value}</strong>
                <span className="text-xl font-black">*</span>
              </p>
              <p className={cn('mt-1.5 text-[13px] leading-snug', mutedClass)}>
                Depois, mensalidade conforme a unidade escolhida.
              </p>
            </div>
          ) : (
            <div className={homePricing ? 'mt-4' : 'mt-5'}>
              <p className={cn('flex items-baseline gap-1', titleClass)}>
                <strong className="text-4xl font-black leading-none">{plan.price}</strong>
                <span className={cn('text-[16px]', mutedClass)}>{plan.period}</span>
              </p>
              {plan.firstPayment && (
                <div className={cn('mt-3 border-l-2 border-lf-volt px-3 py-2', isLight ? 'bg-[#FFFBE6]' : 'bg-lf-graphite')}>
                  <p className={cn('text-[10px] font-bold uppercase tracking-[0.16em]', isLight ? 'text-[#7A6800]' : 'text-lf-volt')}>
                    {plan.firstPayment.label}
                  </p>
                  <p className={cn('text-xl font-black', isLight ? 'text-[#111111]' : 'text-lf-volt')}>
                    {plan.firstPayment.value}
                  </p>
                </div>
              )}
            </div>
          )}

          {benefits}
          {homeBenefitsBlock}

          <div className={cn('mt-auto', homePricing ? 'pt-4' : 'pt-5')}>
            <Button href={href} variant="volt" className="w-full justify-center">
              {cta}
            </Button>
          </div>
        </div>
      </article>
    )
  }

  /* ─── CARDS COMUNS ─── */
  return (
    <article className={cn(
      'group relative flex h-full flex-col overflow-hidden rounded-xl border',
      showBenefits ? 'min-h-[520px]' : '',
      isLight
        ? 'border-[#E2DACB] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)]'
        : 'border-lf-line bg-lf-surface',
      'transition duration-200 hover:-translate-y-0.5',
      isLight ? 'hover:border-[#C8BFB0] hover:shadow-[0_4px_28px_rgba(0,0,0,0.09)]' : 'hover:border-lf-text/20',
    )}>
      <div className={cn('flex min-h-10 items-center border-b px-5 py-2', lineClass)}>
        <span className={cn('text-[11px] font-semibold uppercase tracking-wide', isLight ? 'text-[#756F62]' : 'text-lf-muted/60')}>
          {plan.badge}
        </span>
      </div>

      <div className={cn('flex flex-1 flex-col', homePricing ? 'p-5 md:p-6' : 'p-5')}>
        <h3 className={cn('text-[22px] font-black leading-tight', titleClass)}>{plan.name}</h3>
        <p className={cn('mt-1.5 text-[14px] leading-snug', mutedClass)}>
          {description}
        </p>

        <div className={homePricing ? 'mt-4' : 'mt-5'}>
          <p className={cn('flex items-baseline gap-1', titleClass)}>
            <strong className="text-4xl font-black leading-none">{plan.price}</strong>
            <span className={cn('text-[16px]', mutedClass)}>{plan.period}</span>
          </p>
        </div>

        {benefits}
        {homeBenefitsBlock}

        <div className={cn('mt-auto', homePricing ? 'pt-4' : 'pt-5')}>
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
