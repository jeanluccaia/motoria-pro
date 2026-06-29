import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getUnits, getUnitBySlug } from '@/lib/supabase'
import { UnitBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Section, SectionHeader } from '@/components/ui/Section'
import { enrollmentMessage, getMembershipPlan, membershipPlans } from '@/lib/plans'
import { cn, formatWhatsApp } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ plano?: string | string[] }>
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
    title: `LoudFit ${unit.nome} — Academia em ${unit.cidade}`,
    description: `Academia LoudFit no ${unit.bairro}, ${unit.cidade}. ${unit.modalidades?.join(', ')}.`,
  }
}

export default async function UnitPage({ params, searchParams }: Props) {
  const { slug } = await params
  const unit = await getUnitBySlug(slug)
  if (!unit) notFound()

  const selectedPlan = getMembershipPlan((await searchParams)?.plano) ?? membershipPlans[0]
  const selectedWaLink = formatWhatsApp(
    unit.whatsapp,
    enrollmentMessage(selectedPlan.name, unit.nome)
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthClub',
    name: `LoudFit ${unit.nome}`,
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
    ...(unit.nota_google && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: unit.nota_google,
        ratingCount: 50,
      },
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="pt-16">
        <div className="relative h-64 md:h-96 bg-lf-graphite overflow-hidden">
          {unit.foto_capa && (
            <Image
              src={unit.foto_capa}
              alt={`LoudFit ${unit.nome}`}
              fill
              className="object-cover opacity-70"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-lf-black via-transparent to-transparent" />
          <div className="absolute bottom-8 left-4 sm:left-8 flex items-end gap-4">
            <div>
              <div className="mb-2">
                <UnitBadge status={unit.status} />
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-lf-text">{unit.nome}</h1>
              <p className="text-lf-muted mt-1">
                {unit.bairro} · {unit.cidade}, {unit.estado}
              </p>
            </div>
          </div>
        </div>

        <Section bg="black">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-10">
              <div>
                <h2 className="text-sm uppercase tracking-widest text-lf-volt mb-4">
                  Endereço
                </h2>
                <p className="text-lf-text">{unit.endereco_completo}</p>
              </div>

              {unit.horarios && Object.keys(unit.horarios).length > 0 && (
                <div>
                  <h2 className="text-sm uppercase tracking-widest text-lf-volt mb-4">
                    Horários
                  </h2>
                  <div className="space-y-2">
                    {Object.entries(unit.horarios).map(([day, hours]) => (
                      <div
                        key={day}
                        className="flex justify-between gap-4 text-sm border-b border-lf-line pb-2"
                      >
                        <span className="text-lf-muted capitalize">{day}</span>
                        <span className="text-lf-text text-right">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unit.modalidades?.length > 0 && (
                <div>
                  <h2 className="text-sm uppercase tracking-widest text-lf-volt mb-4">
                    Modalidades
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {unit.modalidades.map((m) => (
                      <span
                        key={m}
                        className="text-sm uppercase tracking-wider bg-lf-surface border border-lf-line text-lf-text px-4 py-2"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-lf-surface border border-lf-line p-6 space-y-4">
                <p className="text-xs uppercase tracking-widest text-lf-muted">
                  Matrícula selecionada
                </p>
                <div>
                  <p className="text-xl font-black text-lf-text">{selectedPlan.name}</p>
                  <p className="mt-1 text-sm text-lf-muted">{selectedPlan.price}/mês</p>
                </div>

                <Button href={selectedWaLink} variant="volt" className="w-full justify-center">
                  Começar matrícula
                </Button>

                {unit.google_maps_url && (
                  <Button href={unit.google_maps_url} variant="ghost" className="w-full justify-center">
                    Ver no Maps
                  </Button>
                )}

                {unit.instagram_url && (
                  <Button href={unit.instagram_url} variant="outline" className="w-full justify-center">
                    Instagram da unidade
                  </Button>
                )}
              </div>

              {unit.nota_google && (
                <div className="bg-lf-surface border border-lf-line p-4 text-center">
                  <span className="text-3xl font-black text-lf-volt">{unit.nota_google}</span>
                  <p className="text-xs text-lf-muted mt-1">Nota no Google</p>
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section bg="graphite" id="planos">
          <SectionHeader
            label="Planos disponíveis"
            title="Escolha o plano"
            subtitle="A matrícula será conduzida pelo WhatsApp. A equipe LoudFit envia o link de pagamento EVO manualmente nesta fase."
          />

          <div className="grid gap-5 md:grid-cols-3">
            {membershipPlans.map((plan) => {
              const isSelected = plan.slug === selectedPlan.slug
              const waLink = formatWhatsApp(
                unit.whatsapp,
                enrollmentMessage(plan.name, unit.nome)
              )

              return (
                <article
                  key={plan.slug}
                  className={cn(
                    'flex min-h-[340px] flex-col border bg-lf-black p-6',
                    isSelected ? 'border-lf-volt' : 'border-lf-line'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        'text-[10px] font-black uppercase tracking-widest px-3 py-1',
                        plan.economical || isSelected
                          ? 'bg-lf-volt text-lf-black'
                          : 'border border-lf-line text-lf-muted'
                      )}
                    >
                      {isSelected ? 'PLANO ESCOLHIDO' : plan.badge}
                    </span>
                  </div>

                  <h3 className="mt-8 text-3xl font-black text-lf-text">{plan.name}</h3>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-5xl font-black text-lf-volt leading-none">
                      {plan.price}
                    </span>
                    <span className="pb-1 text-sm uppercase tracking-widest text-lf-muted">
                      /mês
                    </span>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-lf-muted">
                    {plan.description}
                  </p>

                  <div className="mt-auto pt-8">
                    <Button href={waLink} variant="volt" className="w-full justify-center">
                      Matricular pelo WhatsApp
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>

          <p className="mt-7 text-center text-sm text-lf-muted">
            Incluso em todos: musculação, aulas coletivas e acesso por reconhecimento facial.
          </p>
        </Section>

        {unit.galeria?.length > 0 && (
          <Section bg="black" tight>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {unit.galeria.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden">
                  <Image
                    src={img}
                    alt={`LoudFit ${unit.nome} — foto ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section bg="black" tight>
          <Link
            href="/unidades"
            className="text-sm text-lf-muted hover:text-lf-text transition-colors uppercase tracking-widest"
          >
            ← Todas as unidades
          </Link>
        </Section>
      </div>
    </>
  )
}
