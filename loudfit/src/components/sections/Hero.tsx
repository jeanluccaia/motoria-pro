import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative flex min-h-[94svh] items-center justify-center overflow-hidden bg-lf-black">
      <Image
        src="/assets/images/hero-gym-desktop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 hidden h-full w-full object-cover opacity-70 md:block"
        aria-hidden="true"
      />
      <Image
        src="/assets/images/hero-gym-mobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover opacity-70 md:hidden"
        aria-hidden="true"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_46%,rgba(242,226,5,0.13),transparent_22%),linear-gradient(102deg,rgba(10,10,10,0.98),rgba(10,10,10,0.78)_42%,rgba(10,10,10,0.28)),linear-gradient(180deg,rgba(10,10,10,0.36),rgba(10,10,10,0.98))]" />
      <div className="absolute right-[-12vw] top-0 hidden h-full w-[46vw] -skew-x-12 border-l border-lf-volt/20 bg-lf-volt/[0.035] shadow-[0_0_90px_rgba(242,226,5,0.12)] lg:block" />
      <div className="absolute bottom-24 right-8 hidden w-72 border border-lf-line bg-lf-black/55 p-5 backdrop-blur md:block">
        <p className="text-[10px] uppercase tracking-[0.22em] text-lf-muted">Campanha ativa</p>
        <p className="mt-2 text-2xl font-black text-lf-text">Primeiro mês</p>
        <p className="text-4xl font-black text-lf-volt">R$ 9,90</p>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-6 inline-flex items-center gap-3 border border-lf-volt/30 bg-lf-black/55 px-4 py-2 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-lf-volt shadow-[0_0_18px_rgba(242,226,5,0.8)]" />
          <p className="text-xs uppercase tracking-[0.24em] text-lf-volt">Rede de academias</p>
        </div>

        <h1 className="max-w-5xl text-[3.15rem] font-black leading-none text-lf-text sm:text-7xl md:text-8xl lg:text-9xl">
          <span className="block">O melhor</span>
          <span className="block">ainda está</span>
          <span className="block">por vir.</span>
        </h1>

        <p className="mt-6 max-w-[21rem] text-base leading-relaxed text-lf-muted md:max-w-2xl md:text-xl">
          Energia, estrutura e uma experiência feita para quem leva o treino a sério.
        </p>

        <div className="mt-7 inline-flex max-w-full flex-col border border-lf-volt/30 bg-lf-black/70 p-4 shadow-[0_0_42px_rgba(242,226,5,0.08)] backdrop-blur sm:flex-row sm:items-end sm:gap-5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-lf-muted">Primeiro mês por</span>
          <strong className="text-4xl font-black leading-none text-lf-volt sm:text-5xl">R$ 9,90</strong>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button href="#planos" variant="volt" size="lg">
            Começar matrícula
          </Button>
          <Button href="/unidades" variant="ghost" size="lg">
            Ver unidades
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-lf-muted">Role</span>
        <div className="h-8 w-px animate-pulse bg-lf-volt/50" />
      </div>
    </section>
  )
}
