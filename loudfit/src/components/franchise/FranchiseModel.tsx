import { franchiseConfig, franchiseNumbers, franchiseDisclaimer } from '@/lib/franchise'

interface QualitativeBlock {
  title: string
  body: string
}

const qualitative: QualitativeBlock[] = [
  {
    title: 'Estrutura completa',
    body: 'Musculação, cardio e aulas coletivas em um só plano — o padrão da rede replicado em cada unidade nova.',
  },
  {
    title: 'Modelo recorrente',
    body: 'Planos mensais, semestrais e anuais em operação real. Base recorrente pensada para retenção, não pico de venda.',
  },
  {
    title: 'Equipamentos padrão LoudFit',
    body: 'Musculação e cardio dentro do padrão da rede, com fornecedores parceiros e condições facilitadas de implantação.',
  },
  {
    title: 'Área e ponto planejados',
    body: 'A rede acompanha a análise de praça e da metragem viável antes de qualquer decisão de contrato ou obra.',
  },
  {
    title: 'Aceleração LoudFit',
    body: 'A rede age no lado comercial da praça antes de a unidade abrir — captação, pré-venda e presença digital.',
  },
  {
    title: 'Padrão de marca',
    body: 'Identidade visual, comunicação e tom da LoudFit prontos para operar. Você abre com uma marca reconhecida.',
  },
]

export function FranchiseModel() {
  const show = franchiseConfig.showFinancialNumbers
  return (
    <section
      id="modelo"
      className="relative bg-white py-20 md:py-28 lg:py-32"
      aria-labelledby="modelo-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-14 grid gap-8 md:mb-20 md:grid-cols-[1fr_1.1fr] md:items-end md:gap-16">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-[#0B0B0C]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
                Modelo de negócio
              </p>
            </div>
            <h2
              id="modelo-title"
              className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-[#0B0B0C]"
              style={{ fontSize: 'clamp(2.2rem, 4.4vw, 4rem)' }}
            >
              Um modelo pensado<br />para operar de verdade
            </h2>
          </div>
          <div className="text-[15.5px] leading-[1.65] text-[#3f3f42]">
            <p>
              {show
                ? 'Estimativas de investimento, royalties e retorno abaixo. Os números foram aprovados pelo time comercial e devem sempre ser lidos junto do disclaimer legal e da Circular de Oferta de Franquia.'
                : 'Nesta página apresentamos o modelo em termos qualitativos. Os detalhes financeiros — investimento, taxa, royalties e projeções — são apresentados durante a etapa de qualificação, junto da Circular de Oferta de Franquia.'}
            </p>
          </div>
        </div>

        {show ? <NumericGrid /> : <QualitativeGrid blocks={qualitative} />}

        <p className="mt-10 max-w-3xl border-l-2 border-[#0B0B0C]/25 pl-4 text-[12.5px] leading-[1.6] text-[#666]">
          {franchiseDisclaimer}
        </p>

      </div>
    </section>
  )
}

function QualitativeGrid({ blocks }: { blocks: QualitativeBlock[] }) {
  return (
    <ul className="grid gap-px bg-[#0B0B0C]/12 sm:grid-cols-2 lg:grid-cols-3">
      {blocks.map((block) => (
        <li key={block.title} className="flex flex-col gap-3 bg-white p-6 md:p-7">
          <span aria-hidden="true" className="h-[2px] w-8 bg-lf-volt" />
          <h3
            className="font-black uppercase leading-tight tracking-[-0.005em] text-[#0B0B0C]"
            style={{ fontSize: 'clamp(1.15rem, 1.7vw, 1.5rem)' }}
          >
            {block.title}
          </h3>
          <p className="max-w-[38ch] text-[14.5px] leading-[1.6] text-[#3f3f42]">
            {block.body}
          </p>
        </li>
      ))}
    </ul>
  )
}

function NumericGrid() {
  const numeric = [
    { label: `Taxa (${franchiseNumbers.franchiseFee.firstUnitsLabel})`, value: franchiseNumbers.franchiseFee.firstUnits, meta: `Taxa padrão: ${franchiseNumbers.franchiseFee.standard}` },
    { label: 'Investimento estimado', value: franchiseNumbers.totalInvestment, meta: 'Inclui equipamentos importados' },
    { label: 'Royalties', value: franchiseNumbers.royalties, meta: 'sobre o faturamento mensal' },
    { label: 'Fundo de publicidade', value: franchiseNumbers.publicityFund, meta: 'sobre o faturamento mensal' },
    { label: 'Área mínima', value: franchiseNumbers.minArea, meta: 'metragem viável do ponto comercial' },
    { label: 'Payback estimado', value: franchiseNumbers.paybackEstimate, meta: `Lucratividade estimada: ${franchiseNumbers.profitabilityRange}` },
  ]
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="relative border border-[#0B0B0C] bg-[#0B0B0C] p-8 text-white md:p-12">
        <span className="mb-6 inline-block bg-lf-volt px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#0B0B0C]">
          {franchiseNumbers.franchiseFee.firstUnitsLabel}
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
          Taxa de franquia
        </p>
        <p
          className="mt-3 font-black uppercase leading-none tracking-[-0.005em]"
          style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)', fontFamily: 'var(--font-display)' }}
        >
          {franchiseNumbers.franchiseFee.firstUnits}
        </p>
        <p className="mt-4 max-w-md text-sm leading-[1.6] text-white/70">
          Condição promocional para a fase de expansão da rede. Taxa padrão: {franchiseNumbers.franchiseFee.standard}.
        </p>
      </div>
      <ul className="grid gap-px bg-[#0B0B0C]/12 sm:grid-cols-2">
        {numeric.slice(1).map((item) => (
          <li key={item.label} className="flex flex-col gap-2 bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a4a4f]">
              {item.label}
            </p>
            <p
              className="font-black uppercase leading-none tracking-[-0.005em] text-[#0B0B0C]"
              style={{ fontSize: 'clamp(1.6rem, 2.4vw, 2.2rem)', fontFamily: 'var(--font-display)' }}
            >
              {item.value}
            </p>
            <p className="text-xs leading-[1.5] text-[#4a4a4f]">{item.meta}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
