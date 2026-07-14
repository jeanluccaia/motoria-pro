'use client'

/**
 * Dispara o evento que o ConsentBanner escuta pra reabrir com o modo detalhado.
 * Usado na página de política de privacidade para permitir que o usuário
 * mude sua preferência a qualquer momento.
 */
export function PrivacyReopenButton() {
  function reopen() {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('lf:open-consent'))
  }
  return (
    <button
      type="button"
      onClick={reopen}
      className="mt-2 inline-flex min-h-[44px] items-center justify-center border border-lf-volt bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-lf-volt transition-colors hover:bg-lf-volt/10"
    >
      Alterar preferências de cookies
    </button>
  )
}
