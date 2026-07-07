import type { Metadata } from 'next'
import { Section } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade da LoudFit.',
  alternates: { canonical: '/politica-de-privacidade' },
  openGraph: {
    title: 'Política de Privacidade | LoudFit',
    description: 'Política de privacidade da LoudFit.',
    url: '/politica-de-privacidade',
    images: ['/assets/images/campaign-gym-16x9.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de Privacidade | LoudFit',
    description: 'Política de privacidade da LoudFit.',
    images: ['/assets/images/campaign-gym-16x9.png'],
  },
}

export default function PrivacidadePage() {
  return (
    <div className="pt-16">
      <Section bg="black">
        <div className="max-w-3xl prose prose-invert prose-sm">
          <h1 className="text-4xl font-black text-lf-text uppercase mb-8">Política de Privacidade</h1>
          <p className="text-lf-muted">
            [Inserir texto de política de privacidade conforme a LGPD. Recomendamos validação com
            assessoria jurídica antes de publicar.]
          </p>
          <p className="text-lf-muted mt-4">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </Section>
    </div>
  )
}
