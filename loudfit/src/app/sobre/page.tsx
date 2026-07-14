import type { Metadata } from 'next'
import Link from 'next/link'
import { Reveal } from '@/components/ui/Reveal'
import { founderUnits } from '@/lib/founder-units'

export const metadata: Metadata = {
  title: { absolute: 'Sobre a Loud Fit | A gente acredita em treino de verdade' },
  description:
    'Conheça a história da Loud Fit, uma rede de academias com estrutura completa, aulas inclusas e mensalidade acessível',
  alternates: { canonical: '/sobre' },
  openGraph: {
    title: 'Sobre a Loud Fit | A gente acredita em treino de verdade',
    description:
      'Conheça a história da Loud Fit, uma rede de academias com estrutura completa, aulas inclusas e mensalidade acessível',
    url: '/sobre',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre a Loud Fit | A gente acredita em treino de verdade',
    description:
      'Conheça a história da Loud Fit, uma rede de academias com estrutura completa, aulas inclusas e mensalidade acessível',
    images: ['/opengraph-image'],
  },
}

const differentials = [
  {
    number: '01',
    title: 'Estrutura de verdade',
    body: 'Equipamentos, cardio, musculação e espaços para diferentes objetivos',
  },
  {
    number: '02',
    title: 'Tudo no mesmo plano',
    body: 'Musculação e aulas coletivas dentro da mesma mensalidade',
  },
  {
    number: '03',
    title: 'Perto da rotina',
    body: 'Unidades feitas para facilitar a constância',
  },
]

const loudWords = ['LIBERDADE', 'OUSADIA', 'UNIÃO', 'DETERMINAÇÃO']

const values = [
  { label: 'Disciplina', accent: false },
  { label: 'Respeito', accent: false },
  { label: 'Evolução', accent: true },
  { label: 'Compromisso', accent: true },
  { label: 'Energia', accent: false },
  { label: 'Resultado', accent: false },
]

const stripUnitPrefix = (label: string) => label.replace(/^Loud Fit\s+/i, '')

