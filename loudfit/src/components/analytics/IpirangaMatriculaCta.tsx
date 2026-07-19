'use client'

import Link from 'next/link'
import { dispatchIpirangaInitiateCheckout } from '@/lib/meta-checkout'

interface Props {
  href: string
  className: string
  children: React.ReactNode
}

/**
 * CTA "Matricular online" da unidade Ipiranga. Dispara `InitiateCheckout`
 * no Meta Pixel no clique real (antes da navegação client-side para
 * /matricula/ipiranga), deduplicado por sessão via
 * `dispatchIpirangaInitiateCheckout`. Consentimento é validado dentro do
 * helper. A navegação ocorre normalmente mesmo sem tracking.
 */
export function IpirangaMatriculaCta({ href, className, children }: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        dispatchIpirangaInitiateCheckout()
      }}
    >
      <span className="min-w-0 max-w-full break-words">{children}</span>
    </Link>
  )
}
