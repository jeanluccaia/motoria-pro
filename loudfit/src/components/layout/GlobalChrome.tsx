'use client'

import { usePathname } from 'next/navigation'

/**
 * Rotas que trazem chrome próprio (header/footer de campanha) e por isso
 * devem suprimir o chrome global institucional. Cobre a rota exata e
 * quaisquer subrotas futuras (ex.: /convite/opengraph-image-...).
 */
const HIDDEN_CHROME_ROUTES = ['/founder', '/convite', '/volte']

export function GlobalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (!pathname) return <>{children}</>

  const shouldHide = HIDDEN_CHROME_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
  if (shouldHide) return null

  return <>{children}</>
}
