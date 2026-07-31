'use client'

import { useState } from 'react'
import { Reveal } from '@/components/ui/Reveal'
import { ExpandablePlanCard, type PlansVariant } from './ExpandablePlanCard'
import { type Plan } from '@/lib/plans'

interface PlansGridProps {
  plans: Plan[]
  variant: PlansVariant
  ctaBase: string
  ctaLabel: string
  /** Home mostra "1ª mensalidade" no destaque; unidade mostra o preço mensal cheio. */
  homePricing?: boolean
}

function buildHref(plan: Plan, ctaBase: string): string {
  if (plan.checkoutUrl) return plan.checkoutUrl
  if (ctaBase.includes('?') || ctaBase.includes('#')) return ctaBase
  return `${ctaBase}?plano=${plan.slug}`
}

export function PlansGrid({ plans, variant, ctaBase, ctaLabel, homePricing = false }: PlansGridProps) {
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  function handleToggle(slug: string) {
    setOpenSlug((current) => (current === slug ? null : slug))
  }

  // 3 colunas em ≥lg (cabe os três cards lado a lado); 1 coluna no mobile
  // com Power Plus obrigatoriamente primeiro por `order-first` no card.
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-5 lg:grid-cols-3">
      {plans.map((plan, i) => (
        <Reveal key={plan.slug} delay={i * 0.06} className="flex w-full min-w-0 flex-col self-start">
          <ExpandablePlanCard
            plan={plan}
            isOpen={openSlug === plan.slug}
            onToggle={handleToggle}
            panelId={`plan-panel-${variant}-${plan.slug}`}
            variant={variant}
            ctaHref={buildHref(plan, ctaBase)}
            ctaLabel={ctaLabel}
            homePricing={homePricing}
          />
        </Reveal>
      ))}
    </div>
  )
}
