'use client'

import { Fragment } from 'react'
import { trackCampaignEvent } from '@/lib/campaign-analytics'
import type { CampaignPageConfig } from '@/lib/campaigns'

interface CampaignHeroProps {
  config: CampaignPageConfig
  guestName?: string
}

function renderHeadlineLine(line: string, highlights?: string[]) {
  if (line.includes('R$ 9,90')) {
    return line
      .split(/(R\$ 9,90)/g)
      .map((chunk, j) =>
        chunk === 'R$ 9,90' ? (
          <span key={j} style={{ color: '#FFE000' }}>
            {chunk}
          </span>
        ) : (
          <Fragment key={j}>{chunk}</Fragment>
        ),
      )
  }
  if (highlights && highlights.length > 0) {
    const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`(${escaped.join('|')})`, 'g')
    return line.split(regex).map((chunk, j) =>
      highlights.includes(chunk) ? (
        <span key={j} style={{ color: '#FFE000' }}>
          {chunk}
        </span>
      ) : (
        <Fragment key={j}>{chunk}</Fragment>
      ),
    )
  }
  return line
}

export function FounderHero({ config, guestName }: CampaignHeroProps) {
  function handleCtaClick() {
    trackCampaignEvent(config.tracking.ctaClick, config.audience, {
      source: 'hero',
      campaign_id: config.campaignId,
    })
    if (typeof document === 'undefined') return
    const target = document.getElementById('condicao-especial')
    if (!target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  const greetName = guestName?.trim().toUpperCase()
  const chips = config.giftChips ?? []

  return (
    <section
      className="relative isolate flex items-center justify-center overflow-hidden bg-[#0A0A0A]"
      style={{ minHeight: 'clamp(600px, 82vh, 780px)' }}
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-px w-[64px] -translate-x-1/2 bg-[#FFE000]/70"
      />

      <div
        className="relative z-10 mx-auto flex w-full max-w-[720px] flex-col items-center px-6 py-20 text-center sm:px-8 sm:py-24 md:py-28"
        style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
      >
        <div
          className="flex flex-col items-center gap-1.5"
          style={{ animation: 'lfFounderUp 0.55s cubic-bezier(0.2,0.7,0.2,1) both' }}
        >
          <p className="text-[10.5px] font-bold uppercase tracking-[0.34em] text-[#FFE000] sm:text-[11px]">
            {config.eyebrow}
          </p>
          {config.eyebrowLocation && (
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.28em] text-white/45 sm:text-[10px]">
              {config.eyebrowLocation}
            </p>
          )}
        </div>

        {config.heroPersonalNote && (
          <p
            className="mt-5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/70 sm:text-[11px]"
            style={{ animation: 'lfFounderUp 0.55s cubic-bezier(0.2,0.7,0.2,1) 0.06s both' }}
          >
            <span
              aria-hidden="true"
              className="lf-live-dot h-1.5 w-1.5 rounded-full bg-[#FFE000]"
            />
            {config.heroPersonalNote}
          </p>
        )}

        {greetName && (
          <p
            className="mt-8 uppercase text-white/80 sm:mt-9"
            style={{
              fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
              fontSize: 'clamp(11px, 1.05vw, 13px)',
              letterSpacing: '0.28em',
              lineHeight: 1.4,
              animation: 'lfFounderUp 0.55s cubic-bezier(0.2,0.7,0.2,1) 0.08s both',
            }}
          >
            <span style={{ color: '#FFE000' }}>{greetName}</span>, este convite é para você
          </p>
        )}

        <h1
          className={(greetName ? 'mt-9 sm:mt-10' : 'mt-9 sm:mt-11') + ' uppercase text-lf-text'}
          style={{
            fontFamily: 'var(--font-founder-display), Anton, sans-serif',
            fontSize: 'clamp(44px, 7.4vw, 100px)',
            letterSpacing: '-0.01em',
            lineHeight: 0.92,
            animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.16s both',
          }}
        >
          {config.headline.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              <span style={{ whiteSpace: 'nowrap' }}>
                {renderHeadlineLine(line, config.headlineHighlights)}
              </span>
            </Fragment>
          ))}
        </h1>

        {config.supportText && (
          <p
            className="mx-auto mt-8 max-w-[440px] text-[15px] leading-[1.65] text-white/60 sm:mt-9 sm:text-[16px] md:text-[17px]"
            style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.24s both' }}
          >
            {config.supportText}
          </p>
        )}

        {config.supportSecondary && (
          <p
            className="mx-auto mt-3 max-w-[440px] text-[13.5px] leading-[1.6] text-white/45 sm:text-[14px]"
            style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.28s both' }}
          >
            {config.supportSecondary}
          </p>
        )}

        {chips.length > 0 && (
          <ul
            aria-label="Presentes da oferta"
            className="mx-auto mt-8 grid w-full max-w-[460px] gap-2.5 sm:mt-9 sm:grid-cols-2"
            style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.30s both' }}
          >
            {chips.map((chip, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-[10px] border border-[#FFE000]/25 bg-[#FFE000]/[0.05] px-3 py-2.5 text-left text-[12.5px] font-semibold uppercase leading-[1.25] tracking-[0.06em] text-white/90 sm:text-[12.5px]"
              >
                <span
                  aria-hidden="true"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#FFE000] text-[#0A0A0A]"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="leading-[1.3]">{chip}</span>
              </li>
            ))}
          </ul>
        )}

        <div
          className="mt-10 flex flex-col items-center gap-4 md:mt-11"
          style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.36s both' }}
        >
          <button
            type="button"
            onClick={handleCtaClick}
            className="lf-cta-volt lf-cta-pulse inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[10px] px-8 py-4 text-[13px] font-black uppercase tracking-[0.10em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(255,224,0,0.24)] active:translate-y-0 sm:text-[14px]"
          >
            {config.heroCtaLabel}
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>

          {!config.hideHeroScarcity && (
            <>
              <div className="mt-1 flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="lf-live-dot h-1.5 w-1.5 rounded-full bg-[#FFE000]"
                />
                <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/70 sm:text-[11px]">
                  {config.scarcity.label}
                </span>
              </div>
              <p className="max-w-[380px] text-[12.5px] leading-[1.55] text-white/45">
                {config.scarcity.detail}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
