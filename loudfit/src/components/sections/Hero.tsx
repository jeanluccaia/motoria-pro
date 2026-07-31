import Link from 'next/link'

const HERO_DESKTOP = '/media/hero/hero-power-plus.png'
const HERO_MOBILE = '/media/hero/hero-power-plus-mobile.png'

export function Hero() {
  return (
    <section
      aria-label="Oferta promocional Power Plus — 1º mês por R$ 9,90"
      className="relative isolate overflow-hidden bg-lf-black pt-16 min-h-[600px] md:min-h-[75vh] lg:min-h-[86vh]"
    >
      {/* Hero image: `<picture>` swaps a portrait mobile composition (atleta
          pré-posicionada à direita + área escura à esquerda) por breakpoint,
          para o desktop 2400×1000 aprovado. object-position 72%_28% preservado
          no desktop; mobile já vem enquadrado pela imagem, então cover center. */}
      {/* Mobile: imagem como bloco superior em aspect natural (sem crop), texto
          escorre no fundo preto abaixo. Desktop: imagem full-cover como antes. */}
      <img
        src={HERO_MOBILE}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-x-0 top-16 -z-10 w-full h-auto object-cover md:hidden"
      />
      <img
        src={HERO_DESKTOP}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-10 hidden h-full w-full object-cover object-[72%_28%] md:block"
      />

      {/* Overlay mobile — fade suave na base da imagem para transição limpa
          para o fundo preto onde vive o texto. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-16 -z-10 h-[36vw] max-h-[220px] md:hidden bg-[linear-gradient(180deg,rgba(0,0,0,0)_60%,rgba(0,0,0,0.95)_100%)]"
      />

      {/* Overlay desktop — inalterado (aprovado) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden md:block bg-[linear-gradient(90deg,rgba(8,8,8,0.94)_0%,rgba(8,8,8,0.75)_38%,rgba(8,8,8,0.15)_78%,rgba(8,8,8,0)_100%),linear-gradient(180deg,rgba(8,8,8,0.35)_0%,rgba(8,8,8,0.10)_50%,rgba(8,8,8,0.55)_100%)]"
      />

      {/* Traço amarelo — identidade Loud Fit */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-[3px] w-56 -skew-x-12 origin-left bg-lf-volt" />

      {/* Conteúdo — mobile: alinhado ao topo, compacto, começa logo abaixo do header.
          Desktop (md+): mantém centralização vertical aprovada. */}
      <div className="relative z-10 mx-auto flex min-h-[600px] w-full max-w-[1360px] items-start px-5 pt-[40vw] pb-10 sm:px-8 md:min-h-[75vh] md:items-center md:pt-14 md:py-20 lg:min-h-[86vh] lg:px-12">
        <div className="w-full max-w-[560px]">
          <p className="text-[13px] font-bold uppercase tracking-[0.22em] text-lf-text/85 md:text-[14px]">
            1º mês por
          </p>

          <p
            className="mt-2 whitespace-nowrap font-black leading-[0.9] tracking-[-0.02em] text-lf-text"
            style={{ fontSize: 'clamp(4.25rem, 15vw, 8.75rem)' }}
          >
            R$ <span className="text-lf-volt">9,90</span>
          </p>

          <p className="mt-3 max-w-[36ch] text-[15px] leading-[1.5] text-lf-text/90 md:mt-4 md:text-[17px]">
            Musculação + aulas coletivas
          </p>

          <div className="mt-6 md:mt-10">
            <Link
              href="/unidades"
              className="lf-cta-volt inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-8 py-4 text-[13px] font-black tracking-[0.14em] uppercase sm:w-auto sm:min-h-[56px] sm:px-10 sm:text-[14px]"
            >
              Começar matrícula
            </Link>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-lf-volt/60 bg-lf-volt/15 px-3.5 py-1.5 backdrop-blur-sm md:mt-5">
            <span className="relative flex h-2 w-2">
              <span
                aria-hidden="true"
                className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lf-volt opacity-70 motion-reduce:hidden"
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lf-volt" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-lf-volt">
              Oferta termina em 09/08/2026
            </span>
          </div>
          <p className="mt-2 text-[11.5px] leading-snug text-lf-text/55 md:mt-3">
            Plano Power Plus · Consulte condições
          </p>
        </div>
      </div>
    </section>
  )
}
