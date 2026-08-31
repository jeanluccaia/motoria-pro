import Link from 'next/link'

const HERO_DESKTOP = '/media/hero/hero-setembro.webp'
// -v2 força CDN/browsers a puxarem a versão nova (crop 9x16 clean).
const HERO_MOBILE = '/media/hero/hero-setembro-mobile-v2.webp'

export function Hero() {
  return (
    <section
      aria-label="Oferta de setembro — Mensal Recorrente, 1º mês por R$ 69"
      className="relative isolate overflow-hidden bg-lf-black pt-16 min-h-[92svh] md:min-h-[75vh] lg:min-h-[86vh]"
    >
      {/* Hero image: `<picture>`-style swap por breakpoint.
          Mobile: recorte vertical 900x1200 centrado nas atletas.
          Desktop: 2000x833 aprovado, mantém a área escura à esquerda para o
          texto (posição natural do frame, sem object-position agressivo). */}
      <img
        src={HERO_MOBILE}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-center md:hidden"
      />
      <img
        src={HERO_DESKTOP}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-10 hidden h-full w-full object-cover object-center md:block"
      />

      {/* Overlay mobile — a imagem `banner-mobile-9x16-clean` já vem com uma
          área naturalmente escura no rodapé desenhada pra receber o texto.
          O gradiente só reforça essa base (sem cobrir a atleta no topo). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 md:hidden bg-[linear-gradient(180deg,rgba(8,8,8,0.30)_0%,rgba(8,8,8,0.08)_32%,rgba(8,8,8,0.25)_58%,rgba(8,8,8,0.88)_100%)]"
      />

      {/* Overlay desktop — reforça a coluna esquerda (onde vive o copy). A
          imagem já entrega ~35% de área escura à esquerda; o gradiente
          garante contraste independente do zoom do usuário. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden md:block bg-[linear-gradient(90deg,rgba(8,8,8,0.96)_0%,rgba(8,8,8,0.82)_28%,rgba(8,8,8,0.28)_62%,rgba(8,8,8,0)_86%),linear-gradient(180deg,rgba(8,8,8,0.32)_0%,rgba(8,8,8,0.10)_50%,rgba(8,8,8,0.5)_100%)]"
      />

      {/* Traço amarelo — identidade Loud Fit */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-[3px] w-56 -skew-x-12 origin-left bg-lf-volt" />

      {/* Conteúdo — mobile: ancorado no rodapé, sobre a área escura naturalmente
          reservada na imagem `banner-mobile-9x16-clean`.
          Desktop (md+): centralizado verticalmente na coluna escura à esquerda. */}
      <div className="relative z-10 mx-auto flex min-h-[calc(92svh-4rem)] w-full max-w-[1360px] items-end px-5 pb-12 pt-8 sm:px-8 md:min-h-[75vh] md:items-center md:pt-14 md:py-20 lg:min-h-[86vh] lg:px-12">
        <div className="w-full max-w-[560px]">
          <h1
            className="font-black uppercase leading-[0.94] tracking-[-0.015em] text-lf-text"
            style={{ fontSize: 'clamp(2.75rem, 6.4vw, 5.75rem)' }}
          >
            <span className="block">1º mês por</span>
            <span className="mt-1 block whitespace-nowrap text-lf-volt" style={{ fontSize: 'clamp(4.25rem, 12vw, 8.5rem)' }}>
              R$ 69
            </span>
          </h1>

          <p className="mt-5 max-w-[38ch] text-[15px] leading-[1.55] text-lf-text/90 md:mt-6 md:text-[17px]">
            Mensal recorrente <span aria-hidden="true">•</span> sem fidelidade de 12 meses
          </p>

          <div className="mt-7 md:mt-9">
            <Link
              href="/unidades"
              className="lf-cta-volt inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-8 py-4 text-[13px] font-black tracking-[0.14em] uppercase sm:w-auto sm:min-h-[56px] sm:px-10 sm:text-[14px]"
            >
              Comece agora
            </Link>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-lf-volt/60 bg-lf-volt/15 px-3.5 py-1.5 backdrop-blur-sm md:mt-6">
            <span className="relative flex h-2 w-2">
              <span
                aria-hidden="true"
                className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lf-volt opacity-70 motion-reduce:hidden"
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lf-volt" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-lf-volt">
              Oferta válida até 14/09
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
