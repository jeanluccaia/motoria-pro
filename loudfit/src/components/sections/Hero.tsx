import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { SignalMark } from '@/components/ui/SignalMark'

export function Hero() {
  return (
    <section className="relative flex min-h-[92svh] items-center overflow-hidden bg-lf-black">
      <Image
        src="/assets/images/hero-gym-desktop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 hidden h-full w-full object-cover opacity-75 md:block"
        aria-hidden="true"
      />
      <Image
        src="/assets/images/hero-gym-mobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover opacity-75 md:hidden"
        aria-hidden="true"
      />

      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(10,10,10,0.97),rgba(10,10,10,0.8)_38%,rgba(10,10,10,0.32)),linear-gradient(180deg,rgba(10,10,10,0.28),rgba(10,10,10,0.55)_82%,rgba(10,10,10,0.98))]" />
      <div className="absolute right-[-10vw] top-0 hidden h-full w-[38vw] -skew-x-12 border-l border-lf-volt/20 bg-lf-volt/[0.035] lg:block" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 md:py-32">
        <div className="mb-6 inline-flex items-center gap-3 border-l-2 border-lf-volt pl-3">
          <SignalMark />
          <p className="text-xs uppercase tracking-[0.24em] text-lf-volt">Rede de academias</p>
        </div>

        <h1 className="max-w-5xl text-[3.1rem] font-black leading-[0.92] text-lf-text sm:text-7xl md:text-8xl lg:text-[7.5rem]">
          <span className="block">O melhor</span>
          <span className="block">ainda está</span>
          <span className="block text-lf-volt">por vir.</span>
        </h1>

        <p className="mt-6 max-w-[22rem] text-base leading-relaxed text-lf-muted md:max-w-xl md:text-xl">
          Estrutura completa, equipe qualificada e uma rede que cresce com critério.
        </p>

        <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
          <div className="border-l-2 border-lf-volt bg-lf-black/50 py-2 pl-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-lf-muted">
              Primeira mensalidade por
            </p>
            <p className="text-4xl font-black leading-none text-lf-volt sm:text-5xl">R$9,90</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-lf-muted">
              No Power Anual Recorrente.
            </p>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-4 sm:flex-row">
          <Button href="#planos" variant="volt" size="lg">
            Começar matrícula
          </Button>
          <Button href="/unidades" variant="ghost" size="lg">
            Ver unidades
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
        <span className="text-[10px] uppercase tracking-widest text-lf-muted">Role</span>
        <div className="h-8 w-px animate-pulse bg-lf-volt/50" />
      </div>
    </section>
  )
}
