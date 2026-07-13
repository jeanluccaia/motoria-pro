'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  networkBenefits,
  planConditions,
  planShortDescriptions,
  type Plan,
} from '@/lib/plans'

export type PlansVariant = 'home' | 'unit'

interface ExpandablePlanCardProps {
  plan: Plan
  isOpen: boolean
  onToggle: (slug: string) => void
  panelId: string
  variant: PlansVariant
  ctaHref: string
  ctaLabel: string
  /** Home mostra "1ª mensalidade R$ 9,90" no destaque; unidade mostra o preço mensal cheio. */
  homePricing?: boolean
}

const BODY = '[font-family:var(--font-body)]'

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-lf-volt"
    >
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        'h-3.5 w-3.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none',
        open && 'rotate-180',
      )}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function BenefitsInline({ dark }: { dark?: boolean }) {
  return (
    <div className="mt-4">
      <p
        className={cn(
          'text-[10px] font-bold uppercase tracking-[0.14em]',
          dark ? 'text-lf-volt' : 'text-[#7A6900]',
        )}
      >
        Benefícios inclusos
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {networkBenefits.map((b) => (
          <li
            key={b}
            className={cn(
              'flex items-start gap-2 text-[12.5px] leading-snug',
              dark ? 'text-lf-text/85' : 'text-[#3B3832]',
            )}
          >
            <CheckIcon />
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ConditionsInline({ plan, dark }: { plan: Plan; dark?: boolean }) {
  const text = planConditions[plan.slug]
  if (!text) return null
  return (
    <div className="mt-5">
      <p
        className={cn(
          'text-[10px] font-bold uppercase tracking-[0.14em]',
          dark ? 'text-lf-volt' : 'text-[#7A6900]',
        )}
      >
        Condições
      </p>
      <p
        className={cn(
          'mt-2 text-[12.5px] leading-[1.55]',
          dark ? 'text-lf-text/75' : 'text-[#4A4A4A]',
        )}
      >
        {text}
      </p>
    </div>
  )
}

export function ExpandablePlanCard({
  plan,
  isOpen,
  onToggle,
  panelId,
  variant,
  ctaHref,
  ctaLabel,
  homePricing = false,
}: ExpandablePlanCardProps) {
  const description = planShortDescriptions[plan.slug] ?? plan.description
  const buttonId = `plan-toggle-${plan.slug}-${variant}`
  const isFeatured = plan.featured

  /* Featured — sempre em fundo escuro, mas com peso ligeiramente diferente por contexto. */
  if (isFeatured) {
    const shellBg =
      variant === 'home'
        ? 'bg-[#0F0F0F] shadow-[0_10px_40px_rgba(0,0,0,0.35)]'
        : 'bg-[#181818] shadow-[0_8px_40px_rgba(0,0,0,0.30)]'

    return (
      <article
        className={cn(
          'group relative flex flex-col self-start overflow-hidden rounded-3xl transition-all duration-200 motion-reduce:transition-none',
          shellBg,
          'order-first md:order-none',
          isOpen && 'ring-2 ring-lf-volt/50',
        )}
      >
        <div className={cn('flex items-center justify-between gap-3 bg-lf-volt px-5 py-3', BODY)}>
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-lf-black">
            O mais vantajoso
          </span>
          <span className="rounded-full bg-lf-black/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-lf-black">
            {plan.badge}
          </span>
        </div>

        <div className={cn('flex flex-1 flex-col p-6', BODY)}>
          <h3 className={cn('text-[20px] font-bold leading-tight text-lf-text', BODY)}>
            {plan.name}
          </h3>
          <p className="mt-1 text-[13px] leading-snug text-white/55">{description}</p>

          {homePricing && plan.firstPayment ? (
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lf-volt">
                1ª mensalidade
              </p>
              <p className={cn('mt-1.5 flex items-baseline text-lf-text', BODY)}>
                <strong className="text-[48px] font-black leading-none">
                  {plan.firstPayment.value}
                </strong>
                <span className="ml-0.5 text-[18px] font-bold text-lf-volt">*</span>
              </p>
              <p className="mt-2 text-[12px] leading-snug text-white/45">
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

          <div className="mt-6">
            <Link
              href={ctaHref}
              className="lf-cta-volt inline-flex w-full min-h-[44px] items-center justify-center rounded-full px-5 py-3 text-[13px] font-bold tracking-normal"
            >
              {ctaLabel}
            </Link>
          </div>

          <div className="mt-4">
            <button
              type="button"
              id={buttonId}
              onClick={() => onToggle(plan.slug)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-[12px] font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/50',
                isOpen
                  ? 'border-lf-volt/60 bg-lf-volt/10 text-lf-volt'
                  : 'border-white/10 bg-white/[0.02] text-lf-text/70 hover:border-lf-volt/40 hover:text-lf-volt',
              )}
            >
              <span>{isOpen ? 'Ocultar benefícios e condições' : 'Ver benefícios e condições'}</span>
              <ChevronIcon open={isOpen} />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="mt-3 border-t border-white/10 pt-3"
            >
              <BenefitsInline dark />
              <ConditionsInline plan={plan} dark />
            </div>
          </div>
        </div>
      </article>
    )
  }

  /* Não destacado — Home mantém tema claro branco; Unidade mantém tema escuro grafite. */
  const dark = variant === 'unit'
  const shellClasses = dark
    ? cn(
        'border border-lf-line bg-lf-surface',
        isOpen
          ? 'border-lf-volt/60 ring-2 ring-lf-volt/40 shadow-[0_10px_30px_rgba(255,224,0,0.10)]'
          : 'hover:-translate-y-0.5 hover:border-lf-text/25',
      )
    : cn(
        'border bg-white shadow-[0_1px_6px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)]',
        isOpen
          ? 'border-lf-volt/60 ring-2 ring-lf-volt/40 shadow-[0_10px_30px_rgba(255,224,0,0.15)]'
          : 'border-[#E4DFD4] hover:-translate-y-0.5 hover:shadow-[0_4px_28px_rgba(0,0,0,0.10)]',
      )

  return (
    <article
      className={cn(
        'group relative flex flex-col self-start overflow-hidden rounded-3xl transition-all duration-200 motion-reduce:transition-none',
        shellClasses,
      )}
    >
      <div className={cn('flex flex-1 flex-col p-6', BODY)}>
        <span
          className={cn(
            'mb-4 inline-block self-start rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]',
            dark ? 'bg-lf-graphite text-lf-muted' : 'bg-[#F0EDE6] text-[#7A7267]',
          )}
        >
          {plan.badge}
        </span>

        <h3
          className={cn(
            'text-[20px] font-bold leading-tight',
            BODY,
            dark ? 'text-lf-text' : 'text-[#111111]',
          )}
        >
          {plan.name}
        </h3>
        <p
          className={cn(
            'mt-1 text-[13px] leading-snug',
            dark ? 'text-lf-muted' : 'text-[#5E5B54]',
          )}
        >
          {description}
        </p>

        <div className={cn('mt-5 border-t pt-5', dark ? 'border-lf-line' : 'border-[#EDEBE5]')}>
          <p
            className={cn(
              'flex items-baseline',
              BODY,
              dark ? 'text-lf-text' : 'text-[#111111]',
            )}
          >
            <strong className="text-[38px] font-black leading-none">{plan.price}</strong>
            <span
              className={cn(
                'ml-1 text-[14px]',
                dark ? 'text-lf-muted' : 'text-[#5E5B54]',
              )}
            >
              {plan.period}
            </span>
          </p>
        </div>

        <div className="mt-6">
          <Link
            href={ctaHref}
            className="lf-cta-volt inline-flex w-full min-h-[44px] items-center justify-center rounded-full px-5 py-3 text-[13px] font-bold tracking-normal"
          >
            {ctaLabel}
          </Link>
        </div>

        <div className="mt-4">
          <button
            type="button"
            id={buttonId}
            onClick={() => onToggle(plan.slug)}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className={cn(
              'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-[12px] font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/60',
              dark
                ? isOpen
                  ? 'border-lf-volt/60 bg-lf-volt/10 text-lf-volt'
                  : 'border-lf-line bg-lf-black/40 text-lf-muted hover:border-lf-volt/40 hover:text-lf-volt'
                : isOpen
                  ? 'border-[#7A6900] bg-[#FFF6C2] text-[#141414]'
                  : 'border-[#E4DFD4] bg-[#FAF9F5] text-[#5E5B54] hover:border-[#7A6900] hover:text-[#141414]',
            )}
          >
            <span>{isOpen ? 'Ocultar benefícios e condições' : 'Ver benefícios e condições'}</span>
            <ChevronIcon open={isOpen} />
          </button>

          <div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            hidden={!isOpen}
            className={cn(
              'mt-3 border-t pt-3',
              dark ? 'border-lf-line' : 'border-[#EDEBE5]',
            )}
          >
            <BenefitsInline dark={dark} />
            <ConditionsInline plan={plan} dark={dark} />
          </div>
        </div>
      </div>
    </article>
  )
}
