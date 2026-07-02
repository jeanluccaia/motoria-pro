import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'

export function OfferBanner() {
  return (
    <Section bg="black" className="pt-10 md:pt-14 pb-12 md:pb-16">
      <div className="relative overflow-hidden border border-lf-volt/25 bg-lf-graphite">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(242,226,5,0.16),transparent_28%),linear-gradient(135deg,rgba(10,10,10,0.98),rgba(10,10,10,0.78)_45%,rgba(22,22,22,0.55))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-lf-volt/70" />

        <div className="relative grid min-h-[560px] lg:min-h-[520px] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="z-10 flex flex-col justify-center px-5 py-10 sm:px-8 md:px-12 lg:px-14">
            <p className="text-xs uppercase tracking-[0.24em] text-lf-volt">Oferta de lançamento</p>
            <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] text-lf-text sm:text-6xl md:text-7xl">
              Primeiro mês por
              <span className="mt-2 block text-lf-volt">R$ 9,90</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-lf-muted md:text-lg">
              Escolha sua unidade, escolha seu plano e comece a treinar na LoudFit.
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

          <div className="relative min-h-[260px] lg:min-h-full">
            <Image
              src="/assets/images/campaign-gym-16x9.png"
              alt="Academia LoudFit com equipamentos em ambiente escuro"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-lf-graphite via-lf-black/20 to-transparent lg:bg-gradient-to-r lg:from-lf-graphite lg:via-lf-black/20 lg:to-transparent" />
          </div>
        </div>
      </div>
    </Section>
  )
}
