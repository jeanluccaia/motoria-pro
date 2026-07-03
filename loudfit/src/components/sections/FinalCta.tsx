import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'

const stats = [
  { value: '6', label: 'Unidades na rede' },
  { value: '4', label: 'Cidades' },
  { value: 'R$9,90', label: 'Primeira mensalidade*' },
]

export function FinalCta() {
  return (
    <Section bg="black" className="relative overflow-hidden border-t border-lf-line">
      <div className="relative flex flex-col items-center text-center">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
          Comece agora
        </p>
        <h2 className="max-w-2xl text-4xl font-black leading-[1.02] text-lf-text sm:text-5xl md:text-6xl">
          Escolha sua unidade.<br className="hidden sm:block" /> Comece a treinar.
        </h2>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-lf-muted">
          Matrícula online pelo checkout oficial EVO — rápido, seguro e sem burocracia.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button href="/unidades" variant="volt" size="lg">
            Ver todas as 6 unidades
          </Button>
          <Button href="/#planos" variant="ghost" size="lg">
            Ver planos
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid w-full max-w-xl gap-0 border border-lf-line sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center justify-center px-6 py-5 border-b border-lf-line last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <span className="text-3xl font-black text-lf-volt">{s.value}</span>
              <span className="mt-1 text-[11px] uppercase tracking-[0.14em] text-lf-muted">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-lf-muted/60">*No Power Anual Recorrente. Ipiranga possui tabela própria.</p>
      </div>
    </Section>
  )
}
