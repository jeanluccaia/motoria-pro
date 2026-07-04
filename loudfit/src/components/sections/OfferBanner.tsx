import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const steps = [
  {
    num: '01',
    title: 'Escolha a unidade',
    desc: 'Campinas, Valinhos, São Paulo e Mogi Mirim. 5 unidades em operação, 1 em inauguração.',
  },
  {
    num: '02',
    title: 'Escolha o plano',
    desc: 'Mensal, semestral ou anual recorrente. Todos os planos incluem aulas coletivas.',
  },
  {
    num: '03',
    title: 'Finalize online',
    desc: 'Matrícula 100% online — rápido, seguro e sem burocracia.',
  },
]

export function OfferBanner() {
  return (
    <Section bg="graphite" className="py-14 md:py-20">
      <Reveal>
        <div className="mb-8 flex items-center gap-3">
          <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Como funciona
          </p>
        </div>

        <div className="overflow-hidden border border-lf-line grid sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={[
                'relative px-7 py-8',
                i < steps.length - 1
                  ? 'border-b border-lf-line sm:border-b-0 sm:border-r'
                  : '',
              ].join(' ')}
            >
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-lf-volt/40">
                {step.num}/
              </p>
              <h3 className="text-xl font-black leading-tight text-lf-text">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-[1.6] text-lf-muted">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  )
}
