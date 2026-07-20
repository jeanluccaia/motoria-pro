'use client'

import { readStoredConsent } from '@/lib/consent'

interface Props {
  checkoutUrl: string
  className?: string
  children: React.ReactNode
}

type WindowWithMeta = Window & {
  fbq?: (...args: unknown[]) => void
  dataLayer?: unknown[]
}

const INITIATE_CHECKOUT_PARAMS = {
  value: 69.9,
  currency: 'BRL',
  content_ids: ['ipiranga-mensal-recorrente'],
  content_type: 'product',
} as const

/**
 * Wrapper do link "Abrir checkout em nova aba" para /matricula/ipiranga.
 * Este é o clique autoritativo final do funil Loud Fit Ipiranga: dispara
 * `InitiateCheckout` no Meta Pixel imediatamente, direto no handler, sem
 * dedup por sessionStorage. Cada clique manda o evento — a Meta reconcilia
 * duplicatas do lado dela. A navegação para EVO (target=_blank) segue
 * normalmente e não é bloqueada pelo tracking.
 */
export function IpirangaEvoCheckoutLink({ checkoutUrl, className, children }: Props) {
  return (
    <a
      href={checkoutUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        if (typeof window === 'undefined') return
        console.log('[LF CHECKOUT] click')
        const w = window as WindowWithMeta
        const consent = readStoredConsent()
        console.log('[LF CHECKOUT] consent', consent)
        console.log('[LF CHECKOUT] fbq', typeof w.fbq)

        let fired = false
        if (consent.marketing && typeof w.fbq === 'function') {
          try {
            w.fbq('track', 'InitiateCheckout', INITIATE_CHECKOUT_PARAMS)
            fired = true
          } catch {
            /* nunca bloqueia navegação */
          }
        }
        console.log('[LF CHECKOUT] fired', fired)

        if (Array.isArray(w.dataLayer)) {
          w.dataLayer.push({
            event: 'initiate_checkout',
            unit: 'ipiranga',
            plan: 'mensal_recorrente',
            value: 69.9,
            currency: 'BRL',
          })
        }
      }}
    >
      {children}
    </a>
  )
}
