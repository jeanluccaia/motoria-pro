import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const cards = [
  {
    title: 'Musculação',
    desc: 'Equipamentos completos para evolução diária.',
    image: '/assets/images/real-weights.jpg',
  },
  {
    title: 'Cardio',
    desc: 'Esteiras, bikes e equipamentos de alta performance.',
    image: '/assets/images/real-machines.jpg',
  },
  {
    title: 'Aulas coletivas',
    desc: 'Espaço dedicado para toda a grade da unidade.',
    image: '/assets/images/studio-community.jpg',
  },
]

export function StructureCards() {
  return (
    <Section bg="black" className="py-16 md:py-20 lg:py-24">
      <Reveal>
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
              Estrutura Loud Fit
            </p>
          </div>
          <h2 className="text-balance text-4xl font-black uppercase leading-[1.02] tracking-[-0.005em] text-lf-text md:text-5xl">
            Estrutura completa<br />treino <span className="text-lf-volt">do seu jeito</span>
          </h2>
          <p className="mt-4 max-w-[52ch] text-base leading-[1.6] text-lf-muted">
            Musculação, cardio e aulas coletivas no mesmo plano. Tudo o que você precisa para uma rotina real de treino.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card, i) => (
          <Reveal key={card.title} delay={i * 0.08}>
            <article className="group relative aspect-[4/5] overflow-hidden bg-lf-graphite sm:aspect-[3/4]">
              <Image
                src={card.image}
                alt={`LoudFit — ${card.title}`}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-lf-black/85 via-lf-black/30 to-transparent" />
              <div aria-hidden="true" className="absolute top-0 left-0 h-0 w-0 border-t-[28px] border-t-lf-volt border-r-[28px] border-r-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-2 h-[2px] w-8 bg-lf-volt" />
                <h3 className="text-xl font-black uppercase leading-tight text-lf-text">{card.title}</h3>
                <p className="mt-1 max-w-[26ch] text-sm leading-snug text-lf-text/75">{card.desc}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
