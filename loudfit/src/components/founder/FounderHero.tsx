'use client'

import { trackFounderEvent } from '@/lib/founder-analytics'

interface FounderHeroProps {
  guestName?: string
}

export function FounderHero({ guestName }: FounderHeroProps) {
  function handleCtaClick() {
    trackFounderEvent('founder_cta_click', { source: 'hero' })
    if (typeof document === 'undefined') return
    const target = document.getElementById('condicao-fundador')
    if (!target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  const greetName = guestName?.trim().toUpperCase()

  return (
    <section
      className="relative isolate flex items-center justify-center overflow-hidden bg-[#0A0A0A]"
      style={{ minHeight: 'clamp(600px, 82vh, 780px)' }}
    >
      {/* Fine yellow rule — brand accent, minimal */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-px w-[64px] -translate-x-1/2 bg-[#FFE000]/70"
      />

      <div
        className="relative z-10 mx-auto flex w-full max-w-[720px] flex-col items-center px-6 py-20 text-center sm:px-8 sm:py-24 md:py-28"
        style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
      >
        <p
          className="text-[10.5px] font-bold uppercase tracking-[0.34em] text-[#FFE000] sm:text-[11px]"
          style={{ animation: 'lfFounderUp 0.55s cubic-bezier(0.2,0.7,0.2,1) both' }}
        >
          CONVITE EXCLUSIVO
        </p>

        <p
          className="mt-8 uppercase text-white/80 sm:mt-9"
          style={{
            fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
            fontSize: 'clamp(11px, 1.05vw, 13px)',
            letterSpacing: '0.28em',
            lineHeight: 1.4,
            animation: 'lfFounderUp 0.55s cubic-bezier(0.2,0.7,0.2,1) 0.08s both',
          }}
        >
          {greetName ? (
            <>
              <span style={{ color: '#FFE000' }}>{greetName}</span>, este convite é para você
            </>
          ) : (
            <>Este convite é para você</>
          )}
        </p>

        <h1
          className="mt-9 uppercase text-lf-text sm:mt-10"
          style={{
            fontFamily: 'var(--font-founder-display), Anton, sans-serif',
            fontSize: 'clamp(44px, 7.4vw, 100px)',
            letterSpacing: '-0.01em',
            lineHeight: 0.92,
            animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.16s both',
          }}
        >
          FAÇA PARTE DO
          <br />
          LOTE FUNDADOR
          <br />
          <span style={{ color: '#FFE000' }}>LOUD FIT</span>
        </h1>

        <p
          className="mx-auto mt-8 max-w-[440px] text-[15px] leading-[1.65] text-white/60 sm:mt-9 sm:text-[16px] md:text-[17px]"
          style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.24s both' }}
        >
          Uma condição fora da tabela pública — reservada para quem chegou aqui pelo convite
        </p>

        <div
          className="mt-11 md:mt-12"
          style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.32s both' }}
        >
          <button
            type="button"
            onClick={handleCtaClick}
            className="lf-cta-volt inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[10px] px-8 py-4 text-[13px] font-black uppercase tracking-[0.10em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(255,224,0,0.24)] active:translate-y-0 sm:text-[14px]"
          >
            VER MINHA CONDIÇÃO
          </button>
        </div>
      </div>
    </section>
  )
}
