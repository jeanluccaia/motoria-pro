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
    body: 'Não é só academia. É onde a galeria treina junto, cresce junto.',
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
    <Section bg="black">
      <SectionHeader
        label="Nossa tese"
        title="A LoudFit não é mais uma academia."
        subtitle="É uma decisão sobre onde você quer chegar."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <Reveal key={card.number} delay={i * 0.1}>
            <div className="border border-lf-line p-6 hover:border-lf-volt/40 transition-colors group">
              <span className="text-5xl font-black text-lf-volt/20 group-hover:text-lf-volt/40 transition-colors">
                {card.number}
              </span>
              <h3 className="mt-4 text-lg font-black text-lf-text uppercase">{card.title}</h3>
              <p className="mt-2 text-sm text-lf-muted leading-relaxed">{card.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
