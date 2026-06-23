import type { Metadata } from 'next'
import { Section, SectionHeader } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'Conheça a história e os fundadores da LoudFit.',
}

export default function SobrePage() {
  return (
    <div className="pt-16">
      <Section bg="black">
        <SectionHeader label="Nossa história" title="Por que a LoudFit existe" />
        <div className="max-w-3xl space-y-6 text-lf-muted leading-relaxed">
          <p>
            {/* Substituir pelo texto real dos fundadores */}
            [História da LoudFit — preencher com a narrativa dos fundadores: o que motivou a criar, qual o gap que viram no mercado, como chegaram ao modelo atual.]
          </p>
        </div>
      </Section>

      {/* Fundadores — preencher */}
      <Section bg="graphite">
        <SectionHeader label="Fundadores" title="Quem está por trás" />
        <div className="grid md:grid-cols-2 gap-8">
          {['Fundador 1', 'Fundador 2'].map((f) => (
            <div key={f} className="border border-lf-line p-6">
              <div className="w-20 h-20 bg-lf-surface rounded-full mb-4" />
              <h3 className="text-xl font-black text-lf-text uppercase">{f}</h3>
              <p className="text-sm text-lf-muted mt-2">[Cargo / trajetória]</p>
              <p className="text-sm text-lf-muted mt-3 leading-relaxed">[Bio breve]</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
