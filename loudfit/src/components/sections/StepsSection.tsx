import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const steps = [
  {
    num: '01',
    title: 'Escolha sua unidade',
    desc: 'A academia mais próxima com os planos disponíveis para aquela unidade.',
  },
  {
    num: '02',
    title: 'Escolha seu plano',
    desc: 'Musculação e aulas coletivas inclusas em todos os planos.',
  },
  {
    num: '03',
    title: 'Matricule online',
    desc: 'Checkout oficial EVO — simples, rápido e seguro.',
  },
]

export function StepsSection() {
  return (
    <Section bg="cream" className="py-12 md:py-16">
      <Reveal>
        <div className="mb-8 max-w-3xl md:mb-10">
          <div className="mb-3 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
              Como funciona
            </p>
          </div>
          <h2 className="text-3xl font-black leading-[1.06] text-[#141414] md:text-4xl">
            Sua matrícula em 3 passos
          </h2>
        </div>

        <ol className="grid overflow-hidden rounded-2xl border border-[#E8E8E4] bg-white sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.num}
              className={[
                'relative min-h-[160px] px-5 py-6 md:px-6 md:py-7',
                i < steps.length - 1 ? 'border-b border-[#E8E8E4] sm:border-b-0 sm:border-r' : '',
              ].join(' ')}
            >
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-lf-volt/70">
                {step.num}
              </p>
              <h3 className="text-lg font-black leading-tight text-[#141414] md:text-xl">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[34ch] text-sm leading-[1.55] text-[#4A4A4A]">
                {step.desc}
              </p>
              <div aria-hidden="true" className="absolute bottom-0 left-0 h-[3px] w-10 bg-lf-volt" />
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  )
}
