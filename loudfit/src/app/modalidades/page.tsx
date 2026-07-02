import type { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Modalidades',
  description: 'Modalidades LoudFit para treinar com força, ritmo e energia.',
}

const modalities = [
  {
    title: 'Força',
    body: 'Estrutura para evoluir com carga, técnica e consistência.',
    image: '/assets/images/real-weights.jpg',
  },
  {
    title: 'Cardio',
    body: 'Ritmo para manter o treino vivo e voltar no dia seguinte.',
    image: '/assets/images/real-machines.jpg',
  },
  {
    title: 'Funcional',
    body: 'Movimento, intensidade e grupo para puxar sua melhor versão.',
    image: '/assets/images/training-modalities.png',
  },
  {
    title: 'Comunidade',
    body: 'Gente que treina junto em uma sala com energia de rede.',
    image: '/assets/images/studio-community.jpg',
  },
]

const classes = ['Zumba', 'Jump', 'FitDance', 'Pilates', 'Pump', 'Muay Thai', 'GAP', 'Funcional']

export default function ModalidadesPage() {
  return (
    <div className="pt-16">
      <section className="relative min-h-[520px] overflow-hidden bg-lf-black">
        <Image
          src="/assets/images/training-modalities.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-60"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.96),rgba(10,10,10,0.58)),linear-gradient(180deg,rgba(10,10,10,0.1),rgba(10,10,10,1))]" />
        <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-end px-4 py-14 sm:px-6">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs uppercase tracking-[0.28em] text-lf-volt">Experiências</p>
            <h1 className="text-5xl font-black text-lf-text md:text-7xl">Treino com intenção.</h1>
            <p className="mt-5 text-lg leading-relaxed text-lf-muted">
              Força, ritmo e comunidade para treinar com mais vontade.
            </p>
            <div className="mt-8">
              <Button href="/unidades" variant="volt" size="lg">
                Ver unidades
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Section bg="black">
        <SectionHeader
          label="Modalidades"
          title="Escolha seu ritmo."
          subtitle="Modalidades claras para quem quer entrar, treinar e voltar no dia seguinte."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {modalities.map((item) => (
            <article key={item.title} className="group relative min-h-[340px] overflow-hidden border border-lf-line bg-lf-surface">
              <Image
                src={item.image}
                alt={`LoudFit - ${item.title}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-lf-black via-lf-black/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="text-xs uppercase tracking-[0.22em] text-lf-volt">{item.title}</span>
                <h2 className="mt-3 text-3xl font-black text-lf-text">{item.body}</h2>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section bg="graphite">
        <SectionHeader label="Aulas coletivas" title="Energia de grupo." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {classes.map((item) => (
            <div key={item} className="border border-lf-line bg-lf-black p-5">
              <span className="text-xs uppercase tracking-[0.2em] text-lf-volt">{item.slice(0, 2)}</span>
              <h2 className="mt-5 text-2xl font-black text-lf-text">{item}</h2>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
