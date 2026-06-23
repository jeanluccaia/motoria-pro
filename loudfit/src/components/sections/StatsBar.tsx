import { Section } from '@/components/ui/Section'
import { StatCounter } from '@/components/ui/StatCounter'

const stats = [
  { value: 5, suffix: '', label: 'Unidades' },
  { value: 0, suffix: '+', label: 'Alunos ativos' },    // preencher com dado real
  { value: 0, suffix: '', label: 'Anos de rede' },       // preencher com dado real
  { value: 0, suffix: '', prefix: '', label: 'Nota Google', },  // preencher
]

export function StatsBar() {
  return (
    <Section bg="graphite" tight>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y-0 md:divide-x md:divide-lf-line">
        {stats.map((s) => (
          <StatCounter key={s.label} {...s} />
        ))}
      </div>
    </Section>
  )
}
