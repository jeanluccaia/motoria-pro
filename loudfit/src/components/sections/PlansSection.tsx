'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'
import { getPlans, type Plan } from '@/lib/plans'

const homePlanDescriptions: Record<string, string> = {
  'power-mensal': 'Mês a mês, sem compromisso.',
  'power-mensal-recorrente': 'Cobrança automática mensal.',
  'power-semestral-recorrente': '6 meses com mensalidade reduzida.',
  'power-anual-recorrente': '12 meses com a menor mensalidade.',
}

const commonBenefits = [
  'Musculação',
  'Aulas coletivas inclusas',
  'Estrutura completa',
  'Reconhecimento facial',
  'Convidados: até 5 acessos',
  'Aula experimental grátis',
]

const planConditions: Record<string, string> = {
  'power-mensal':
    'Mês a mês, sem cobrança automática. Ideal para quem quer experimentar sem compromisso de longo prazo.',
  'power-mensal-recorrente':
    'Cobrança automática todo mês. Você treina, a renovação acontece sozinha.',
  'power-semestral-recorrente':
    'Seis meses de treino com mensalidade mais baixa que o plano mensal. Cobrança mensal automática.',
  'power-anual-recorrente':
    'Plano de 12 meses com a menor mensalidade. Cobrança mensal recorrente, sem comprometer de uma só vez o valor total do contrato no limite do cartão. Primeira mensalidade por R$ 9,90.',
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-lf-volt">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function BenefitsInline({ dark }: { dark?: boolean }) {
  return (
    <div className="mt-4">
      <p className={cn('text-[10px] font-bold uppercase tracking-[0.14em]', dark ? 'text-lf-volt' : 'text-[#7A6900]')}>
        Benefícios inclusos
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {commonBenefits.map((b) => (
          <li key={b} className={cn('flex items-start gap-2 text-[12.5px] leading-snug', dark ? 'text-lf-text/85' : 'text-[#3B3832]')}>
            <CheckIcon />
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ConditionsInline({ plan, dark }: { plan: Plan; dark?: boolean }) {
  return (
    <div className="mt-5">
      <p className={cn('text-[10px] font-bold uppercase tracking-[0.14em]', dark ? 'text-lf-volt' : 'text-[#7A6900]')}>
        Condições
      </p>
      <p className={cn('mt-2 text-[12.5px] leading-[1.55]', dark ? 'text-lf-text/75' : 'text-[#4A4A4A]')}>
        {planConditions[plan.slug]}
      </p>
    </div>
  )
}

interface CardProps {
  plan: Plan
  isOpen: boolean
  onToggle: (slug: string) => void
  panelId: string
}

function ExpandableCard({ plan, isOpen, onToggle, panelId }: CardProps) {
  const description = homePlanDescriptions[plan.slug] ?? plan.description
  const isFeatured = plan.featured
  const buttonId = `plan-toggle-${plan.slug}`

  if (isFeatured) {
    return (
      <article
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-3xl bg-[#0F0F0F] shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-all duration-200 motion-reduce:transition-none',
          'order-first md:order-none',
          isOpen && 'ring-2 ring-lf-volt/50',
        )}
      >
        <div className="flex items-center justify-between gap-3 bg-lf-volt px-5 py-3">
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-lf-black">
            O mais vantajoso
          </span>
          <span className="rounded-full bg-lf-black/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-lf-black">
            {plan.badge}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-[20px] font-bold leading-tight text-lf-text [font-family:var(--font-body)]">
            {plan.name}
          </h3>
          <p className="mt-1 text-[13px] leading-snug text-white/55">{description}</p>

          {plan.firstPayment && (
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lf-volt">
                1ª mensalidade
              </p>
              <p className="mt-1.5 flex items-baseline text-lf-text">
                <strong className="text-[48px] font-black leading-none [font-family:var(--font-body)]">
                  {plan.firstPayment.value}
                </strong>
                <span className="ml-0.5 text-[18px] font-bold text-lf-volt">*</span>
              </p>
              <p className="mt-2 text-[12px] leading-snug text-white/45">
                Depois, mensalidade conforme a unidade escolhida.
              </p>
            </div>
          )}

          <div className="mt-6">
            <Link
              href="/unidades"
              className="lf-cta-volt inline-flex w-full min-h-[44px] items-center justify-center rounded-full px-5 py-3 text-[13px] font-bold tracking-normal"
            >
              Começar matrícula
            </Link>
          </div>

          <div className="mt-4">
            <button
              type="button"
              id={buttonId}
              onClick={() => onToggle(plan.slug)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-[12px] font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/50',
                isOpen
                  ? 'border-lf-volt/60 bg-lf-volt/10 text-lf-volt'
                  : 'border-white/10 bg-white/[0.02] text-lf-text/70 hover:border-lf-volt/40 hover:text-lf-volt',
              )}
            >
              <span>{isOpen ? 'Ocultar benefícios e condições' : 'Ver benefícios e condições'}</span>
              <ChevronIcon open={isOpen} />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="border-t border-white/10 pt-3 mt-3"
            >
              <BenefitsInline dark />
              <ConditionsInline plan={plan} dark />
            </div>
          </div>
        </div>
      </article>
    )
  }

  /* Cards comuns — fundo claro */
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-[0_1px_6px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)] transition-all duration-200 motion-reduce:transition-none',
        isOpen
          ? 'border-lf-volt/60 ring-2 ring-lf-volt/40 shadow-[0_10px_30px_rgba(255,224,0,0.15)]'
          : 'border-[#E4DFD4] hover:-translate-y-0.5 hover:shadow-[0_4px_28px_rgba(0,0,0,0.10)]',
      )}
    >
      <div className="flex flex-1 flex-col p-6">
        <span className="mb-4 inline-block self-start rounded-full bg-[#F0EDE6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7A7267]">
          {plan.badge}
        </span>

        <h3 className="text-[20px] font-bold leading-tight text-[#111111] [font-family:var(--font-body)]">
          {plan.name}
        </h3>
        <p className="mt-1 text-[13px] leading-snug text-[#5E5B54]">{description}</p>

        <div className="mt-5 border-t border-[#EDEBE5] pt-5">
          <p className="flex items-baseline text-[#111111]">
            <strong className="text-[38px] font-black leading-none [font-family:var(--font-body)]">
              {plan.price}
            </strong>
            <span className="ml-1 text-[14px] text-[#5E5B54]">{plan.period}</span>
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/unidades"
            className="lf-cta-volt inline-flex w-full min-h-[44px] items-center justify-center rounded-full px-5 py-3 text-[13px] font-bold tracking-normal"
          >
            Começar matrícula
          </Link>
        </div>

        <div className="mt-4">
          <button
            type="button"
            id={buttonId}
            onClick={() => onToggle(plan.slug)}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className={cn(
              'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-[12px] font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/60',
              isOpen
                ? 'border-[#7A6900] bg-[#FFF6C2] text-[#141414]'
                : 'border-[#E4DFD4] bg-[#FAF9F5] text-[#5E5B54] hover:border-[#7A6900] hover:text-[#141414]',
            )}
          >
            <span>{isOpen ? 'Ocultar benefícios e condições' : 'Ver benefícios e condições'}</span>
            <ChevronIcon open={isOpen} />
          </button>

          <div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            hidden={!isOpen}
            className="border-t border-[#EDEBE5] pt-3 mt-3"
          >
            <BenefitsInline />
            <ConditionsInline plan={plan} />
          </div>
        </div>
      </div>
    </article>
  )
}

