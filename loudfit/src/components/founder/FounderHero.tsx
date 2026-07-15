'use client'

import { Fragment } from 'react'
import Image from 'next/image'
import { trackCampaignEvent } from '@/lib/campaign-analytics'
import type { CampaignPageConfig } from '@/lib/campaigns'

interface CampaignHeroProps {
  config: CampaignPageConfig
  guestName?: string
}

export function FounderHero({ config, guestName }: CampaignHeroProps) {
  const productImage = config.productImage
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

  const contentAlignment = productImage
    ? 'items-center text-center md:items-start md:text-left'
    : 'items-center text-center'
  const outerWidth = productImage ? 'max-w-[1120px]' : 'max-w-[720px]'
  const contentWidth = productImage ? 'md:max-w-[540px]' : ''

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
        className={`relative z-10 mx-auto flex w-full ${outerWidth} flex-col ${productImage ? 'gap-10 md:flex-row md:items-center md:justify-between md:gap-14 lg:gap-20' : ''} items-center px-6 py-20 sm:px-8 sm:py-24 md:py-28`}
        style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
      >
        <div
          className={`flex w-full flex-col ${contentAlignment} ${contentWidth}`}
        >
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.34em] text-[#FFE000] sm:text-[11px]"
            style={{ animation: 'lfFounderUp 0.55s cubic-bezier(0.2,0.7,0.2,1) both' }}
          >
            {config.eyebrow}
          </p>

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
              fontSize: productImage
                ? 'clamp(40px, 6.4vw, 78px)'
                : 'clamp(44px, 7.4vw, 100px)',
              letterSpacing: '-0.01em',
              lineHeight: 0.92,
              animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.16s both',
            }}
          >
            {config.headline.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                <span style={{ whiteSpace: 'nowrap' }}>
                  {line.includes('R$ 9,90')
                    ? line.split(/(R\$ 9,90)/g).map((chunk, j) =>
                        chunk === 'R$ 9,90' ? (
                          <span key={j} style={{ color: '#FFE000' }}>
                            {chunk}
                          </span>
                        ) : (
                          <Fragment key={j}>{chunk}</Fragment>
                        ),
                      )
                    : line}
                </span>
              </Fragment>
            ))}
          </h1>

          <p
            className={`mx-auto mt-8 max-w-[440px] text-[15px] leading-[1.65] text-white/60 sm:mt-9 sm:text-[16px] md:text-[17px] ${productImage ? 'md:mx-0' : ''}`}
            style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.24s both' }}
          >
            {config.supportText}
          </p>

          {config.supportSecondary && (
            <p
              className={`mx-auto mt-3 max-w-[440px] text-[13.5px] leading-[1.6] text-white/45 sm:text-[14px] ${productImage ? 'md:mx-0' : ''}`}
              style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.28s both' }}
            >
              {config.supportSecondary}
            </p>
          )}

          <div
            className={`mt-11 flex flex-col items-center gap-4 md:mt-12 ${productImage ? 'md:items-start' : ''}`}
            style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.32s both' }}
          >
            <button
              type="button"
              onClick={handleCtaClick}
              className="lf-cta-volt lf-cta-pulse inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[10px] px-8 py-4 text-[13px] font-black uppercase tracking-[0.10em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(255,224,0,0.24)] active:translate-y-0 sm:text-[14px]"
            >
              {config.heroCtaLabel}
            </button>

            <div className="mt-1 flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="lf-live-dot h-1.5 w-1.5 rounded-full bg-[#FFE000]"
              />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/70 sm:text-[11px]">
                {config.scarcity.label}
              </span>
            </div>
            <p
              className={`max-w-[380px] text-[12.5px] leading-[1.55] text-white/45 ${productImage ? 'md:text-left' : ''}`}
            >
              {config.scarcity.detail}
            </p>
          </div>
        </div>

        {productImage && (
          <div
            className="mt-10 flex w-full justify-center md:mt-0 md:flex-1 md:justify-end"
            style={{ animation: 'lfFounderUp 0.7s cubic-bezier(0.2,0.7,0.2,1) 0.12s both' }}
          >
            <div
              className="relative w-[200px] sm:w-[240px] md:w-[320px] lg:w-[380px]"
              style={{ aspectRatio: `${productImage.width} / ${productImage.height}` }}
            >
              <Image
                src={productImage.src}
                alt={productImage.alt}
                fill
                sizes="(min-width: 1024px) 380px, (min-width: 768px) 320px, (min-width: 640px) 240px, 200px"
                priority
                className="object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
