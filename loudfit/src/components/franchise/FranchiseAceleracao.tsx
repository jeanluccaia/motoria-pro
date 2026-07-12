'use client'

import { useState, useId } from 'react'
import Image from 'next/image'
import { trackFranchiseEvent } from '@/lib/franchise-analytics'

interface Phase {
  id: 'antes' | 'inauguracao' | 'primeiros'
  label: string
  eyebrow: string
  headline: string
  intro: string
  bullets: string[]
  image: string
  imageAlt: string
}

const phases: Phase[] = [
  {
    id: 'antes',
    label: 'Antes da inauguração',
    eyebrow: 'Fase 01',
    headline: 'Comece a captar antes da inauguração',
    intro:
      'A rede prepara a praça enquanto a obra acontece: presença digital, público local aquecido e primeiras matrículas antes da porta abrir.',
    bullets: [
      'Presença digital da unidade',
      'Captação de interessados e lista de espera',
      'Campanhas locais de reconhecimento',
      'Pré-venda e primeiras matrículas',
    ],
    image: '/assets/images/real-facade.jpg',
    imageAlt: 'Fachada de uma unidade Loud Fit em preparação para abertura',
  },
  {
    id: 'inauguracao',
    label: 'Inauguração',
    eyebrow: 'Fase 02',
    headline: 'Um lançamento coordenado com a rede',
    intro:
      'Comercial, marketing e comunicação da rede alinhados com o time local no dia da abertura.',
    bullets: [
      'Operação de lançamento com apoio da rede',
      'Comunicação coordenada nas redes',
      'Ativação comercial no dia da abertura',
      'Onboarding dos primeiros alunos ativos',
    ],
    image: '/assets/images/real-opening.jpg',
    imageAlt: 'Momento de abertura de uma unidade Loud Fit com pessoas presentes',
  },
  {
    id: 'primeiros',
    label: 'Primeiros meses',
    eyebrow: 'Fase 03',
    headline: 'Acompanhamento próximo pós-abertura',
    intro:
      'A rede acompanha métricas, aponta ajustes e conduz a unidade nos primeiros ciclos comerciais.',
    bullets: [
      'Time de expansão presente',
      'Leitura de matrícula e retenção',
      'Ajustes comerciais e de marketing local',
      'Consolidação da base de alunos',
    ],
    image: '/assets/images/studio-community.jpg',
    imageAlt: 'Ambiente de aula coletiva com alunos treinando em uma unidade Loud Fit',
  },
]

export function FranchiseAceleracao() {
  const [active, setActive] = useState<Phase['id']>('antes')
  const tablistId = useId()
  const activePhase = phases.find((p) => p.id === active)!

  return (
    <section
      id="aceleracao"
      className="relative bg-lf-black py-20 md:py-28 lg:py-32"
      aria-labelledby="aceleracao-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-12 max-w-3xl md:mb-16">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt">
              Diferencial Loud Fit
            </p>
          </div>
          <h2
            id="aceleracao-title"
            className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-lf-text"
            style={{ fontSize: 'clamp(2.2rem, 4.4vw, 4rem)' }}
          >
            Aceleração Loud Fit
          </h2>
          <p className="mt-6 max-w-[48ch] text-base leading-[1.65] text-lf-muted md:text-lg">
            Três fases pensadas para preparar a demanda antes da inauguração e sustentar os primeiros ciclos da unidade.
          </p>
        </div>

        {/* Tablist */}
        <div
          role="tablist"
          aria-label="Fases da Aceleração Loud Fit"
          id={tablistId}
          className="mb-8 grid grid-cols-1 gap-px bg-lf-line sm:grid-cols-3 md:mb-10"
        >
          {phases.map((phase) => {
            const isActive = phase.id === active
            return (
              <button
                key={phase.id}
                role="tab"
                type="button"
                id={`tab-${phase.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${phase.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  setActive(phase.id)
                  trackFranchiseEvent('franchise_aceleracao_tab', { phase: phase.id })
                }}
                className={
                  'flex flex-col items-start gap-1 border-t-[3px] bg-lf-black px-5 py-5 text-left transition-colors md:px-6 md:py-6 ' +
                  (isActive
                    ? 'border-lf-volt text-lf-text'
                    : 'border-transparent text-lf-muted hover:border-lf-volt/40 hover:text-lf-text')
                }
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-lf-volt">
                  {phase.eyebrow}
                </span>
                <span
                  className="font-black uppercase leading-tight tracking-[-0.005em]"
                  style={{ fontSize: 'clamp(1.05rem, 1.6vw, 1.4rem)' }}
                >
                  {phase.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Active panel */}
        <div
          role="tabpanel"
          id={`panel-${activePhase.id}`}
          aria-labelledby={`tab-${activePhase.id}`}
          className="grid gap-8 border border-lf-line bg-lf-graphite p-6 md:grid-cols-[1fr_1fr] md:gap-14 md:p-10 lg:p-14"
        >
          <div className="flex flex-col gap-6">
            <h3
              className="text-balance font-black uppercase leading-[1] tracking-[-0.005em] text-lf-text"
              style={{ fontSize: 'clamp(1.7rem, 2.6vw, 2.4rem)' }}
            >
              {activePhase.headline}
            </h3>
            <p className="max-w-[44ch] text-[15.5px] leading-[1.65] text-lf-muted">
              {activePhase.intro}
            </p>
            <ul className="mt-2 flex flex-col gap-3">
              {activePhase.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-[14.5px] leading-[1.55] text-lf-text/85">
                  <span aria-hidden="true" className="mt-[9px] inline-block h-1.5 w-3 shrink-0 bg-lf-volt" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden border border-lf-line md:aspect-auto md:min-h-[420px]">
            <Image
              src={activePhase.image}
              alt={activePhase.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-lf-black/45 via-transparent to-transparent" />
          </div>
        </div>

        {/* Mobile timeline hint — accessible progression indicator */}
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-lf-muted sm:hidden">
          {phases.findIndex((p) => p.id === active) + 1} de {phases.length}
        </p>

      </div>
    </section>
  )
}
