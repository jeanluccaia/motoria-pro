'use client'

import { Fragment, useEffect, useRef } from 'react'
import {
  STANDARD_PLAN_BENEFITS,
  campaignPlans,
  type CampaignPageConfig,
  type CampaignPlan,
} from '@/lib/campaigns'
import { trackCampaignEvent } from '@/lib/campaign-analytics'
import { trackMetaEvent } from '@/lib/analytics'

interface CampaignOfferProps {
  config: CampaignPageConfig
  selectedPlanId: CampaignPlan['id']
  onSelect: (id: CampaignPlan['id']) => void
  onCtaClick: () => void
}

export function FounderOffer({
  config,
  selectedPlanId,
  onSelect,
  onCtaClick,
}: CampaignOfferProps) {
  const availablePlans =
    config.planIds && config.planIds.length > 0
      ? campaignPlans.filter((p) => config.planIds!.includes(p.id))
      : campaignPlans
  const selected =
    availablePlans.find((p) => p.id === selectedPlanId) ??
    availablePlans[0] ??
    campaignPlans[3]
  const showFirstMonthPrice = config.showFirstMonthPrice !== false
  const showPlanSelector =
    !config.hidePlanSelector && availablePlans.length > 1
  const cardValidityText =
    config.cardValidityText ??
    'Válido em qualquer unidade Loud Fit — a equipe finaliza a matrícula por você'
  const firstMonthPriceLabel =
    config.firstMonthPriceOverride ?? selected.firstMonthPrice
  const firstMonthPriceValue =
    config.firstMonthPriceValueOverride ?? selected.firstMonthPriceValue
  const regularPriceLabel =
    config.regularPriceOverride ?? selected.regularPrice
  const regularPriceValue =
    config.regularPriceValueOverride ?? selected.regularPriceValue
  const sectionRef = useRef<HTMLElement>(null)
  const seenRef = useRef(false)

  useEffect(() => {
    if (!sectionRef.current || seenRef.current) return
    const el = sectionRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seenRef.current) {
            seenRef.current = true
            trackCampaignEvent(config.tracking.offerView, config.audience, {
              campaign_id: config.campaignId,
            })
            observer.disconnect()
          }
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [config])

  return (
    <section
      ref={sectionRef}
      id="condicao-especial"
      className="relative border-t border-white/[0.10] bg-[#0A0A0A]"
      style={{
        fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
        padding: 'clamp(72px, 9vw, 108px) clamp(24px, 5vw, 80px)',
      }}
    >
      <div className="mx-auto flex max-w-[620px] flex-col items-center text-center">
        <h2
          className="uppercase text-lf-text"
          style={{
            fontFamily: 'var(--font-founder-display), Anton, sans-serif',
            fontSize: 'clamp(29px, 4.5vw, 56px)',
            letterSpacing: '-0.01em',
            lineHeight: 0.96,
            margin: 0,
          }}
        >
          {config.offerTitle.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </h2>

        <p className="mt-6 max-w-[460px] text-[14.5px] leading-[1.65] text-white/60 sm:text-[15.5px]">
          {config.offerSubtitle}
        </p>

        {showPlanSelector && (
          <div className="mt-10 w-full max-w-[460px] sm:mt-11">
            <span className="sr-only" id="campaign-plan-selector-label">
              Escolha o plano
            </span>
            <div
              role="radiogroup"
              aria-labelledby="campaign-plan-selector-label"
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {availablePlans.map((plan) => {
                const active = plan.id === selected.id
                return (
                  <button
                    key={plan.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      onSelect(plan.id)
                      trackCampaignEvent(config.tracking.planSelect, config.audience, {
                        campaign_id: config.campaignId,
                        plan_name: plan.name,
                        regular_price: plan.regularPriceValue,
                        first_month_price: plan.firstMonthPriceValue,
                      })
                    }}
                    className={
                      'inline-flex min-h-[44px] items-center justify-center rounded-[10px] border px-3 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.10em] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE000]/60 sm:text-[11px] ' +
                      (active
                        ? 'border-[#FFE000] bg-[#FFE000] text-[#0A0A0A]'
                        : 'border-white/12 bg-transparent text-white/65 hover:border-white/30 hover:text-white/85')
                    }
                  >
                    {plan.shortLabel}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Card */}
        <div
          className="relative mt-10 w-full max-w-[480px] overflow-hidden rounded-2xl border border-white/[0.12] text-left shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:mt-12"
          style={{
            background: 'linear-gradient(180deg,#111 0%,#0c0c0c 100%)',
            padding: 'clamp(28px, 4vw, 40px)',
          }}
        >
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-0 h-[3px]"
            style={{ background: '#FFE000' }}
          />

          <div className="flex flex-col gap-5">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.26em] text-[#FFE000]">
              {config.cardEyebrow}
            </span>

            <div className="flex flex-col gap-1.5">
              <span
                key={`name-${selected.id}`}
                className="text-[11px] font-bold uppercase tracking-[0.20em] text-white/55"
                style={{ animation: 'lfFounderFade 0.35s ease both' }}
              >
                {selected.name.toUpperCase()}
              </span>

              {showFirstMonthPrice ? (
                <>
                  <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.20em] text-white/45">
                    1º MÊS
                  </span>

                  <div className="flex items-baseline gap-2">
                    <span
                      key={`price-${selected.id}`}
                      className="font-extrabold text-lf-text"
                      style={{
                        fontSize: 'clamp(44px, 7.6vw, 72px)',
                        lineHeight: 0.9,
                        letterSpacing: '-0.02em',
                        whiteSpace: 'nowrap',
                        animation: 'lfFounderPrice 0.35s cubic-bezier(0.2,0.7,0.2,1) both',
                      }}
                    >
                      {firstMonthPriceLabel}
                    </span>
                  </div>

                  <p className="mt-3 text-[14px] leading-[1.5] text-white/70">
                    Depois{' '}
                    <span className="font-semibold text-lf-text">
                      {regularPriceLabel}
                    </span>{' '}
                    por mês
                  </p>

                  <p className="mt-1 text-[12.5px] leading-[1.5] text-white/50">
                    {selected.recurrenceLabel}
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      key={`price-${selected.id}`}
                      className="font-extrabold text-lf-text"
                      style={{
                        fontSize: 'clamp(44px, 7.5vw, 68px)',
                        lineHeight: 0.9,
                        letterSpacing: '-0.02em',
                        whiteSpace: 'nowrap',
                        animation: 'lfFounderPrice 0.35s cubic-bezier(0.2,0.7,0.2,1) both',
                      }}
                    >
                      {regularPriceLabel}
                    </span>
                    <span className="text-[14px] font-semibold uppercase tracking-[0.16em] text-white/55">
                      /mês
                    </span>
                  </div>

                  <p className="mt-3 text-[13.5px] leading-[1.5] text-white/60">
                    {selected.recurrenceLabel}
                  </p>
                </>
              )}
            </div>

            <p className="text-[13px] leading-[1.55] text-white/55">
              {cardValidityText}
            </p>

            <details className="group border-t border-white/[0.10] pt-1">
              <summary className="flex cursor-pointer select-none list-none items-center justify-between py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-white/70 [&::-webkit-details-marker]:hidden">
                <span>O que está incluído no plano</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <ul className="mt-2 flex flex-col gap-2.5 pb-1">
                {STANDARD_PLAN_BENEFITS.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-[13px] leading-[1.45] text-white/70"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-[#FFE000]"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </details>

            {config.checkoutHref ? (
              <>
                <a
                  href={config.checkoutHref}
                  onClick={() => {
                    trackCampaignEvent(config.tracking.ctaClick, config.audience, {
                      source: 'offer_card_checkout',
                      campaign_id: config.campaignId,
                      plan_name: selected.name,
                      regular_price: regularPriceValue,
                      first_month_price: firstMonthPriceValue,
                    })
                    if (config.campaignId === 'convite_inauguracao') {
                      trackMetaEvent('InitiateCheckout', {
                        content_name: 'Plano Mensal Recorrente - Loud Fit Ipiranga',
                        content_category: 'Academia',
                        content_type: 'product',
                        content_ids: ['ipiranga-mensal-recorrente'],
                        value: 69.9,
                        currency: 'BRL',
                      })
                      const w = window as Window & { dataLayer?: unknown[] }
                      if (Array.isArray(w.dataLayer)) {
                        w.dataLayer.push({
                          event: 'initiate_checkout',
                          unit: 'ipiranga',
                          plan: 'mensal_recorrente',
                          value: 69.9,
                          currency: 'BRL',
                        })
                      }
                    }
                  }}
                  className="lf-cta-volt lf-cta-pulse mt-1 inline-flex min-h-[54px] w-full items-center justify-center rounded-[10px] px-6 py-4 text-[13.5px] font-black uppercase tracking-[0.08em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(255,224,0,0.24)] active:translate-y-0 sm:text-[14px]"
                >
                  {config.checkoutCtaLabel ?? config.cardCtaLabel}
                </a>
                {config.checkoutSupportText && (
                  <p className="mt-2 text-center text-[12px] leading-[1.5] text-white/50">
                    {config.checkoutSupportText}
                  </p>
                )}
                {config.assistanceHref ? (
                  <a
                    href={config.assistanceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackCampaignEvent(config.tracking.ctaClick, config.audience, {
                        source: 'offer_card_assistance',
                        campaign_id: config.campaignId,
                        plan_name: selected.name,
                        regular_price: regularPriceValue,
                        first_month_price: firstMonthPriceValue,
                      })
                    }}
                    className="mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[10px] border border-white/20 bg-transparent px-5 py-3 text-[12px] font-bold uppercase tracking-[0.10em] text-white/85 transition-all duration-200 hover:border-white/50 hover:text-white active:translate-y-0 sm:text-[12.5px]"
                  >
                    <svg
                      aria-hidden="true"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.52 3.48A11.87 11.87 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.94L0 24l6.34-1.66a11.86 11.86 0 0 0 5.72 1.45h.01c6.55 0 11.9-5.34 11.9-11.9a11.83 11.83 0 0 0-3.45-8.41ZM12.07 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.76.99 1-3.67-.24-.38a9.86 9.86 0 0 1-1.52-5.24c0-5.46 4.45-9.9 9.92-9.9 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9Zm5.44-7.42c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.24-.24-.58-.5-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5 0 1.48 1.08 2.91 1.23 3.11.15.2 2.13 3.24 5.16 4.55.72.31 1.28.5 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.18-1.42-.08-.13-.28-.2-.58-.35Z" />
                    </svg>
                    {config.assistanceCtaLabel ?? config.cardCtaLabel}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      trackCampaignEvent(config.tracking.ctaClick, config.audience, {
                        source: 'offer_card_assistance',
                        campaign_id: config.campaignId,
                        plan_name: selected.name,
                        regular_price: regularPriceValue,
                        first_month_price: firstMonthPriceValue,
                      })
                      onCtaClick()
                    }}
                    className="mt-3 inline-flex min-h-[46px] w-full items-center justify-center rounded-[10px] border border-white/20 bg-transparent px-5 py-3 text-[12px] font-bold uppercase tracking-[0.10em] text-white/80 transition-all duration-200 hover:border-white/50 hover:text-white active:translate-y-0 sm:text-[12.5px]"
                  >
                    {config.assistanceCtaLabel ?? config.cardCtaLabel}
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  trackCampaignEvent(config.tracking.ctaClick, config.audience, {
                    source: 'offer_card',
                    campaign_id: config.campaignId,
                    plan_name: selected.name,
                    regular_price: regularPriceValue,
                    first_month_price: firstMonthPriceValue,
                  })
                  onCtaClick()
                }}
                className="lf-cta-volt lf-cta-pulse mt-1 inline-flex min-h-[54px] w-full items-center justify-center rounded-[10px] px-6 py-4 text-[13.5px] font-black uppercase tracking-[0.08em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(255,224,0,0.24)] active:translate-y-0 sm:text-[14px]"
              >
                {config.cardCtaLabel}
              </button>
            )}

            <div className="mt-3 flex items-center justify-center gap-2.5 text-center">
              <span
                aria-hidden="true"
                className="lf-live-dot h-1.5 w-1.5 rounded-full bg-[#FFE000]"
              />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.20em] text-white/60">
                {config.scarcity.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
