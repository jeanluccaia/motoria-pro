import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const items = [
  {
    title: 'Musculação',
    body: 'Equipamentos, carga e espaço para evoluir.',
    image: '/assets/images/real-weights.jpg',
    bento: 'lg:col-span-2 lg:row-span-2',
    minH: 'min-h-[320px] lg:min-h-auto',
  },
  {
    title: 'Cardio',
    body: 'Ritmo alto, constância e resultado.',
    image: '/assets/images/real-machines.jpg',
    bento: '',
    minH: 'min-h-[220px]',
  },
  {
    title: 'Funcional',
    body: 'Movimento e intensidade em grupo.',
    image: '/assets/images/training-modalities.png',
    bento: '',
    minH: 'min-h-[220px]',
  },
  {
    title: 'Aulas Coletivas',
    body: 'Do Muay Thai ao Pilates — incluso no plano.',
    image: '/assets/images/studio-community.jpg',
    bento: 'lg:col-span-3',
    minH: 'min-h-[180px]',
  },
]

const delays = [0, 0.1, 0.2, 0.15]

export function ModalitiesTeaser() {
  return (
    <Section bg="black" className="relative overflow-hidden">
      <div className="relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal className="mb-0">
            <SectionHeader
              label="Modalidades"
              title="Musculação, cardio e aulas coletivas."
              subtitle="Tudo que você precisa no mesmo espaço, incluso no plano."
              className="mb-0"
            />
          </Reveal>
          <Reveal delay={0.1} className="shrink-0 mb-10 md:mb-14">
            <Button href="/modalidades" variant="outline" size="md">
              Ver modalidades
            </Button>
          </Reveal>
        </div>

        {/*
          Bento grid desktop (lg):
          [Musculação 2col × 2row] [Cardio]
          [Musculação continues  ] [Funcional]
          [Aulas Coletivas — 3col]
        */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:[grid-template-rows:260px_260px_auto]">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={delays[i]} className={['h-full', item.bento].join(' ')}>
              <article
                className={[
                  'group relative h-full overflow-hidden transition duration-300 hover:-translate-y-1',
                  item.minH,
                ].join(' ')}
              >
                <Image
                  src={item.image}
                  alt={`LoudFit — ${item.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover opacity-65 transition duration-500 group-hover:scale-105 group-hover:opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-lf-black/95 via-lf-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
                  <div className="mb-2 h-px w-8 bg-lf-volt transition-all duration-300 group-hover:w-14" />
                  <h3 className="text-xl font-black text-lf-text lg:text-2xl">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-lf-muted">{item.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}
