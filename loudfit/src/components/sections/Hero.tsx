import Link from 'next/link'

const HERO_DESKTOP = '/media/hero/hero-outubro.webp'
const HERO_MOBILE = '/media/hero/hero-outubro-mobile.webp'

const OFFER_HREF = '/unidades?plano=power-trimestral'
const OFFER_ALT =
  'Loud Fit Black Friday: treine 3 meses e pague apenas 2. Plano Trimestral com 2 pagamentos de R$ 119,90.'

export function Hero() {
  return (
    <section
      aria-label={OFFER_ALT}
      className="relative isolate overflow-hidden bg-white pt-16"
    >
      {/* A capa INTEIRA é um único link para a página de unidades. Clicar
          em qualquer parte da arte — inclusive na faixa Black Friday —
          leva a /unidades?plano=power-trimestral. */}
      <Link
        href={OFFER_HREF}
        aria-label="Black Friday Loud Fit — treine 3 meses, pague apenas 2"
        className="relative mx-auto block w-full cursor-pointer aspect-[1086/1448] md:aspect-[1942/809] md:max-w-[2000px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-lf-volt"
      >
        <img
          src={HERO_MOBILE}
          alt={OFFER_ALT}
          fetchPriority="high"
          decoding="async"
          width={1080}
          height={1440}
          className="absolute inset-0 h-full w-full object-cover md:hidden"
        />
        <img
          src={HERO_DESKTOP}
          alt={OFFER_ALT}
          fetchPriority="high"
          decoding="async"
          width={2000}
          height={833}
          className="absolute inset-0 hidden h-full w-full object-cover md:block"
        />

        {/* Faixa transversal Black Friday — atravessa o hero na diagonal,
            do canto superior-esquerdo ao inferior-direito, cobrindo toda a
            largura. Mantém a imagem visível acima e abaixo da faixa. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-1/2 w-[160%] -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] md:-rotate-[8deg]">
            <div className="relative bg-black py-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] md:py-8">
              {/* Borda superior/inferior em amarelo volt para impacto */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-lf-volt" />
              <div className="absolute inset-x-0 bottom-0 h-[3px] bg-lf-volt" />
              <div className="flex items-center justify-center gap-5 px-6 text-center md:gap-10">
                <span className="hidden h-10 w-[2px] bg-lf-volt md:block" />
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-lf-volt md:text-xs">
                    OFERTA
                  </span>
                  <span className="mt-1 text-[28px] font-black uppercase tracking-[0.08em] text-white md:text-[64px] lg:text-[80px]">
                    BLACK&nbsp;FRIDAY
                  </span>
                  <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt md:text-base lg:text-lg">
                    Treine 3 meses · pague apenas 2
                  </span>
                </div>
                <span className="hidden h-10 w-[2px] bg-lf-volt md:block" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}
