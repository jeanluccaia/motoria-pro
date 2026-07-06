import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative flex min-h-[92svh] items-start overflow-hidden bg-lf-black pb-16 pt-[12svh] md:items-end md:pb-24 lg:min-h-[90vh] lg:pt-0 lg:pb-28">
      {/* Desktop image */}
      <Image
        src="/assets/images/hero-gym-desktop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 hidden h-full w-full object-cover object-[65%_center] opacity-68 md:block"
        aria-hidden="true"
      />
      {/* Mobile image — focal point on athlete */}
      <Image
        src="/assets/images/hero-gym-mobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-95 brightness-[0.9] contrast-[1.08] md:hidden"
        aria-hidden="true"
      />

      {/* Gradient desktop — esquerda escura para texto, direita revela foto */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(9,9,9,0.96)_0%,rgba(9,9,9,0.68)_44%,rgba(9,9,9,0.16)_100%),linear-gradient(180deg,rgba(9,9,9,0.08)_0%,rgba(9,9,9,0.34)_46%,rgba(9,9,9,0.92)_100%)] md:block" />
      {/* Gradient mobile — lighter wash, image stays visible; darkens only enough for text */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.62)_0%,rgba(9,9,9,0.22)_34%,rgba(9,9,9,0.72)_100%),linear-gradient(90deg,rgba(9,9,9,0.72)_0%,rgba(9,9,9,0.12)_100%)] md:hidden" />

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
          <span className="text-lf-volt">vir</span>
        </h1>

        {/* Subtexto — curto para manter a hero direta */}
        <p className="mt-5 max-w-[36ch] text-base leading-[1.45] text-white/76 md:mt-6 md:text-lg">
          <span className="block">Musculação + aulas coletivas inclusas no plano.</span>
        </p>

        {/* Faixa da oferta — pill contido, sem traço amarelo solto */}
        <div className="mt-6 inline-flex items-center gap-2.5 border border-white/[0.12] bg-white/[0.07] px-4 py-2.5 backdrop-blur-[2px] md:mt-7">
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
        <div className="mt-7 flex flex-col items-start gap-3 sm:mt-9 sm:flex-row sm:items-center">
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
