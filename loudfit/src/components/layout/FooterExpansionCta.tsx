'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/**
 * The franchise landing page has its own strong candidatura block, so we hide
 * the global footer expansion CTA on that route to avoid a duplicated call.
 */
export function FooterExpansionCta({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/franquias')) return null
  return <>{children}</>
}
