'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_FOUNDER_PLAN_ID,
  founderPlans,
  type FounderPlan,
} from '@/lib/founder-plans'
import { trackFounderEvent } from '@/lib/founder-analytics'
import { FounderHero } from './FounderHero'
import { FounderOffer } from './FounderOffer'
import { FounderBenefits } from './FounderBenefits'
import { FounderConversion } from './FounderConversion'

interface FounderPageProps {
  guestName?: string
}

export function FounderPage({ guestName }: FounderPageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<FounderPlan['id']>(
    DEFAULT_FOUNDER_PLAN_ID,
  )
  const selectedPlan =
    founderPlans.find((p) => p.id === selectedPlanId) ?? founderPlans[3]

  useEffect(() => {
    trackFounderEvent('founder_page_view', { campaign: 'lote_fundador_conceito' })
  }, [])

  function scrollToForm() {
    if (typeof document === 'undefined') return
    const target = document.getElementById('fazer-parte')
    if (!target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <>
      <FounderHero guestName={guestName} />
      <FounderOffer
        selectedPlanId={selectedPlanId}
        onSelect={setSelectedPlanId}
        onCtaClick={scrollToForm}
      />
      <FounderBenefits />
      <FounderConversion plan={selectedPlan} />
    </>
  )
}
