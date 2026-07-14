import type { Metadata } from 'next'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Carreiras',
  description: 'Trabalhe na Loud Fit. Vagas abertas na rede de academias.',
  alternates: { canonical: '/carreiras' },
  openGraph: {
    title: 'Carreiras | Loud Fit',
    description: 'Trabalhe na Loud Fit. Vagas abertas na rede de academias.',
    url: '/carreiras',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carreiras | Loud Fit',
    description: 'Trabalhe na Loud Fit. Vagas abertas na rede de academias.',
    images: ['/opengraph-image'],
  },
}

export default function CarreirasPage() {
  return (
    <div className="pt-16">
      <Section bg="black">
        <div className="max-w-3xl">
          <SectionHeader
            label="Carreiras"
            title="Trabalhe na Loud Fit"
            subtitle="Estamos formando um time que gosta de energia, gosta de resultado e quer crescer junto com a rede."
          />
        </div>

        {/* Vagas — alimentar via Supabase depois */}
        <div className="mt-8 border border-lf-line p-8 text-center text-lf-muted">
          <p className="text-lg font-black text-lf-text uppercase">Vagas em breve</p>
          <p className="text-sm mt-2">
            Não temos vagas abertas no momento, mas estamos sempre crescendo.
          </p>
          <div className="mt-6">
            <Button href="mailto:comercial@loudfit.com.br" variant="outline">
              Enviar currículo
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}
