import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getUnits, getUnitBySlug } from '@/lib/supabase'
import { getPlans } from '@/lib/plans'
import { UnitBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'
import { PlanCard } from '@/components/ui/PlanCard'

interface Props {
  params: Promise<{ slug: string }>
}

const AULAS_COLETIVAS = new Set([
  'Muay Thai', 'Pilates', 'Pilates Solo', 'FitDance', 'Fit Dance', 'Zumba', 'Jump', 'Spinning',
  'Yoga', 'Jiu-Jitsu', 'Pump', 'GAP', 'Step', 'Crosstreino', 'Loud Dance',
  'Alongamento', 'Alongamento/Mobilidade', 'Funcional', 'Ritbox',
])

const DAY_LABELS: Record<string, string> = {
  segunda_a_sexta: 'Segunda a sexta',
  sabado: 'Sábado',
  domingo: 'Domingo',
  sabado_e_domingo: 'Sábado e domingo',
  abertura: 'Abertura',
}

function formatDay(day: string): string {
  return DAY_LABELS[day] ?? day.replaceAll('_', ' ')
}

export async function generateStaticParams() {
  const units = await getUnits().catch(() => [])
  return units.map((u) => ({ slug: u.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const unit = await getUnitBySlug(slug)
  if (!unit) return {}
  return {
    title: `${unit.nome} - Academia em ${unit.cidade}`,
    description: `Academia LoudFit no ${unit.bairro}, ${unit.cidade}. Planos com primeira mensalidade por R$ 9,90 no Power Anual Recorrente.`,
  }
}

export default async function UnitPage({ params }: Props) {
  const { slug } = await params
  const unit = await getUnitBySlug(slug)
  if (!unit) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthClub',
    name: unit.nome,
    address: {
      '@type': 'PostalAddress',
      streetAddress: unit.endereco_completo,
      addressLocality: unit.cidade,
      addressRegion: unit.estado,
      addressCountry: 'BR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: unit.lat, longitude: unit.lng },
    telephone: unit.whatsapp,
    url: `https://loudfit.com.br/unidades/${unit.slug}`,
    ...(unit.nota_google && { aggregateRating: { '@type': 'AggregateRating', ratingValue: unit.nota_google, ratingCount: 50 } }),
  }

  const isIpiranga = unit.slug === 'ipiranga'
  const hasCheckout = !!unit.checkoutUrl
  const checkoutHref = hasCheckout ? `/matricula/${unit.slug}` : '#planos'

  const aulasUnit = unit.modalidades.filter((m) => AULAS_COLETIVAS.has(m))
  const hasAulas = aulasUnit.length > 0

  const structureItems = Array.from(
    new Set(['Musculação', 'Aulas coletivas', 'Estrutura completa', 'Reconhecimento facial'])
  )

  const plans = getPlans(unit.slug)
  const planCtaBase = hasCheckout ? `/matricula/${unit.slug}` : `/unidades/${unit.slug}#informacoes`
  const planCtaLabel = isIpiranga && hasCheckout
    ? 'Garantir matrícula online'
    : hasCheckout
    ? 'Começar matrícula online'
    : undefined

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pt-16">
        {/* Hero */}
        <div className="relative min-h-[520px] overflow-hidden bg-lf-graphite">
          {unit.foto_capa && (
            <Image
              src={unit.foto_capa}
              alt={unit.nome}
              fill
              sizes="100vw"
              className="object-cover opacity-65"
              priority
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.96),rgba(10,10,10,0.68)_52%,rgba(10,10,10,0.25)),linear-gradient(180deg,rgba(10,10,10,0.25),rgba(10,10,10,0.98))]" />
          <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-end px-4 py-12 sm:px-6 md:py-16">
            <div className="max-w-4xl">
              <div className="mb-5">
                <UnitBadge status={unit.status} />
              </div>
              <p className="mb-4 text-xs uppercase tracking-[0.28em] text-lf-volt">Unidade LoudFit</p>
              <h1 className="text-5xl font-black text-lf-text md:text-7xl">{unit.nome}</h1>
              <p className="mt-4 max-w-[21rem] text-base leading-relaxed text-lf-muted md:max-w-2xl md:text-lg">
                {unit.bairro} / {unit.cidade}, {unit.estado}.{' '}
                {unit.status === 'em_breve'
                  ? 'Unidade em inauguração.'
                  : `Estrutura completa. Primeira ${isIpiranga ? 'parcela' : 'mensalidade'} por R$ 9,90 no Power Anual Recorrente.`}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {unit.status !== 'em_breve' && (
                  <Button href={checkoutHref} variant="volt" size="lg" className="w-full sm:w-auto">
                    {hasCheckout ? 'Matricular online' : 'Começar matrícula'}
                  </Button>
                )}
                {unit.status === 'em_breve' && hasCheckout && (
                  <Button href={checkoutHref} variant="volt" size="lg" className="w-full sm:w-auto">
                    Garantir matrícula online
                  </Button>
                )}
                {unit.status === 'em_breve' && !hasCheckout && (
                  <Button href="#planos" variant="volt" size="lg" className="w-full sm:w-auto">
                    Ver planos
                  </Button>
                )}
                <Button href="#informacoes" variant="ghost" size="lg" className="w-full sm:w-auto">
                  Ver informações
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Informações */}
        <Section id="informacoes" bg="black">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="border border-lf-line bg-lf-surface p-6">
                <h2 className="text-sm uppercase tracking-[0.2em] text-lf-volt">Endereço</h2>
                <p className="mt-4 text-lf-muted">{unit.endereco_completo}</p>
              </div>

              <div className="border border-lf-line bg-lf-surface p-6">
                <h2 className="text-sm uppercase tracking-[0.2em] text-lf-volt">Horário</h2>
                <div className="mt-4 space-y-2">
                  {Object.entries(unit.horarios ?? {}).map(([day, hours]) => (
                    <div key={day} className="flex flex-col gap-1 border-b border-lf-line pb-2 text-sm sm:flex-row sm:justify-between sm:gap-4">
                      <span className="text-lf-muted">{formatDay(day)}</span>
                      <span className="text-lf-text sm:text-right">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-lf-line bg-lf-surface p-6 md:col-span-2">
                <h2 className="text-sm uppercase tracking-[0.2em] text-lf-volt">Estrutura</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {structureItems.map((item) => (
                    <span key={item} className="border border-lf-line bg-lf-black px-4 py-2 text-sm uppercase tracking-wider text-lf-text">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border border-lf-volt/25 bg-lf-graphite p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-lf-volt">Matrícula online</p>
              <h2 className="mt-4 text-3xl font-black text-lf-text">
                Primeira {isIpiranga ? 'parcela' : 'mensalidade'} por R$9,90.
              </h2>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-lf-muted">
                No Power Anual Recorrente.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-lf-muted">
                {isIpiranga && hasCheckout
                  ? 'Unidade em inauguração. Garanta sua matrícula pelo checkout oficial EVO.'
                  : hasCheckout
                  ? 'Checkout disponível. Escolha seu plano abaixo e finalize online.'
                  : 'Escolha um plano e finalize sua matrícula.'}
              </p>
              <Button
                href={unit.status === 'em_breve' && !hasCheckout ? '#planos' : checkoutHref}
                variant="volt"
                className="mt-6 w-full justify-center"
              >
                {unit.status === 'em_breve' && !hasCheckout
                  ? 'Ver planos'
                  : isIpiranga
                  ? 'Garantir matrícula online'
                  : hasCheckout
                  ? 'Matricular online'
                  : 'Começar matrícula'}
              </Button>
              {unit.google_maps_url && (
                <Button href={unit.google_maps_url} variant="ghost" className="mt-3 w-full justify-center">
                  Ver no Maps
                </Button>
              )}
              {unit.instagram_url && (
                <Button href={unit.instagram_url} variant="outline" className="mt-3 w-full justify-center">
                  Instagram da unidade
                </Button>
              )}
            </div>
          </div>
        </Section>

        {/* Planos */}
        <Section id="planos" bg="light">
          <SectionHeader
            dark
            label="Planos da unidade"
            title="Escolha como começar."
            subtitle={
              isIpiranga
                ? 'Tabela própria da unidade Ipiranga.'
                : 'Tabela padrão LoudFit para esta unidade.'
            }
          />

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
            {plans.map((plan) => (
              <PlanCard
                key={plan.name}
                plan={plan}
                ctaBase={planCtaBase}
                ctaLabel={planCtaLabel}
              />
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Após a primeira {isIpiranga ? 'parcela' : 'mensalidade'} promocional,
            aplica-se o valor mensal do Power Anual Recorrente desta unidade. Os demais planos
            seguem o valor cheio desde a primeira cobrança.
          </p>
        </Section>

        {/* Aulas coletivas da unidade */}
        {hasAulas && (
          <Section bg="lighter">
            <SectionHeader
              dark
              label="Aulas coletivas"
              title="Grade de aulas."
              subtitle="Estas aulas estão inclusas no seu plano nesta unidade, sem custo adicional."
            />
            <div className="flex flex-wrap gap-2 md:gap-2.5">
              {aulasUnit.map((aula) => (
                <span
                  key={aula}
                  className="border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                >
                  {aula}
                </span>
              ))}
            </div>
          </Section>
        )}

        {!hasAulas && (
          <Section bg="lighter" tight>
            <p className="text-sm text-gray-500">
              Grade de aulas coletivas desta unidade a confirmar. Consulte a unidade.
            </p>
          </Section>
        )}

        {/* Galeria */}
        {unit.galeria?.length > 0 && (
          <Section bg="black" tight>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {unit.galeria.map((img, i) => (
                <div key={img} className="relative aspect-square overflow-hidden">
                  <Image src={img} alt={`${unit.nome} - foto ${i + 1}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section bg="black" tight>
          <Link href="/unidades" className="text-sm uppercase tracking-widest text-lf-muted transition-colors hover:text-lf-text">
            ← Voltar para unidades
          </Link>
        </Section>
      </div>
    </>
  )
}
