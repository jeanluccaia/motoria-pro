import type { Metadata } from 'next'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Carreiras',
  description: 'Trabalhe na LoudFit. Vagas abertas na rede de academias.',
}

export default function CarreirasPage() {
  return (
    <div className="pt-16">
      <Section bg="black">
        <div className="max-w-3xl">
          <SectionHeader
            label="Carreiras"
            title="Trabalhe na LoudFit"
            subtitle="Pessoas que querem crescer junto com a rede. Se você tem energia, vontade e gosta de resultado, fale com a gente."
          />
        </div>

        {/* Vagas — alimentar via Supabase depois */}
        <div className="mt-8 border border-lf-line p-8 text-center text-lf-muted">
          <p className="text-lg font-black text-lf-text uppercase">Vagas em breve</p>
          <p className="text-sm mt-2">
            Não temos vagas abertas no momento, mas estamos sempre crescendo.
          </p>
          <div className="mt-6">
            <Button href="mailto:contato@loudfit.com.br" variant="outline">
              Enviar currículo
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}
