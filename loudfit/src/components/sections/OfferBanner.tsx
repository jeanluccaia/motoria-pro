import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { SignalMark } from '@/components/ui/SignalMark'

export function OfferBanner() {
  return (
    <Section bg="black" className="pt-8 md:pt-12 pb-12 md:pb-16">
      <div className="relative overflow-hidden border border-lf-volt/25 bg-lf-graphite shadow-[0_32px_120px_rgba(0,0,0,0.38)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lf-volt to-transparent" />

        <div className="relative grid min-h-[500px] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="z-10 flex flex-col justify-center px-5 py-10 sm:px-8 md:px-12 lg:px-14">
            <div className="mb-5 flex items-center gap-3">
              <SignalMark />
              <p className="text-xs uppercase tracking-[0.24em] text-lf-volt">Oferta de lançamento</p>
            </div>
            <h2 className="max-w-3xl text-4xl font-black leading-[0.95] text-lf-text sm:text-5xl md:text-6xl">
              Primeira mensalidade por
              <span className="mt-3 block text-[4.4rem] leading-[0.85] text-lf-volt sm:text-[5.6rem] md:text-[6.6rem]">
                R$9,90
              </span>
            </h2>
            <p className="mt-3 text-sm font-bold uppercase tracking-[0.16em] text-lf-muted">
              No Power Anual Recorrente.
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-lf-muted md:text-lg">
              Comece pagando pouco, siga com cobrança mensal e sem comprometer o limite total do
              cartão.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/unidades" variant="volt" size="lg" className="sm:min-w-48">
                Escolher unidade
              </Button>
              <Button href="#planos" variant="outline" size="lg" className="sm:min-w-44">
                Ver planos
              </Button>
            </div>

            <p className="mt-6 max-w-2xl text-xs leading-relaxed text-lf-muted">
              Após a primeira mensalidade promocional, aplica-se o valor mensal do plano anual
              recorrente da unidade escolhida.
            </p>
          </div>

          <div className="relative min-h-[260px] lg:min-h-full">
            <Image
              src="/assets/images/campaign-gym-16x9.png"
              alt="Academia LoudFit com equipamentos em ambiente escuro"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-lf-graphite via-lf-black/10 to-transparent lg:bg-gradient-to-r lg:from-lf-graphite lg:via-lf-black/20 lg:to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 border-l-2 border-lf-volt bg-lf-black/60 p-4 backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.18em] text-lf-muted">Como funciona</p>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-lf-text">
                Escolha o plano, escolha a unidade e comece a treinar
              </p>
              <p className="mt-1 text-[11px] text-lf-muted">
                Venda online via EVO será conectada à página de vendas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
