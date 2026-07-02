import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'

const aulas = [
  'Muay Thai', 'Pilates', 'FitDance', 'Zumba', 'Jump', 'Spinning',
  'Yoga', 'Jiu-Jitsu', 'Pump', 'GAP', 'Step', 'Crosstreino',
  'Loud Dance', 'Alongamento', 'Funcional',
]

export function CollectiveClassesSection() {
  return (
    <Section id="aulas-coletivas" bg="lighter">
      <SectionHeader
        dark
        label="Aulas coletivas"
        title="Inclusas em todos os planos."
        subtitle="Você não paga a mais por aula. Contratou o plano, as atividades da sua unidade já estão dentro."
      />

      <div className="flex flex-wrap gap-2 md:gap-3">
        {aulas.map((aula) => (
          <span
            key={aula}
            className="border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-lf-volt hover:text-gray-900"
          >
            {aula}
          </span>
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        A grade de aulas varia por unidade.
      </p>

      <div className="mt-8">
        <Button href="/unidades" variant="volt" size="md">
          Ver as aulas da minha unidade
        </Button>
      </div>
    </Section>
  )
}
