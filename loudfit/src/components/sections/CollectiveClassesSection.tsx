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

      {/* Cabeçalho */}
      <div className="mb-12 md:mb-16">
        <Reveal>
          <div className="mb-5 flex items-center gap-3">
            <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
              Planos LoudFit
            </p>
          </div>
          <h2 className="text-4xl font-black leading-[1.02] text-lf-text text-balance md:text-5xl">
            Um plano. Tudo incluso.
          </h2>
          <p className="mt-4 max-w-[60ch] text-base leading-[1.6] text-lf-muted">
            Muay Thai, Pilates, Spinning, Zumba, Jump... Na LoudFit, nenhuma aula é cobrada à parte.
            O preço do plano — qualquer plano — já inclui toda a grade da sua unidade.
          </p>
        </Reveal>
      </div>

      {/* Comparação simples */}
      <Reveal delay={0.05}>
        <div className="mb-10 flex flex-col gap-3">
          <div className="flex items-center gap-3 opacity-35">
            <span className="shrink-0 text-sm font-bold text-lf-muted line-through">✗</span>
            <span className="text-sm text-lf-muted line-through">Mensalidade + taxa por aula</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-lf-volt text-[10px] font-black text-lf-black">✓</span>
            <span className="text-sm font-bold text-lf-text">LoudFit: musculação + 16 modalidades na mesma mensalidade</span>
          </div>
        </div>
      </Reveal>

      {/* Cards âncora — 6 modalidades destaque */}
      <Reveal delay={0.08}>
        <div className="mb-5 grid grid-cols-2 gap-[1px] bg-lf-line sm:grid-cols-3 md:grid-cols-6">
          {anchorAulas.map((aula) => (
            <div
              key={aula}
              className="group relative overflow-hidden bg-lf-graphite px-4 py-5 transition-colors duration-200 hover:bg-lf-surface"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-lf-volt" />
              <span className="block text-sm font-bold text-lf-text leading-snug">
                {aula}
              </span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Grid compacto — demais modalidades */}
      <Reveal delay={0.12}>
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

      {/* Fecho com oferta */}
      <Reveal delay={0.15}>
        <div className="mb-6 border-l-2 border-lf-volt bg-lf-graphite/60 px-5 py-4">
          <p className="text-sm leading-relaxed text-lf-muted">
            E no{' '}
            <span className="font-bold text-lf-text">Power Anual Recorrente</span>
            , você entra pagando{' '}
            <span className="font-bold text-lf-volt">R$9,90</span> na primeira mensalidade.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.18}>
        <p className="mb-5 text-xs text-lf-muted/50">
          A grade de aulas pode variar por unidade.
        </p>
        <Button href="/unidades" variant="volt" size="md">
          Começar matrícula
        </Button>
      </Reveal>
    </Section>
  )
}
