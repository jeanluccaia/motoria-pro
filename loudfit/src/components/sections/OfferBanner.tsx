import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const steps = [
  {
    num: '01',
    title: 'Escolha sua unidade',
    desc: 'Veja a LoudFit mais próxima e confira horários, aulas e planos.',
  },
  {
    num: '02',
    title: 'Escolha seu plano',
    desc: 'Todos incluem musculação e aulas coletivas da unidade.',
  },
  {
    num: '03',
    title: 'Finalize online',
    desc: 'Conclua sua matrícula pelo checkout oficial EVO.',
  },
]

export function OfferBanner() {
  return (
    <Section bg="cream" className="py-12 md:py-16">
      <Reveal>
        <div className="mb-8 flex items-center gap-3 md:mb-10">
          <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Como funciona
          </p>
        </div>

        <div className="grid overflow-hidden border border-[#E8E8E4] bg-white sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={[
                'relative min-h-[170px] px-5 py-6 md:px-6 md:py-7',
                i < steps.length - 1
                  ? 'border-b border-[#E8E8E4] sm:border-b-0 sm:border-r'
                  : '',
              ].join(' ')}
            >
              <p className="mb-5 text-[10px] font-black uppercase tracking-[0.22em] text-lf-volt/70">
                {step.num}
              </p>
              <h3 className="text-lg font-black leading-tight text-[#141414] md:text-xl">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[30ch] text-sm leading-[1.55] text-[#4A4A4A]">
                {step.desc}
              </p>
              <div className="absolute bottom-0 left-0 h-[3px] w-10 bg-lf-volt" />
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  )
}
