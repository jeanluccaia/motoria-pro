/**
 * Disparo autoritativo de `InitiateCheckout` no Meta Pixel para o fluxo
 * Loud Fit Ipiranga → checkout EVO.
 *
 * O evento representa "usuário clicou no CTA que leva ao checkout da EVO"
 * — momento de commit real, não mount da página. É deduplicado por sessão
 * (`sessionStorage`) para atender ao requisito de exatamente uma chamada
 * a `fbq` mesmo quando o usuário passa por múltiplos gatilhos (CTA da
 * campanha, botão da unidade, "abrir em nova aba").
 *
 * Consentimento de marketing é validado dentro de `trackMetaEvent`.
 * Redirecionamento/navegação nunca é bloqueado — este helper só faz
 * side-effects de tracking.
 */

import { trackMetaEvent } from '@/lib/analytics'

const DEDUP_KEY = 'lf_ipiranga_initiate_checkout_v1'

const IPIRANGA_INITIATE_CHECKOUT_PARAMS = {
  value: 69.9,
  currency: 'BRL',
  content_ids: ['ipiranga-mensal-recorrente'],
  content_type: 'product',
} as const

function alreadyFired(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.sessionStorage.getItem(DEDUP_KEY) === '1'
  } catch {
    return false
  }
}

function markFired() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(DEDUP_KEY, '1')
  } catch {
    /* storage indisponível — degradar silenciosamente */
  }
}

/**
 * Dispara `InitiateCheckout` no Meta Pixel para o plano Mensal Recorrente
 * da Loud Fit Ipiranga (R$ 69,90). Também empurra `initiate_checkout` no
 * dataLayer para GTM. Idempotente por sessão.
 */
export function dispatchIpirangaInitiateCheckout() {
  if (alreadyFired()) return
  markFired()

  trackMetaEvent('InitiateCheckout', IPIRANGA_INITIATE_CHECKOUT_PARAMS)

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
}
