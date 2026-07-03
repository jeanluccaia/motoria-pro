import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const aulas = [
  'Muay Thai', 'Pilates', 'FitDance', 'Spinning', 'Jump', 'GAP',
  'Pump', 'Alongamento', 'Ritbox', 'Funcional', 'Yoga', 'Jiu-Jitsu',
  'Zumba', 'Loud Dance', 'Step', 'Crosstreino',
]

export function CollectiveClassesSection() {
  return (
    <Section id="aulas-coletivas" bg="graphite">
      <Reveal>
        <SectionHeader
          label="Aulas coletivas"
          title="Inclusas em todos os planos."
          subtitle="Musculação + aulas coletivas na mesma mensalidade — você não paga nada a mais por aula."
        />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="flex flex-wrap gap-2 md:gap-2.5">
          {aulas.map((aula) => (
            <span
              key={aula}
              className="border border-lf-line bg-lf-surface px-4 py-2 text-sm font-medium text-lf-muted transition-all duration-150 hover:border-lf-volt hover:bg-lf-volt hover:text-lf-black cursor-default"
            >
              {aula}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <p className="mt-6 text-sm text-lf-muted/60">
          A grade de aulas varia por unidade. Verifique na página da sua unidade.
        </p>

        <div className="mt-6">
          <Button href="/unidades" variant="volt" size="md">
            Ver aulas por unidade
          </Button>
        </div>
      </Reveal>
    </Section>
  )
}
