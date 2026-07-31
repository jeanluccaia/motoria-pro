import Image from 'next/image'
import Link from 'next/link'

const HERO_IMAGE = '/media/hero/hero-power-plus.png'

export function Hero() {
  return (
    <section
      aria-label="Oferta promocional Power Plus — 1º mês por R$ 9,90"
      className="relative isolate overflow-hidden bg-lf-black pt-16 min-h-[620px] md:min-h-[75vh] lg:min-h-[86vh]"
    >
      {/* Imagem de campanha — atleta à direita, área escura à esquerda */}
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        quality={85}
        aria-hidden="true"
        // Desktop: foco em ~72% x (atleta à direita).
        // Mobile: recentraliza para preservar o rosto sem cortar.
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[62%_28%] md:object-[72%_28%]"
      />

      {/* Overlays: mais forte no mobile e no lado esquerdo do desktop para contraste do texto */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,8,8,0.72)_0%,rgba(8,8,8,0.55)_45%,rgba(8,8,8,0.92)_100%)] md:bg-[linear-gradient(90deg,rgba(8,8,8,0.94)_0%,rgba(8,8,8,0.75)_38%,rgba(8,8,8,0.15)_78%,rgba(8,8,8,0)_100%),linear-gradient(180deg,rgba(8,8,8,0.35)_0%,rgba(8,8,8,0.10)_50%,rgba(8,8,8,0.55)_100%)]"
      />

      {/* Traço amarelo — identidade Loud Fit */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-[3px] w-56 -skew-x-12 origin-left bg-lf-volt" />

      {/* Conteúdo — alinhado à esquerda, dentro da área escura da imagem */}
      <div className="relative z-10 mx-auto flex min-h-[620px] w-full max-w-[1360px] items-center px-5 py-16 sm:px-8 md:min-h-[75vh] md:py-20 lg:min-h-[86vh] lg:px-12">
        <div className="w-full max-w-[560px]">
          <p className="text-[13px] font-bold uppercase tracking-[0.22em] text-lf-text/85 md:text-[14px]">
            1º mês por
          </p>

          <p
            className="mt-2 font-black leading-[0.92] tracking-[-0.02em] text-lf-text"
            style={{ fontSize: 'clamp(4.75rem, 12vw, 8.75rem)' }}
          >
            R$ <span className="text-lf-volt">9,90</span>
          </p>

          <p className="mt-4 max-w-[36ch] text-[15px] leading-[1.55] text-lf-text/90 md:text-[17px]">
            Musculação + aulas coletivas
          </p>

          <div className="mt-8 md:mt-10">
            <Link
              href="/unidades"
              className="lf-cta-volt inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-8 py-4 text-[13px] font-black tracking-[0.14em] uppercase sm:w-auto sm:min-h-[56px] sm:px-10 sm:text-[14px]"
            >
              Começar matrícula
            </Link>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-lf-volt/60 bg-lf-volt/15 px-3.5 py-1.5 backdrop-blur-sm">
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
          <p className="mt-3 text-[11.5px] leading-snug text-lf-text/55">
            Plano Power Plus · Consulte condições
          </p>
        </div>
      </div>
    </section>
  )
}
