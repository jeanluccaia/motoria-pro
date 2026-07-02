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
            A LoudFit nasceu para ocupar o espaço entre o low cost e as academias de luxo:
            estrutura completa, equipe qualificada e o mesmo padrão em cada unidade da rede.
          </p>
        </div>
      </Section>
    </div>
  )
}
