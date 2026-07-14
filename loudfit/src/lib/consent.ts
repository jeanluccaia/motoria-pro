/**
 * Consentimento LGPD por categorias. Persistido em localStorage.
 * Essenciais são sempre concedidos; analytics e marketing dependem do usuário.
 */

export type ConsentCategory = 'essential' | 'analytics' | 'marketing'

export interface ConsentState {
  essential: true
  analytics: boolean
  marketing: boolean
  /** ISO date da última decisão do usuário. Ausência = usuário nunca escolheu. */
  decidedAt: string | null
}

export const CONSENT_STORAGE_KEY = 'lf_consent_v1'

export const DEFAULT_CONSENT: ConsentState = {
  essential: true,
  analytics: false,
  marketing: false,
  decidedAt: null,
}

export function readStoredConsent(): ConsentState {
  if (typeof window === 'undefined') return DEFAULT_CONSENT
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return DEFAULT_CONSENT
    const parsed = JSON.parse(raw) as Partial<ConsentState>
    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : null,
    }
  } catch {
    return DEFAULT_CONSENT
  }
}

export function writeStoredConsent(state: ConsentState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state))
    // Invalida o cache do snapshot antes de notificar os subscribers.
    cachedSnapshot = null
    window.dispatchEvent(new CustomEvent('lf:consent-change', { detail: state }))
  } catch {
    /* storage indisponível — degradar silenciosamente */
  }
}

// -- useSyncExternalStore glue -----------------------------------------------
// useSyncExternalStore exige que getSnapshot devolva a MESMA referência
// enquanto os dados não mudarem. readStoredConsent cria um objeto novo a
// cada chamada, então memorizamos localmente e invalidamos no write ou no
// evento external `lf:consent-change`.

let cachedSnapshot: ConsentState | null = null

export function subscribeConsent(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  function listener() {
    cachedSnapshot = null
    callback()
  }
  window.addEventListener('lf:consent-change', listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener('lf:consent-change', listener)
    window.removeEventListener('storage', listener)
  }
}

export function getConsentSnapshot(): ConsentState {
  if (typeof window === 'undefined') return DEFAULT_CONSENT
  if (!cachedSnapshot) cachedSnapshot = readStoredConsent()
  return cachedSnapshot
}

export function getConsentServerSnapshot(): ConsentState {
  return DEFAULT_CONSENT
}
