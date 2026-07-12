interface SupportGroup {
  moment: string
  eyebrow: string
  intro: string
  items: string[]
}

const groups: SupportGroup[] = [
  {
    moment: 'Antes da abertura',
    eyebrow: '01',
    intro: 'Preparação da praça e do negócio antes de qualquer obra começar.',
    items: [
      'Time de expansão dedicado',
      'Análise de praça',
      'Parecer técnico sobre o ponto',
      'Planejamento comercial e financeiro',
    ],
  },
  {
    moment: 'Durante a implantação',
    eyebrow: '02',
    intro: 'Padrão Loud Fit replicado com apoio direto da rede.',
    items: [
      'Acompanhamento da obra e do projeto',
      'Padrão visual e identidade da marca',
      'Fornecedores de equipamentos indicados',
      'Treinamento da equipe local',
      'Aceleração Loud Fit em paralelo',
    ],
  },
  {
    moment: 'Depois da inauguração',
    eyebrow: '03',
    intro: 'Suporte contínuo após a porta abrir.',
    items: [
      'Suporte operacional recorrente',
      'Marketing e comunicação da rede',
      'Rotinas de gestão e métricas',
      'Acompanhamento de retenção e ocupação',
    ],
  },
]

export function FranchiseSupport() {
  return (
    <section
      id="suporte"
      className="relative bg-[#EFEDE6] py-20 md:py-28 lg:py-32"
      aria-labelledby="suporte-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-14 max-w-3xl md:mb-16">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-[#0B0B0C]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
              Suporte ao franqueado
            </p>
          </div>
          <h2
            id="suporte-title"
            className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-[#0B0B0C]"
            style={{ fontSize: 'clamp(2.2rem, 4.4vw, 4rem)' }}
          >
            Você não precisa<br />abrir sozinho
          </h2>
          <p className="mt-5 max-w-[48ch] text-base leading-[1.65] text-[#3f3f42] md:text-lg">
            A equipe acompanha as etapas de planejamento, implantação, lançamento e operação.
          </p>
        </div>

        <ol className="grid gap-6 md:grid-cols-3 md:gap-4 lg:gap-6">
          {groups.map((group) => (
            <li
              key={group.moment}
              className="relative flex flex-col gap-5 border-t-[3px] border-lf-volt bg-white p-6 md:p-8"
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-black uppercase leading-none text-[#0B0B0C]/25"
                  style={{ fontSize: 'clamp(2rem, 3vw, 2.6rem)', fontFamily: 'var(--font-display)' }}
                >
                  {group.eyebrow}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
                  Fase
                </span>
              </div>
              <h3
                className="font-black uppercase leading-tight tracking-[-0.005em] text-[#0B0B0C]"
                style={{ fontSize: 'clamp(1.25rem, 1.9vw, 1.7rem)' }}
              >
                {group.moment}
              </h3>
              <p className="text-[14.5px] leading-[1.55] text-[#3f3f42]">{group.intro}</p>
              <ul className="mt-1 flex flex-col gap-3 border-t border-[#0B0B0C]/10 pt-5">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] leading-[1.55] text-[#141416]">
                    <span
                      aria-hidden="true"
                      className="mt-[6px] inline-block h-1.5 w-3 shrink-0 bg-lf-volt"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

      </div>
    </section>
  )
}
