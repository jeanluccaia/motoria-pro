import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative flex min-h-[94svh] lg:min-h-[90vh] items-end overflow-hidden bg-lf-black pb-16 md:pb-24 lg:pb-28">
      <Image
        src="/assets/images/hero-gym-desktop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 hidden h-full w-full object-cover object-center opacity-60 md:block"
        aria-hidden="true"
      />
      <Image
        src="/assets/images/hero-gym-mobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-55 md:hidden"
        aria-hidden="true"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.08)_0%,rgba(9,9,9,0.42)_42%,rgba(9,9,9,0.94)_100%)]" />

      {/* Linha técnica diagonal — identidade LoudFit */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
      <div className="absolute bottom-0 left-0 h-[3px] w-48 -skew-x-12 origin-left bg-lf-volt" />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-12">

        {/* Eyebrow */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Rede de academias
          </p>
        </div>

        {/* H1 — fluido, sem <br> hardcoded */}
        <h1
          className="font-black uppercase leading-[0.92] text-lf-text text-balance"
          style={{ fontSize: 'clamp(2.8rem, 7.5vw, 8.5rem)' }}
        >
          O melhor ainda está por{' '}
          <span className="text-lf-volt">vir.</span>
        </h1>

        {/* Subtexto — oferta principal */}
        <p className="mt-6 max-w-[55ch] text-base leading-[1.6] text-lf-muted text-balance md:text-lg">
          Musculação + aulas coletivas no mesmo plano. Do Muay Thai ao Pilates, já está incluso.
        </p>

        {/* Bloco de oferta compacto */}
        <div className="mt-5 flex items-center gap-2.5">
          <div className="h-[2px] w-5 shrink-0 bg-lf-volt/50" />
          <p className="text-sm text-lf-muted">
            <span className="font-bold text-lf-text">Primeira mensalidade R$9,90</span>
            {' '}· Power Anual Recorrente
          </p>
        </div>

        {/* CTAs — 1 amarelo cheio, 1 fantasma */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="#planos" variant="volt" size="lg">
            Começar matrícula
          </Button>
          <Button href="/unidades" variant="ghost" size="lg">
            Ver unidades
          </Button>
        </div>
      </div>
    </section>
  )
}
