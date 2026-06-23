import type { Metadata } from 'next'
import Link from 'next/link'
import { Section, SectionHeader } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a LoudFit — seja como aluno, franqueado ou parceiro.',
}

const doors = [
  {
    tag: 'Aluno',
    title: 'Quero treinar na LoudFit',
    body: 'Encontre a unidade mais próxima de você e fale diretamente com a equipe.',
    cta: 'Encontrar unidade',
    href: '/unidades',
    accent: true,
  },
  {
    tag: 'Franqueado',
    title: 'Quero ser dono de uma LoudFit',
    body: 'Conheça o modelo de franquia, os números e o processo de qualificação.',
    cta: 'Ver franquias',
    href: '/franquias',
    accent: false,
  },
  {
    tag: 'Imprensa / Parceria',
    title: 'Imprensa & parcerias',
    body: 'Para assessoria, colaborações e oportunidades de marca.',
    cta: 'Enviar e-mail',
    href: 'mailto:contato@loudfit.com.br',
    accent: false,
  },
]

export default function ContatoPage() {
  return (
    <div className="pt-16">
      <Section bg="black">
        <SectionHeader
          label="Contato"
          title="Como podemos ajudar?"
          centered
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {doors.map((door) => (
            <Link
              key={door.tag}
              href={door.href}
              className={`group block p-8 border transition-all ${
                door.accent
                  ? 'border-lf-volt bg-lf-volt/5 hover:bg-lf-volt/10'
                  : 'border-lf-line hover:border-lf-volt/30 bg-lf-surface'
              }`}
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-lf-volt">{door.tag}</span>
              <h2 className="mt-3 text-2xl font-black text-lf-text group-hover:text-lf-volt transition-colors">
                {door.title}
              </h2>
              <p className="mt-3 text-sm text-lf-muted leading-relaxed">{door.body}</p>
              <p className="mt-6 text-sm uppercase tracking-widest text-lf-volt font-bold">
                {door.cta} →
              </p>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  )
}
