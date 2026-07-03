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
    <Section bg="lighter" className="relative overflow-hidden">
      <div className="relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            dark
            label="Modalidades"
            title="Musculação, cardio e aulas coletivas."
            subtitle="Tudo que você precisa no mesmo espaço, incluso no plano."
          />
          <Button href="/modalidades" variant="volt" size="md" className="mb-12 md:mb-16">
            Ver modalidades
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <article
              key={item.title}
              className={`group relative min-h-[300px] overflow-hidden border border-lf-line bg-lf-black transition duration-300 hover:-translate-y-1 hover:border-lf-volt/45 ${
                index === 1 ? 'md:mt-10' : ''
              }`}
            >
              <Image
                src={item.image}
                alt={`LoudFit - ${item.title}`}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-lf-black via-lf-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 border-t-2 border-lf-volt/70 bg-lf-black/40 p-5">
                <h3 className="text-2xl font-black text-lf-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-lf-muted">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  )
}
