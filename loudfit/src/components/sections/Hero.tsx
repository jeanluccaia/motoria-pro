import Link from 'next/link'

const HERO_DESKTOP = '/media/hero/hero-setembro.webp'
const HERO_MOBILE = '/media/hero/hero-setembro-mobile.webp'

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

      {/* Overlay mobile — reforço sutil de legibilidade: escurece topo (texto)
          e base (transição para a próxima seção). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 md:hidden bg-[linear-gradient(180deg,rgba(8,8,8,0.72)_0%,rgba(8,8,8,0.35)_38%,rgba(8,8,8,0.18)_62%,rgba(8,8,8,0.65)_100%)]"
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

      {/* Conteúdo — mobile: alinhado ao topo, sobre a área escura da imagem.
          Desktop (md+): centralizado verticalmente na coluna escura à esquerda. */}
      <div className="relative z-10 mx-auto flex min-h-[calc(92svh-4rem)] w-full max-w-[1360px] items-start px-5 pt-8 pb-10 sm:px-8 md:min-h-[75vh] md:items-center md:pt-14 md:py-20 lg:min-h-[86vh] lg:px-12">
        <div className="w-full max-w-[560px] translate-y-14 md:translate-y-0">
          <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-lf-volt md:text-[13px]">
            Liberdade para treinar alto
          </p>

          <h1
            className="mt-5 font-black uppercase leading-[0.94] tracking-[-0.015em] text-lf-text md:mt-6"
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
        </div>
      </div>
    </section>
  )
}
