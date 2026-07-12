interface Pillar {
  number: string
  title: string
  body: string
}

const pillars: Pillar[] = [
  {
    number: '01',
    title: 'Implantação',
    body: 'Análise da praça, parecer sobre o ponto e projeto padrão da rede.',
  },
  {
    number: '02',
    title: 'Operação',
    body: 'Playbook comercial, treinamento da equipe e padrão de gestão diário.',
  },
  {
    number: '03',
    title: 'Marketing e captação',
    body: 'Presença digital da unidade, campanhas locais e apoio comercial da rede.',
  },
  {
    number: '04',
    title: 'Acompanhamento',
    body: 'Time de expansão presente antes, durante e depois da inauguração.',
  },
]

export function FranchiseGrowth() {
  return (
    <section
      id="estrutura"
      className="relative bg-[#F6F5F1] py-16 md:py-20 lg:py-24"
      aria-labelledby="estrutura-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-10 max-w-3xl md:mb-14">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-[#0B0B0C]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
              O que você recebe
            </p>
          </div>
          <h2
            id="estrutura-title"
            className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-[#0B0B0C]"
            style={{ fontSize: 'clamp(2rem, 3.6vw, 3.2rem)' }}
          >
            Estrutura para abrir<br />e suporte para crescer
          </h2>
        </div>

        <ol className="grid gap-px bg-[#0B0B0C]/12 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <li key={pillar.number} className="flex flex-col gap-3 bg-[#F6F5F1] p-6 md:p-7">
              <span
                className="font-black uppercase leading-none text-[#0B0B0C]/25"
                style={{ fontSize: 'clamp(1.8rem, 2.6vw, 2.4rem)', fontFamily: 'var(--font-display)' }}
              >
                {pillar.number}
              </span>
              <h3
                className="font-black uppercase leading-tight tracking-[-0.005em] text-[#0B0B0C]"
                style={{ fontSize: 'clamp(1.15rem, 1.6vw, 1.4rem)' }}
              >
                {pillar.title}
              </h3>
              <p className="max-w-[36ch] text-[14px] leading-[1.55] text-[#3f3f42]">
                {pillar.body}
              </p>
            </li>
          ))}
        </ol>

      </div>
    </section>
  )
}
