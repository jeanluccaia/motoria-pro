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

export async function generateStaticParams() {
  const units = await getUnits().catch(() => [])
  return units.map((u) => ({ slug: u.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const unit = await getUnitBySlug(slug)
  if (!unit) return {}
  return {
    title: `LoudFit ${unit.nome} - Academia em ${unit.cidade}`,
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
  const structureItems = Array.from(
    new Set(['Musculação', 'Aulas coletivas', 'Estrutura completa', 'Reconhecimento facial', ...unit.modalidades])
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pt-16">
        <div className="relative min-h-[560px] overflow-hidden bg-lf-graphite">
          {unit.foto_capa && (
            <Image
              src={unit.foto_capa}
              alt={`LoudFit ${unit.nome}`}
              fill
              sizes="100vw"
              className="object-cover opacity-65"
              priority
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.96),rgba(10,10,10,0.68)_52%,rgba(10,10,10,0.25)),linear-gradient(180deg,rgba(10,10,10,0.25),rgba(10,10,10,0.98))]" />
          <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-end px-4 py-12 sm:px-6 md:py-16">
            <div className="max-w-4xl">
              <div className="mb-5">
                <UnitBadge status={unit.status} />
              </div>
              <p className="mb-4 text-xs uppercase tracking-[0.28em] text-lf-volt">Unidade LoudFit</p>
              <h1 className="text-5xl font-black text-lf-text md:text-7xl">{unit.nome}</h1>
              <p className="mt-5 max-w-[21rem] text-base leading-relaxed text-lf-muted md:max-w-2xl md:text-lg">
                {unit.bairro} / {unit.cidade}, {unit.estado}. Estrutura completa e primeira{' '}
                {unit.slug === 'ipiranga' ? 'parcela' : 'mensalidade'} por R$ 9,90 no Power Anual
                Recorrente.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="#planos" variant="volt" size="lg" className="w-full sm:w-auto">
                  Começar matrícula
                </Button>
                <Button href="#informacoes" variant="ghost" size="lg" className="w-full sm:w-auto">
                  Ver informações
                </Button>
              </div>
            </div>
          </div>
        </div>

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
                      <span className="capitalize text-lf-muted">{day.replaceAll('_', ' ')}</span>
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
                Primeira {unit.slug === 'ipiranga' ? 'parcela' : 'mensalidade'} por R$9,90.
              </h2>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-lf-muted">
                No Power Anual Recorrente.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-lf-muted">
                Escolha um plano desta unidade e avance para a página de vendas EVO.
              </p>
              <Button href="#planos" variant="volt" className="mt-6 w-full justify-center">
                Começar matrícula
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

        <Section id="planos" bg="graphite">
          <SectionHeader
            label="Planos da unidade"
            title="Escolha como começar."
            subtitle={
              unit.slug === 'ipiranga'
                ? 'Tabela própria da unidade Ipiranga.'
                : 'Tabela padrão LoudFit para esta unidade.'
            }
          />

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {getPlans(unit.slug).map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
          <p className="mt-6 text-sm text-lf-muted">
            Após a primeira {unit.slug === 'ipiranga' ? 'parcela' : 'mensalidade'} promocional,
            aplica-se o valor mensal do Power Anual Recorrente desta unidade. Os demais planos
            seguem o valor cheio desde a primeira cobrança.
          </p>
        </Section>

        {unit.galeria?.length > 0 && (
          <Section bg="black" tight>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {unit.galeria.map((img, i) => (
                <div key={img} className="relative aspect-square overflow-hidden">
                  <Image src={img} alt={`LoudFit ${unit.nome} - foto ${i + 1}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section bg="black" tight>
          <Link href="/unidades" className="text-sm uppercase tracking-widest text-lf-muted transition-colors hover:text-lf-text">
            Voltar para unidades
          </Link>
        </Section>
      </div>
    </>
  )
}
