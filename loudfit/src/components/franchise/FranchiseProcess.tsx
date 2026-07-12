interface Step {
  number: string
  title: string
  body: string
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Candidatura',
    body: 'Você preenche o formulário nesta página. O time de expansão recebe e analisa o perfil.',
  },
  {
    number: '02',
    title: 'Qualificação',
    body: 'Conversa inicial de alinhamento para entender objetivo, praça e capacidade de investimento.',
  },
  {
    number: '03',
    title: 'Apresentação do modelo',
    body: 'A rede apresenta a operação real — o que já existe, como funciona e o padrão LoudFit.',
  },
  {
    number: '04',
    title: 'Análise da praça',
    body: 'Estudo da cidade e região, avaliando potencial de demanda, concorrência e público.',
  },
  {
    number: '05',
    title: 'Avaliação do ponto',
    body: 'Se você já tem um ponto em vista, a rede dá parecer técnico antes de qualquer contrato.',
  },
  {
    number: '06',
    title: 'COF e contrato',
    body: 'Circular de Oferta de Franquia, contrato e formalização jurídica da relação.',
  },
  {
    number: '07',
    title: 'Implantação',
    body: 'Obra, equipamentos, padrão visual, treinamento e preparação da equipe local.',
  },
  {
    number: '08',
    title: 'Aceleração e inauguração',
    body: 'A Aceleração LoudFit entra em ação. Sua unidade abre com base de interessados e presença local.',
  },
]

export function FranchiseProcess() {
  return (
    <section
      id="processo"
      className="relative bg-[#F6F5F1] py-20 md:py-28 lg:py-32"
      aria-labelledby="processo-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-14 max-w-3xl md:mb-16">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-[#0B0B0C]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
              Processo de entrada
            </p>
          </div>
          <h2
            id="processo-title"
            className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-[#0B0B0C]"
            style={{ fontSize: 'clamp(2.2rem, 4.4vw, 4rem)' }}
          >
            Da candidatura<br />à inauguração
          </h2>
          <p className="mt-5 max-w-[52ch] text-base leading-[1.65] text-[#3f3f42] md:text-lg">
            Um processo estruturado em oito etapas. Sem prazos prometidos — cada praça tem sua realidade, e a rede só avança quando os fundamentos estão prontos.
          </p>
        </div>

        <ol className="grid gap-px bg-[#0B0B0C]/12 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li
              key={step.number}
              className="group flex flex-col gap-3 bg-[#F6F5F1] p-6 transition-colors hover:bg-[#EFEDE6] md:p-7"
            >
              <span
                className="font-black uppercase leading-none text-lf-volt"
                style={{ fontSize: 'clamp(2rem, 3vw, 2.6rem)', fontFamily: 'var(--font-display)' }}
              >
                {step.number}
              </span>
              <h3
                className="font-black uppercase leading-tight tracking-[-0.005em] text-[#0B0B0C]"
                style={{ fontSize: 'clamp(1.1rem, 1.6vw, 1.35rem)' }}
              >
                {step.title}
              </h3>
              <p className="text-[13.5px] leading-[1.55] text-[#3f3f42]">{step.body}</p>
            </li>
          ))}
        </ol>

      </div>
    </section>
  )
}
