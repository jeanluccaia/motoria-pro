import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'

const items = [
  {
    title: 'Força',
    body: 'Equipamentos, carga e espaço para evoluir.',
    image: '/assets/images/real-weights.jpg',
  },
  {
    title: 'Cardio',
    body: 'Ritmo alto para manter consistência.',
    image: '/assets/images/real-machines.jpg',
  },
  {
    title: 'Funcional',
    body: 'Movimento, intensidade e treino em grupo.',
    image: '/assets/images/training-modalities.png',
  },
]

export function ModalitiesTeaser() {
  return (
    <Section bg="graphite" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(242,226,5,0.08),transparent_32%),radial-gradient(circle_at_18%_80%,rgba(255,255,255,0.06),transparent_22%)]" />
      <div className="relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            label="Modalidades"
            title="Treino com intenção."
            subtitle="Força, cardio, funcional e aulas coletivas dentro do mesmo padrão LoudFit."
          />
          <Button href="/modalidades" variant="outline" size="md" className="mb-12 md:mb-16">
            Ver modalidades
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.title}
              className={`group relative min-h-[360px] overflow-hidden rounded-lg border border-lf-line bg-lf-black shadow-[0_24px_80px_rgba(0,0,0,0.25)] transition duration-500 hover:-translate-y-1 hover:border-lf-volt/45 ${
                index === 1 ? 'md:mt-10' : ''
              }`}
            >
              <Image
                src={item.image}
                alt={`Modalidade LoudFit - ${item.title}`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-lf-black via-lf-black/40 to-transparent" />
              <div className="absolute left-5 top-5 rounded-full border border-lf-volt/40 bg-lf-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="text-3xl font-black text-lf-text">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-lf-muted">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  )
}
