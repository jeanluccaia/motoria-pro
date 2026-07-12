import { franchiseDisclaimer, franchiseNumbers } from '@/lib/franchise'

const highlights = [
  {
    label: 'Investimento estimado',
    value: franchiseNumbers.totalInvestment,
    detail: '+ equipamentos importados',
  },
  {
    label: 'Royalties',
    value: franchiseNumbers.royalties,
    detail: 'sobre o faturamento mensal',
  },
  {
    label: 'Payback estimado',
    value: franchiseNumbers.paybackEstimate,
    detail: 'variável conforme a praça',
  },
]

const complements = [
  { label: 'Fundo de publicidade', value: franchiseNumbers.publicityFund },
  { label: 'Área mínima', value: franchiseNumbers.minArea },
  { label: 'Lucratividade estimada', value: franchiseNumbers.profitabilityRange },
  { label: 'Equipamentos importados', value: 'com parcelamento' },
]

export function FranchiseInvestment() {
  return (
    <section
      id="numeros"
      className="relative bg-white py-16 md:py-20 lg:py-24"
      aria-labelledby="numeros-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-10 max-w-3xl md:mb-12">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-[#0B0B0C]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
              Condição de expansão
            </p>
          </div>
          <h2
            id="numeros-title"
            className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-[#0B0B0C]"
            style={{ fontSize: 'clamp(2rem, 3.6vw, 3.2rem)' }}
          >
            Números para começar<br />a conversa
          </h2>
          <p className="mt-4 max-w-[54ch] text-[15px] leading-[1.55] text-[#3f3f42] md:text-base">
            As principais informações do modelo para quem está avaliando abrir uma unidade.
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-[1.05fr_1fr]">
          {/* Card promocional */}
          <article className="relative flex flex-col justify-between overflow-hidden border border-[#0B0B0C] bg-[#0B0B0C] p-6 text-white md:p-9 lg:p-11">
            <div>
              <span className="inline-block bg-lf-volt px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#0B0B0C]">
                10 primeiras unidades
              </span>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
                Taxa de franquia
              </p>
              <p
                className="mt-3 font-black uppercase leading-[0.9] tracking-[-0.01em]"
                style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontFamily: 'var(--font-display)' }}
              >
                {franchiseNumbers.franchiseFee.firstUnits}
              </p>
              <p className="mt-3 flex items-baseline gap-2 text-[13px] text-white/60">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">De</span>
                <span className="relative inline-block font-bold text-white/75">
                  {franchiseNumbers.franchiseFee.standard}
                  <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-lf-volt" />
                </span>
              </p>
            </div>

            <p className="mt-8 max-w-md text-[13px] leading-[1.55] text-white/60">
              Condição promocional para a fase de expansão da rede. Vale até o preenchimento das dez primeiras unidades.
            </p>
          </article>

          {/* Highlights principais */}
          <ol className="grid gap-px bg-[#0B0B0C]/12 sm:grid-cols-3 lg:grid-cols-1">
            {highlights.map((item) => (
              <li key={item.label} className="flex flex-col justify-center gap-2 bg-white p-5 lg:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
                  {item.label}
                </p>
                <p
                  className="font-black uppercase leading-none tracking-[-0.005em] text-[#0B0B0C]"
                  style={{ fontSize: 'clamp(1.5rem, 2.2vw, 2rem)', fontFamily: 'var(--font-display)' }}
                >
                  {item.value}
                </p>
                <p className="text-[12.5px] leading-[1.5] text-[#4a4a4f]">{item.detail}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Faixa de detalhes complementares */}
        <ul className="mt-4 grid gap-px overflow-hidden border border-[#0B0B0C]/12 bg-[#0B0B0C]/12 sm:grid-cols-2 lg:grid-cols-4 md:mt-6">
          {complements.map((c) => (
            <li key={c.label} className="flex flex-col gap-1 bg-white px-5 py-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
                {c.label}
              </span>
              <span className="text-[15px] font-bold text-[#0B0B0C]">
                {c.value}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-3xl border-l-2 border-[#0B0B0C]/25 pl-4 text-[12.5px] leading-[1.55] text-[#666]">
          {franchiseDisclaimer}
        </p>

      </div>
    </section>
  )
}
