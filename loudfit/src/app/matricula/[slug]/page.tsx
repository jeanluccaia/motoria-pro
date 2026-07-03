import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getUnits, getUnitBySlug } from '@/lib/supabase'
import { CheckoutFrame } from '@/components/ui/CheckoutFrame'
import { UnitBadge } from '@/components/ui/Badge'
import { PlanReminder } from '@/components/ui/PlanReminder'

interface Props {
  params: Promise<{ slug: string }>
}

const trustItems = [
  'Matrícula online segura',
  'Cadastro registrado no sistema da academia',
  'Aulas coletivas inclusas nos planos',
  'Primeira mensalidade por R$9,90 no Power Anual Recorrente',
]

const howItWorks = [
  'Escolha o plano no checkout',
  'Preencha seus dados',
  'Matrícula registrada no sistema da academia',
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
    description: `Faça sua matrícula online na ${unit.nome}. Processo rápido e seguro.`,
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
    <div className="min-h-screen bg-[#F2F2F0]">

      {/* Tira escura de identidade — fina, só branding */}
      <div className="bg-lf-black pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link
            href={`/unidades/${unit.slug}`}
            className="text-xs text-lf-muted hover:text-lf-volt transition-colors"
          >
            ← Unidades
          </Link>
          <span className="text-lf-line">/</span>
          <span className="text-xs text-lf-muted truncate">{unit.nome}</span>
        </div>
      </div>

      {/* Conteúdo principal: claro */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* Card 1 — identidade + trust */}
        <div className="bg-white border border-gray-200 border-t-4 border-t-lf-volt p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
                {isPreOpening ? 'Matrícula antecipada' : 'Matrícula online'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                {unit.nome}
              </h1>
              {isPreOpening && (
                <span className="mt-3 inline-flex items-center gap-1.5 border border-lf-volt/40 bg-lf-volt/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-lf-volt">
                  <span className="h-1.5 w-1.5 rounded-full bg-lf-volt animate-pulse" />
                  Unidade em inauguração
                </span>
              )}
              <p className="mt-3 text-sm text-gray-500 max-w-lg">
                {isPreOpening
                  ? 'Garanta sua matrícula antes da inauguração. Processo rápido e seguro.'
                  : 'Escolha seu plano no checkout abaixo e finalize sua matrícula. Processo rápido e seguro.'}
              </p>
            </div>
            <UnitBadge status={unit.status} />
          </div>

          {/* Trust — checklist limpa */}
          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6">
            {trustItems.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center bg-lf-volt text-[9px] font-black text-lf-black">✓</span>
                <span className="text-sm text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2 — como funciona */}
        <div className="bg-white border border-gray-200 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">
            Como funciona
          </p>
          <ol className="flex flex-col gap-3 sm:flex-row sm:gap-0">
            {howItWorks.map((step, i) => (
              <li key={step} className="flex items-start gap-3 flex-1 sm:pr-6">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-lf-volt text-[11px] font-black text-lf-black">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-600 leading-snug">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Card 3 — checkout */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-black text-gray-800">Finalize sua matrícula</p>
            <a
              href={unit.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors"
            >
              Abrir em nova aba ↗
            </a>
          </div>

          <div className="p-4 sm:p-5">
            <PlanReminder isIpiranga={isIpiranga} />
            <CheckoutFrame
              src={unit.checkoutUrl}
              title={`Matrícula online — ${unit.nome}`}
            />
          </div>
        </div>

        {/* Back link */}
        <div className="py-4">
          <Link
            href={`/unidades/${unit.slug}`}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Voltar para {unit.nome}
          </Link>
        </div>
      </div>
    </div>
  )
}
