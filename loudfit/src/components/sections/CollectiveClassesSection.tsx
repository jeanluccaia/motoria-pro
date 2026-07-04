import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const anchorAulas = [
  'Muay Thai',
  'Pilates',
  'Spinning',
  'FitDance',
  'Funcional',
  'Jump',
]

const allAulas = [
  'Muay Thai', 'Pilates', 'FitDance', 'Spinning', 'Jump', 'GAP',
  'Pump', 'Alongamento', 'Ritbox', 'Funcional', 'Yoga', 'Jiu-Jitsu',
  'Zumba', 'Loud Dance', 'Step', 'Crosstreino',
]

const otherAulas = allAulas.filter((a) => !anchorAulas.includes(a))

export function CollectiveClassesSection() {
  return (
    <Section id="aulas-coletivas" bg="black">

      {/* Cabeçalho + número destaque */}
      <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end md:mb-16">
        <Reveal>
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                Aulas coletivas
              </p>
            </div>
            <h2 className="text-4xl font-black leading-[1.02] text-lf-text text-balance md:text-5xl">
              Aulas coletivas inclusas no seu plano.
            </h2>
            <p className="mt-4 max-w-[55ch] text-base leading-[1.6] text-lf-muted">
              Musculação + aulas coletivas na mesma mensalidade — você não paga nada a mais por aula.
            </p>
          </div>
        </Reveal>

        {/* Número 16 em destaque */}
        <Reveal delay={0.1}>
          <div className="border border-lf-volt/30 bg-lf-volt/5 px-8 py-6 text-center self-start lg:self-end">
            <p className="text-[4.5rem] font-black leading-none text-lf-volt">16</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-lf-volt/60">
              modalidades
            </p>
          </div>
        </Reveal>
      </div>

      {/* Cards âncora — 6 modalidades destaque */}
      <Reveal delay={0.05}>
        <div className="mb-5 grid grid-cols-2 gap-[1px] bg-lf-line sm:grid-cols-3 md:grid-cols-6">
          {anchorAulas.map((aula) => (
            <div
              key={aula}
              className="group relative overflow-hidden bg-lf-graphite px-4 py-5 transition-colors duration-200 hover:bg-lf-surface"
            >
              {/* Linha amarela lateral */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-lf-volt" />
              <span className="block text-sm font-bold text-lf-text leading-snug">
                {aula}
              </span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Grid compacto — demais modalidades */}
      <Reveal delay={0.1}>
        <div className="mb-8 flex flex-wrap gap-1.5">
          {otherAulas.map((aula) => (
            <span
              key={aula}
              className="border border-lf-line px-3 py-1.5 text-xs font-medium text-lf-muted"
            >
              {aula}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <p className="mb-5 text-xs text-lf-muted/50">
          A grade de aulas varia por unidade.
        </p>
        <Button href="/unidades" variant="volt" size="md">
          Ver aulas por unidade
        </Button>
      </Reveal>
    </Section>
  )
}