export function PlansSection() {
  const plans = getPlans()
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  function handleToggle(slug: string) {
    setOpenSlug((current) => (current === slug ? null : slug))
  }

  return (
    <Section id="planos" bg="cream" className="relative overflow-hidden py-16 md:py-24 lg:py-28">
      <Reveal>
        <div className="mb-3 flex items-center gap-3">
          <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Planos
          </p>
        </div>
        <h2 className="text-4xl font-black leading-[1.02] text-[#141414] md:text-5xl">
          Escolha seu plano
        </h2>
      </Reveal>

      {/* items-start deixa cada card crescer para baixo quando expandido, sem esticar os outros */}
      <div className="mt-8 grid grid-cols-1 items-start gap-5 sm:grid-cols-2 md:mt-10 xl:grid-cols-4">
        {plans.map((plan, i) => (
          <Reveal key={plan.slug} delay={i * 0.06} className="flex h-full flex-col">
            <ExpandableCard
              plan={plan}
              isOpen={openSlug === plan.slug}
              onToggle={handleToggle}
              panelId={`plan-panel-${plan.slug}`}
            />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.28}>
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#E4DFD4] bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#141414]">
              Ainda em dúvida? Faça uma aula experimental grátis.
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[#5E5B54]">
              Teste musculação, cardio ou aulas coletivas antes de escolher seu plano.
            </p>
          </div>
          <Link
            href="/unidades"
            className="inline-flex h-10 shrink-0 items-center rounded-full border border-[#D8D0C0] px-5 text-[12px] font-bold uppercase tracking-[0.06em] text-[#111111] transition hover:bg-[#EFE9DA]"
          >
            Agendar aula experimental
          </Link>
        </div>
      </Reveal>

      <Reveal delay={0.32}>
        <div className="mt-5 flex flex-col gap-1 border-t border-[#D8D0C0] pt-5 text-[11px] text-[#6E675C] sm:flex-row sm:justify-between">
          <p>*R$ 9,90 na primeira mensalidade apenas no Power Anual Recorrente.</p>
          <p>Valores e condições podem variar conforme a unidade. Ipiranga possui tabela própria.</p>
        </div>
      </Reveal>
    </Section>
  )
}
