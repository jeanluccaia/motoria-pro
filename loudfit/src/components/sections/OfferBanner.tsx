import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const steps = [
  {
    num: '01',
    title: 'Escolha sua unidade',
    desc: 'Veja a LoudFit mais próxima e confira a grade disponível.',
  },
  {
    num: '02',
    title: 'Escolha seu plano',
    desc: 'Mensal, recorrente, semestral ou anual. As aulas da unidade já entram no plano.',
  },
  {
    num: '03',
    title: 'Finalize online',
    desc: 'Matrícula rápida, segura e feita pelo checkout oficial.',
  },
]

export function OfferBanner() {
  return (
    <Section bg="graphite" className="py-14 md:py-20">
      <Reveal>
        <div className="mb-8 flex items-center gap-3 md:mb-10">
          <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Como funciona
          </p>
        </div>

        <div className="grid overflow-hidden border border-lf-line bg-lf-black/20 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={[
                'relative min-h-[210px] px-6 py-7 md:px-7 md:py-8',
                i < steps.length - 1
                  ? 'border-b border-lf-line sm:border-b-0 sm:border-r'
                  : '',
              ].join(' ')}
            >
              <p className="mb-7 text-[10px] font-black uppercase tracking-[0.22em] text-lf-volt/45">
                {step.num}
              </p>
              <h3 className="text-xl font-black leading-tight text-lf-text md:text-2xl">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[30ch] text-sm leading-[1.55] text-lf-muted">
                {step.desc}
              </p>
              <div className="absolute bottom-0 left-0 h-[3px] w-10 bg-lf-volt/70" />
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  )
}
