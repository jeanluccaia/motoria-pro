/**
 * Camada central de analytics do Loud Fit.
 *
 * - Encaminha eventos para GA4 (gtag), Meta Pixel (fbq) e dataLayer (GTM),
 *   quando cada um estiver disponível.
 * - Respeita consentimento LGPD: se `analytics` está negado, nada vai pra GA4;
 *   se `marketing` está negado, nada vai pra Meta.
 * - No-op no servidor e quando nenhum consumidor estiver presente.
 * - Nenhum dado pessoal (nome, e-mail, telefone, CPF) deve ser passado como
 *   parâmetro — a interface `AnalyticsParams` limita valores a strings/números
 *   simples, mas quem chama continua responsável por não vazar PII.
 */

import { readStoredConsent } from '@/lib/consent'

export type AnalyticsParams = Record<
  string,
  string | number | boolean | undefined | null
>

/** Nome do evento no padrão GA4/dataLayer. */
export type AnalyticsEventName =
  | 'page_view'
  | 'view_unit'
  | 'select_plan'
  | 'begin_checkout'
  | 'whatsapp_click'
  | 'lead_franchise'
  | 'lead_campaign'
  | 'day_use_click'
  // Eventos legados dos forwarders antigos permanecem aceitos como string arbitrária
  | (string & {})

type WindowWithAnalytics = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  fbq?: (...args: unknown[]) => void
}

/**
 * Mapeamento GA4 → Meta Pixel para eventos que fazem sentido em ambos.
 * Eventos ausentes desse mapa não são replicados pro Meta Pixel.
 */
const META_EVENT_MAP: Record<string, string> = {
  view_unit: 'ViewContent',
  select_plan: 'CustomizeProduct',
  begin_checkout: 'InitiateCheckout',
  lead_franchise: 'Lead',
  lead_campaign: 'Lead',
  whatsapp_click: 'Contact',
}

function sanitize(params: AnalyticsParams): AnalyticsParams {
  const out: AnalyticsParams = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    out[k] = v
  }
  return out
}

/** Emite um evento respeitando consentimento. Safe no server, no-op sem consumers. */
export function trackEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsParams = {},
) {
  if (typeof window === 'undefined') return

  const w = window as WindowWithAnalytics
  const clean = sanitize(params)
  const consent = readStoredConsent()

  try {
    // dataLayer aceita sempre — quem processa (ex.: GTM) decide o que enviar.
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: eventName, ...clean })
    }

    if (consent.analytics && typeof w.gtag === 'function') {
      w.gtag('event', eventName, clean)
    }

    if (consent.marketing && typeof w.fbq === 'function') {
      const metaName = META_EVENT_MAP[eventName]
      if (metaName) {
        // Meta espera o segundo argumento como objeto; passamos os mesmos params.
        w.fbq('track', metaName, clean)
      }
    }
  } catch {
    /* silent */
  }
}

/** page_view manual — o snippet do GA4 já dispara no primeiro load. */
export function trackPageView(url: string) {
  if (typeof window === 'undefined') return
  const w = window as WindowWithAnalytics
  const consent = readStoredConsent()

  try {
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: 'page_view', page_path: url })
    }
    if (consent.analytics && typeof w.gtag === 'function') {
      const gaId = process.env.NEXT_PUBLIC_GA4_ID
      if (gaId) {
        w.gtag('config', gaId, { page_path: url })
      }
    }
    if (consent.marketing && typeof w.fbq === 'function') {
      w.fbq('track', 'PageView')
    }
  } catch {
    /* silent */
  }
}
