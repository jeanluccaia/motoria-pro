interface FranchiseProofStripProps {
  proof: { total: number; operating: number; cities: number }
}

const pad = (value: number) => value.toString().padStart(2, '0')

export function FranchiseProofStrip({ proof }: FranchiseProofStripProps) {
  const items = [
    { label: 'Unidades na rede', value: pad(proof.total) },
    { label: 'Em operação', value: pad(proof.operating) },
    { label: 'Cidades', value: pad(proof.cities) },
  ]

  return (
    <section
      aria-label="Números da rede Loud Fit"
      className="border-y border-lf-line bg-lf-black"
    >
      <div className="mx-auto flex w-full max-w-[1360px] flex-col divide-y divide-lf-line/70 px-5 sm:px-8 md:flex-row md:divide-x md:divide-y-0 lg:px-12">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-baseline justify-between gap-4 py-4 md:flex-1 md:justify-start md:px-6 md:py-5"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-lf-muted">
              {item.label}
            </span>
            <span className="font-black tabular-nums leading-none text-lf-text md:ml-auto" style={{ fontSize: 'clamp(1.1rem, 1.6vw, 1.5rem)' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
