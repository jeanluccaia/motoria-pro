import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative flex min-h-[94svh] lg:min-h-[90vh] items-start lg:items-end overflow-hidden bg-lf-black pt-[12svh] pb-16 lg:pt-0 md:pb-24 lg:pb-28">
      {/* Desktop image */}
      <Image
        src="/assets/images/hero-gym-desktop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 hidden h-full w-full object-cover object-[65%_center] opacity-60 md:block"
        aria-hidden="true"
      />
      {/* Mobile image — focal point on athlete */}
      <Image
        src="/assets/images/hero-gym-mobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-90 brightness-[0.92] contrast-[1.05] md:hidden"
        aria-hidden="true"
      />

      {/* Gradient desktop — esquerda escura para texto, direita revela foto */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(9,9,9,0.88)_0%,rgba(9,9,9,0.62)_45%,rgba(9,9,9,0.18)_100%),linear-gradient(180deg,rgba(9,9,9,0.08)_0%,rgba(9,9,9,0.40)_42%,rgba(9,9,9,0.92)_100%)] md:block" />
      {/* Gradient mobile — lighter wash, image stays visible; darkens only enough for text */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.46)_0%,rgba(9,9,9,0.16)_36%,rgba(9,9,9,0.46)_100%),linear-gradient(90deg,rgba(9,9,9,0.46)_0%,rgba(9,9,9,0.08)_100%)] md:hidden" />

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

        {/* H1 — menor peso no mobile, mantém impacto no desktop */}
        <h1
          className="max-w-5xl text-balance font-black uppercase leading-[1.05] text-lf-text md:leading-[1.02]"
          style={{ fontSize: 'clamp(2.35rem, 5.4vw, 6.5rem)' }}
        >
          O melhor ainda está por{' '}
          <span className="text-lf-volt">vir.</span>
        </h1>

        {/* Subtexto — 2 linhas no mobile com quebra controlada */}
        <p className="mt-3 text-base leading-[1.4] text-white/70 md:mt-4 md:max-w-[44ch] md:text-lg">
          <span className="block">Musculação + aulas coletivas no mesmo plano.</span>
          <span className="block">Do Muay&nbsp;Thai ao Pilates, já está incluso.</span>
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

        {/* Faixa da oferta — pill contido, sem traço amarelo solto */}
        <div className="mt-4 inline-flex items-center gap-2.5 border border-white/[0.12] bg-white/[0.06] px-4 py-2.5 backdrop-blur-[2px] md:mt-5">
          <span className="flex flex-col gap-0.5 leading-tight">
            <span className="text-sm font-bold text-lf-text">
              R$9,90 na 1ª mensalidade
            </span>
            <span className="text-[11px] text-lf-muted">
              Power Anual Recorrente
            </span>
          </span>
        </div>

        {/* CTAs — hierarquia clara, alturas iguais 52-56px */}
        <div className="mt-6 flex flex-col items-start gap-3 sm:mt-8 sm:flex-row sm:items-center">
          <Button href="/unidades" variant="volt" size="lg" className="min-h-[52px] tracking-[0.02em] font-extrabold">
            Começar matrícula
          </Button>
          <Button
            href="/unidades"
            variant="outline"
            size="lg"
            className="min-h-[52px] tracking-[0.02em]"
          >
            Ver unidades
          </Button>
        </div>
      </div>
    </section>
  )
}
