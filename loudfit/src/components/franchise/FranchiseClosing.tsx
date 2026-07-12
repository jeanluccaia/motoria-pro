import { ClosingCta } from './ClosingCta'

export function FranchiseClosing() {
  return (
    <section
      id="encerramento"
      className="relative overflow-hidden bg-lf-black py-24 md:py-32 lg:py-40"
      aria-labelledby="encerramento-title"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-lf-volt/25 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-lf-volt/15 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1360px] flex-col items-center gap-10 px-5 text-center sm:px-8 lg:px-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-lf-volt">
          O melhor ainda está por vir
        </p>

        <h2
          id="encerramento-title"
          className="text-balance font-black uppercase leading-[0.92] tracking-[-0.005em] text-lf-text"
          style={{ fontSize: 'clamp(2.6rem, 6vw, 6.4rem)' }}
        >
          Leve a <span className="text-lf-volt">Loud Fit</span><br />
          para a sua cidade
        </h2>

        <p className="max-w-[48ch] text-base leading-[1.65] text-lf-text/80 sm:text-lg">
          Tenha estrutura, acompanhamento e suporte para tirar a nova unidade do papel.
        </p>

        <ClosingCta />
      </div>
    </section>
  )
}
