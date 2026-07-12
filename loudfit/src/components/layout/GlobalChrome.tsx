'use client'

import { usePathname } from 'next/navigation'

export function GlobalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/founder')) return null
  return <>{children}</>
}
