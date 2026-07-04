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
      {/* Mobile image — focal point raised so atleta não fica atrás do badge */}
      <Image
        src="/assets/images/hero-gym-mobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover object-[center_30%] opacity-55 md:hidden"
        aria-hidden="true"
      />

      {/* Gradient desktop — fundo suave, texto ancora na base */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(180deg,rgba(9,9,9,0.08)_0%,rgba(9,9,9,0.42)_42%,rgba(9,9,9,0.94)_100%)] md:block" />
      {/* Gradient mobile — cobre bem a zona de conteúdo no topo */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.18)_0%,rgba(9,9,9,0.68)_55%,rgba(9,9,9,0.92)_100%)] md:hidden" />

      {/* Linha técnica diagonal — identidade LoudFit */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
      <div className="absolute bottom-0 left-0 h-[3px] w-48 -skew-x-12 origin-left bg-lf-volt" />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-12">

        {/* Eyebrow */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Rede de academias
          </p>
        </div>

        {/* H1 — fluido, sem <br> hardcoded, max-w controla a quebra */}
        <h1
          className="max-w-4xl font-black uppercase leading-[0.94] text-lf-text"
          style={{ fontSize: 'clamp(2.8rem, 6vw, 7rem)' }}
        >
          O melhor ainda está por{' '}
          <span className="text-lf-volt">vir.</span>
        </h1>

        {/* Subtexto — 2 linhas controladas, &nbsp; em nomes compostos */}
        <p className="mt-4 max-w-[44ch] text-base leading-[1.4] text-white/70 md:text-lg">
          Musculação + aulas coletivas no mesmo plano.<br />
          {`Do Muay Thai ao Pilates, já está incluso.`}
        </p>

        {/* Tags de modalidades */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Muay Thai', 'Pilates', 'Spinning', 'Jump', 'FitDance', 'GAP'].map((c) => (
            <span
              key={c}
              className="border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-lf-muted/70"
            >
              {c}
            </span>
          ))}
        </div>

        {/* Badge da oferta — pill compacto, sem traço amarelo */}
        <div className="mt-5 inline-flex flex-col gap-0.5 border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
          <span className="text-sm font-bold leading-tight text-lf-text">
            R$9,90 na 1ª mensalidade
          </span>
          <span className="text-[11px] leading-tight text-lf-muted">
            Power Anual Recorrente
          </span>
        </div>

        {/* CTAs — tracking reduzido para leitura mais limpa */}
        <div className="mt-10 flex flex-col gap-3 sm:mt-8 sm:flex-row">
          <Button href="#planos" variant="volt" size="lg" className="tracking-[0.02em]">
            Começar matrícula
          </Button>
          <Button href="/unidades" variant="ghost" size="lg" className="tracking-[0.02em]">
            Ver unidades
          </Button>
        </div>
      </div>
    </section>
  )
}
