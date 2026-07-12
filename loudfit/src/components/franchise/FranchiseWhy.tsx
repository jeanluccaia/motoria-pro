interface Pillar {
  number: string
  title: string
  body: string
}

const pillars: Pillar[] = [
  {
    number: '01',
    title: 'Marca com identidade',
    body: 'A LoudFit tem estética própria — urbana, forte e reconhecível. Você abre com uma marca que já se comunica sozinha na fachada.',
  },
  {
    number: '02',
    title: 'Operação documentada',
    body: 'Playbook comercial, operação e marketing formalizados. O que já funciona nas unidades vira padrão para a sua.',
  },
  {
    number: '03',
    title: 'Aceleração LoudFit',
    body: 'Sua unidade começa a captar antes de abrir. Pré-venda, presença digital e ativação local estruturados desde a assinatura.',
  },
  {
    number: '04',
    title: 'Suporte contínuo',
    body: 'Expansão, implantação, marketing e operação ao lado da sua unidade em cada fase — não só até a inauguração.',
  },
]

export function FranchiseWhy() {
  return (
    <section
      id="por-que"
      className="relative bg-[#F6F5F1] py-20 md:py-28 lg:py-32"
      aria-labelledby="por-que-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-14 grid gap-8 md:mb-20 md:grid-cols-[1fr_1.1fr] md:items-end md:gap-16">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-[#0B0B0C]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
                Por que a LoudFit
              </p>
            </div>
            <h2
              id="por-que-title"
              className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-[#0B0B0C]"
              style={{ fontSize: 'clamp(2.2rem, 4.4vw, 4rem)' }}
            >
              Você não abre<br />uma academia.<br />Você entra numa<br /><span className="bg-lf-volt px-2 pb-1 text-[#0B0B0C]">operação</span>.
            </h2>
          </div>
          <div className="text-[15.5px] leading-[1.65] text-[#333]">
            <p>
              A LoudFit não vende uma franquia isolada. Você entra em uma rede que já opera, que documenta o próprio modelo e que trabalha para gerar demanda na sua praça antes mesmo da inauguração.
            </p>
            <p className="mt-4">
              Os pilares abaixo estruturam essa proposta. Cada um deles conecta com uma seção específica desta página.
            </p>
          </div>
        </div>

        <ol className="grid gap-px bg-[#0B0B0C]/12 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <li
              key={pillar.number}
              className="relative flex flex-col gap-4 bg-[#F6F5F1] p-6 transition-colors hover:bg-[#EFEDE6] md:p-8"
            >
              <span
                className="font-black uppercase leading-none text-[#0B0B0C]/25"
                style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontFamily: 'var(--font-display)' }}
              >
                {pillar.number}
              </span>
              <h3
                className="max-w-[22ch] font-black uppercase leading-[1] tracking-[-0.005em] text-[#0B0B0C]"
                style={{ fontSize: 'clamp(1.4rem, 2.1vw, 1.9rem)' }}
              >
                {pillar.title}
              </h3>
              <p className="max-w-[42ch] text-[14.5px] leading-[1.6] text-[#3f3f42]">
                {pillar.body}
              </p>
            </li>
          ))}
        </ol>

      </div>
    </section>
  )
}
