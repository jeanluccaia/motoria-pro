/**
 * Wrapper compatível com componentes de campanha (/convite, /volte).
 * Delega para a camada central de analytics; enriquece com `campaign_audience`.
 * Consentimento é validado dentro de trackEvent — no-op se usuário negou.
 */
import { trackEvent, type AnalyticsParams } from '@/lib/analytics'

export function trackCampaignEvent(
  eventName: string,
  audience: string,
  payload: AnalyticsParams = {},
) {
  trackEvent(eventName, { ...payload, campaign_audience: audience })
}
