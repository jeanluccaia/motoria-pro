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
 * Consentimento de marketing é validado aqui mesmo, antes de marcar o
 * dedup. Um clique sem consentimento (ou antes do fbq carregar) não
 * marca o dedup — assim o próximo clique com consentimento válido
 * consegue disparar de fato.
 * Redirecionamento/navegação nunca é bloqueado — este helper só faz
 * side-effects de tracking.
 */

import { readStoredConsent } from '@/lib/consent'

const DEDUP_KEY = 'lf_ipiranga_initiate_checkout_v1'

const IPIRANGA_INITIATE_CHECKOUT_PARAMS = {
  value: 69.9,
  currency: 'BRL',
  content_ids: ['ipiranga-mensal-recorrente'],
  content_type: 'product',
} as const

type WindowWithMetaAndDataLayer = Window & {
  fbq?: (...args: unknown[]) => void
  dataLayer?: unknown[]
}

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
 * da Loud Fit Ipiranga (1ª mensalidade R$ 69,90 — ver `campaigns.ts`
 * `conviteConfig.firstMonthPriceValueOverride`). Também empurra
 * `initiate_checkout` no dataLayer para GTM.
 *
 * Idempotente por sessão SOMENTE quando o pixel foi de fato disparado —
 * cliques sem consentimento ou com fbq ainda ausente não consomem o
 * dedup, permitindo retry no próximo clique válido.
 */
export function dispatchIpirangaInitiateCheckout() {
  if (typeof window === 'undefined') return
  if (alreadyFired()) return

  const w = window as WindowWithMetaAndDataLayer
  const consent = readStoredConsent()

  // Sem consentimento de marketing ou pixel ainda não carregado: retorna
  // silenciosamente e NÃO marca o dedup. A navegação para EVO segue
  // normalmente no chamador; o próximo clique com estado válido dispara.
  if (!consent.marketing) return
  if (typeof w.fbq !== 'function') return

  // A partir daqui o disparo é garantido — marca o dedup antes do fbq
  // para blindar contra reentrada síncrona (ex.: dois onClick no mesmo
  // clique) mesmo se o fbq lançar.
  markFired()

  try {
    w.fbq('track', 'InitiateCheckout', IPIRANGA_INITIATE_CHECKOUT_PARAMS)
  } catch {
    /* silent — nunca bloquear navegação */
  }

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
