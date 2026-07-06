import type { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: { absolute: 'Modalidades LoudFit — Aulas e treinos' },
  description: 'Modalidades LoudFit para treinar com força, ritmo e energia.',
  alternates: { canonical: '/modalidades' },
  openGraph: {
    title: 'Modalidades LoudFit — Aulas e treinos',
    description: 'Modalidades LoudFit para treinar com força, ritmo e energia.',
    url: '/modalidades',
    images: ['/assets/images/campaign-gym-16x9.png'],
  },
}

const anchorCards = [
  {
    name: 'Muay Thai',
    desc: 'Arte marcial de alta intensidade. Soco, chute e queima calórica de verdade.',
  },
  {
    name: 'Pilates',
    desc: 'Força no core, postura e mobilidade. Indicado para todos os níveis.',
  },
  {
    name: 'Spinning',
    desc: 'Alta intensidade sobre a bike. Resistência cardio com ritmo de música.',
  },
  {
    name: 'FitDance',
    desc: 'Dança fitness que não parece treino. Movimentos, música e energia de grupo.',
  },
  {
    name: 'Funcional',
    desc: 'Exercícios compostos que trabalham força e condicionamento ao mesmo tempo.',
  },
  {
    name: 'Jump',
    desc: 'Mini trampolim com coreografia. Cardio de alto impacto com baixo esforço articular.',
  },
]

const otherAulas = [
  'Zumba', 'GAP', 'Pump', 'Yoga', 'Jiu-Jitsu', 'Ritbox',
  'Loud Dance', 'Step', 'Crosstreino', 'Alongamento',
]

export default function ModalidadesPage() {
  return (
    <div className="pt-16">

      {/* Hero */}
      <section className="relative min-h-[520px] overflow-hidden bg-lf-black">
        <Image
          src="/assets/images/training-modalities.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-50"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,9,0.97),rgba(9,9,9,0.72)_50%,rgba(9,9,9,0.38)),linear-gradient(180deg,rgba(9,9,9,0.15),rgba(9,9,9,0.95))]" />

        <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-end px-4 py-14 sm:px-6">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                Aulas coletivas
              </p>
            </div>

            <h1 className="text-4xl font-black leading-[1.02] text-lf-text md:text-6xl">
              Tudo isso já está<br className="hidden sm:block" /> no seu plano.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-lf-muted">
              16 modalidades inclusas na mensalidade, sem custo por aula.
            </p>

            <p className="mt-2 text-xs text-lf-muted/50">
              A grade pode variar por unidade.
            </p>

            <div className="mt-8">
              <Button href="/unidades" variant="volt" size="lg">
                Começar matrícula
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de modalidades âncora */}
      <Section bg="black">
        <div className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
              Modalidades em destaque
            </p>
          </div>
          <h2 className="text-3xl font-black leading-[1.02] text-lf-text md:text-4xl">
            Já incluídas no seu plano.
          </h2>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-[1px] bg-lf-line sm:grid-cols-2 md:grid-cols-3">
          {anchorCards.map((card) => (
            <div
              key={card.name}
              className="group relative bg-lf-graphite px-6 py-6 transition-colors duration-200 hover:bg-lf-surface"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-lf-volt" />
              <h3 className="text-base font-black text-lf-text">{card.name}</h3>
              <p className="mt-2 text-sm leading-[1.5] text-lf-muted">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Demais modalidades em pills */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {otherAulas.map((aula) => (
            <span
              key={aula}
              className="border border-lf-line px-3 py-1.5 text-xs font-medium text-lf-muted"
            >
              {aula}
            </span>
          ))}
        </div>
        <p className="text-xs text-lf-muted/50">A grade de aulas pode variar por unidade.</p>
      </Section>

      {/* Bloco "A grade varia por unidade" */}
      <Section bg="graphite">
        <div className="max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
              Consulte sua unidade
            </p>
          </div>
          <h2 className="text-3xl font-black leading-[1.02] text-lf-text md:text-4xl">
            A grade varia por unidade.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-lf-muted">
            Consulte as aulas disponíveis na unidade mais próxima de você.
          </p>
          <div className="mt-8">
            <Button href="/unidades" variant="volt" size="md">
              Ver aulas da sua unidade
            </Button>
          </div>
        </div>
      </Section>

      {/* Fecho comercial */}
      <Section bg="black">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
              Planos LoudFit
            </p>
            <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          </div>
          <h2 className="text-4xl font-black leading-[1.02] text-lf-text md:text-5xl">
            Um plano. Tudo incluso.
          </h2>
          <p className="mx-auto mt-5 max-w-[50ch] text-base leading-relaxed text-lf-muted">
            Musculação e todas as aulas coletivas da sua unidade na mesma mensalidade.
          </p>
          <div className="mt-8">
            <Button href="/unidades" variant="volt" size="lg">
              Começar matrícula
            </Button>
          </div>
        </div>
      </Section>

    </div>
  )
}
