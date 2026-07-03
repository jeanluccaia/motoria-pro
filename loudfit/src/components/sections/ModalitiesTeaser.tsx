import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'

const items = [
  {
    title: 'Musculação',
    body: 'Equipamentos, carga e espaço para evoluir.',
    image: '/assets/images/real-weights.jpg',
  },
  {
    title: 'Cardio',
    body: 'Ritmo alto, constância e resultado.',
    image: '/assets/images/real-machines.jpg',
  },
  {
    title: 'Funcional',
    body: 'Movimento e intensidade em grupo.',
    image: '/assets/images/training-modalities.png',
  },
  {
    title: 'Aulas Coletivas',
    body: 'Do Muay Thai ao Pilates, incluso no plano.',
    image: '/assets/images/studio-community.jpg',
  },
]

export function ModalitiesTeaser() {
  return (
    <Section bg="black" className="relative overflow-hidden">
      <div className="relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            label="Modalidades"
            title="Musculação, cardio e aulas coletivas."
            subtitle="Tudo que você precisa no mesmo espaço, incluso no plano."
            className="mb-0"
          />
          <Button href="/modalidades" variant="outline" size="md" className="shrink-0 mb-10 md:mb-14">
            Ver modalidades
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.title}
              className="group relative min-h-[280px] overflow-hidden transition duration-300 hover:-translate-y-1"
            >
              <Image
                src={item.image}
                alt={`LoudFit — ${item.title}`}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover opacity-65 transition duration-500 group-hover:scale-105 group-hover:opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-lf-black/95 via-lf-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-2 h-px w-8 bg-lf-volt transition-all duration-300 group-hover:w-12" />
                <h3 className="text-xl font-black text-lf-text">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-lf-muted">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  )
}
