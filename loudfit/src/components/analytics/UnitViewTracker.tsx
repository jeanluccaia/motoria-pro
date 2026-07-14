'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

interface Props {
  unitSlug: string
  unitName: string
  city: string
  state: string
}

/**
 * Emite `view_unit` uma única vez ao montar. Uso restrito a páginas
 * individuais de unidade — NÃO usar na lista `/unidades`.
 */
export function UnitViewTracker({ unitSlug, unitName, city, state }: Props) {
  useEffect(() => {
    trackEvent('view_unit', {
      unit_slug: unitSlug,
      unit_name: unitName,
      city,
      state,
    })
  }, [unitSlug, unitName, city, state])

  return null
}
