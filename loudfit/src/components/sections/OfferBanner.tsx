import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'

export function OfferBanner() {
  return (
    <Section bg="black" className="pt-10 md:pt-14 pb-12 md:pb-16">
      <div className="relative overflow-hidden rounded-lg border border-lf-volt/25 bg-lf-graphite shadow-[0_32px_120px_rgba(0,0,0,0.38)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_24%,rgba(242,226,5,0.18),transparent_26%),linear-gradient(135deg,rgba(10,10,10,0.98),rgba(10,10,10,0.82)_42%,rgba(22,22,22,0.58))]" />
        <div className="absolute -right-28 top-0 hidden h-full w-72 -skew-x-12 bg-lf-volt/10 lg:block" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lf-volt to-transparent" />

        <div className="relative grid min-h-[540px] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="z-10 flex flex-col justify-center px-5 py-10 sm:px-8 md:px-12 lg:px-14">
            <p className="text-xs uppercase tracking-[0.24em] text-lf-volt">Oferta de lançamento</p>
            <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] text-lf-text sm:text-6xl md:text-7xl">
              Primeiro mês por
              <span className="mt-3 block text-[5.4rem] leading-[0.85] text-lf-volt sm:text-[7rem] md:text-[8rem]">
                R$ 9,90
              </span>
            </h2>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-lf-muted md:text-lg">
              Escolha sua unidade, escolha seu plano e comece a treinar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="#planos" variant="volt" size="lg" className="sm:min-w-48">
                Começar agora
              </Button>
              <Button href="/unidades" variant="outline" size="lg" className="sm:min-w-44">
                Ver unidades
              </Button>
            </div>

            <p className="mt-6 max-w-2xl text-xs leading-relaxed text-lf-muted">
              Após o primeiro mês, aplica-se o valor do plano escolhido. Condições sujeitas à disponibilidade da unidade.
            </p>
          </div>

          <div className="relative min-h-[250px] lg:min-h-full">
            <Image
              src="/assets/images/campaign-gym-16x9.png"
              alt="Academia LoudFit com equipamentos em ambiente escuro"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-lf-graphite via-lf-black/10 to-transparent lg:bg-gradient-to-r lg:from-lf-graphite lg:via-lf-black/20 lg:to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 border border-lf-line bg-lf-black/60 p-4 backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.18em] text-lf-muted">Fluxo de matrícula</p>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-lf-text">
                Plano → unidade → página de venda EVO
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
