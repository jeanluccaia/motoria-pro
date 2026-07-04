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
  { icon: '✓', text: 'Checkout oficial EVO' },
  { icon: '✓', text: 'Dados registrados no sistema da academia' },
  { icon: '✓', text: 'Pagamento seguro' },
  { icon: '✓', text: 'Aulas coletivas já inclusas no plano' },
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

      {/* Barra de identidade escura */}
      <div className="bg-lf-black pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-3 text-xs text-lf-muted">
            <Link href={`/unidades/${unit.slug}`} className="hover:text-lf-volt transition-colors">
              ← {unit.nome}
            </Link>
            <span className="text-lf-line">/</span>
            <span>Matrícula online</span>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-0 pb-5 pt-2">
            {[
              { step: '①', label: 'Unidade escolhida', done: true },
              { step: '②', label: 'Plano', done: false },
              { step: '③', label: 'Pagamento seguro', done: false },
            ].map((item, i) => (
              <div key={item.step} className="flex items-center gap-0 flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-black',
                      item.done
                        ? 'bg-lf-volt text-lf-black'
                        : 'bg-lf-surface border border-lf-line text-lf-muted',
                    ].join(' ')}
                  >
                    {item.done ? '✓' : item.step.replace(/[①②③]/g, String(i + 1))}
                  </span>
                  <span className={`hidden sm:block text-[11px] font-medium uppercase tracking-[0.1em] ${item.done ? 'text-lf-text' : 'text-lf-muted'}`}>
                    {item.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className="flex-1 mx-3 h-px bg-lf-line" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* Card de identidade + trust */}
        <div className="bg-white border border-gray-200 border-t-4 border-t-lf-volt">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-1">
                  {isPreOpening ? 'Matrícula antecipada' : 'Matrícula online'}
                </p>
                <h1 className="text-2xl font-black leading-tight text-gray-900 sm:text-3xl">
                  {unit.nome}
                </h1>
                {isIpiranga && isPreOpening && (
                  <p className="mt-2 text-sm font-semibold text-lf-volt">
                    Garanta sua matrícula na inauguração.
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-gray-500 max-w-lg">
                  {isPreOpening
                    ? 'Garanta sua matrícula antes da inauguração. Processo rápido e seguro.'
                    : 'Escolha seu plano no checkout abaixo e finalize sua matrícula.'}
                </p>
              </div>
              <UnitBadge status={unit.status} />
            </div>

            {/* Benefício em destaque */}
            <div className="mt-5 border-l-2 border-lf-volt bg-gray-50 px-4 py-3">
              <p className="text-sm font-bold text-gray-800">
                Aulas coletivas já inclusas no seu plano.
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Muay Thai, Pilates, Spinning, FitDance e mais — sem custo adicional.
              </p>
            </div>
          </div>

          {/* Selos de confiança */}
          <div className="border-t border-gray-100 px-6 py-4 sm:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6">
              {trustItems.map((item) => (
                <div key={item.text} className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center bg-lf-volt text-[9px] font-black text-lf-black">
                    {item.icon}
                  </span>
                  <span className="text-sm text-gray-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card de checkout */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-black text-gray-800">Finalize sua matrícula</p>
            <a
              href={unit.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-500 hover:text-gray-700"
            >
              Abrir checkout em nova aba ↗
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

        {/* Voltar */}
        <div className="py-4">
          <Link
            href={`/unidades/${unit.slug}`}
            className="text-sm text-gray-400 transition-colors hover:text-gray-700"
          >
            ← Voltar para {unit.nome}
          </Link>
        </div>
      </div>
    </div>
  )
}
