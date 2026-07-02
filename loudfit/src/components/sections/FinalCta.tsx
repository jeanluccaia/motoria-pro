import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { SignalMark } from '@/components/ui/SignalMark'
import { StatCounter } from '@/components/ui/StatCounter'

const stats = [
  { value: 6, label: 'Unidades na rede' },
  { value: 4, label: 'Cidades' },
  { value: 9, suffix: ',90', prefix: 'R$ ', label: 'Primeira mensalidade*' },
]

export function FinalCta() {
  return (
    <Section bg="black" className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lf-volt to-transparent" />
      <div className="relative flex flex-col items-center text-center">
        <div className="mb-5 flex items-center gap-3">
          <SignalMark />
          <p className="text-xs uppercase tracking-[0.24em] text-lf-volt">Comece agora</p>
        </div>
        <h2 className="max-w-3xl text-4xl font-black leading-[0.95] text-lf-text sm:text-5xl md:text-6xl">
          Escolha sua unidade. Escolha seu plano. Comece a treinar.
        </h2>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button href="/unidades" variant="volt" size="lg">
            Começar matrícula
          </Button>
          <Button href="/unidades" variant="ghost" size="lg">
            Ver unidades
          </Button>
        </div>

        <div className="mt-14 grid w-full max-w-2xl gap-6 border-t border-lf-line pt-10 sm:grid-cols-3">
          {stats.map((s) => (
            <StatCounter key={s.label} {...s} />
          ))}
        </div>
        <p className="mt-4 text-xs text-lf-muted">*No Power Anual Recorrente. Ipiranga possui tabela própria.</p>
      </div>
    </Section>
  )
}
