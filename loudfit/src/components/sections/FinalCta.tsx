import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

type NumericStat = { kind: 'n'; value: number; label: string }
type PriceStat   = { kind: 'p'; value: string; label: string }
const stats: Array<NumericStat | PriceStat> = [
  { kind: 'n', value: 5,      label: 'Unidades em operação' },
  { kind: 'n', value: 4,      label: 'Cidades' },
  { kind: 'p', value: 'R$9,90', label: 'Primeira mensalidade*' },
]

export function FinalCta() {
  return (
    <Section bg="black" className="relative overflow-hidden border-t border-lf-line lg:py-32">
      <Reveal>
        <div className="relative flex flex-col items-center text-center">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Comece agora
          </p>
          <h2 className="max-w-2xl text-4xl font-black leading-[1.02] text-lf-text sm:text-5xl md:text-6xl">
            Escolha sua unidade.<br className="hidden sm:block" /> Comece a treinar.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-lf-muted">
            Matrícula 100% online — rápido, seguro e sem burocracia.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/unidades" variant="volt" size="lg">
              Ver todas as unidades
            </Button>
            <Button href="/#planos" variant="ghost" size="lg">
              Ver planos
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid w-full max-w-xl gap-0 border border-lf-line sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center px-6 py-5 border-b border-lf-line last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
              >
                <span className="text-3xl font-black text-lf-volt">
                  {s.kind === 'n'
                    ? <AnimatedNumber value={s.value} duration={1200} />
                    : s.value}
                </span>
                <span className="mt-1 text-[11px] uppercase tracking-[0.14em] text-lf-muted">{s.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-lf-muted/60">*No Power Anual Recorrente. Ipiranga possui tabela própria.</p>
        </div>
      </Reveal>
    </Section>
  )
}
