type EventPayload = Record<string, string | number | boolean | undefined>

type WindowWithAnalytics = Window & {
  dataLayer?: unknown[]
  gtag?: (command: 'event', eventName: string, params?: EventPayload) => void
}

export function trackCampaignEvent(
  eventName: string,
  audience: string,
  payload: EventPayload = {},
) {
  if (typeof window === 'undefined') return
  const w = window as WindowWithAnalytics
  const enriched = { ...payload, campaign_audience: audience }

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
