import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getUnits, getUnitBySlug } from '@/lib/supabase'
import { getPlans } from '@/lib/plans'
import { formatWhatsApp, shortUnitName, unitDisplayName } from '@/lib/utils'
import { UnitBadge } from '@/components/ui/Badge'
import { Button, buttonClasses } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'
import { PlansGrid } from '@/components/plans/PlansGrid'
import { UnitGallery, type UnitGalleryImage } from '@/components/ui/UnitGallery'
import { UnitViewTracker } from '@/components/analytics/UnitViewTracker'
import { IpirangaMatriculaCta } from '@/components/analytics/IpirangaMatriculaCta'
import { siteUrl } from '@/lib/site'

interface Props {
  params: Promise<{ slug: string }>
}

const AULAS_COLETIVAS = new Set([
  'Muay Thai', 'Pilates', 'Pilates Solo', 'FitDance', 'Fit Dance', 'Zumba', 'Jump', 'Spinning',
  'Yoga', 'Jiu-Jitsu', 'Pump', 'GAP', 'Step', 'Crosstreino', 'Loud Dance',
  'Alongamento', 'Alongamento/Mobilidade', 'Funcional', 'Ritbox',
])

export async function generateStaticParams() {
  const units = await getUnits().catch(() => [])
  return units.map((u) => ({ slug: u.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const unit = await getUnitBySlug(slug)
  if (!unit) return {}
  const name = unitDisplayName(unit)
  const title = `${name} — Academia em ${unit.cidade}`
  const description = `Academia ${name} em ${unit.bairro}, ${unit.cidade}. Planos com primeira mensalidade por R$9,90 no Power Anual Recorrente.`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/unidades/${unit.slug}` },
    openGraph: {
      title,
      description,
      url: `/unidades/${unit.slug}`,
      images: ['/assets/images/campaign-gym-16x9.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/assets/images/campaign-gym-16x9.png'],
    },
  }
}

export default async function UnitPage({ params }: Props) {
  const { slug } = await params
  const unit = await getUnitBySlug(slug)
  if (!unit) notFound()
  const displayName = unitDisplayName(unit)
  const shortName = shortUnitName(unit)
  const whatsapp = unit.whatsapp_url ?? unit.whatsapp

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthClub',
    name: displayName,
    address: {
      '@type': 'PostalAddress',
      streetAddress: unit.endereco_completo,
      addressLocality: unit.cidade,
      addressRegion: unit.estado,
      addressCountry: 'BR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: unit.lat, longitude: unit.lng },
    ...(whatsapp && { telephone: whatsapp }),
    openingHoursSpecification: unit.horarios.map((item) => ({
      '@type': 'OpeningHoursSpecification',
      name: item.label,
      description: item.value,
    })),
    url: `${siteUrl}/unidades/${unit.slug}`,
    ...(unit.nota_google && { aggregateRating: { '@type': 'AggregateRating', ratingValue: unit.nota_google, ratingCount: 50 } }),
  }

  const isIpiranga = unit.slug === 'ipiranga'
  const hasCheckout = !!unit.checkoutUrl
  const checkoutHref = hasCheckout ? `/matricula/${unit.slug}` : '#planos'

  const aulasUnit = unit.modalidades.filter((m) => AULAS_COLETIVAS.has(m))
  const hasAulas = aulasUnit.length > 0
  const atividades = unit.atividades ?? []
  const hasAtividades = atividades.length > 0

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
      <UnitViewTracker
        unitSlug={unit.slug}
        unitName={displayName}
        city={unit.cidade}
        state={unit.estado}
      />

      <div className="pt-16">
        {/* Hero */}
        <div className="relative min-h-[520px] overflow-hidden bg-lf-graphite">
          {unit.foto_capa && (
            <Image
              src={unit.foto_capa}
              alt={displayName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
              className="object-cover opacity-65"
              priority
              fetchPriority="high"
              quality={60}
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.96),rgba(10,10,10,0.68)_52%,rgba(10,10,10,0.25)),linear-gradient(180deg,rgba(10,10,10,0.25),rgba(10,10,10,0.98))]" />
          <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-end px-4 py-12 sm:px-6 md:py-16">
            <div className="max-w-4xl">
              <div className="mb-5">
                <UnitBadge status={unit.status} />
              </div>
              <p className="mb-4 text-xs uppercase tracking-[0.28em] text-lf-volt">Unidade Loud Fit</p>
              <h1 className="text-5xl font-black text-lf-text md:text-7xl">{displayName}</h1>
              <p className="mt-4 max-w-[21rem] text-base leading-relaxed text-lf-muted md:max-w-2xl md:text-lg">
                {unit.bairro} / {unit.cidade}, {unit.estado}.{' '}
                {unit.status === 'em_breve'
                  ? 'Unidade em inauguração.'
                  : 'Estrutura completa. Primeira mensalidade por R$9,90 no Power Anual Recorrente.'}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {unit.status !== 'em_breve' && (
                  isIpiranga && hasCheckout ? (
                    <IpirangaMatriculaCta
                      href={checkoutHref}
                      className={buttonClasses('volt', 'lg', 'w-full sm:w-auto')}
                    >
                      Matricular online
                    </IpirangaMatriculaCta>
                  ) : (
                    <Button href={checkoutHref} variant="volt" size="lg" className="w-full sm:w-auto">
                      {hasCheckout ? 'Matricular online' : 'Ver planos'}
                    </Button>
                  )
                )}
                {unit.status === 'em_breve' && hasCheckout && (
                  isIpiranga ? (
                    <IpirangaMatriculaCta
                      href={checkoutHref}
                      className={buttonClasses('volt', 'lg', 'w-full sm:w-auto')}
                    >
                      Garantir matrícula online
                    </IpirangaMatriculaCta>
                  ) : (
                    <Button href={checkoutHref} variant="volt" size="lg" className="w-full sm:w-auto">
                      Garantir matrícula online
                    </Button>
                  )
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
        <Section id="informacoes" bg="lighter">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lf-volt">Endereço</p>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{unit.endereco_completo}</p>
              </div>

              <div className="bg-lf-black border border-lf-line p-6">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="h-4 w-0.5 flex-shrink-0 bg-lf-volt" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lf-volt">Horário de funcionamento</p>
                </div>
                <div>
                  {unit.horarios.map((item, i) => (
                    <div key={item.label} className={`flex items-center justify-between gap-4 py-2.5 text-sm ${i > 0 ? 'border-t border-lf-line' : ''}`}>
                      <span className="text-lf-muted">{item.label}</span>
                      <span className="text-right font-bold tabular-nums text-lf-text">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 md:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lf-volt">Estrutura</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {structureItems.map((item) => (
                    <span key={item} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border-t-4 border-t-lf-volt border border-gray-200 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lf-volt">Matrícula online</p>
              <h2 className="mt-3 text-3xl font-black text-gray-900 leading-tight">
                Primeira mensalidade por R$ 9,90
              </h2>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gray-400">
                No Power Anual Recorrente
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                {isIpiranga && unit.status === 'em_breve' && hasCheckout
                  ? 'Unidade em inauguração. Garanta sua matrícula online antes da abertura.'
                  : hasCheckout
                  ? 'Escolha seu plano abaixo e finalize a matrícula online.'
                  : 'Escolha um plano e finalize sua matrícula.'}
              </p>
              {isIpiranga && hasCheckout ? (
                <IpirangaMatriculaCta
                  href={checkoutHref}
                  className={buttonClasses('volt', 'md', 'mt-5 w-full justify-center')}
                >
                  Garantir matrícula online
                </IpirangaMatriculaCta>
              ) : (
                <Button
                  href={unit.status === 'em_breve' && !hasCheckout ? '#planos' : checkoutHref}
                  variant="volt"
                  className="mt-5 w-full justify-center"
                >
                  {unit.status === 'em_breve' && !hasCheckout
                    ? 'Ver planos'
                    : hasCheckout
                    ? 'Matricular online'
                    : 'Ver planos'}
                </Button>
              )}
              {whatsapp && (
                <a
                  href={formatWhatsApp(
                    whatsapp,
                    `Olá, quero tirar uma dúvida sobre a unidade ${shortName} da Loud Fit.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-green-200 bg-green-50 py-2.5 text-xs font-medium text-green-700 transition hover:border-green-400 hover:bg-green-100"
                >
                  <WhatsAppInlineIcon />
                  Falar com a unidade
                </a>
              )}
              {unit.email && (
                <a
                  href={`mailto:${unit.email}`}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 break-all border border-gray-200 py-2.5 text-xs font-medium text-gray-600 transition hover:border-lf-volt hover:text-gray-900 focus-visible:border-lf-volt focus-visible:text-gray-900 focus-visible:outline-none"
                >
                  {unit.email}
                </a>
              )}
              {unit.google_maps_url && (
                <a
                  href={unit.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex w-full items-center justify-center gap-1.5 border border-gray-200 py-2.5 text-xs font-medium text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
                >
                  Ver no Maps ↗
                </a>
              )}
              {unit.instagram_url && (
                <a
                  href={unit.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex w-full items-center justify-center gap-1.5 border border-gray-200 py-2.5 text-xs font-medium text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
                >
                  Instagram ↗
                </a>
              )}
            </div>
          </div>
        </Section>

        {/* Atividades da unidade */}
        {hasAtividades && (
          <Section bg="black">
            <SectionHeader
              label="Atividades disponíveis"
              title="Atividades da unidade"
              subtitle="Modalidades disponíveis nesta unidade, inclusas no seu plano."
            />
            <div className="flex flex-wrap gap-2">
              {atividades.map((atividade) => (
                <span
                  key={atividade}
                  className="border border-lf-line px-3 py-1.5 text-sm font-medium text-lf-muted transition-colors hover:border-lf-volt hover:text-lf-text"
                >
                  {atividade}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Planos */}
        <Section id="planos" bg="graphite">
          <SectionHeader
            label="Planos da unidade"
            title="Escolha como começar"
            subtitle={
              isIpiranga
                ? 'Tabela própria da unidade Ipiranga.'
                : 'Tabela padrão Loud Fit para esta unidade.'
            }
          />

          {/* Benefícios comuns */}
          <div className="mb-10 flex flex-wrap items-center gap-x-5 gap-y-2 border border-lf-line px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-lf-muted/50">
              Todos os planos incluem:
            </p>
            {['Musculação', 'Aulas coletivas', 'Estrutura completa', 'Reconhecimento facial', 'Máquina de gelo'].map((b) => (
              <span key={b} className="flex items-center gap-2 text-xs text-lf-muted">
                <span className="h-1 w-1 shrink-0 bg-lf-volt" />
                {b}
              </span>
            ))}
          </div>

          <PlansGrid
            plans={plans}
            variant="unit"
            ctaBase={planCtaBase}
            ctaLabel={planCtaLabel ?? 'Começar matrícula'}
          />

          <p className="mt-6 text-xs text-lf-muted/50">
            Após a primeira mensalidade promocional,
            aplica-se o valor mensal do Power Anual Recorrente desta unidade. Os demais planos
            seguem o valor cheio desde a primeira cobrança.
          </p>
        </Section>

        {/* Aulas coletivas da unidade */}
        {hasAulas && (
          <Section bg="black">
            <SectionHeader
              label="Aulas coletivas"
              title="Grade de aulas"
              subtitle="Estas aulas estão inclusas no seu plano nesta unidade, sem custo adicional."
            />
            <div className="flex flex-wrap gap-2">
              {aulasUnit.map((aula) => (
                <span
                  key={aula}
                  className="border border-lf-line px-3 py-1.5 text-sm font-medium text-lf-muted hover:border-lf-volt hover:text-lf-text transition-colors"
                >
                  {aula}
                </span>
              ))}
            </div>
          </Section>
        )}

        {!hasAulas && !hasAtividades && (
          <Section bg="black" tight>
            <p className="text-sm text-lf-muted/60">
              Grade de aulas coletivas desta unidade a confirmar. Consulte a unidade.
            </p>
          </Section>
        )}

        {/* Galeria — mesma experiência responsiva com main image, arrows, counter e indicadores */}
        {(unit.media?.gallery?.length ?? unit.galeria?.length ?? 0) > 0 && (
          <Section bg="black" tight>
            {(() => {
              const items: UnitGalleryImage[] = unit.media?.gallery?.length
                ? unit.media.gallery.map((item) => ({
                    src: item.src,
                    alt: item.alt,
                    fit: item.fit,
                    position: item.position,
                  }))
                : unit.galeria.map((src, i) => ({ src, alt: `${displayName} - foto ${i + 1}` }))

              return <UnitGallery images={items} unitName={displayName} />
            })()}
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

function WhatsAppInlineIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  )
}
