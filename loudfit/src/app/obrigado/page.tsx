import type { Metadata } from 'next'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Obrigado!',
  robots: { index: false },
}

export default function ObrigadoPage() {
  return (
    <div className="pt-16">
      <Section bg="black">
        <div className="max-w-xl mx-auto text-center py-16">
          <span className="text-6xl font-black text-lf-volt">OK.</span>
          <h1 className="mt-4 text-4xl font-black text-lf-text">Recebemos seu contato.</h1>
          <p className="mt-4 text-lf-muted text-lg leading-relaxed">
            Nosso time de expansão vai analisar o seu perfil e entrar em contato em até{' '}
            <strong className="text-lf-text">48 horas úteis</strong>.
          </p>
          <p className="mt-2 text-sm text-lf-muted">
            Fique de olho no WhatsApp e no e-mail que você cadastrou.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/" variant="volt">
              Voltar ao início
            </Button>
            <Button href="/franquias" variant="ghost">
              Saber mais sobre franquias
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}
