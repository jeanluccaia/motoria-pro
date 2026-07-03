import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getUnits, getUnitBySlug } from '@/lib/supabase'
import { CheckoutFrame } from '@/components/ui/CheckoutFrame'
import { Section } from '@/components/ui/Section'
import { SignalMark } from '@/components/ui/SignalMark'
import { PlanReminder } from '@/components/ui/PlanReminder'

interface Props {
  params: Promise<{ slug: string }>
}

const trustItems = [
  'Checkout oficial EVO',
  'Venda e cadastro registrados no sistema da academia',
  'Aulas coletivas inclusas nos planos',
  'Power Anual Recorrente com primeira mensalidade por R$9,90',
]

const howItWorks = [
  'Escolha o plano no checkout',
  'Preencha seus dados',
  'Sua matrícula fica registrada no sistema da academia',
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
    title: `Matrícula online — ${unit.nome}`,
    description: `Faça sua matrícula online na ${unit.nome}. Checkout oficial EVO. Power Anual Recorrente com primeira mensalidade por R$9,90.`,
  }
}

export default async function MatriculaPage({ params }: Props) {
  const { slug } = await params
  const unit = await getUnitBySlug(slug)

  if (!unit) notFound()
  if (!unit.checkoutUrl) redirect(`/unidades/${slug}`)

  const isPreOpening = unit.status === 'em_breve'
  const isIpiranga = unit.slug === 'ipiranga'

  return (
    <div className="pt-16">
      {/* Header */}
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

        {/* Trust items */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item} className="flex items-start gap-3 border border-lf-line bg-lf-surface px-4 py-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lf-volt" />
              <span className="text-sm text-lf-muted leading-snug">{item}</span>
            </div>
          ))}
        </div>

        {/* Como funciona */}
        <div className="mt-8 border-t border-lf-line pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lf-muted mb-4">Como funciona</p>
          <ol className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            {howItWorks.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-lf-volt text-[11px] font-black text-lf-black">
                  {i + 1}
                </span>
                <span className="text-sm text-lf-muted">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Checkout iframe */}
      <Section bg="light">
        <PlanReminder isIpiranga={isIpiranga} />

        <CheckoutFrame
          src={unit.checkoutUrl}
          title={`Checkout EVO — ${unit.nome}`}
        />

        <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-400">
            Se o checkout não carregar, tente abrir em nova aba.
          </p>
          <a
            href={unit.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 border border-gray-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-600 transition hover:border-lf-volt hover:text-gray-900"
          >
            Abrir em nova aba ↗
          </a>
        </div>
      </Section>

      {/* Rodapé */}
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
