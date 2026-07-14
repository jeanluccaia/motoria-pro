import type { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'

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

const pillars = [
  {
    title: 'Estrutura completa',
    body: 'Musculação, cardio e ambientes preparados para diferentes objetivos',
  },
  {
    title: 'Aulas inclusas',
    body: 'Aulas coletivas da unidade dentro da mensalidade',
  },
  {
    title: 'Perto de você',
    body: 'Unidades pensadas para fazer o treino caber na rotina',
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

export default function SobrePage() {
  return (
    <div className="pt-16">
      {/* 1. Hero tipográfica — sem imagem */}
      <section className="relative bg-lf-black">
        <div className="mx-auto flex min-h-[380px] max-w-[1360px] flex-col justify-center px-6 py-16 sm:min-h-[440px] sm:px-8 md:min-h-[500px] md:py-24 lg:px-12">
          <Reveal>
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                  Sobre a Loud Fit
                </p>
              </div>
              <h1 className="text-[2.25rem] font-black uppercase leading-[0.98] text-lf-text sm:text-[clamp(2.6rem,6vw,4.75rem)]">
                O treino fala mais alto
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-lf-muted md:text-lg">
                Uma rede criada para entregar estrutura, energia e treino de verdade por uma
                mensalidade acessível
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. Nossa história */}
      <Section bg="graphite" className="border-t border-lf-line">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <Reveal>
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                  Nossa história
                </p>
              </div>
              <h2 className="text-3xl font-black uppercase leading-[1.02] text-lf-text md:text-[2.6rem]">
                Uma academia completa
                <br />
                que cresceu sem perder a proximidade
              </h2>

              <div className="mt-7 flex max-w-xl flex-col gap-5 text-[15px] leading-relaxed text-lf-muted md:text-base">
                <p>
                  A Loud Fit nasceu para ocupar um espaço que faltava — uma academia com
                  estrutura completa, aulas coletivas inclusas e um jeito de treinar próximo,
                  sem os preços das grandes redes premium.
                </p>
                <p>
                  Foi crescendo unidade por unidade, no bairro, no shopping, na esquina. A
                  cada abertura, o mesmo compromisso: manter a estrutura séria e a
                  experiência de gente que conhece quem treina.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-lf-line bg-lf-black md:aspect-[5/4] lg:aspect-[4/3]">
              <Image
                src="/assets/images/real-weights.jpg"
                alt="Área interna de uma unidade Loud Fit"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(8,8,8,0.35)_100%)]" />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 3. O que você encontra aqui */}
      <Section bg="black" className="border-t border-lf-line">
        <Reveal>
          <div className="mb-10 max-w-3xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                No dia a dia
              </p>
            </div>
            <h2 className="text-3xl font-black uppercase leading-[1.05] text-lf-text md:text-4xl">
              O que você encontra aqui
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-0 border-y border-lf-line md:grid-cols-3 md:divide-x md:divide-lf-line">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <article className="flex flex-col gap-2 border-b border-lf-line px-1 py-6 last:border-b-0 md:border-b-0 md:px-6 md:py-7">
                <h3 className="text-lg font-black uppercase leading-tight text-lf-text">
                  {p.title}
                </h3>
                <p className="max-w-sm text-sm leading-relaxed text-lf-muted">{p.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 4. Faixa compacta LOUD */}
      <section className="border-t border-lf-line bg-lf-graphite">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-3 px-6 py-10 text-center sm:px-8 md:flex-row md:justify-center md:gap-6 md:py-8 lg:px-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-lf-volt">
            L · O · U · D
          </span>
          <span
            aria-hidden="true"
            className="hidden h-3 w-px bg-lf-line md:inline-block"
          />
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-lf-text md:text-base">
            Loud é liberdade, ousadia, união e determinação
          </p>
        </div>
      </section>

      {/* 5. Missão e Visão */}
      <Section bg="black" className="border-t border-lf-line">
        <Reveal>
          <div className="mb-10 max-w-3xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                O que nos move
              </p>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <Reveal>
            <article className="border border-lf-line bg-lf-graphite p-6 md:p-8">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-lf-volt">
                Nossa missão
              </p>
              <p className="text-xl font-black uppercase leading-[1.15] text-lf-text md:text-2xl">
                Fazer treino de qualidade caber na rotina e no bolso de mais gente
              </p>
            </article>
          </Reveal>

          <Reveal delay={0.08}>
            <article className="border border-lf-line bg-lf-graphite p-6 md:p-8">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-lf-volt">
                Nossa visão
              </p>
              <p className="text-xl font-black uppercase leading-[1.15] text-lf-text md:text-2xl">
                Crescer como uma rede forte, próxima e reconhecida pela qualidade da experiência
              </p>
            </article>
          </Reveal>
        </div>
      </Section>

      {/* 6. Valores compactos */}
      <Section bg="graphite" className="border-t border-lf-line">
        <Reveal>
          <div className="mb-10 max-w-3xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                Valores
              </p>
            </div>
            <h2 className="text-3xl font-black uppercase leading-[1.05] text-lf-text md:text-4xl">
              O padrão que guia a Loud Fit
            </h2>
          </div>
        </Reveal>

        <div className="border-y border-lf-line">
          <ul className="grid grid-cols-1 divide-y divide-lf-line md:grid-cols-2 md:divide-y-0 lg:grid-cols-3">
            {values.map((v, i) => (
              <li
                key={v.title}
                className={[
                  'flex flex-col gap-1.5 px-1 py-5 md:px-5 md:py-6',
                  i % 2 === 1 ? 'md:border-l md:border-lf-line' : '',
                  i >= 2 ? 'md:border-t md:border-lf-line' : '',
                  'lg:border-l lg:border-t lg:border-lf-line first:lg:border-l-0',
                  i < 3 ? 'lg:border-t-0' : '',
                  i === 3 ? 'lg:border-l-0' : '',
                ].join(' ')}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-lf-volt">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg font-black uppercase leading-tight text-lf-text">
                  {v.title}
                </h3>
                <p className="max-w-sm text-sm leading-relaxed text-lf-muted">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 7. CTA final */}
      <section className="border-t border-lf-line bg-lf-black">
        <div className="mx-auto flex max-w-[1360px] flex-col items-start gap-6 px-6 py-16 sm:px-8 md:py-20 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
              Próximo passo
            </p>
          </div>
          <h2 className="max-w-3xl text-3xl font-black uppercase leading-[1.02] text-lf-text md:text-5xl">
            Venha treinar com a gente
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-lf-muted md:text-lg">
            Encontre a Loud Fit mais próxima e conheça a estrutura da sua unidade
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button href="/unidades" variant="volt" size="lg">
              Escolher minha unidade
            </Button>
            <Button
              href="/franquias"
              variant="outline"
              size="lg"
              className="hidden sm:inline-flex"
            >
              Conhecer a franquia
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
