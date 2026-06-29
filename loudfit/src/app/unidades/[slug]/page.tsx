import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getUnits, getUnitBySlug } from '@/lib/supabase'
import { UnitBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { formatWhatsApp } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
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

export default async function UnitPage({ params }: Props) {
  const { slug } = await params
  const unit = await getUnitBySlug(slug)
  if (!unit) notFound()

  const waLink = formatWhatsApp(unit.whatsapp, `Olá! Vi a LoudFit ${unit.nome} no site e quero conhecer.`)

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
    ...(unit.nota_google && { aggregateRating: { '@type': 'AggregateRating', ratingValue: unit.nota_google, ratingCount: 50 } }),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pt-16">
        {/* Hero da unidade */}
        <div className="relative h-64 md:h-96 bg-lf-graphite overflow-hidden">
          {unit.foto_capa && (
            <Image src={unit.foto_capa} alt={`LoudFit ${unit.nome}`} fill className="object-cover opacity-70" priority />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-lf-black via-transparent to-transparent" />
          <div className="absolute bottom-8 left-4 sm:left-8 flex items-end gap-4">
            <div>
              <div className="mb-2">
                <UnitBadge status={unit.status} />
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-lf-text">{unit.nome}</h1>
              <p className="text-lf-muted mt-1">{unit.bairro} · {unit.cidade}, {unit.estado}</p>
            </div>
          </div>
        </div>

        <Section bg="black">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Info principal */}
            <div className="md:col-span-2 space-y-8">
              {unit.modalidades?.length > 0 && (
                <div>
                  <h2 className="text-sm uppercase tracking-widest text-lf-volt mb-4">Modalidades</h2>
                  <div className="flex flex-wrap gap-2">
                    {unit.modalidades.map((m) => (
                      <span key={m} className="text-sm uppercase tracking-wider bg-lf-surface border border-lf-line text-lf-text px-4 py-2">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {unit.horarios && Object.keys(unit.horarios).length > 0 && (
                <div>
                  <h2 className="text-sm uppercase tracking-widest text-lf-volt mb-4">Horários</h2>
                  <div className="space-y-2">
                    {Object.entries(unit.horarios).map(([day, hours]) => (
                      <div key={day} className="flex justify-between text-sm border-b border-lf-line pb-2">
                        <span className="text-lf-muted capitalize">{day}</span>
                        <span className="text-lf-text">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar CTAs */}
            <div className="space-y-4">
              <div className="bg-lf-surface border border-lf-line p-6 space-y-4">
                <p className="text-sm text-lf-muted">{unit.endereco_completo}</p>

                <Button href={waLink} variant="volt" className="w-full justify-center">
                  Quero conhecer
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

        {/* Galeria */}
        {unit.galeria?.length > 0 && (
          <Section bg="graphite" tight>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {unit.galeria.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden">
                  <Image src={img} alt={`LoudFit ${unit.nome} — foto ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Back */}
        <Section bg="black" tight>
          <Link href="/unidades" className="text-sm text-lf-muted hover:text-lf-text transition-colors uppercase tracking-widest">
            ← Todas as unidades
          </Link>
        </Section>
      </div>
    </>
  )
}
