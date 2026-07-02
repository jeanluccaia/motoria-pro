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
      <section className="relative min-h-[560px] overflow-hidden bg-lf-black">
        <Image
          src="/assets/images/training-modalities.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-65"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_46%,rgba(242,226,5,0.13),transparent_22%),linear-gradient(90deg,rgba(10,10,10,0.97),rgba(10,10,10,0.62)),linear-gradient(180deg,rgba(10,10,10,0.08),rgba(10,10,10,1))]" />
        <div className="absolute right-[-18vw] top-0 hidden h-full w-[42vw] -skew-x-12 border-l border-lf-volt/20 bg-lf-volt/[0.04] lg:block" />
        <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-end px-4 py-14 sm:px-6">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs uppercase tracking-[0.28em] text-lf-volt">Experiências</p>
            <h1 className="text-[3.1rem] font-black leading-none text-lf-text md:text-7xl">Treino com intenção.</h1>
            <p className="mt-5 max-w-[21rem] text-base leading-relaxed text-lf-muted md:max-w-xl md:text-lg">
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

      <Section bg="black" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(242,226,5,0.08),transparent_22%)]" />
        <div className="relative">
          <div className="mb-12 md:mb-16">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-lf-volt">Modalidades</p>
            <h2 className="text-4xl font-black text-lf-text md:text-6xl">
              <span className="block">Escolha seu</span>
              <span className="block">ritmo.</span>
            </h2>
            <p className="mt-4 max-w-[21rem] text-base leading-relaxed text-lf-muted md:max-w-2xl md:text-lg">
              Modalidades claras para quem quer entrar, treinar e voltar no dia seguinte.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {modalities.map((item, index) => (
              <article key={item.title} className="group relative min-h-[390px] overflow-hidden rounded-lg border border-lf-line bg-lf-surface transition duration-500 hover:-translate-y-1 hover:border-lf-volt/45">
                <Image
                  src={item.image}
                  alt={`LoudFit - ${item.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-72 transition duration-700 group-hover:scale-105 group-hover:opacity-88"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-lf-black via-lf-black/35 to-transparent" />
                <div className="absolute left-6 top-6 rounded-full border border-lf-volt/40 bg-lf-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <span className="text-xs uppercase tracking-[0.22em] text-lf-volt">{item.title}</span>
                  <h2 className="mt-3 max-w-xl text-2xl font-black text-lf-text md:text-4xl">{item.body}</h2>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section bg="graphite" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(242,226,5,0.08),transparent_32%)]" />
        <div className="relative">
          <SectionHeader label="Aulas coletivas" title="Energia de grupo." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {classes.map((item) => (
              <div key={item} className="rounded-lg border border-lf-line bg-lf-black/70 p-5 transition duration-300 hover:-translate-y-1 hover:border-lf-volt/45">
                <span className="text-xs uppercase tracking-[0.2em] text-lf-volt">{item.slice(0, 2)}</span>
                <h2 className="mt-5 text-2xl font-black text-lf-text">{item}</h2>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}
