'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  subscribeConsent,
  writeStoredConsent,
  DEFAULT_CONSENT,
  type ConsentState,
} from '@/lib/consent'

type Mode = 'hidden' | 'summary' | 'details'

/**
 * Banner LGPD com 3 categorias.
 * Fica escondido enquanto `decidedAt` for `null` no localStorage.
 * Botões: Aceitar tudo · Rejeitar · Configurar (abre detalhes com toggles).
 * Preferência pode ser reabertada a qualquer momento via evento
 * `lf:open-consent` disparado externamente (link do rodapé, política, etc.).
 */
export function ConsentBanner() {
  const stored = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  )
  // Toggle de "modo detalhado" — só true quando o usuário clicou em
  // "Configurar" (no summary) ou disparou o evento lf:open-consent.
  const [detailsOpen, setDetailsOpen] = useState(false)
  // Buffer local dos toggles no modo detalhado — confirmado só no "Salvar".
  const [draft, setDraft] = useState<ConsentState>(DEFAULT_CONSENT)

  // Modo derivado de stored + detailsOpen (nada de setState em effect).
  const mode: Mode = detailsOpen
    ? 'details'
    : stored.decidedAt
      ? 'hidden'
      : 'summary'

  useEffect(() => {
    function openHandler() {
      setDraft(getConsentSnapshot())
      setDetailsOpen(true)
    }
    window.addEventListener('lf:open-consent', openHandler)
    return () => window.removeEventListener('lf:open-consent', openHandler)
  }, [])

  function openDetails() {
    setDraft(stored)
    setDetailsOpen(true)
  }

  function persist(next: ConsentState) {
    const withDecision: ConsentState = { ...next, decidedAt: new Date().toISOString() }
    writeStoredConsent(withDecision)
    setDetailsOpen(false)
  }

  function acceptAll() {
    persist({ essential: true, analytics: true, marketing: true, decidedAt: null })
  }
  function rejectAll() {
    persist({ essential: true, analytics: false, marketing: false, decidedAt: null })
  }
  function saveCustom() {
    persist(draft)
  }

  if (mode === 'hidden') return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-lf-line bg-lf-black/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-5 sm:px-8 md:flex-row md:items-start md:gap-8 md:py-6">
        <div className="flex-1 text-sm leading-relaxed text-lf-muted">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-lf-volt">
            Cookies e privacidade
          </p>
          <p>
            Usamos cookies essenciais para o site funcionar e, com sua autorização, cookies de
            análise e marketing para entender a navegação e mostrar campanhas relevantes. Você pode
            aceitar, rejeitar ou personalizar. Detalhes na{' '}
            <Link
              href="/politica-de-privacidade"
              className="text-lf-volt underline underline-offset-4 hover:text-lf-text"
            >
              política de privacidade
            </Link>
            .
          </p>

          {mode === 'details' && (
            <div className="mt-5 grid gap-3">
              <label className="flex cursor-not-allowed items-start gap-3 opacity-70">
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label="Cookies essenciais (sempre ativos)"
                  className="mt-1 h-4 w-4 accent-lf-volt"
                />
                <span>
                  <span className="block text-sm font-bold text-lf-text">Essenciais</span>
                  <span className="block text-xs text-lf-muted">
                    Necessários para o site funcionar (sempre ativos)
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(e) =>
                    setDraft((s) => ({ ...s, analytics: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 accent-lf-volt"
                />
                <span>
                  <span className="block text-sm font-bold text-lf-text">Análise</span>
                  <span className="block text-xs text-lf-muted">
                    Google Analytics — nos ajuda a entender como o site é usado
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={draft.marketing}
                  onChange={(e) =>
                    setDraft((s) => ({ ...s, marketing: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 accent-lf-volt"
                />
                <span>
                  <span className="block text-sm font-bold text-lf-text">Marketing</span>
                  <span className="block text-xs text-lf-muted">
                    Meta Pixel e Google Ads — mostram anúncios da Loud Fit em outros sites
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 md:min-w-[220px]">
          <button
            type="button"
            onClick={acceptAll}
            className="inline-flex min-h-[44px] items-center justify-center bg-lf-volt px-5 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-lf-black transition-transform hover:-translate-y-0.5"
          >
            Aceitar tudo
          </button>
          {mode === 'summary' ? (
            <>
              <button
                type="button"
                onClick={rejectAll}
                className="inline-flex min-h-[44px] items-center justify-center border border-lf-line px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-lf-text transition-colors hover:border-lf-text/40"
              >
                Rejeitar
              </button>
              <button
                type="button"
                onClick={openDetails}
                className="text-xs font-bold uppercase tracking-[0.1em] text-lf-muted underline underline-offset-4 hover:text-lf-text"
              >
                Configurar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={saveCustom}
                className="inline-flex min-h-[44px] items-center justify-center border border-lf-volt px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-lf-volt transition-colors hover:bg-lf-volt/10"
              >
                Salvar escolha
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="text-xs font-bold uppercase tracking-[0.1em] text-lf-muted underline underline-offset-4 hover:text-lf-text"
              >
                Rejeitar tudo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
