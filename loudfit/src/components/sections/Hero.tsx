import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative flex min-h-[92svh] items-center justify-center overflow-hidden bg-lf-black">
      <Image
        src="/assets/images/hero-gym-desktop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 hidden h-full w-full object-cover opacity-55 md:block"
        aria-hidden="true"
      />
      <Image
        src="/assets/images/hero-gym-mobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover opacity-55 md:hidden"
        aria-hidden="true"
      />
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-30"
        aria-hidden="true"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95),rgba(10,10,10,0.66)_46%,rgba(10,10,10,0.2)),linear-gradient(180deg,rgba(10,10,10,0.45),rgba(10,10,10,0.95))]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
        <p className="mb-6 text-xs uppercase tracking-[0.28em] text-lf-volt">
          Rede de academias
        </p>

        <h1 className="max-w-5xl text-[3.25rem] font-black leading-none text-lf-text sm:text-7xl md:text-8xl lg:text-9xl">
          <span className="block">O melhor</span>
          <span className="block">ainda está</span>
          <span className="block">por vir.</span>
        </h1>

        <p className="mt-6 max-w-[21rem] text-base leading-relaxed text-lf-muted md:max-w-2xl md:text-xl">
          Energia, estrutura e uma experiência feita para quem leva o treino a sério.
        </p>

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
