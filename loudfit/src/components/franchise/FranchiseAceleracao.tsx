interface Phase {
  eyebrow: string
  title: string
  body: string
}

const phases: Phase[] = [
  {
    eyebrow: 'Fase 01',
    title: 'Antes da abertura',
    body: 'Captação local e preparação comercial da praça.',
  },
  {
    eyebrow: 'Fase 02',
    title: 'Na inauguração',
    body: 'Lançamento e ativação da unidade com apoio da rede.',
  },
  {
    eyebrow: 'Fase 03',
    title: 'Nos primeiros meses',
    body: 'Acompanhamento da operação e das métricas iniciais.',
  },
]

export function FranchiseAceleracao() {
  return (
    <section
      id="aceleracao"
      className="relative bg-lf-black py-16 md:py-20 lg:py-24"
      aria-labelledby="aceleracao-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-10 max-w-3xl md:mb-14">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt">
              Diferencial Loud Fit
            </p>
          </div>
          <h2
            id="aceleracao-title"
            className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-lf-text"
            style={{ fontSize: 'clamp(2rem, 3.6vw, 3.2rem)' }}
          >
            Aceleração Loud Fit
          </h2>
          <p className="mt-4 max-w-[46ch] text-base leading-[1.65] text-lf-muted">
            A rede prepara a demanda antes da inauguração e acompanha os primeiros ciclos da unidade.
          </p>
        </div>

        <ol className="grid gap-px bg-lf-line sm:grid-cols-3">
          {phases.map((phase) => (
            <li
              key={phase.title}
              className="flex flex-col gap-3 border-t-[3px] border-lf-volt bg-lf-black p-6 md:p-7"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-lf-volt">
                {phase.eyebrow}
              </span>
              <h3
                className="font-black uppercase leading-tight tracking-[-0.005em] text-lf-text"
                style={{ fontSize: 'clamp(1.15rem, 1.6vw, 1.4rem)' }}
              >
                {phase.title}
              </h3>
              <p className="max-w-[34ch] text-[14px] leading-[1.55] text-lf-muted">
                {phase.body}
              </p>
            </li>
          ))}
        </ol>

      </div>
    </section>
  )
}