export default function SobrePage() {
  return (
    <div className="pt-16">
      {/* 1. HERO — tipográfica, preta, sem imagem */}
      <section className="relative overflow-hidden bg-lf-black">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 top-16 select-none font-black leading-[0.8] tracking-[-0.04em] text-white/[0.035] sm:-right-10 sm:top-20 md:-right-8 md:top-24"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(220px, 60vw, 560px)',
          }}
        >
          LF
        </span>
        <div className="relative mx-auto flex max-w-[1200px] flex-col justify-center px-6 pb-24 pt-16 sm:px-8 sm:pt-20 md:pb-32 md:pt-28 lg:px-12 lg:pb-36 lg:pt-32">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-lf-volt">
              Sobre a Loud Fit
            </p>
            <h1 className="mt-6 text-[clamp(2.55rem,10vw,6rem)] font-black uppercase leading-[0.94] tracking-[-0.015em] text-lf-text md:mt-8">
              Você vem
              <br />
              pelo treino
              <br />
              <span className="text-lf-volt">fica pela energia</span>
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-lf-muted sm:text-lg md:mt-9 md:max-w-lg md:text-xl">
              Estrutura completa e uma mensalidade que cabe na rotina
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. HISTÓRIA + VÍDEO — paper */}
      <section className="bg-[#F4F3EF] text-[#0B0B0C]">
        <div className="mx-auto max-w-[1200px] px-6 py-20 sm:px-8 md:py-28 lg:px-12 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:items-center lg:gap-20">
            <Reveal>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#8b8880]">
                  Como tudo começou
                </p>
                <h2 className="mt-5 max-w-[16ch] text-[clamp(1.85rem,5.5vw,3.25rem)] font-black uppercase leading-[1.0] tracking-[-0.01em] text-[#0B0B0C]">
                  Uma academia completa feita para caber na vida real
                </h2>
                <div className="mt-7 flex max-w-[52ch] flex-col gap-5 text-base leading-relaxed text-[#3d3b34] md:mt-8 md:text-lg">
                  <p>
                    A Loud Fit nasceu de uma percepção simples: muita academia entregava
                    estrutura, mas faltava experiência, identidade e gente por perto.
                  </p>
                  <p>
                    A gente juntou equipamento bom, aulas coletivas no mesmo plano e atendimento
                    próximo. Treinar virou parte natural do dia.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="mx-auto w-full max-w-[300px] sm:max-w-[320px] lg:mx-0 lg:max-w-[360px]">
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[18px] bg-[#0B0B0C] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] lg:rounded-[22px]">
                  <video
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    poster="/media/unidades/vila-industrial/videos/apresentacao-loud-fit-vila-industrial-poster.webp"
                  >
                    <source
                      src="/media/unidades/vila-industrial/videos/apresentacao-loud-fit-vila-industrial.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
                <p className="mt-4 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8b8880]">
                  Conheça a Loud Fit por dentro
                </p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#8b8880]">
                  Apresentação gravada na unidade Vila Industrial
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. DIFERENCIAIS — editorial numerado */}
      <section className="bg-lf-black">
        <div className="mx-auto max-w-[1200px] px-6 py-20 sm:px-8 md:py-28 lg:px-12 lg:py-32">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-lf-volt">
              Por que Loud Fit
            </p>
          </Reveal>

          <div className="mt-10 border-t border-white/10 md:mt-14 md:grid md:grid-cols-3 md:border-t md:border-b md:border-white/10">
            {differentials.map((d, i) => (
              <Reveal key={d.number} delay={i * 0.06}>
                <article
                  className={[
                    'border-b border-white/10 py-8 md:border-b-0 md:py-12',
                    i > 0 ? 'md:border-l md:border-white/10' : '',
                    i === 0 ? 'md:pr-8' : i === 1 ? 'md:px-8' : 'md:pl-8',
                  ].join(' ')}
                >
                  <div className="flex items-baseline gap-4">
                    <span
                      className="text-base font-black text-lf-volt"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {d.number}
                    </span>
                    <h3 className="text-[clamp(1.35rem,3.2vw,1.95rem)] font-black uppercase leading-none tracking-[-0.01em] text-lf-text">
                      {d.title}
                    </h3>
                  </div>
                  <p className="mt-4 max-w-md pl-[34px] text-[15px] leading-relaxed text-white/60 md:pl-0 md:text-base">
                    {d.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LOUD É — bloco amarelo */}
      <section className="bg-lf-volt text-[#0B0B0C]">
        <div className="mx-auto max-w-[1200px] px-6 py-16 sm:px-8 md:py-24 lg:px-12 lg:py-28">
          <div className="lg:flex lg:items-center lg:gap-14">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#0B0B0C]/60 lg:[writing-mode:vertical-rl] lg:rotate-180"
            >
              Loud é
            </p>
            <div className="mt-6 flex flex-col gap-0.5 lg:mt-0">
              {loudWords.map((word, i) => (
                <Reveal key={word} delay={i * 0.05}>
                  <div className="text-[clamp(2.6rem,9vw,4.75rem)] font-black uppercase leading-[0.94] tracking-[-0.02em] text-[#0B0B0C]">
                    {word}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. CRESCIMENTO — preto, 06 unidades */}
      <section className="bg-lf-black">
        <div className="mx-auto max-w-[1200px] px-6 py-20 sm:px-8 md:py-28 lg:px-12 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-end lg:gap-20">
            <Reveal>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-lf-volt">
                  A rede está crescendo
                </p>
                <h2 className="mt-5 max-w-[15ch] text-[clamp(1.85rem,5vw,3.15rem)] font-black uppercase leading-[1.0] tracking-[-0.01em] text-lf-text">
                  Uma unidade de cada vez sem perder a proximidade
                </h2>
                <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-white/60 md:text-lg">
                  A Loud Fit cresce levando a mesma energia, estrutura e experiência para novas
                  cidades
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div>
                <div className="flex items-baseline gap-4 md:gap-5">
                  <span
                    className="font-black leading-[0.78] tracking-[-0.04em] text-lf-volt"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(4.5rem,14vw,8rem)',
                    }}
                  >
                    06
                  </span>
                  <span className="max-w-[130px] text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                    Unidades em SP
                  </span>
                </div>

                <ul className="mt-8 grid grid-cols-1 gap-x-11 sm:grid-cols-2">
                  {founderUnits.map((u, i) => (
                    <li
                      key={u.id}
                      className={[
                        'flex items-center justify-between border-t border-white/10 py-4',
                        i === founderUnits.length - 1 || i === founderUnits.length - 2
                          ? 'sm:border-b sm:border-white/10'
                          : '',
                        founderUnits.length % 2 === 1 && i === founderUnits.length - 1
                          ? 'border-b border-white/10 sm:border-b'
                          : '',
                      ].join(' ')}
                    >
                      <span className="text-[15px] font-bold uppercase tracking-[-0.005em] text-lf-text">
                        {stripUnitPrefix(u.label)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-lf-volt">
                        Em operação
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center gap-3">
                  <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-lf-volt">
                    Novas cidades em breve
                  </span>
                  <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. MISSÃO + VALORES — paper */}
      <section className="bg-[#F4F3EF] text-[#0B0B0C]">
        <div className="mx-auto max-w-[1200px] px-6 py-20 sm:px-8 md:py-28 lg:px-12 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <Reveal>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#8b8880]">
                  O que faz a gente continuar
                </p>
                <h2 className="mt-5 max-w-[13ch] text-[clamp(1.85rem,5vw,3.15rem)] font-black uppercase leading-[1.0] tracking-[-0.01em] text-[#0B0B0C]">
                  Fazer treino de qualidade caber na rotina e no bolso de mais gente
                </h2>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:gap-3">
                {values.map((v) => (
                  <li
                    key={v.label}
                    className={[
                      'flex items-center justify-center rounded-xl px-4 py-4 text-center text-sm font-bold uppercase leading-tight tracking-[-0.01em] sm:px-5 sm:py-5 sm:text-[15px] lg:py-6 lg:text-base',
                      v.accent
                        ? 'bg-[#0B0B0C] text-lf-volt'
                        : 'border border-[#e2dfd6] bg-white text-[#0B0B0C]',
                    ].join(' ')}
                  >
                    {v.label}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. CTA FINAL — amarelo, centralizado */}
      <section className="bg-lf-volt text-[#0B0B0C]">
        <div className="mx-auto max-w-[1200px] px-6 py-20 text-center sm:px-8 md:py-28 lg:px-12 lg:py-32">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#0B0B0C]/60">
              Agora é com você
            </p>
            <h2 className="mx-auto mt-6 max-w-[16ch] text-[clamp(2.15rem,7.5vw,5rem)] font-black uppercase leading-[0.96] tracking-[-0.02em] text-[#0B0B0C] md:mt-8">
              Encontre a Loud Fit mais perto de você
            </h2>
            <p className="mx-auto mt-6 max-w-[42ch] text-base leading-relaxed text-[#2a2a1f] md:text-lg">
              Conheça a estrutura, veja os planos e escolha onde começar
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/unidades"
                className="inline-flex h-14 w-full max-w-[360px] items-center justify-center rounded-[14px] bg-[#0B0B0C] px-8 text-[15px] font-bold uppercase tracking-[0.02em] text-white transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:h-14 sm:w-auto md:h-16 md:text-base"
              >
                Escolher minha unidade
              </Link>
              <Link
                href="/franquias"
                className="hidden h-14 w-auto items-center justify-center rounded-[14px] border-[1.5px] border-[#0B0B0C] bg-transparent px-8 text-[15px] font-bold uppercase tracking-[0.02em] text-[#0B0B0C] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:inline-flex md:h-16 md:text-base"
              >
                Conhecer a franquia
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
