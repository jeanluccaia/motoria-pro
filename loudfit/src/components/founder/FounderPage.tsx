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
import { FounderPresentationVideo } from './FounderPresentationVideo'

interface CampaignPageProps {
  config: CampaignPageConfig
  guestName?: string
  showPresentationVideo?: boolean
}

export function FounderPage({ config, guestName, showPresentationVideo }: CampaignPageProps) {
  const initialPlanId: CampaignPlan['id'] =
    config.planIds && config.planIds.length > 0
      ? config.planIds[0]
      : DEFAULT_CAMPAIGN_PLAN_ID
  const [selectedPlanId, setSelectedPlanId] =
    useState<CampaignPlan['id']>(initialPlanId)
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

  const showLeadForm = config.showLeadForm !== false

  return (
    <>
      <FounderHero config={config} guestName={guestName} />
      {showPresentationVideo && <FounderPresentationVideo />}
      <FounderOffer
        config={config}
        selectedPlanId={selectedPlanId}
        onSelect={setSelectedPlanId}
        onCtaClick={scrollToForm}
      />
      <FounderBenefits config={config} />
      {showLeadForm && <FounderConversion config={config} plan={selectedPlan} />}
    </>
  )
}
