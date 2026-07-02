import { Section } from '@/components/ui/Section'
import { StatCounter } from '@/components/ui/StatCounter'

const stats = [
  { value: 5, suffix: '', label: 'Unidades' },
  { value: 1, suffix: '', label: 'Implantação' },
  { value: 3, suffix: '', label: 'Cidades' },
  { value: 9, suffix: ',90', prefix: 'R$ ', label: 'Primeiro mês' },
]

export function StatsBar() {
  return (
    <Section bg="graphite" tight className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(242,226,5,0.08),transparent_22%,rgba(255,255,255,0.04)_72%,transparent)]" />
      <div className="relative grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-lf-line bg-lf-black/55 p-6 backdrop-blur">
            <StatCounter {...s} />
          </div>
        ))}
      </div>
    </Section>
  )
}
