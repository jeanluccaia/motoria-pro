'use client'

import { useEffect, useRef } from 'react'
import { founderPlans, type FounderPlan } from '@/lib/founder-plans'
import { trackFounderEvent } from '@/lib/founder-analytics'

interface FounderOfferProps {
  selectedPlanId: FounderPlan['id']
  onSelect: (id: FounderPlan['id']) => void
  onCtaClick: () => void
}

export function FounderOffer({ selectedPlanId, onSelect, onCtaClick }: FounderOfferProps) {
  const selected = founderPlans.find((p) => p.id === selectedPlanId) ?? founderPlans[3]
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
            trackFounderEvent('founder_offer_view')
            observer.disconnect()
          }
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="condicao-fundador"
      className="relative border-t border-white/[0.10] bg-[#0A0A0A]"
      style={{
        fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
        padding: 'clamp(52px, 8vw, 96px) clamp(22px, 5vw, 80px)',
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
          SUA CONDIÇÃO
          <br />
          DE FUNDADOR
        </h2>

        <p className="mt-5 max-w-[440px] text-[14px] leading-[1.55] text-white/60 sm:text-[15px]">
          Uma proposta reservada para quem recebeu o convite — R$ 10 de vantagem mensal em relação ao valor regular da rede
        </p>

        {/* Plan selector */}
        <div className="mt-8 w-full max-w-[460px]">
          <span className="sr-only" id="founder-plan-selector-label">
            Escolha o plano
          </span>
          <div
            role="radiogroup"
            aria-labelledby="founder-plan-selector-label"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {founderPlans.map((plan) => {
              const active = plan.id === selected.id
              return (
                <button
                  key={plan.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    onSelect(plan.id)
                    trackFounderEvent('founder_plan_select', {
                      plan_name: plan.name,
                      regular_price: plan.regularPriceValue,
                      founder_price: plan.founderPriceValue,
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

        {/* Card */}
        <div
          className="relative mt-8 w-full max-w-[480px] overflow-hidden rounded-2xl border border-white/[0.12] text-left shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
          style={{
            background: 'linear-gradient(180deg,#111 0%,#0c0c0c 100%)',
            padding: 'clamp(24px, 4vw, 40px)',
          }}
        >
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-0 h-[3px]"
            style={{ background: '#FFE000' }}
          />

          <div className="flex flex-col gap-5">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.26em] text-[#FFE000]">
              Sua condição de fundador
            </span>

            <div className="flex flex-col gap-1.5">
              <span
                key={`name-${selected.id}`}
                className="text-[11px] font-bold uppercase tracking-[0.20em] text-white/55"
                style={{ animation: 'lfFounderFade 0.35s ease both' }}
              >
                {selected.name.toUpperCase()}
              </span>

              <div className="flex items-baseline gap-2">
                <span
                  key={`price-${selected.id}`}
                  className="font-extrabold text-lf-text"
                  style={{
                    fontSize: 'clamp(48px, 8.5vw, 80px)',
                    lineHeight: 0.9,
                    letterSpacing: '-0.02em',
                    animation: 'lfFounderPrice 0.35s cubic-bezier(0.2,0.7,0.2,1) both',
                  }}
                >
                  {selected.founderPrice}
                </span>
              </div>

              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                POR MÊS
              </span>

              <span className="mt-2 flex flex-wrap items-baseline gap-2 text-[13px] leading-[1.5] text-white/55">
                <span>De</span>
                <span className="line-through decoration-white/35">{selected.regularPrice}</span>
              </span>

              <p className="mt-1 text-[13px] leading-[1.5] text-white/60">
                R$ 10 de vantagem mensal em relação ao valor regular
              </p>
            </div>

            <div className="h-px w-full bg-white/[0.10]" />

            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 flex-none rounded-[2px]"
                style={{ background: '#FFE000' }}
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-lf-text">
                STATUS MEMBRO FUNDADOR INCLUÍDO
              </span>
            </div>

            <p className="text-[13px] leading-[1.55] text-white/55">
              Válido em qualquer unidade Loud Fit — a equipe finaliza a matrícula por você
            </p>

            <button
              type="button"
              onClick={() => {
                trackFounderEvent('founder_cta_click', {
                  source: 'offer_card',
                  plan_name: selected.name,
                  regular_price: selected.regularPriceValue,
                  founder_price: selected.founderPriceValue,
                })
                onCtaClick()
              }}
              className="lf-cta-volt mt-1 inline-flex min-h-[54px] w-full items-center justify-center rounded-[10px] px-6 py-4 text-[13.5px] font-black uppercase tracking-[0.08em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(255,224,0,0.24)] active:translate-y-0 sm:text-[14px]"
            >
              QUERO SER MEMBRO FUNDADOR
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
