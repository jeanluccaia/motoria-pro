import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

export function OfferBanner() {
  return (
    <Section bg="graphite" className="pt-10 md:pt-16 pb-14 md:pb-20">
      <Reveal>
        <div className="relative overflow-hidden border border-lf-line">

          <div className="relative grid min-h-[440px] lg:grid-cols-[1fr_1fr]">
            {/* Conteúdo esquerdo */}
            <div className="z-10 flex flex-col justify-center px-6 py-10 sm:px-10 md:px-14 lg:px-16">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                Oferta de lançamento
              </p>
              <h2 className="max-w-lg text-3xl font-black leading-[1.05] text-lf-text sm:text-4xl md:text-5xl">
                Primeira mensalidade<br />por apenas
              </h2>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-[4.5rem] font-black leading-none text-lf-volt sm:text-[5.5rem] md:text-[6rem]">
                  R$9,90
                </span>
              </div>
              <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-lf-muted">
                No Power Anual Recorrente
              </p>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-lf-muted">
                Comece pagando pouco, siga com cobrança mensal e sem comprometer o limite total do cartão.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/unidades" variant="volt" size="lg">
                  Escolher unidade
                </Button>
                <Button href="#planos" variant="outline" size="lg">
                  Ver planos
                </Button>
              </div>

              <p className="mt-5 max-w-md text-xs leading-relaxed text-lf-muted/70">
                Após a primeira mensalidade promocional, aplica-se o valor mensal do plano anual recorrente da unidade escolhida.
              </p>
            </div>

            {/* Imagem direita */}
            <div className="relative min-h-[260px] lg:min-h-full">
              <Image
                src="/assets/images/campaign-gym-16x9.png"
                alt="Academia LoudFit com equipamentos"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-lf-graphite/90 via-lf-black/20 to-transparent lg:bg-gradient-to-r lg:from-lf-graphite lg:via-lf-black/30 lg:to-transparent" />

              {/* Detalhe informativo */}
              <div className="absolute bottom-5 left-5 right-5 bg-lf-black/75 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-lf-muted mb-1.5">
                  Como funciona
                </p>
                <p className="text-sm font-bold text-lf-text">
                  Escolha a unidade → Escolha o plano → Finalize online
                </p>
                <p className="mt-1 text-xs text-lf-muted">
                  Matrícula 100% online — rápido e seguro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
