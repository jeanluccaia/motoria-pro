import type { Metadata } from 'next'
import { Section } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
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
