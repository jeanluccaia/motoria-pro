'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'
import { dispatchIpirangaInitiateCheckout } from '@/lib/meta-checkout'
import {
  NETWORK_MIN_MONTHLY_PRICE,
  networkBenefits,
  planConditions,
  planShortDescriptions,
  type Plan,
} from '@/lib/plans'

/** Extrai o slug da unidade quando ctaHref segue o padrão /matricula/{slug}. */
function unitSlugFromHref(href: string): string | undefined {
  const match = href.match(/\/matricula\/([^/?#]+)/)
  return match?.[1]
}

function firePlanCtaClick(plan: Plan, ctaHref: string) {
  trackEvent('select_plan', {
    unit_slug: unitSlugFromHref(ctaHref),
    plan_id: plan.slug,
    plan_name: plan.name,
    displayed_price: plan.firstPayment?.value ?? plan.price,
    regular_price: plan.price,
    currency: 'BRL',
    promotion: plan.firstPayment ? 'first_month' : undefined,
  })
  // Clique autoritativo para o InitiateCheckout do Meta Pixel na unidade
  // Ipiranga. Helper é deduplicado por sessão e valida consentimento.
  if (ctaHref.startsWith('/matricula/ipiranga')) {
    dispatchIpirangaInitiateCheckout()
  }
}

export type PlansVariant = 'home' | 'unit'

interface ExpandablePlanCardProps {
  plan: Plan
  isOpen: boolean
  onToggle: (slug: string) => void
  panelId: string
  variant: PlansVariant
  ctaHref: string
  ctaLabel: string
  /** Home mostra "1º mês por R$ 9,90 · depois a partir de …"; unidade mostra o valor exato da unidade. */
  homePricing?: boolean
}

const BODY = '[font-family:var(--font-body)]'

function CheckIcon({ dark }: { dark?: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={cn('mt-0.5 shrink-0', dark ? 'text-lf-volt' : 'text-[#7A6900]')}
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
            <CheckIcon dark={dark} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ConditionsInline({ plan, dark }: { plan: Plan; dark?: boolean }) {
  const items = planConditions[plan.slug]
  if (!items || items.length === 0) return null
  return (
    <div className="mt-5">
      <p
        className={cn(
          'text-[10px] font-bold uppercase tracking-[0.14em]',
          dark ? 'text-lf-volt' : 'text-[#7A6900]',
        )}
      >
        Condições do plano
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item}
            className={cn(
              'flex items-start gap-2 text-[12.5px] leading-snug',
              dark ? 'text-lf-text/75' : 'text-[#4A4A4A]',
            )}
          >
            <CheckIcon dark={dark} />
            {item}
          </li>
        ))}
      </ul>
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
  const tier = plan.tier

  /* Featured — Power Plus. Fundo preto premium, borda amarela, selo único. */
  if (tier === 'featured') {
    const shellBg =
      variant === 'home'
        ? 'bg-[#0F0F0F] shadow-[0_10px_40px_rgba(0,0,0,0.35)]'
        : 'bg-[#181818] shadow-[0_8px_40px_rgba(0,0,0,0.30)]'

    const afterFirstMonth =
      homePricing
        ? `Depois, ${NETWORK_MIN_MONTHLY_PRICE}${plan.period}`
        : `Depois, ${plan.price}${plan.period}`

    return (
      <article
        className={cn(
          'group relative flex w-full min-w-0 flex-col overflow-hidden rounded-3xl transition-all duration-200 motion-reduce:transition-none',
          shellBg,
          'order-first md:order-none',
          'ring-1 ring-lf-volt/40',
          isOpen && 'ring-2 ring-lf-volt/60',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center bg-lf-volt px-5 py-1.5',
            BODY,
          )}
        >
          <span className="text-[10.5px] font-black uppercase tracking-[0.2em] text-lf-black">
            {plan.badge}
          </span>
        </div>

        <div className={cn('flex flex-1 flex-col p-7 md:p-8', BODY)}>
          <h3 className={cn('text-[22px] font-black leading-tight text-lf-text', BODY)}>
            {plan.name}
          </h3>
          <p className="mt-1.5 text-[13px] leading-snug text-white/55">{description}</p>

          {plan.firstPayment ? (
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-lf-volt">
                {plan.firstPayment.label}
              </p>
              <p className={cn('mt-2 flex items-baseline text-lf-text', BODY)}>
                <strong className="text-[44px] font-black leading-none tracking-tight md:text-[48px]">
                  {plan.firstPayment.value}
                </strong>
                <span className="ml-1 text-[16px] font-bold text-lf-volt">*</span>
              </p>
              <p className="mt-3 text-[13.5px] leading-snug text-white/75">
                {afterFirstMonth}
              </p>
            </div>
          ) : (
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className={cn('flex items-baseline text-lf-text', BODY)}>
                <strong className="text-[38px] font-black leading-none">{plan.price}</strong>
                <span className="ml-1 text-[14px] text-white/50">{plan.period}</span>
              </p>
            </div>
          )}

          <div className="mt-auto pt-7">
            <Link
              href={ctaHref}
              onClick={() => firePlanCtaClick(plan, ctaHref)}
              className="lf-cta-volt inline-flex w-full min-h-[48px] items-center justify-center rounded-full px-5 py-3 text-[13px] font-bold tracking-normal"
            >
              {ctaLabel}
            </Link>

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
        </div>
      </article>
    )
  }

  /* Accent — Power Recorrente. Tratamento intermediário: fundo branco com borda mais forte + selo escuro. */
  if (tier === 'accent') {
    const shellClasses = cn(
      'border bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05),0_10px_30px_rgba(0,0,0,0.07)]',
      isOpen
        ? 'border-[#141414] ring-2 ring-[#141414]/25'
        : 'border-[#141414]/40 hover:-translate-y-0.5 hover:shadow-[0_6px_32px_rgba(0,0,0,0.12)]',
    )

    return (
      <article
        className={cn(
          'group relative flex w-full min-w-0 flex-col overflow-hidden rounded-3xl transition-all duration-200 motion-reduce:transition-none',
          shellClasses,
        )}
      >
        <div className={cn('flex flex-1 flex-col p-7 md:p-8', BODY)}>
          <span className="mb-5 inline-block self-start rounded-full bg-[#141414] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-lf-volt">
            {plan.badge}
          </span>

          <h3 className={cn('text-[22px] font-black leading-tight text-[#111111]', BODY)}>
            {plan.name}
          </h3>
          <p className="mt-1.5 text-[13px] leading-snug text-[#5E5B54]">{description}</p>

          <div className="mt-6 border-t border-[#EDEBE5] pt-6">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#7A7267]">
              Mensalidade
            </p>
            <p className={cn('mt-2 flex items-baseline text-[#111111]', BODY)}>
              <strong className="text-[36px] font-black leading-none tracking-tight md:text-[38px]">
                {plan.price}
              </strong>
              <span className="ml-1 text-[14px] text-[#5E5B54]">{plan.period}</span>
            </p>
            <p className="mt-3 text-[12px] leading-snug text-[#7A7267]">{plan.commitment}</p>
          </div>

          <div className="mt-auto pt-7">
            <Link
              href={ctaHref}
              onClick={() => firePlanCtaClick(plan, ctaHref)}
              className="inline-flex w-full min-h-[48px] items-center justify-center rounded-full bg-[#141414] px-5 py-3 text-[13px] font-bold tracking-normal text-lf-volt transition hover:bg-[#000] hover:shadow-[0_0_22px_rgba(255,224,0,0.18)]"
            >
              {ctaLabel}
            </Link>

            <div className="mt-4">
              <button
                type="button"
                id={buttonId}
                onClick={() => onToggle(plan.slug)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-[12px] font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/40',
                  isOpen
                    ? 'border-[#141414] bg-[#F5F3EE] text-[#141414]'
                    : 'border-[#141414]/30 bg-[#FAF9F5] text-[#3B3832] hover:border-[#141414] hover:text-[#141414]',
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
                className="mt-3 border-t border-[#EDEBE5] pt-3"
              >
                <BenefitsInline />
                <ConditionsInline plan={plan} />
              </div>
            </div>
          </div>
        </div>
      </article>
    )
  }

  /* Neutral — Power. Tema claro, tratamento mais suave. */
  const shellClasses = cn(
    'border bg-white shadow-[0_1px_6px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)]',
    isOpen
      ? 'border-lf-volt/60 ring-2 ring-lf-volt/40 shadow-[0_10px_30px_rgba(255,224,0,0.15)]'
      : 'border-[#E4DFD4] hover:-translate-y-0.5 hover:shadow-[0_4px_28px_rgba(0,0,0,0.10)]',
  )

  return (
    <article
      className={cn(
        'group relative flex w-full min-w-0 flex-col overflow-hidden rounded-3xl transition-all duration-200 motion-reduce:transition-none',
        shellClasses,
      )}
    >
      <div className={cn('flex flex-1 flex-col p-7 md:p-8', BODY)}>
        <span className="mb-5 inline-block self-start rounded-full bg-[#F0EDE6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A7267]">
          {plan.badge}
        </span>

        <h3 className={cn('text-[22px] font-black leading-tight text-[#111111]', BODY)}>
          {plan.name}
        </h3>
        <p className="mt-1.5 text-[13px] leading-snug text-[#5E5B54]">{description}</p>

        <div className="mt-6 border-t border-[#EDEBE5] pt-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#7A7267]">
            Mensalidade
          </p>
          <p className={cn('mt-2 flex items-baseline text-[#111111]', BODY)}>
            <strong className="text-[36px] font-black leading-none tracking-tight md:text-[38px]">
              {plan.price}
            </strong>
            <span className="ml-1 text-[14px] text-[#5E5B54]">{plan.period}</span>
          </p>
          <p className="mt-3 text-[12px] leading-snug text-[#7A7267]">{plan.commitment}</p>
          <p className="mt-1 text-[11.5px] leading-snug text-[#9A938A]">Cancele quando quiser</p>
        </div>

        <div className="mt-auto pt-7">
          <Link
            href={ctaHref}
            onClick={() => firePlanCtaClick(plan, ctaHref)}
            className="lf-cta-volt inline-flex w-full min-h-[48px] items-center justify-center rounded-full px-5 py-3 text-[13px] font-bold tracking-normal"
          >
            {ctaLabel}
          </Link>

          <div className="mt-4">
            <button
              type="button"
              id={buttonId}
              onClick={() => onToggle(plan.slug)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-[12px] font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/60',
                isOpen
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
              className="mt-3 border-t border-[#EDEBE5] pt-3"
            >
              <BenefitsInline />
              <ConditionsInline plan={plan} />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
