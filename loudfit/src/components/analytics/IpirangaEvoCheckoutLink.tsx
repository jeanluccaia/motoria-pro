'use client'

import { dispatchIpirangaInitiateCheckout } from '@/lib/meta-checkout'

interface Props {
  checkoutUrl: string
  className?: string
  children: React.ReactNode
}

/**
 * Wrapper do link "Abrir checkout em nova aba" para /matricula/ipiranga.
 * Caminho secundário do fluxo /convite → /matricula/ipiranga → EVO — para
 * usuários em que o iframe embutido não funciona. Compartilha o helper
 * `dispatchIpirangaInitiateCheckout`, que já é deduplicado por sessão e
 * gated no consentimento de marketing. A navegação para EVO segue pelo
 * `href` normal e nunca é bloqueada por falhas de tracking.
 */
export function IpirangaEvoCheckoutLink({ checkoutUrl, className, children }: Props) {
  return (
    <a
      href={checkoutUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        dispatchIpirangaInitiateCheckout()
      }}
    >
      {children}
    </a>
  )
}
