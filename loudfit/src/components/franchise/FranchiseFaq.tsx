'use client'

import { useId, useState } from 'react'
import { franchiseConfig, franchiseNumbers } from '@/lib/franchise'
import { trackFranchiseEvent } from '@/lib/franchise-analytics'

interface FaqItem {
  q: string
  a: string
}

function buildFaq(): FaqItem[] {
  const show = franchiseConfig.showFinancialNumbers
  return [
    {
      q: 'Qual é o investimento?',
      a: show
        ? `O investimento estimado parte de ${franchiseNumbers.totalInvestment}, mais equipamentos importados. A taxa promocional para as dez primeiras unidades é de ${franchiseNumbers.franchiseFee.firstUnits}. Detalhes completos ficam para a qualificação, junto da Circular de Oferta de Franquia.`
        : 'Os valores exatos são apresentados durante a qualificação, junto da Circular de Oferta de Franquia.',
    },
    {
      q: 'Preciso ter experiência no mercado fitness?',
      a: 'Não. Importa o perfil empreendedor, a capacidade de investimento e a disposição para operar dentro do padrão da rede.',
    },
    {
      q: 'A Loud Fit ajuda na escolha do ponto?',
      a: 'Sim. O time de expansão faz análise de praça e emite parecer técnico sobre o ponto antes de qualquer contrato.',
    },
    {
      q: 'Como funciona a implantação?',
      a: 'A rede acompanha projeto, obra, padrão visual, equipamentos e treinamento da equipe. A Aceleração Loud Fit ocorre em paralelo para preparar a demanda da praça.',
    },
    {
      q: 'O que acontece após a candidatura?',
      a: 'O time de expansão analisa o perfil. Se houver aderência, seguimos para a conversa de qualificação e, a partir daí, para as próximas etapas.',
    },
  ]
}

export function FranchiseFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const idBase = useId()
  const faq = buildFaq()

  function toggle(i: number) {
    setOpenIdx((prev) => {
      const next = prev === i ? null : i
      if (next !== null) {
        trackFranchiseEvent('franchise_faq_open', { question_index: i })
      }
      return next
    })
  }

  return (
    <section
      id="faq"
      className="relative bg-white py-20 md:py-28 lg:py-32"
      aria-labelledby="faq-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-16 lg:gap-20">
          <div className="md:sticky md:top-24 md:self-start">
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-[#0B0B0C]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
                Perguntas frequentes
              </p>
            </div>
            <h2
              id="faq-title"
              className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-[#0B0B0C]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.6rem)' }}
            >
              Antes<br />de perguntar
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-[1.65] text-[#3f3f42]">
              As respostas cobrem o que mais aparece nas primeiras conversas. Se restar alguma dúvida, envie a candidatura — o time responde na qualificação.
            </p>
          </div>

          <ul className="divide-y divide-[#0B0B0C]/12 border-y border-[#0B0B0C]/12">
            {faq.map((item, i) => {
              const isOpen = openIdx === i
              const panelId = `${idBase}-panel-${i}`
              const buttonId = `${idBase}-button-${i}`
              return (
                <li key={item.q}>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(i)}
                    className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors md:py-6"
                  >
                    <span
                      className="pt-1 font-black uppercase leading-tight tracking-[-0.005em] text-[#0B0B0C]"
                      style={{ fontSize: 'clamp(1.05rem, 1.5vw, 1.35rem)' }}
                    >
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className={
                        'mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-[#0B0B0C]/30 text-[#0B0B0C] transition-transform duration-300 ' +
                        (isOpen ? 'rotate-45 border-lf-volt bg-lf-volt/20' : '')
                      }
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <line x1="12" y1="4" x2="12" y2="20" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                      </svg>
                    </span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className="pb-6 pr-4"
                  >
                    <p className="max-w-[62ch] text-[15px] leading-[1.65] text-[#3f3f42]">{item.a}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
