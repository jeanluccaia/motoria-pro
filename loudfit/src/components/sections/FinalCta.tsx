import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

export function FinalCta() {
  return (
    <Section bg="black" className="relative border-t border-lf-line lg:py-32">
      <Reveal>
        <div className="relative flex flex-col items-center text-center">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Comece agora
          </p>
          <h2 className="max-w-2xl text-4xl font-black leading-[1.04] text-lf-text sm:text-5xl md:text-6xl">
            Escolha sua unidade.<br className="hidden sm:block" /> Comece a treinar.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-lf-muted">
            Veja a unidade mais próxima e finalize sua matrícula online.
          </p>

          <div className="mt-9">
            <Button href="/unidades" variant="volt" size="lg">
              Ver todas as unidades
            </Button>
          </div>

          <p className="mt-8 text-sm text-lf-muted">
            Primeira mensalidade por{' '}
            <span className="font-bold text-lf-volt">R$9,90</span>{' '}
            no Power Anual Recorrente.
          </p>
          <p className="mt-2 text-[11px] text-lf-muted/60">
            *Ipiranga possui tabela própria. Valores podem variar conforme a unidade.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
