import Link from 'next/link'
import Image from 'next/image'
import { UnitBadge } from './Badge'
import type { Unit } from '@/types'
import { unitDisplayName } from '@/lib/utils'

export function UnitCard({ unit }: { unit: Unit }) {
  const hasMods = unit.modalidades.length > 0
  const unitName = unitDisplayName(unit)

  return (
    <Link
      href={`/unidades/${unit.slug}`}
      className="group block overflow-hidden transition duration-300 hover:-translate-y-1"
    >
      {/* Imagem full + overlay */}
      <div className="relative aspect-[4/3] overflow-hidden bg-lf-graphite">
        {unit.foto_capa ? (
          <Image
            src={unit.foto_capa}
            alt={`Academia ${unitName}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl font-black text-lf-muted">LF</span>
          </div>
        )}

        {/* Overlay permanente — gradiente do baixo */}
        <div className="absolute inset-0 bg-gradient-to-t from-lf-black via-lf-black/30 to-transparent" />

        {/* Diagonal corner mark — identidade LoudFit */}
        <div className="absolute top-0 left-0 z-10 h-0 w-0 border-t-[32px] border-t-lf-volt border-r-[32px] border-r-transparent" />

        {/* Badge status */}
        <div className="absolute left-3 top-3">
          <UnitBadge status={unit.status} />
        </div>

        {/* Conteúdo sobre a imagem */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-xl font-black text-white leading-tight group-hover:text-lf-volt transition-colors duration-200">
            {unitName}
          </h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-lf-volt">
            {unit.bairro} / {unit.cidade}
          </p>

          {/* Tags de modalidades */}
          {hasMods && (
            <div className="mt-2 flex flex-wrap gap-1">
              {unit.modalidades.slice(0, 4).map((m) => (
                <span
                  key={m}
                  className="border border-white/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/55"
                >
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* CTA inline */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/70 group-hover:text-lf-volt transition-colors duration-200">
              Ver unidade
            </span>
            <span className="flex h-7 w-7 items-center justify-center bg-lf-volt/0 border border-white/30 text-white text-sm transition-all duration-200 group-hover:bg-lf-volt group-hover:border-lf-volt group-hover:text-lf-black group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
