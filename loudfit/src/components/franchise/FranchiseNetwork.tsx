import Image from 'next/image'
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
  span: 'wide' | 'tall' | 'square'
}

/**
 * Editorial mosaic. Each tile represents a real unit — no invented facades.
 * Layout uses CSS grid areas so unit tiles have distinct sizes instead of a
 * uniform six-card grid.
 */
export function FranchiseNetwork({ units }: FranchiseNetworkProps) {
  const items: NetworkItem[] = units.map((unit, idx) => ({
    slug: unit.slug,
    displayName: unit.nome.replace(/^LoudFit\s+/i, ''),
    city: `${unit.cidade} · ${unit.estado}`,
    status: unit.status === 'ativa' ? 'operando' : 'inauguracao',
    image: unit.foto_capa || '/assets/images/real-facade.jpg',
    span: idx === 0 ? 'wide' : idx === 3 ? 'tall' : 'square',
  }))

  return (
    <section
      id="rede"
      className="relative bg-lf-black py-20 md:py-28 lg:py-32"
      aria-labelledby="rede-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between md:gap-16">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt">
                A rede em movimento
              </p>
            </div>
            <h2
              id="rede-title"
              className="text-balance font-black uppercase leading-[0.98] tracking-[-0.005em] text-lf-text"
              style={{ fontSize: 'clamp(2.2rem, 4.4vw, 4rem)' }}
            >
              A LoudFit já opera.<br />Sua cidade pode ser a próxima.
            </h2>
          </div>
          <p className="max-w-md text-base leading-[1.6] text-lf-muted md:text-right">
            Cada unidade abaixo é uma operação real — com estrutura, aulas coletivas e comunidade em rotina.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:grid-rows-2 md:gap-5">
          {items.map((item, idx) => (
            <li
              key={item.slug}
              className={
                'group relative overflow-hidden border border-lf-line bg-lf-graphite ' +
                (item.span === 'wide' ? 'aspect-[4/5] sm:aspect-[3/4] md:col-span-2 md:row-span-2 md:aspect-auto' : '') +
                (item.span === 'tall' ? 'aspect-[4/5] md:col-span-1 md:row-span-2 md:aspect-auto' : '') +
                (item.span === 'square' ? 'aspect-[4/5] md:aspect-auto' : '')
              }
            >
              <Image
                src={item.image}
                alt={`Fachada ou ambiente da LoudFit ${item.displayName}`}
                fill
                sizes={idx === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,12,0.05)_45%,rgba(11,11,12,0.92)_100%)]"
              />

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span
                  className={
                    'inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] backdrop-blur-sm ' +
                    (item.status === 'operando'
                      ? 'border-lf-volt/60 bg-lf-volt/10 text-lf-volt'
                      : 'border-lf-text/25 bg-lf-black/50 text-lf-text/80')
                  }
                >
                  <span aria-hidden="true" className={item.status === 'operando' ? 'inline-block h-1.5 w-1.5 rounded-full bg-lf-volt' : 'inline-block h-1.5 w-1.5 rounded-full bg-lf-text/60'} />
                  {item.status === 'operando' ? 'Em operação' : 'Em inauguração'}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lf-text/60">
                  {item.city}
                </p>
                <h3
                  className="mt-1 font-black uppercase leading-[1] tracking-[-0.005em] text-lf-text"
                  style={{ fontSize: item.span === 'wide' ? 'clamp(1.6rem, 2.6vw, 2.4rem)' : 'clamp(1.15rem, 1.6vw, 1.6rem)' }}
                >
                  {item.displayName}
                </h3>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-10 max-w-2xl border-l-2 border-lf-volt/60 pl-4 text-sm leading-[1.65] text-lf-text/80">
          Novas praças em estudo. Se você imagina a LoudFit na sua cidade, a próxima candidatura pode ser a sua.
        </p>

      </div>
    </section>
  )
}
