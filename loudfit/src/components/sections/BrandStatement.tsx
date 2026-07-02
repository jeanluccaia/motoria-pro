import { Section, SectionHeader } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const cards = [
  {
    number: '01',
    title: 'Acima do low cost',
    body: 'Estrutura, limpeza, equipamentos e equipe de um nível acima. Sempre.',
  },
  {
    number: '02',
    title: 'Comunidade real',
    body: 'Não é só academia. É onde a galera treina junto, cresce junto.',
  },
  {
    number: '03',
    title: 'Resultado de verdade',
    body: 'Metodologia, acompanhamento e um ambiente que cobra resultado de você.',
  },
  {
    number: '04',
    title: 'Expansão inteligente',
    body: 'Uma rede que cresce com critério. Cada unidade é uma embaixada da marca.',
  },
]

export function BrandStatement() {
  return (
    <Section bg="black" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(242,226,5,0.08),transparent_22%)]" />
      <div className="relative">
        <SectionHeader
          label="Nossa tese"
          title="A LoudFit não é mais uma academia."
          subtitle="É uma decisão sobre onde você quer chegar."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <Reveal key={card.number} delay={i * 0.1}>
              <div className="group relative min-h-[250px] overflow-hidden rounded-lg border border-lf-line bg-lf-surface p-6 transition duration-500 hover:-translate-y-1 hover:border-lf-volt/40">
                <span className="absolute -right-2 -top-3 text-8xl font-black leading-none text-lf-volt/10 transition group-hover:text-lf-volt/20">
                  {card.number}
                </span>
                <span className="relative text-xs font-bold uppercase tracking-[0.18em] text-lf-volt">{card.number}</span>
                <h3 className="relative mt-12 text-xl font-black text-lf-text">{card.title}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-lf-muted">{card.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}
