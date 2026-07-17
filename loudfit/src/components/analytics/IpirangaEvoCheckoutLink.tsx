'use client'

import { trackMetaEvent } from '@/lib/analytics'

interface Props {
  checkoutUrl: string
  className?: string
  children: React.ReactNode
}

/**
 * Wrapper do link "Abrir checkout em nova aba" para /matricula/ipiranga.
 * Este é o click autoritativo que envia o usuário ao checkout externo da EVO
 * dentro do fluxo /convite → /matricula/ipiranga → EVO. Dispara
 * `InitiateCheckout` no Meta Pixel e `initiate_checkout` no dataLayer,
 * ambos gated no consentimento de marketing dentro dos helpers.
 * O redirecionamento acontece via `href` normal e não é bloqueado por falhas
 * de tracking.
 */
export function IpirangaEvoCheckoutLink({ checkoutUrl, className, children }: Props) {
  return (
    <a
      href={checkoutUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        trackMetaEvent('InitiateCheckout', {
          content_name: 'Plano Mensal Recorrente - Loud Fit Ipiranga',
          content_category: 'Academia',
          content_type: 'product',
          content_ids: ['ipiranga-mensal-recorrente'],
          value: 69.9,
          currency: 'BRL',
        })
        const w = window as Window & { dataLayer?: unknown[] }
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
