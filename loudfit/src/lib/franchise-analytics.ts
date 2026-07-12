/**
 * Lightweight event forwarder for the franchise funnel.
 *
 * Pushes to `window.dataLayer` when available (GTM standard) and to
 * `window.gtag('event', …)` when GA4 is loaded. No-op on the server and
 * whenever neither hook is present — safe to call from any component.
 */
type EventPayload = Record<string, string | number | boolean | undefined>

type WindowWithAnalytics = Window & {
  dataLayer?: unknown[]
  gtag?: (command: 'event', eventName: string, params?: EventPayload) => void
}

export function trackFranchiseEvent(eventName: string, payload: EventPayload = {}) {
  if (typeof window === 'undefined') return
  const w = window as WindowWithAnalytics
  const enriched = { ...payload, funnel: 'franquias' }

  try {
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: eventName, ...enriched })
    }
    if (typeof w.gtag === 'function') {
      w.gtag('event', eventName, enriched)
    }
  } catch {
    /* silent */
  }
}
