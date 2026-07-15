import { Fragment } from 'react'
import Image from 'next/image'
import type { CampaignPageConfig } from '@/lib/campaigns'

interface CampaignBenefitsProps {
  config: CampaignPageConfig
}

export function FounderBenefits({ config }: CampaignBenefitsProps) {
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
          fontSize: 'clamp(26px, 3.5vw, 42px)',
          letterSpacing: '-0.01em',
          lineHeight: 0.98,
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
        <p className="mx-auto mb-14 mt-5 max-w-[540px] text-center text-[14.5px] leading-[1.65] text-white/60 sm:mb-12 sm:text-[15.5px]">
          {config.benefitsSupport}
        </p>
      )}

      <div className="mx-auto mb-4 grid max-w-[820px] gap-11 sm:grid-cols-2 sm:gap-10 lg:gap-12">
        {config.benefits.map((b) => (
          <div key={b.n} className="border-t border-white/[0.10] pt-5 sm:pt-6">
            <span
              className="block"
              style={{
                fontFamily: 'var(--font-founder-display), Anton, sans-serif',
                color: '#FFE000',
                fontSize: '26px',
                lineHeight: 1,
              }}
            >
              {b.n}
            </span>
            <h3
              className="mt-3 text-[14.5px] font-extrabold uppercase leading-[1.2] tracking-[0.04em] text-lf-text sm:text-[15px]"
              style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
            >
              {b.title}
            </h3>
            <p className="mt-2 text-[14px] leading-[1.55] text-white/60">{b.desc}</p>
            {b.note && (
              <p className="mt-2 text-[12.5px] leading-[1.5] text-white/40">{b.note}</p>
            )}
            {b.image && (
              <div className="mt-5 flex items-center justify-start">
                <div
                  className="relative w-[120px] overflow-hidden rounded-[10px] border border-white/[0.08] bg-white/[0.02] sm:w-[132px]"
                  style={{ aspectRatio: `${b.image.width} / ${b.image.height}` }}
                >
                  <Image
                    src={b.image.src}
                    alt={b.image.alt}
                    fill
                    sizes="132px"
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {config.eligibilityText && (
        <p className="mx-auto mt-12 max-w-[540px] text-center text-[12.5px] leading-[1.6] text-white/45">
          {config.eligibilityText}
        </p>
      )}
    </section>
  )
}
