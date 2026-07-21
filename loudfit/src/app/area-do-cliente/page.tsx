import type { Metadata } from 'next'
import { getUnits } from '@/lib/supabase'
import { getCustomerAreaLink } from '@/lib/customer-area'
import { unitDisplayName } from '@/lib/utils'
import { Section, SectionHeader } from '@/components/ui/Section'
import { buttonClasses } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Área do Cliente',
  description:
    'Acesse sua Área do Cliente Loud Fit. Escolha sua unidade para gerenciar cadastro, plano, pagamentos e informações no ambiente oficial da EVO.',
  alternates: { canonical: '/area-do-cliente' },
  openGraph: {
    title: 'Área do Cliente | Loud Fit',
    description:
      'Escolha sua unidade e acesse seu cadastro, plano e pagamentos no ambiente oficial da EVO.',
    url: '/area-do-cliente',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Área do Cliente | Loud Fit',
    description:
      'Escolha sua unidade e acesse seu cadastro, plano e pagamentos no ambiente oficial da EVO.',
    images: ['/opengraph-image'],
  },
}

export default async function AreaDoClientePage() {
  const units = await getUnits().catch(() => [])
  const cards = units
    .map((unit) => {
      const link = getCustomerAreaLink(unit.slug)
      if (!link) return null
      return { unit, link }
    })
    .filter((entry): entry is { unit: (typeof units)[number]; link: NonNullable<ReturnType<typeof getCustomerAreaLink>> } => entry !== null)

  return (
    <div className="pt-16">
      <Section bg="lighter">
        <SectionHeader
          dark
          label="Sua conta Loud Fit"
          title="Área do Cliente"
          subtitle="Escolha sua unidade para acessar seu cadastro, plano, pagamentos e informações na EVO."
        />

        {cards.length === 0 ? (
          <p className="border border-gray-200 bg-white py-16 text-center text-gray-500">
            Não foi possível listar as unidades neste momento. Tente novamente em instantes.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map(({ unit, link }) => {
                const name = unitDisplayName(unit)
                return (
                  <div
                    key={unit.id}
                    className="flex flex-col justify-between border border-gray-200 bg-white p-6 transition-colors hover:border-lf-volt"
                  >
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lf-volt">
                        Unidade
                      </p>
                      <h3 className="mt-2 text-xl font-black leading-tight text-gray-900">
                        {name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {unit.bairro} · {unit.cidade}/{unit.estado}
                      </p>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClasses('volt', 'md', 'mt-6 w-full justify-center')}
                    >
                      Acessar Área do Cliente
                    </a>
                  </div>
                )
              })}
            </div>

            <p className="mt-8 flex items-start gap-2 text-xs text-gray-500">
              <span aria-hidden="true" className="mt-[3px] h-2 w-2 shrink-0 bg-lf-volt" />
              <span>Você será direcionado para o ambiente seguro da EVO.</span>
            </p>
          </>
        )}
      </Section>
    </div>
  )
}
