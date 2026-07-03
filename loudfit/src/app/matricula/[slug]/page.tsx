import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getUnits, getUnitBySlug } from '@/lib/supabase'
import { CheckoutFrame } from '@/components/ui/CheckoutFrame'
import { Section } from '@/components/ui/Section'
import { SignalMark } from '@/components/ui/SignalMark'

interface Props {
  params: Promise<{ slug: string }>
}

const trustItems = [
  'Checkout oficial EVO',
  'Venda e cadastro registrados no sistema da academia',
  'Aulas coletivas inclusas nos planos',
  'Power Anual Recorrente com primeira mensalidade por R$9,90',
]

export async function generateStaticParams() {
  const units = await getUnits().catch(() => [])
  return units.filter((u) => u.checkoutUrl).map((u) => ({ slug: u.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const unit = await getUnitBySlug(slug)
  if (!unit || !unit.checkoutUrl) return {}
  return {
    title: `Matrícula online — LoudFit ${unit.nome}`,
    description: `Faça sua matrícula online na LoudFit ${unit.nome}. Checkout oficial EVO. Power Anual Recorrente com primeira mensalidade por R$9,90.`,
  }
}

export default async function MatriculaPage({ params }: Props) {
  const { slug } = await params
  const unit = await getUnitBySlug(slug)

  if (!unit) notFound()
  if (!unit.checkoutUrl) redirect(`/unidades/${slug}`)

  const isPreOpening = unit.status === 'em_breve'

  return (
    <div className="pt-16">
      {/* Header escuro */}
      <Section bg="black" tight>
        <div className="flex items-center gap-3 mb-6">
          <SignalMark />
          <p className="text-xs uppercase tracking-[0.24em] text-lf-volt">
            {isPreOpening ? 'Matrícula antecipada' : 'Matrícula online'}
          </p>
        </div>
        <h1 className="text-4xl font-black text-lf-text md:text-6xl">
          {unit.nome}
        </h1>
        {isPreOpening && (
          <div className="mt-4 inline-flex items-center gap-2 border border-lf-volt/40 bg-lf-volt/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-lf-volt animate-pulse" />
            <span className="text-xs uppercase tracking-[0.2em] text-lf-volt">Unidade em inauguração</span>
          </div>
        )}
        <p className="mt-4 text-base leading-relaxed text-lf-muted md:text-lg max-w-xl">
          {isPreOpening
            ? 'Garanta sua matrícula antes da inauguração pelo checkout oficial EVO.'
            : 'Escolha seu plano e finalize sua matrícula pelo checkout oficial EVO.'}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item} className="flex items-start gap-3 border border-lf-line bg-lf-surface px-4 py-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lf-volt" />
              <span className="text-sm text-lf-muted leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Checkout iframe */}
      <Section bg="light">
        <CheckoutFrame
          src={unit.checkoutUrl}
          title={`Checkout EVO — LoudFit ${unit.nome}`}
        />
      </Section>

      {/* Rodapé da página */}
      <Section bg="black" tight>
        <Link
          href={`/unidades/${unit.slug}`}
          className="text-sm uppercase tracking-widest text-lf-muted transition-colors hover:text-lf-text"
        >
          ← Voltar para {unit.nome}
        </Link>
      </Section>
    </div>
  )
}
