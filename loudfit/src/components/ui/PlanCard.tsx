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
  'power-mensal-recorrente': 'Cobrança automática mensal.',
  'power-semestral-recorrente': '6 meses com mensalidade reduzida.',
  'power-anual-recorrente': 'Plano de 12 meses com cobrança mensal.',
}

const HOME_BENEFITS = [
  'Aulas coletivas inclusas',
  'Acesso às unidades',
  'Convidados: até 5 acessos',
  'Reconhecimento facial',
]

/* Força uso da fonte body (Inter) nos cards — sobrescreve o h3 global que usa Big Shoulders */
const BODY = '[font-family:var(--font-body)]'

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-lf-volt">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function BenefitsAccordion({ dark }: { dark?: boolean }) {
  return (
    <details className={cn('group border-t', dark ? 'border-white/10' : 'border-[#EDEBE5]', BODY)}>
      <summary className={cn(
        'flex cursor-pointer select-none list-none items-center justify-between py-3',
        'text-[12px] font-medium [&::-webkit-details-marker]:hidden',
        dark ? 'text-white/40' : 'text-[#8A8478]',
      )}>
        <span className="group-open:hidden">Mostrar benefícios</span>
        <span className="hidden group-open:block">Ocultar benefícios</span>
        <ChevronDownIcon className={cn(
          'h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-open:rotate-180',
          dark ? 'text-white/40' : 'text-[#8A8478]',
        )} />
      </summary>
      <ul className="mb-3 flex flex-col gap-2.5 pt-0.5">
        {HOME_BENEFITS.map((b) => (
          <li key={b} className={cn('flex items-start gap-2 text-[12px]', dark ? 'text-white/60' : 'text-[#3B3832]')}>
            <CheckIcon />
            {b}
          </li>
        ))}
      </ul>
    </details>
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
  const description = homePricing ? homePlanDescriptions[plan.slug] ?? plan.description : plan.description
  const cta = ctaLabel ?? 'Começar matrícula'

  /* Benefits — unit pages only */
  const benefitsBlock = showBenefits ? (
    <ul className={cn('mt-5 grid gap-2.5 border-t pt-5 text-sm', isLight ? 'border-[#EDEBE5] text-[#3B3832]' : 'border-lf-line text-lf-muted')}>
      {planBenefits.map((b) => (
        <li key={b} className="flex items-start gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-lf-volt" />
          <span className="leading-snug">{b}</span>
        </li>
      ))}
    </ul>
  ) : null

  /* ─── CARD DESTAQUE — sempre escuro, independente de tone ─── */
  if (plan.featured) {
    return (
      <article className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl',
        showBenefits ? 'min-h-[520px]' : '',
        'bg-[#181818] shadow-[0_8px_40px_rgba(0,0,0,0.30)]',
        'order-first md:order-none',
        'transition duration-200 hover:-translate-y-1',
      )}>
        {/* Banda topo amarela */}
        <div className={cn('flex items-center justify-between gap-3 bg-lf-volt px-5 py-3', BODY)}>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-lf-black">
            O mais vantajoso
          </span>
          <span className="rounded-full bg-lf-black/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-lf-black">
            {plan.badge}
          </span>
        </div>

        <div className={cn('flex flex-1 flex-col p-6', BODY)}>
          <h3 className={cn('text-[20px] font-bold leading-tight text-lf-text', BODY)}>
            {plan.name}
          </h3>
          <p className="mt-1 text-[13px] leading-snug text-white/50">
            {description}
          </p>

          {homePricing && plan.firstPayment ? (
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lf-volt">
                1ª mensalidade
              </p>
              <p className={cn('mt-1.5 flex items-baseline', BODY)}>
                <strong className="text-[48px] font-black leading-none text-lf-text">
                  {plan.firstPayment.value}
                </strong>
                <span className="ml-0.5 text-[18px] font-bold text-lf-volt">*</span>
              </p>
              <p className="mt-2 text-[12px] leading-snug text-white/40">
                Depois, mensalidade conforme a unidade escolhida.
              </p>
            </div>
          ) : (
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className={cn('flex items-baseline text-lf-text', BODY)}>
                <strong className="text-[44px] font-black leading-none">{plan.price}</strong>
                <span className="ml-1 text-[14px] text-white/50">{plan.period}</span>
              </p>
            </div>
          )}

          {benefitsBlock}

          <div className="mt-auto pt-6">
            <Button
              href={href}
              variant="volt"
              className={cn('w-full justify-center rounded-full text-[13px] font-bold normal-case tracking-normal', BODY)}
            >
              {cta}
            </Button>
            {homePricing && <BenefitsAccordion dark />}
          </div>
        </div>
      </article>
    )
  }

  /* ─── CARDS COMUNS ─── */
  return (
    <article className={cn(
      'group relative flex h-full flex-col overflow-hidden rounded-3xl',
      showBenefits ? 'min-h-[520px]' : '',
      isLight
        ? 'border border-[#E4DFD4] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)]'
        : 'border border-lf-line bg-lf-surface',
      'transition duration-200 hover:-translate-y-0.5',
      isLight ? 'hover:shadow-[0_4px_28px_rgba(0,0,0,0.10)]' : 'hover:border-lf-text/20',
    )}>
      <div className={cn('flex flex-1 flex-col p-6', BODY)}>
        {/* Badge pill */}
        <span className={cn(
          'mb-4 inline-block self-start rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]',
          isLight ? 'bg-[#F0EDE6] text-[#7A7267]' : 'bg-lf-graphite text-lf-muted',
        )}>
          {plan.badge}
        </span>

        <h3 className={cn('text-[20px] font-bold leading-tight', BODY, isLight ? 'text-[#111111]' : 'text-lf-text')}>
          {plan.name}
        </h3>
        <p className={cn('mt-1 text-[13px] leading-snug', isLight ? 'text-[#5E5B54]' : 'text-lf-muted')}>
          {description}
        </p>

        <div className={cn('mt-5 border-t pt-5', isLight ? 'border-[#EDEBE5]' : 'border-lf-line')}>
          <p className={cn('flex items-baseline', isLight ? 'text-[#111111]' : 'text-lf-text', BODY)}>
            <strong className="text-[38px] font-black leading-none">{plan.price}</strong>
            <span className={cn('ml-1 text-[14px]', isLight ? 'text-[#5E5B54]' : 'text-lf-muted')}>{plan.period}</span>
          </p>
        </div>

        {benefitsBlock}

        <div className="mt-auto pt-5">
          <Button
            href={href}
            variant="volt"
            className={cn('w-full justify-center rounded-full text-[13px] font-bold normal-case tracking-normal', BODY)}
          >
            {cta}
          </Button>
          {homePricing && <BenefitsAccordion dark={!isLight} />}
        </div>
      </div>
    </article>
  )
}
