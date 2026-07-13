import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { PlansGrid } from '@/components/plans/PlansGrid'
import { getPlans } from '@/lib/plans'

export function PlansSection() {
  const plans = getPlans()

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
      <div className="mt-8 md:mt-10">
        <PlansGrid
          plans={plans}
          variant="home"
          ctaBase="/unidades"
          ctaLabel="Começar matrícula"
          homePricing
        />
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
