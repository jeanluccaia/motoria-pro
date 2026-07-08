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
  'power-mensal': ['Aulas coletivas inclusas', 'Acesso às unidades', 'Aula experimental grátis'],
  'power-mensal-recorrente': ['Aulas coletivas inclusas', 'Acesso às unidades', 'Reconhecimento facial'],
  'power-semestral-recorrente': ['Aulas coletivas inclusas', 'Convidados: até 5 acessos', 'Reconhecimento facial'],
  'power-anual-recorrente': ['Aulas coletivas inclusas', 'Acesso às unidades', 'Convidados: até 5 acessos'],
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0 text-lf-volt">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
  const lineClass = isLight ? 'border-[#EDEBE5]' : 'border-lf-line'
  const description = homePricing ? homePlanDescriptions[plan.slug] ?? plan.description : plan.description

  const cta = ctaLabel ?? 'Começar matrícula'

  /* Benefits — unit pages only */
  const benefits = showBenefits ? (
    <ul className={cn('mt-5 grid gap-2.5 border-t pt-5 text-sm', isLight ? 'border-[#EDEBE5] text-[#3B3832]' : 'border-lf-line text-lf-muted')}>
      {planBenefits.map((b) => (
        <li key={b} className="flex items-start gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-lf-volt" />
          <span className="leading-snug">{b}</span>
        </li>
      ))}
    </ul>
  ) : null

  /* Home benefits — compact, elegant */
  const homeBenefitsBlock = homePricing && homeCardBenefits[plan.slug] ? (
    <ul className={cn('mt-4 flex flex-col gap-2 border-t pt-4', lineClass)}>
      {homeCardBenefits[plan.slug].map((b) => (
        <li key={b} className={cn('flex items-center gap-2 text-[13px] font-normal', isLight ? 'text-[#4A4742]' : 'text-lf-muted')}>
          <CheckIcon />
          {b}
        </li>
      ))}
    </ul>
  ) : null

  /* ─── CARD DESTAQUE ─── */
  if (plan.featured) {
    return (
      <article className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl',
        showBenefits ? 'min-h-[520px]' : '',
        isLight
          ? 'border border-lf-volt/50 bg-white shadow-[0_2px_20px_rgba(255,229,0,0.10),0_1px_4px_rgba(0,0,0,0.05)]'
          : 'bg-lf-black ring-2 ring-lf-volt shadow-[0_8px_48px_rgba(255,229,0,0.12)]',
        'order-first md:order-none',
        'transition duration-200 hover:-translate-y-0.5',
      )}>
        {/* Banda topo */}
        <div className="flex items-center justify-between gap-3 bg-lf-volt px-5 py-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-lf-black">
            Mais popular
          </span>
          <span className="rounded-sm bg-lf-black/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-lf-black">
            {plan.badge}
          </span>
        </div>

        <div className={cn('flex flex-1 flex-col', homePricing ? 'p-5 md:p-6' : 'p-5')}>
          <h3 className={cn('text-[20px] font-black leading-tight', titleClass)}>{plan.name}</h3>
          <p className={cn('mt-1 text-[13px] leading-snug', mutedClass)}>
            {description}
          </p>

          {homePricing && plan.firstPayment ? (
            <div className={cn('mt-4 border-t pt-4', lineClass)}>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-lf-volt">
                1ª mensalidade
              </p>
              <p className={cn('mt-1 flex items-baseline gap-0.5', titleClass)}>
                <strong className="text-[44px] font-black leading-none">{plan.firstPayment.value}</strong>
                <span className="ml-0.5 text-[17px] font-bold text-lf-volt">*</span>
              </p>
              <p className={cn('mt-1.5 text-[12px] leading-snug', mutedClass)}>
                Depois, mensalidade conforme a unidade escolhida.
              </p>
            </div>
          ) : (
            <div className={cn('mt-4 border-t pt-4', lineClass)}>
              <p className={cn('flex items-baseline gap-0.5', titleClass)}>
                <strong className="text-[40px] font-black leading-none">{plan.price}</strong>
                <span className={cn('ml-0.5 text-[14px]', mutedClass)}>{plan.period}</span>
              </p>
            </div>
          )}

          {benefits}
          {homeBenefitsBlock}

          <div className={cn('mt-auto', homePricing ? 'pt-5' : 'pt-5')}>
            <Button href={href} variant="volt" className="w-full justify-center text-[13px]">
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
      'group relative flex h-full flex-col overflow-hidden rounded-2xl',
      showBenefits ? 'min-h-[520px]' : '',
      isLight
        ? 'border border-[#E8E3D8] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]'
        : 'border border-lf-line bg-lf-surface',
      'transition duration-200 hover:-translate-y-0.5',
      isLight ? 'hover:border-[#C8C0B4] hover:shadow-[0_2px_20px_rgba(0,0,0,0.08)]' : 'hover:border-lf-text/20',
    )}>
      <div className={cn('flex flex-1 flex-col', homePricing ? 'p-5 md:p-6' : 'p-5')}>
        {/* Badge inline — sem barra separadora */}
        <span className={cn(
          'mb-3 inline-block self-start rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]',
          isLight ? 'bg-[#F0EDE6] text-[#7A7267]' : 'bg-lf-graphite text-lf-muted',
        )}>
          {plan.badge}
        </span>

        <h3 className={cn('text-[20px] font-black leading-tight', titleClass)}>{plan.name}</h3>
        <p className={cn('mt-1 text-[13px] leading-snug', mutedClass)}>
          {description}
        </p>

        <div className={cn('mt-4 border-t pt-4', lineClass)}>
          <p className={cn('flex items-baseline gap-0.5', titleClass)}>
            <strong className="text-[36px] font-black leading-none">{plan.price}</strong>
            <span className={cn('ml-0.5 text-[14px]', mutedClass)}>{plan.period}</span>
          </p>
        </div>

        {benefits}
        {homeBenefitsBlock}

        <div className="mt-auto pt-5">
          <Button
            href={href}
            variant="ghost"
            className={cn(
              'w-full justify-center text-[13px]',
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
