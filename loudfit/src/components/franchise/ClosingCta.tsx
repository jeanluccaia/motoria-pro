'use client'

import { trackFranchiseEvent } from '@/lib/franchise-analytics'

export function ClosingCta() {
  return (
    <a
      href="#candidatura"
      onClick={() => trackFranchiseEvent('franchise_cta_final')}
      className="lf-cta-volt inline-flex min-h-[56px] items-center justify-center px-10 py-4 text-sm font-black uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5 active:scale-[0.99] sm:text-base"
    >
      Quero ser franqueado
    </a>
  )
}
