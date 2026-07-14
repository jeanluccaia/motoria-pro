import type { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Section, SectionHeader } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: { absolute: 'Sobre a Loud Fit | A rede que faz o treino falar mais alto' },
  description:
    'Conheça a história, o propósito e a expansão da Loud Fit, uma rede de academias com estrutura completa e mensalidade acessível',
  alternates: { canonical: '/sobre' },
  openGraph: {
    title: 'Sobre a Loud Fit | A rede que faz o treino falar mais alto',
    description:
      'Conheça a história, o propósito e a expansão da Loud Fit, uma rede de academias com estrutura completa e mensalidade acessível',
    url: '/sobre',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre a Loud Fit | A rede que faz o treino falar mais alto',
    description:
      'Conheça a história, o propósito e a expansão da Loud Fit, uma rede de academias com estrutura completa e mensalidade acessível',
    images: ['/opengraph-image'],
  },
}

const historyBlocks = [
  {
    title: 'Estrutura completa',
    body: 'Musculação, cardio e ambientes preparados para diferentes objetivos',
  },
  {
    title: 'Aulas inclusas',
    body: 'Aulas coletivas da unidade dentro do plano, sem cobrança à parte',
  },
  {
    title: 'Presença de bairro',
    body: 'Unidades próximas, pensadas para quem quer treinar todos os dias sem fricção',
  },
]

const loudMeaning = [
  {
    letter: 'L',
    title: 'Liberdade',
    body: 'Treine do seu jeito, no ritmo que faz sentido para a sua rotina.',
  },
  {
    letter: 'O',
    title: 'Ousadia',
    body: 'Desafiar limites faz parte da nossa cultura, dentro e fora do treino.',
  },
  {
    letter: 'U',
    title: 'União',
    body: 'Uma comunidade que cresce junto, com pessoas que treinam por perto todos os dias.',
  },
  {
    letter: 'D',
    title: 'Determinação',
    body: 'Constância é o que sustenta os resultados que aparecem no espelho.',
  },
]

const values = [
  { title: 'Disciplina', body: 'Fazer o que precisa ser feito, todos os dias' },
  { title: 'Respeito', body: 'Cuidar das pessoas, dos espaços e da experiência' },
  { title: 'Evolução', body: 'Melhorar um pouco a cada semana, dentro e fora do treino' },
  { title: 'Compromisso', body: 'Assumir o combinado e entregar o combinado' },
  { title: 'Energia', body: 'Ambiente que puxa quem entra pra treinar de verdade' },
  { title: 'Resultado', body: 'Consistência que aparece na saúde, no espelho e no dia a dia' },
]

// Flag desligada até termos fotos e biografias oficiais dos fundadores.
const showFounders = false

