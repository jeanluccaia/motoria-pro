'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

interface Props {
  unitSlug: string
  unitName: string
}

/**
 * Emite `begin_checkout` uma única vez quando a página de matrícula monta
 * (que corresponde ao momento em que o iframe do EVO começa a carregar).
 * Deduplicado por ref para não repetir em re-renders.
 */
export function CheckoutBeginTracker({ unitSlug, unitName }: Props) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackEvent('begin_checkout', {
      unit_slug: unitSlug,
      unit_name: unitName,
      checkout_provider: 'evo',
      currency: 'BRL',
    })
  }, [unitSlug, unitName])
  return null
}
