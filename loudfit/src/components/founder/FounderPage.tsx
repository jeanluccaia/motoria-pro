'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_CAMPAIGN_PLAN_ID,
  campaignPlans,
  type CampaignPageConfig,
  type CampaignPlan,
} from '@/lib/campaigns'
import { trackCampaignEvent } from '@/lib/campaign-analytics'
import { FounderHero } from './FounderHero'
import { FounderOffer } from './FounderOffer'
import { FounderBenefits } from './FounderBenefits'
import { FounderConversion } from './FounderConversion'

interface CampaignPageProps {
  config: CampaignPageConfig
  guestName?: string
}

export function FounderPage({ config, guestName }: CampaignPageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<CampaignPlan['id']>(
    DEFAULT_CAMPAIGN_PLAN_ID,
  )
  const selectedPlan =
    campaignPlans.find((p) => p.id === selectedPlanId) ?? campaignPlans[3]

  useEffect(() => {
    trackCampaignEvent(config.tracking.view, config.audience, {
      campaign_id: config.campaignId,
    })
  }, [config])

  function scrollToForm() {
    if (typeof document === 'undefined') return
    const target = document.getElementById('fazer-parte')
    if (!target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <>
      <FounderHero config={config} guestName={guestName} />
      <FounderOffer
        config={config}
        selectedPlanId={selectedPlanId}
        onSelect={setSelectedPlanId}
        onCtaClick={scrollToForm}
      />
      <FounderBenefits config={config} />
      <FounderConversion config={config} plan={selectedPlan} />
    </>
  )
}
