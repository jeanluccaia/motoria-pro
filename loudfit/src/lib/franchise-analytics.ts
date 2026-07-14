/**
 * Wrapper compatível com o funil de franquia.
 * Delega para a camada central de analytics; enriquece com `funnel: 'franquias'`.
 * Consentimento é validado dentro de trackEvent — no-op se usuário negou.
 */
import { trackEvent, type AnalyticsParams } from '@/lib/analytics'

export function trackFranchiseEvent(eventName: string, payload: AnalyticsParams = {}) {
  trackEvent(eventName, { ...payload, funnel: 'franquias' })
}
