import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative flex min-h-[60vh] items-start overflow-x-hidden bg-lf-black pb-12 pt-24 md:min-h-[68vh] md:items-end md:pb-20 md:pt-28 lg:min-h-[70vh] lg:pb-24 lg:pt-36">
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
      {/* Mobile image */}
      <Image
        src="/assets/images/hero-gym-mobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-95 brightness-[0.9] contrast-[1.08] md:hidden"
        aria-hidden="true"
      />

      {/* Gradientes */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(9,9,9,0.96)_0%,rgba(9,9,9,0.68)_44%,rgba(9,9,9,0.16)_100%),linear-gradient(180deg,rgba(9,9,9,0.08)_0%,rgba(9,9,9,0.34)_46%,rgba(9,9,9,0.92)_100%)] md:block" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.62)_0%,rgba(9,9,9,0.22)_34%,rgba(9,9,9,0.72)_100%),linear-gradient(90deg,rgba(9,9,9,0.72)_0%,rgba(9,9,9,0.12)_100%)] md:hidden" />

      {/* Linha diagonal — identidade LoudFit */}
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
          className="max-w-[12ch] font-black uppercase leading-[1.12] tracking-[0] text-lf-text md:max-w-[13ch] md:leading-[1.1]"
          style={{ fontSize: 'clamp(2.35rem, 4vw, 4.65rem)' }}
        >
          O melhor ainda está por{' '}
          <span className="text-lf-volt">vir</span>
        </h1>

        {/* Subtexto */}
        <p className="mt-5 max-w-[34ch] text-base leading-[1.45] text-white/76 md:mt-6 md:text-lg">
          Musculação + aulas coletivas no mesmo plano.
        </p>

        {/* Selo de oferta */}
        <div className="mt-6 inline-flex items-center gap-2.5 border border-white/[0.12] bg-white/[0.07] px-4 py-2.5 backdrop-blur-[2px] md:mt-7">
          <span className="flex flex-col gap-0.5 leading-tight">
            <span className="text-sm font-bold text-lf-text">
              1ª mensalidade R$9,90
            </span>
            <span className="text-[11px] text-lf-muted">
              Power Anual Recorrente*
            </span>
          </span>
        </div>

        {/* CTAs */}
        <div className="mt-7 flex flex-col items-start gap-3 sm:mt-9 sm:flex-row sm:items-center">
          <Button href="/unidades" variant="volt" size="lg" className="min-h-[52px] font-extrabold tracking-[0.02em]">
            Encontrar minha unidade
          </Button>
          <Button
            href="#planos"
            variant="outline"
            size="lg"
            className="min-h-[52px] tracking-[0.02em]"
          >
            Ver planos
          </Button>
        </div>
      </div>
    </section>
  )
}
