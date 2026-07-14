import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const featuredModalities = [
  { name: 'Muay Thai', desc: 'Arte marcial e condicionamento físico em grupo.' },
  { name: 'Pilates', desc: 'Força, postura e mobilidade no movimento.' },
  { name: 'Spinning', desc: 'Cardio de alta intensidade em bike.' },
  { name: 'Zumba', desc: 'Dança, ritmo e queima calórica.' },
]

const otherModalities = [
  'Jump', 'Funcional', 'Yoga', 'Ritmos', 'Step',
  'Body Combat', 'GAP', 'Pump', 'Localizada', 'Boxe', 'Ginástica', 'Dança',
]

export function CollectiveClassesSection() {
  return (
    <Section id="aulas-coletivas" bg="black" className="relative overflow-hidden">
      {/* Topo: counter + título | cards de modalidades */}
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">

        {/* Esquerda: contador + título + subtexto */}
        <Reveal>
          <div className="mb-5 flex items-center gap-3">
            <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
              Planos Loud Fit
            </p>
          </div>

          <div className="mb-6 flex items-end gap-4">
            <span
              className="font-black leading-none text-lf-volt"
              style={{ fontSize: 'clamp(4.5rem, 10vw, 7rem)' }}
            >
              16
            </span>
            <span className="pb-2 text-sm font-bold uppercase tracking-[0.1em] text-lf-muted">
              modalidades<br />inclusas
            </span>
          </div>

          <h2 className="text-balance text-4xl font-black leading-[1.02] text-lf-text md:text-5xl">
            Um plano. Tudo incluso.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-[1.6] text-lf-muted md:text-lg">
            Muay Thai, Pilates, Spinning, Zumba, Jump… Na Loud Fit, nenhuma aula é cobrada à parte. O preço do plano — qualquer plano — já inclui toda a grade da sua unidade.
          </p>
        </Reveal>

        {/* Direita: cards das aulas destaque */}
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {featuredModalities.map((mod) => (
              <div key={mod.name} className="border border-lf-line bg-lf-graphite p-5">
                <div className="mb-3 h-[2px] w-6 bg-lf-volt" />
                <h3 className="text-base font-black text-lf-text">{mod.name}</h3>
                <p className="mt-1.5 text-sm leading-snug text-lf-muted">{mod.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Pills — demais modalidades */}
      <Reveal delay={0.15}>
        <div className="mt-10 flex flex-wrap gap-2">
          {otherModalities.map((mod) => (
            <span
              key={mod}
              className="border border-lf-line/60 bg-lf-graphite px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-lf-muted"
            >
              {mod}
            </span>
          ))}
        </div>
      </Reveal>

      {/* Nota + CTA */}
      <Reveal delay={0.2}>
        <div className="mt-8 flex flex-col gap-4 border-t border-lf-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-lf-muted/60">A grade de aulas varia por unidade.</p>
          <Button href="/unidades" variant="volt" size="md">
            Ver aulas por unidade
          </Button>
        </div>
      </Reveal>
    </Section>
  )
}
