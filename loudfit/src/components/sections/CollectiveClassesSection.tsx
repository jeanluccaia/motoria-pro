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
        subtitle="Do Muay Thai ao Pilates: você não paga nada a mais por aula."
      />

      <div className="flex flex-wrap gap-2 md:gap-2.5">
        {aulas.map((aula) => (
          <span
            key={aula}
            className="border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-lf-volt hover:text-gray-900"
          >
            {aula}
          </span>
        ))}
      </div>

      <p className="mt-5 text-sm text-gray-500">
        A grade de aulas varia por unidade. Verifique a disponibilidade na página da sua unidade.
      </p>

      <div className="mt-6">
        <Button href="/unidades" variant="volt" size="md">
          Ver as aulas da minha unidade
        </Button>
      </div>
    </Section>
  )
}
