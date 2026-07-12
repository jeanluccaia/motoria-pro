const traits = [
  'Perfil empreendedor com foco em construir uma operação',
  'Capacidade de investimento compatível com o modelo',
  'Compromisso com a presença e a gestão da unidade',
  'Disposição para seguir o padrão da marca',
  'Foco em gestão de equipe e leitura de indicadores',
  'Alinhamento com a cultura da rede',
  'Interesse em construir a Loud Fit na sua região',
]

export function FranchiseProfile() {
  return (
    <section
      id="perfil"
      className="relative bg-lf-black py-20 md:py-28 lg:py-32"
      aria-labelledby="perfil-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16 lg:gap-20">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt">
                Perfil do franqueado
              </p>
            </div>
            <h2
              id="perfil-title"
              className="text-balance font-black uppercase leading-[0.96] tracking-[-0.005em] text-lf-text"
              style={{ fontSize: 'clamp(2.2rem, 4.4vw, 4rem)' }}
            >
              Estamos procurando<br />os <span className="text-lf-volt">parceiros certos</span>
            </h2>
            <p className="mt-6 max-w-[44ch] text-base leading-[1.65] text-lf-muted md:text-lg">
              Não é preciso experiência prévia em academia. É preciso comprometimento com a operação, alinhamento com a marca e vontade de construir na sua praça.
            </p>
          </div>
          <ul className="grid gap-px bg-lf-line">
            {traits.map((trait) => (
              <li key={trait} className="flex items-start gap-4 bg-lf-black px-5 py-5">
                <span
                  aria-hidden="true"
                  className="mt-[6px] inline-block h-4 w-4 shrink-0 border-2 border-lf-volt"
                >
                  <span className="mx-auto mt-[3px] block h-1.5 w-2 rotate-[-40deg] border-b-2 border-l-2 border-lf-volt" />
                </span>
                <p className="text-[15px] leading-[1.55] text-lf-text/90">{trait}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
