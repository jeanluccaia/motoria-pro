import { Fragment } from 'react'
import { FounderForm } from './FounderForm'
import type { CampaignPageConfig, CampaignPlan } from '@/lib/campaigns'

interface CampaignConversionProps {
  config: CampaignPageConfig
  plan: CampaignPlan
}

export function FounderConversion({ config, plan }: CampaignConversionProps) {
  return (
    <section
      id="fazer-parte"
      className="border-t border-white/[0.10] bg-[#0A0A0A]"
      style={{
        fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
        padding: 'clamp(76px, 9vw, 108px) clamp(24px, 5vw, 80px)',
      }}
    >
      <div className="mx-auto flex max-w-[520px] flex-col items-center text-center">
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
          {config.formTitle.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </h2>
        <p className="mb-11 mt-6 max-w-[420px] text-[14.5px] leading-[1.65] text-white/60 sm:mb-12 sm:text-[15.5px]">
          {config.formSupport}
        </p>

        <FounderForm config={config} plan={plan} />
      </div>
    </section>
  )
}
