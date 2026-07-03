import Link from 'next/link'
import Image from 'next/image'
import { UnitBadge } from './Badge'
import type { Unit } from '@/types'

export function UnitCard({ unit }: { unit: Unit }) {
  return (
    <Link
      href={`/unidades/${unit.slug}`}
      className="group block overflow-hidden bg-white border border-gray-200 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-lf-volt/40 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {unit.foto_capa ? (
          <Image
            src={unit.foto_capa}
            alt={unit.nome}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover opacity-85 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-lf-graphite">
            <span className="text-4xl font-black text-lf-muted">LF</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-lf-black/80 via-lf-black/10 to-transparent" />
        <div className="absolute left-3 top-3">
          <UnitBadge status={unit.status} />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Unidade LoudFit
          </p>
          <h3 className="mt-1 text-xl font-black text-white transition-colors group-hover:text-lf-volt">
            {unit.bairro}
          </h3>
          <p className="text-sm text-white/70">{unit.cidade}</p>
        </div>
      </div>

      <div className="p-4">
        {unit.modalidades?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {unit.modalidades.slice(0, 3).map((m) => (
              <span key={m} className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[10px] uppercase tracking-wider text-gray-600">
                {m}
              </span>
            ))}
          </div>
        )}

        <div className={`flex items-center justify-between border-t border-gray-100 pt-3 ${unit.modalidades?.length > 0 ? 'mt-3' : 'mt-0'}`}>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-lf-volt">
            {unit.checkoutUrl ? 'Matricular online' : 'Ver unidade'}
          </span>
          <span className="flex h-8 w-8 items-center justify-center border border-lf-volt/40 text-lf-volt transition group-hover:bg-lf-volt group-hover:text-lf-black">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}
