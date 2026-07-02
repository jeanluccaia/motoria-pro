import Link from 'next/link'
import Image from 'next/image'
import { UnitBadge } from './Badge'
import type { Unit } from '@/types'

export function UnitCard({ unit }: { unit: Unit }) {
  return (
    <Link
      href={`/unidades/${unit.slug}`}
      className="group block overflow-hidden border border-lf-line bg-lf-surface transition duration-500 hover:-translate-y-1 hover:border-lf-volt/45 hover:shadow-[0_24px_70px_rgba(0,0,0,0.32)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {unit.foto_capa ? (
          <Image
            src={unit.foto_capa}
            alt={`LoudFit ${unit.nome}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover opacity-82 transition duration-700 group-hover:scale-105 group-hover:opacity-95"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-lf-graphite">
            <span className="text-4xl font-black text-lf-muted">LF</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-lf-black via-lf-black/25 to-transparent" />
        <div className="absolute left-3 top-3">
          <UnitBadge status={unit.status} />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Unidade LoudFit
          </p>
          <h3 className="mt-1 text-2xl font-black text-lf-text transition-colors group-hover:text-lf-volt">
            {unit.nome}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm text-lf-muted">
          {unit.bairro} / {unit.cidade}
        </p>

        {unit.modalidades?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {unit.modalidades.slice(0, 3).map((m) => (
              <span key={m} className="rounded-full border border-lf-line bg-lf-black px-2.5 py-1 text-[10px] uppercase tracking-wider text-lf-muted">
                {m}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-lf-line pt-4">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-lf-volt">
            Ver unidade
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-lf-volt/40 text-lf-volt transition group-hover:bg-lf-volt group-hover:text-lf-black">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}
