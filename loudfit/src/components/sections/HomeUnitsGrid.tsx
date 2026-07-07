import Link from 'next/link'
import { getUnits } from '@/lib/supabase'
import { Section, SectionHeader } from '@/components/ui/Section'
import { UnitBadge } from '@/components/ui/Badge'
import { Reveal } from '@/components/ui/Reveal'
import { shortUnitName } from '@/lib/utils'

export async function HomeUnitsGrid() {
  const units = await getUnits()

  return (
    <Section id="unidades" bg="cream" className="py-16 md:py-24">
      <Reveal>
        <SectionHeader
          label="Unidades"
          title="Encontre sua LoudFit."
          subtitle="5 unidades em operação e 1 em inauguração — Campinas, Valinhos, São Paulo e Mogi Mirim."
          dark
          className="mb-8 md:mb-12"
        />
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((unit, i) => {
          const name = shortUnitName(unit)
          const href = `/unidades/${unit.slug}`

          return (
            <Reveal key={unit.id} delay={Math.min(i * 0.06, 0.3)}>
              <article className="flex flex-col overflow-hidden bg-white border border-[#E8E8E4] shadow-[0_2px_16px_rgba(0,0,0,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(0,0,0,0.09)]">
                {/* Placeholder foto 4:3 */}
                <div className="relative aspect-[4/3] bg-[#EFEFED] overflow-hidden">
                  <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-[#C8C6C0] select-none">
                    LF
                  </span>
                  <div className="absolute top-3 right-3">
                    <UnitBadge status={unit.status} />
                  </div>
                  {/* Accent diagonal — identidade */}
                  <div className="absolute top-0 left-0 h-0 w-0 border-t-[28px] border-t-lf-volt border-r-[28px] border-r-transparent" />
                </div>

                {/* Conteúdo */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black leading-tight text-[#141414]">{name}</h3>
                  <p className="mt-1 text-sm text-[#4A4A4A]">
                    {unit.bairro} · {unit.cidade}
                  </p>

                  {/* CTAs */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={href}
                      className="flex-1 border border-[#E8E8E4] py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[#141414] transition hover:border-[#141414] hover:bg-[#F0EFED]"
                    >
                      Ver unidade
                    </Link>
                    <Link
                      href={`${href}#planos`}
                      className="flex-1 bg-lf-volt py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-lf-black transition hover:bg-lf-volt-deep"
                    >
                      Matricular online
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}
