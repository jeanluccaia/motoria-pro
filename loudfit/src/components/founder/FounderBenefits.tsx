import { Fragment } from 'react'
import Image from 'next/image'
import type { CampaignBenefit, CampaignPageConfig } from '@/lib/campaigns'

interface CampaignBenefitsProps {
  config: CampaignPageConfig
}

function BenefitVisual({ benefit }: { benefit: CampaignBenefit }) {
  if (benefit.image) {
    return (
      <div className="relative w-full overflow-hidden rounded-[14px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 0%, rgba(255,224,0,0.22) 0%, rgba(255,224,0,0.06) 45%, rgba(255,224,0,0) 70%)',
          }}
        />
        <div
          className="relative mx-auto flex aspect-[4/5] w-full items-center justify-center rounded-[14px] border border-white/[0.10] bg-[#0f0f0f]"
          style={{
            background:
              'linear-gradient(180deg,#141414 0%,#0b0b0b 60%,#080808 100%)',
          }}
        >
          <div
            className="relative h-[82%] w-[70%]"
            style={{
              aspectRatio: `${benefit.image.width} / ${benefit.image.height}`,
            }}
          >
            <Image
              src={benefit.image.src}
              alt={benefit.image.alt}
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 768px) 320px, 88vw"
              className="object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
            />
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 bottom-6 h-[3px] rounded-full"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,224,0,0) 0%, rgba(255,224,0,0.65) 50%, rgba(255,224,0,0) 100%)',
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[14px] border border-white/[0.10] bg-[#0f0f0f]"
      style={{
        background:
          'radial-gradient(120% 90% at 50% 30%, rgba(255,224,0,0.14) 0%, rgba(255,224,0,0.04) 40%, #0b0b0b 75%)',
      }}
    >
      <div className="flex flex-col items-center text-center">
        <span
          style={{
            fontFamily: 'var(--font-founder-display), Anton, sans-serif',
            color: '#FFE000',
            fontSize: 'clamp(120px, 18vw, 200px)',
            lineHeight: 0.85,
            letterSpacing: '-0.02em',
          }}
        >
          30
        </span>
        <span
          className="mt-2 text-[16px] font-black uppercase tracking-[0.28em] text-white/90 sm:text-[18px]"
          style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
        >
          DIAS
        </span>
        <span className="mt-3 text-[12px] font-semibold uppercase tracking-[0.20em] text-white/55">
          para presentear
        </span>
        <span
          aria-hidden="true"
          className="mt-5 flex items-center justify-center gap-2 text-white/70"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/25 text-[11px] font-black">
            EU
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span
            className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-black text-[#0A0A0A]"
            style={{ background: '#FFE000' }}
          >
            +1
          </span>
        </span>
      </div>
    </div>
  )
}

export function FounderBenefits({ config }: CampaignBenefitsProps) {
  const videoSlot = config.benefitsHighlight?.videoSlot

  return (
    <section
      className="border-t border-white/[0.10] bg-[#0A0A0A]"
      style={{
        fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
        padding: 'clamp(72px, 8vw, 96px) clamp(24px, 5vw, 80px)',
      }}
    >
      <h2
        className="mx-auto max-w-[720px] text-center uppercase text-lf-text"
        style={{
          fontFamily: 'var(--font-founder-display), Anton, sans-serif',
          fontSize: 'clamp(30px, 4.2vw, 52px)',
          letterSpacing: '-0.01em',
          lineHeight: 0.96,
          margin: 0,
        }}
      >
        {config.benefitsTitle.map((line, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </h2>

      {config.benefitsSupport && (
        <p className="mx-auto mb-14 mt-5 max-w-[560px] text-center text-[14.5px] leading-[1.65] text-white/60 sm:mb-16 sm:text-[15.5px]">
          {config.benefitsSupport}
        </p>
      )}

      <div className="mx-auto grid max-w-[1080px] gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
        {config.benefits.map((b) => (
          <article
            key={b.n}
            className="relative flex flex-col overflow-hidden rounded-[18px] border border-white/[0.10] bg-[#0d0d0d] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-7"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#0A0A0A]"
                style={{
                  background: '#FFE000',
                  fontFamily: 'var(--font-founder-display), Anton, sans-serif',
                  fontSize: '15px',
                  letterSpacing: '0.02em',
                }}
              >
                {b.n}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFE000]/85">
                {b.n === '01' ? 'Presente físico' : 'Presente para alguém'}
              </span>
            </div>

            <div className="mt-6">
              <BenefitVisual benefit={b} />
            </div>

            <h3
              className="mt-6 text-[18px] font-black uppercase leading-[1.12] tracking-[0.02em] text-lf-text sm:text-[20px] lg:text-[22px]"
              style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
            >
              {b.title}
            </h3>
            <p className="mt-3 text-[14.5px] leading-[1.55] text-white/70 sm:text-[15px]">
              {b.desc}
            </p>
            {b.note && (
              <p className="mt-2 text-[12.5px] leading-[1.5] text-white/40">
                {b.note}
              </p>
            )}
          </article>
        ))}
      </div>

      {videoSlot && (
        <div
          className="mx-auto mt-10 flex max-w-[1080px] items-center gap-4 rounded-[14px] border border-dashed border-white/[0.15] bg-white/[0.03] px-5 py-4 text-center sm:mt-12"
          role="note"
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFE000]/15 text-[#FFE000]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </span>
          <p className="text-left text-[13px] leading-[1.5] text-white/60">
            {videoSlot.note}
          </p>
        </div>
      )}

      {config.eligibilityText && (
        <p className="mx-auto mt-12 max-w-[560px] text-center text-[12.5px] leading-[1.65] text-white/45 sm:mt-14">
          {config.eligibilityText}
        </p>
      )}
    </section>
  )
}
