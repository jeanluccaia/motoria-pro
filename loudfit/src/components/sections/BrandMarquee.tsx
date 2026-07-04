import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const stats = [
  '5 unidades em operação',
  '16 modalidades',
  'Matrícula online',
  'Aulas inclusas',
]

export function BrandMarquee() {
  return (
    <Section bg="graphite" className="py-10 md:py-14">
      <Reveal>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-md">
            <h2 className="text-xl font-black leading-snug text-lf-text md:text-2xl">
              Musculação + aulas inclusas.
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-lf-muted">
              Você escolhe a unidade, escolhe o plano e treina com acesso às
              atividades disponíveis na grade.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:shrink-0">
            {stats.map((s) => (
              <div
                key={s}
                className="flex items-center gap-2 border border-lf-line bg-lf-surface px-3.5 py-3"
              >
                <span className="h-1 w-1 shrink-0 bg-lf-volt" />
                <span className="text-xs font-bold leading-snug text-lf-text">
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
