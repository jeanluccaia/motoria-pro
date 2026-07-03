import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative flex min-h-[94svh] items-end overflow-hidden bg-lf-black pb-16 md:pb-24">
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

      {/* Gradient: escuro embaixo onde fica o conteúdo, deixa imagem respirar no topo */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.2)_0%,rgba(9,9,9,0.55)_50%,rgba(9,9,9,0.95)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,9,0.88)_0%,rgba(9,9,9,0.4)_55%,rgba(9,9,9,0.0)_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
        <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
          Rede de academias
        </p>

        <h1 className="max-w-4xl text-[3.2rem] font-black leading-[0.94] text-lf-text sm:text-[4.5rem] md:text-[5.5rem] lg:text-[7rem]">
          O melhor<br />
          ainda está<br />
          <span className="text-lf-volt">por vir.</span>
        </h1>

        <p className="mt-6 max-w-md text-base leading-relaxed text-lf-muted md:text-lg">
          Energia, estrutura e uma experiência feita para quem leva o treino a sério.
        </p>

        {/* Oferta R$9,90 */}
        <div className="mt-8 inline-block border-l-2 border-lf-volt py-2.5 pl-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-muted">
            Primeira mensalidade por
          </p>
          <p className="text-[2.8rem] font-black leading-none text-lf-volt sm:text-[3.2rem]">
            R$9,90
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-lf-muted">
            no Power Anual Recorrente
          </p>
        </div>

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
