import Link from 'next/link'
import Image from 'next/image'
import { UnitBadge } from './Badge'
import type { Unit } from '@/types'

export function UnitCard({ unit }: { unit: Unit }) {
  return (
    <Link
      href={`/unidades/${unit.slug}`}
      className="group block overflow-hidden border border-lf-line bg-lf-surface transition-all duration-300 hover:border-lf-volt/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {unit.foto_capa ? (
          <Image
            src={unit.foto_capa}
            alt={`LoudFit ${unit.nome}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-lf-graphite">
            <span className="text-4xl font-black text-lf-muted">LF</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-lf-black/60 via-transparent to-transparent" />
        <div className="absolute left-3 top-3">
          <UnitBadge status={unit.status} />
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-black text-lf-text transition-colors group-hover:text-lf-volt">
          {unit.nome}
        </h3>
        <p className="mt-1 text-sm text-lf-muted">
          {unit.bairro} / {unit.cidade}
        </p>

        {unit.modalidades?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {unit.modalidades.slice(0, 3).map((m) => (
              <span key={m} className="bg-lf-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-lf-muted">
                {m}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 border-t border-lf-line pt-4">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-lf-volt">
            Ver unidade e planos
          </span>
        </div>
      </div>
    </Link>
  )
}
