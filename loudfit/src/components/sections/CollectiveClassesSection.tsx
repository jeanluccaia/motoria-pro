import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

export function CollectiveClassesSection() {
  return (
    <Section id="aulas-coletivas" bg="black" className="relative overflow-hidden py-16 md:py-20 lg:py-24">
      <Reveal>
        <div className="border border-lf-line bg-lf-graphite/55 p-6 md:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex items-end gap-4">
              <span
                className="font-black leading-none text-lf-volt"
                style={{ fontSize: 'clamp(5rem, 9vw, 8rem)' }}
              >
                16
              </span>
              <span className="pb-3 text-sm font-bold uppercase tracking-[0.12em] text-lf-muted">
                modalidades<br />inclusas
              </span>
            </div>

            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                  Planos LoudFit
                </p>
              </div>
              <h2 className="text-balance text-3xl font-black leading-[1.06] text-lf-text md:text-5xl">
                Musculação + aulas no mesmo plano.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-[1.65] text-lf-muted md:text-base">
                Muay Thai, Pilates, Spinning, Zumba, Jump e outras modalidades já entram na mensalidade da sua unidade.
              </p>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-lf-muted/70">
                Muay Thai · Pilates · Spinning · Zumba · Jump · Funcional
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:min-w-[210px] lg:items-end">
              <Button href="/unidades" variant="volt" size="md" className="w-full justify-center lg:w-auto">
                Ver aulas por unidade
              </Button>
              <p className="text-xs text-lf-muted/60">A grade de aulas varia por unidade.</p>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
