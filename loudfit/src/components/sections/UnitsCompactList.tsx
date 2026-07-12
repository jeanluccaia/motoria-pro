import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { UnitBadge } from '@/components/ui/Badge'
import { getUnits } from '@/lib/supabase'
import { shortUnitName } from '@/lib/utils'

export async function UnitsCompactList() {
  const units = await getUnits().catch(() => [])

  return (
    <Section id="encontre-sua-loudfit" bg="black" className="py-16 md:py-20 lg:py-24">
      <Reveal>
        <div className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-6">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                Unidades
              </p>
            </div>
            <h2 className="text-4xl font-black leading-[1.02] text-lf-text md:text-5xl">
              Encontre sua LoudFit
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-[1.6] text-lf-muted md:text-base">
              Escolha a unidade mais próxima. Veja horários, aulas e finalize sua matrícula online.
            </p>
          </div>
        </div>
      </Reveal>

      {units.length === 0 ? (
        <div className="border border-lf-line bg-lf-graphite/60 p-8 text-center text-sm text-lf-muted">
          Não foi possível listar as unidades agora. Tente novamente em instantes.
        </div>
      ) : (
        <Reveal delay={0.05}>
          <ul className="overflow-hidden rounded-2xl border border-lf-line bg-lf-graphite/70 shadow-[0_10px_40px_rgba(0,0,0,0.28)]">
            {units.map((unit) => {
              const name = shortUnitName(unit)
              return (
                <li key={unit.id} className="border-b border-lf-line last:border-b-0">
                  <Link
                    href={`/unidades/${unit.slug}`}
                    className="group flex flex-col gap-3 px-5 py-5 transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.03] focus-visible:outline-none md:flex-row md:items-center md:justify-between md:gap-6 md:px-7 md:py-6"
                  >
                    <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-lg font-black uppercase leading-tight text-lf-text transition-colors group-hover:text-lf-volt md:text-xl">
                            {name}
                          </h3>
                          <UnitBadge status={unit.status} />
                        </div>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-lf-volt/85">
                          {unit.bairro} / {unit.cidade} — {unit.estado}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-lf-text/70 transition-colors group-hover:text-lf-volt md:gap-3">
                      <span>Ver unidade</span>
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 items-center justify-center border border-white/25 text-sm text-lf-text transition-all duration-200 group-hover:border-lf-volt group-hover:bg-lf-volt group-hover:text-lf-black group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Reveal>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-lf-muted/60">
          Rede em expansão: {units.length > 0 ? units.length : 6} unidades em SP.
        </p>
        <Link
          href="/unidades"
          className="inline-flex min-h-[44px] items-center justify-center border border-lf-line px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-lf-text transition-colors hover:border-lf-volt hover:text-lf-volt"
        >
          Ver todas as unidades
        </Link>
      </div>
    </Section>
  )
}
