import Link from 'next/link'

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-lf-volt text-lf-black">
      {/* Traço superior sutil para separar do bloco anterior */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-lf-black/10" />

      <div className="relative mx-auto max-w-[1360px] px-5 py-14 sm:px-8 md:py-20 lg:px-12 lg:py-24">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-14">
          <div className="max-w-2xl">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-lf-black/70">
              Começa aqui
            </p>
            <h2 className="text-balance text-4xl font-black uppercase leading-[0.98] tracking-[-0.005em] sm:text-5xl md:text-6xl">
              Escolha sua unidade.<br />Comece a treinar
            </h2>
            <p className="mt-4 max-w-[42ch] text-sm leading-[1.55] text-lf-black/75 md:text-base">
              Veja a unidade mais próxima e finalize sua matrícula online.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href="/unidades"
              className="inline-flex min-h-[52px] items-center justify-center bg-lf-black px-8 py-4 text-xs font-black uppercase tracking-[0.14em] text-lf-volt transition hover:-translate-y-0.5 hover:bg-lf-black/90 sm:text-sm"
            >
              Ver todas as unidades
            </Link>
            <Link
              href="#planos"
              className="inline-flex min-h-[52px] items-center justify-center border-2 border-lf-black px-8 py-4 text-xs font-black uppercase tracking-[0.14em] text-lf-black transition hover:-translate-y-0.5 hover:bg-lf-black hover:text-lf-volt sm:text-sm"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
