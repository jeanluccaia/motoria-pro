import Link from 'next/link'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

export function HomeUnitsGrid() {
  return (
    <Section id="unidades" bg="cream" className="py-14 md:py-20">
      <Reveal>
        <SectionHeader
          label="Unidades"
          title="Encontre sua LoudFit"
          subtitle="Escolha a unidade mais próxima e veja planos, horários, aulas e matrícula online."
          dark
          className="mb-6 md:mb-8"
        />
      </Reveal>

      <Reveal delay={0.06}>
        <article className="flex flex-col gap-6 border border-[#E8E8E4] bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] md:flex-row md:items-center md:justify-between md:p-8">
          <p className="min-w-0 max-w-2xl text-sm leading-relaxed text-[#4A4A4A] md:text-base">
            Unidades em Campinas, Valinhos, São Paulo e Mogi Mirim.
          </p>
          <Link
            href="/unidades"
            className="lf-cta-volt inline-flex min-h-[48px] w-full min-w-0 max-w-full items-center justify-center whitespace-normal px-4 py-3 text-center text-xs font-black uppercase tracking-[0.08em] transition hover:-translate-y-0.5 sm:w-auto sm:px-6 sm:text-sm sm:tracking-[0.1em]"
          >
            Ver todas as unidades
          </Link>
        </article>
      </Reveal>
    </Section>
  )
}
