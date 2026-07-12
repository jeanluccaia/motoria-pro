import Image from 'next/image'
import Link from 'next/link'
import type { Unit } from '@/types'

interface FranchiseNetworkProps {
  units: Unit[]
}

interface NetworkItem {
  slug: string
  displayName: string
  city: string
  status: 'operando' | 'inauguracao'
  image: string
}

const HIGHLIGHT_SLUGS = ['carrefour-valinhos', 'amoreiras', 'anchieta-sp']

export function FranchiseNetwork({ units }: FranchiseNetworkProps) {
  const chosen = HIGHLIGHT_SLUGS
    .map((slug) => units.find((u) => u.slug === slug))
    .filter((u): u is Unit => !!u)
    .slice(0, 3)

  const items: NetworkItem[] = chosen.map((unit) => ({
    slug: unit.slug,
    displayName: unit.nome.replace(/^LoudFit\s+/i, '').replace(/^Loud Fit\s+/i, ''),
    city: `${unit.cidade} · ${unit.estado}`,
    status: unit.status === 'ativa' ? 'operando' : 'inauguracao',
    image: unit.foto_capa || '/assets/images/real-facade.jpg',
  }))

  if (items.length === 0) return null

  return (
    <section
      id="rede"
      className="relative bg-lf-black py-16 md:py-20 lg:py-24"
      aria-labelledby="rede-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt">
                A rede já está crescendo
              </p>
            </div>
            <h2
              id="rede-title"
              className="text-balance font-black uppercase leading-[0.98] tracking-[-0.005em] text-lf-text"
              style={{ fontSize: 'clamp(2rem, 3.6vw, 3.2rem)' }}
            >
              A Loud Fit já está<br />em expansão
            </h2>
          </div>
          <Link
            href="/unidades"
            className="inline-flex items-center gap-2 self-start text-[11px] font-black uppercase tracking-[0.2em] text-lf-text/85 transition-colors hover:text-lf-volt md:self-end"
          >
            Conheça nossas unidades
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {items.map((item) => (
            <li key={item.slug} className="group relative overflow-hidden border border-lf-line bg-lf-graphite">
              <div className="relative aspect-[4/5] sm:aspect-[3/4]">
                <Image
                  src={item.image}
                  alt={`Ambiente da Loud Fit ${item.displayName}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,12,0.05)_50%,rgba(11,11,12,0.9)_100%)]"
                />

                <div className="absolute top-3 left-3">
                  <span
                    className={
                      'inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] backdrop-blur-sm ' +
                      (item.status === 'operando'
                        ? 'border-lf-volt/60 bg-lf-volt/10 text-lf-volt'
                        : 'border-lf-text/25 bg-lf-black/50 text-lf-text/80')
                    }
                  >
                    {item.status === 'operando' ? 'Em operação' : 'Em inauguração'}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lf-text/60">
                    {item.city}
                  </p>
                  <h3
                    className="mt-1 font-black uppercase leading-[1] tracking-[-0.005em] text-lf-text"
                    style={{ fontSize: 'clamp(1.15rem, 1.6vw, 1.6rem)' }}
                  >
                    {item.displayName}
                  </h3>
                </div>
              </div>
            </li>
          ))}
        </ul>

      </div>
    </section>
  )
}
