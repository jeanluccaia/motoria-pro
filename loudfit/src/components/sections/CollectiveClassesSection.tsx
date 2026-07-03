import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'

const aulas = [
  'Muay Thai', 'Pilates', 'FitDance', 'Spinning', 'Jump', 'GAP',
  'Pump', 'Alongamento', 'Ritbox', 'Funcional', 'Yoga', 'Jiu-Jitsu',
  'Zumba', 'Loud Dance', 'Step', 'Crosstreino',
]

export function CollectiveClassesSection() {
  return (
    <Section id="aulas-coletivas" bg="lighter">
      <SectionHeader
        dark
        label="Aulas coletivas"
        title="Inclusas em todos os planos."
        subtitle="Musculação + aulas coletivas na mesma mensalidade — você não paga nada a mais por aula."
      />

      <div className="flex flex-wrap gap-2.5 md:gap-3">
        {aulas.map((aula) => (
          <span
            key={aula}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-150 hover:border-lf-volt hover:bg-lf-volt hover:text-lf-black"
          >
            {aula}
          </span>
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-400">
        A grade de aulas varia por unidade. Verifique na página da sua unidade.
      </p>

      <div className="mt-6">
        <Button href="/unidades" variant="volt" size="md">
          Ver aulas por unidade
        </Button>
      </div>
    </Section>
  )
}
