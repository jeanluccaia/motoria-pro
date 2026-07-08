import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

export function CollectiveClassesSection() {
  return (
    <Section id="aulas-coletivas" bg="black" className="relative overflow-hidden py-16 md:py-20 lg:py-24">
      <Reveal>
        <div className="relative overflow-hidden border border-lf-line bg-lf-graphite/55">
          {/* Número decorativo de fundo */}
          <span
            className="pointer-events-none absolute -right-4 -top-6 select-none font-black leading-none text-white/[0.04] md:-right-8 md:-top-10"
            style={{ fontSize: 'clamp(10rem, 28vw, 22rem)' }}
            aria-hidden="true"
          >
            16
          </span>

          <div className="relative grid gap-10 p-8 md:p-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16 lg:p-12">
            {/* Conteúdo principal */}
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="font-black leading-none text-lf-volt"
                  style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)' }}
                >
                  16
                </span>
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-lf-muted">
                  modalidades<br />inclusas
                </span>
              </div>

              <h2 className="max-w-xl text-balance text-3xl font-black leading-[1.06] text-lf-text md:text-4xl lg:text-5xl">
                Aulas coletivas sem pagar à parte
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-[1.7] text-lf-muted md:text-base">
                Do Muay Thai ao Pilates: a grade da sua unidade já entra no plano.
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-lf-muted/50">
                A disponibilidade das aulas varia por unidade.
              </p>
            </div>

            {/* CTA */}
            <div className="lg:pb-1">
              <Button href="/unidades" variant="volt" size="md" className="w-full justify-center lg:w-auto lg:min-w-[200px]">
                Ver aulas por unidade
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
