import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative flex min-h-[94svh] lg:min-h-[90vh] items-start lg:items-end overflow-hidden bg-lf-black pt-[14svh] pb-16 lg:pt-0 md:pb-24 lg:pb-28">
      {/* Desktop image */}
      <Image
        src="/assets/images/hero-gym-desktop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 hidden h-full w-full object-cover object-center opacity-60 md:block"
        aria-hidden="true"
      />
      {/* Mobile image — focal point raised */}
      <Image
        src="/assets/images/hero-gym-mobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover object-[center_30%] opacity-55 md:hidden"
        aria-hidden="true"
      />

      {/* Gradient desktop */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(180deg,rgba(9,9,9,0.08)_0%,rgba(9,9,9,0.42)_42%,rgba(9,9,9,0.94)_100%)] md:block" />
      {/* Gradient mobile — cobre zona de texto no topo */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.18)_0%,rgba(9,9,9,0.68)_55%,rgba(9,9,9,0.92)_100%)] md:hidden" />

      {/* Linha técnica diagonal — identidade LoudFit */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
      <div className="absolute bottom-0 left-0 h-[3px] w-48 -skew-x-12 origin-left bg-lf-volt" />

      <div className="relative z-10 mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        {/* Eyebrow */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Rede de academias
          </p>
        </div>

        {/* H1 */}
        <h1
          className="max-w-5xl text-balance font-black uppercase leading-[1.02] text-lf-text"
          style={{ fontSize: 'clamp(2.75rem, 5.4vw, 6.5rem)' }}
        >
          O melhor ainda está por{' '}
          <span className="text-lf-volt">vir.</span>
        </h1>

        {/* Subtexto — curto no mobile, completo no desktop */}
        <p className="mt-3 text-base leading-[1.4] text-white/70 md:mt-4 md:max-w-[44ch] md:text-lg">
          <span className="md:hidden">Musculação + aulas coletivas inclusas no plano.</span>
          <span className="hidden md:inline">
            Musculação + aulas coletivas no mesmo plano.<br />
            {`Do Muay Thai ao Pilates, já está incluso.`}
          </span>
        </p>

        {/* Tags de modalidades — somente desktop */}
        <div className="mt-3 hidden flex-wrap gap-1.5 md:flex">
          {['Muay Thai', 'Pilates', 'Spinning', 'Jump', 'FitDance', 'GAP'].map((c) => (
            <span
              key={c}
              className="border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-lf-muted/70"
            >
              {c}
            </span>
          ))}
        </div>

        {/* Badge da oferta — compacto no mobile, mais espaçado no desktop */}
        <div className="mt-4 inline-flex flex-col gap-0.5 border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-sm md:mt-5 md:px-4 md:py-3">
          <span className="text-sm font-bold leading-tight text-lf-text">
            R$9,90 na 1ª mensalidade
          </span>
          <span className="text-[11px] leading-tight text-lf-muted">
            Power Anual Recorrente
          </span>
        </div>

        {/* CTAs — hierarquia clara, touch-target mantido */}
        <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row">
          <Button href="#planos" variant="volt" size="lg" className="tracking-[0.02em] py-3 md:py-4">
            Começar matrícula
          </Button>
          <Button href="/unidades" variant="ghost" size="lg" className="tracking-[0.02em] py-3 md:py-4">
            Ver unidades
          </Button>
        </div>
      </div>
    </section>
  )
}
