import Link from 'next/link'
import Image from 'next/image'
import { UnitBadge } from './Badge'
import type { Unit } from '@/types'

export function UnitCard({ unit }: { unit: Unit }) {
  return (
    <Link
      href={`/unidades/${unit.slug}`}
      className="group block bg-lf-surface border border-lf-line hover:border-lf-volt/40 transition-all duration-300 overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {unit.foto_capa ? (
          <Image
            src={unit.foto_capa}
            alt={`LoudFit ${unit.nome}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-lf-graphite flex items-center justify-center">
            <span className="text-lf-muted text-4xl font-black">LF</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <UnitBadge status={unit.status} />
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-black text-lf-text group-hover:text-lf-volt transition-colors">
          {unit.nome}
        </h3>
        <p className="text-sm text-lf-muted mt-1">{unit.bairro} · {unit.cidade}</p>

        {unit.modalidades?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {unit.modalidades.slice(0, 3).map((m) => (
              <span key={m} className="text-[10px] uppercase tracking-wider bg-lf-line text-lf-muted px-2 py-0.5">
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