export default function SobrePage() {
  return (
    <div className="pt-16">
      <section className="relative flex min-h-[620px] items-end overflow-hidden bg-lf-black py-16 sm:min-h-[680px] md:min-h-[78vh] md:py-24 lg:min-h-[86vh] lg:py-28">
        <Image
          src="/assets/images/real-facade.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.28)_0%,rgba(8,8,8,0.22)_36%,rgba(8,8,8,0.92)_100%),linear-gradient(90deg,rgba(8,8,8,0.90)_0%,rgba(8,8,8,0.52)_44%,rgba(8,8,8,0.12)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
        <div className="absolute bottom-0 left-0 h-[3px] w-56 -skew-x-12 origin-left bg-lf-volt" />

        <div className="relative z-10 mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal>
            <div className="max-w-[22rem] sm:max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lf-volt">
                  Sobre a Loud Fit
                </p>
              </div>
              <h1 className="text-[1.9rem] font-black uppercase leading-[1.02] text-lf-text sm:text-[clamp(2.4rem,5.5vw,5rem)]">
                Uma rede criada para transformar treino em experiência
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-lf-text/80 md:text-lg">
                Academias completas, aulas coletivas inclusas e uma operação que aproxima cada pessoa da rotina de treino todos os dias.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/unidades" variant="volt" size="md" className="font-extrabold sm:px-8 sm:py-4 sm:text-base">
                  Conhecer unidades
                </Button>
                <Button href="/#planos" variant="outline" size="sm">
                  Ver planos
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Section bg="black" className="border-b border-lf-line">
        <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <SectionHeader
                label="Nossa história"
                title="A Loud Fit nasceu para entregar uma academia completa, acessível e com energia de comunidade"
                className="mb-6"
              />
              <p className="max-w-sm text-base leading-relaxed text-lf-muted">
                Mais do que equipamentos, a Loud Fit reúne estrutura, aulas coletivas, atendimento
                próximo e uma rotina de treino pensada para quem quer começar, evoluir e se manter
                em movimento.
              </p>
            </div>
          </Reveal>

          <div className="flex flex-col gap-4">
            {historyBlocks.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.08}>
                <article className="border border-lf-line bg-lf-graphite/50 p-6 transition-colors hover:border-lf-volt/30 md:p-7">
                  <div className="mb-4 h-[3px] w-8 bg-lf-volt" />
                  <h2 className="text-xl font-black uppercase leading-tight text-lf-text">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-lf-muted">
                    {item.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section bg="graphite" className="relative overflow-hidden">
        <div className="absolute right-0 top-0 h-28 w-28 -skew-x-12 bg-lf-volt" aria-hidden="true" />
        <SectionHeader
          label="Identidade"
          title="O que significa LOUD?"
          subtitle="Quatro princípios que traduzem a energia da marca dentro e fora do treino."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loudMeaning.map((item, index) => (
            <Reveal key={item.letter} delay={index * 0.08}>
              <article className="group relative min-h-[300px] overflow-hidden border border-lf-line bg-lf-black p-6 transition-all hover:-translate-y-1 hover:border-lf-volt/50 md:p-7">
                <span className="absolute -right-3 -top-8 font-display text-[12rem] font-black leading-none text-lf-surface transition-colors group-hover:text-lf-volt/10">
                  {item.letter}
                </span>
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <span className="inline-flex h-14 w-14 items-center justify-center bg-lf-volt text-4xl font-black leading-none text-lf-black">
                      {item.letter}
                    </span>
                    <h2 className="mt-8 text-4xl font-black uppercase leading-none text-lf-text">
                      {item.title}
                    </h2>
                  </div>
                  <p className="mt-10 max-w-xs text-base leading-relaxed text-lf-muted">
                    {item.body}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section bg="cream" className="text-[#141414]">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <article className="min-h-full border-l-4 border-lf-volt bg-white p-6 shadow-[0_1px_0_0_rgba(20,20,20,0.08)] md:p-8">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#7A6900]">
                Nossa missão
              </p>
              <h2 className="text-4xl font-black uppercase leading-tight md:text-5xl">
                Fazer treino de qualidade caber na rotina e no bolso de mais gente
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#4A4A4A] md:text-lg">
                Estrutura completa, aulas coletivas inclusas e uma operação de bairro para quem
                quer começar, evoluir e não parar.
              </p>
            </article>
          </Reveal>

          <Reveal delay={0.08}>
            <article className="min-h-full bg-[#141414] p-6 text-lf-text md:p-8">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.14em] text-lf-volt">
                Nossa visão
              </p>
              <h2 className="text-4xl font-black uppercase leading-tight md:text-5xl">
                Ser referência nacional em academias
              </h2>
              <p className="mt-5 text-base leading-relaxed text-lf-muted md:text-lg">
                Unindo estrutura, atendimento, tecnologia e uma comunidade forte, tornando a Loud
                Fit uma das maiores redes fitness do Brasil.
              </p>
            </article>
          </Reveal>
        </div>
      </Section>

      <Section bg="black">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <div>
              <SectionHeader
                label="Nossos valores"
                title="O padrão que guia cada treino, unidade e decisão"
                subtitle="Valores simples, repetidos todos os dias na operação, no atendimento e na relação com a comunidade."
                className="mb-0"
              />
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {values.map((value, index) => (
              <Reveal key={value.title} delay={index * 0.06}>
                <article className="group flex min-h-[136px] flex-col justify-between gap-3 border border-lf-line bg-lf-graphite p-5 transition-all hover:border-lf-volt/40 hover:bg-lf-surface">
                  <h2 className="text-2xl font-black uppercase leading-none text-lf-text">
                    {value.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-lf-muted">
                    {value.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {showFounders && (
        <Section bg="graphite" className="overflow-hidden">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <Reveal>
              <div>
                <SectionHeader
                  label="Pessoas"
                  title="Quem constrói a Loud Fit"
                  subtitle="Uma marca construída por pessoas apaixonadas por transformar vidas através do esporte."
                  className="mb-8"
                />
              </div>
            </Reveal>
            {/* Cards de fundadores entram aqui quando fotos oficiais estiverem disponíveis. */}
          </div>
        </Section>
      )}

      <Section bg="black" className="relative overflow-hidden border-t border-lf-line lg:py-32">
        <Image
          src="/assets/images/real-weights.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-20"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,0.98),rgba(8,8,8,0.88),rgba(8,8,8,0.65))]" />
        <Reveal>
          <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-lf-volt">
              Próximo passo
            </p>
            <h2 className="text-4xl font-black uppercase leading-[1.04] text-lf-text sm:text-5xl md:text-6xl">
              Venha viver a experiência Loud Fit
            </h2>
            <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Button href="/unidades" variant="volt" size="lg" className="w-full sm:w-auto">
                Escolha sua unidade
              </Button>
              <Button href="/franquias" variant="ghost" size="lg" className="w-full sm:w-auto">
                Conheça a franquia
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>
    </div>
  )
}
