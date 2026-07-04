const items = [
  'Musculação',
  '16 modalidades',
  '5 unidades em operação',
  'Matrícula 100% online',
  'Aulas coletivas inclusas',
]

export function BrandMarquee() {
  return (
    <div className="border-y border-lf-line bg-lf-graphite" aria-hidden="true">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="font-display text-sm font-black uppercase tracking-[0.14em] text-lf-volt">
            LoudFit
          </span>
          {items.map((item) => (
            <span key={item} className="flex items-center gap-5">
              <span className="text-lf-muted/30 text-xs select-none">—</span>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-lf-muted/60">
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
