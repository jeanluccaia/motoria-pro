export interface CustomerAreaLink {
  slug: string
  evoUnitId: number
  url: string
}

const CUSTOMER_AREA_BASE = 'https://evo-totem.w12app.com.br/loudfit'

function buildCustomerAreaUrl(evoUnitId: number): string {
  return `${CUSTOMER_AREA_BASE}/${evoUnitId}/totem/escolher-acao/cliente`
}

const CUSTOMER_AREA_BY_SLUG: Record<string, CustomerAreaLink> = {
  'carrefour-valinhos': { slug: 'carrefour-valinhos', evoUnitId: 1, url: buildCustomerAreaUrl(1) },
  amoreiras: { slug: 'amoreiras', evoUnitId: 2, url: buildCustomerAreaUrl(2) },
  'anchieta-sp': { slug: 'anchieta-sp', evoUnitId: 3, url: buildCustomerAreaUrl(3) },
  'vila-industrial': { slug: 'vila-industrial', evoUnitId: 4, url: buildCustomerAreaUrl(4) },
  'mogi-mirim': { slug: 'mogi-mirim', evoUnitId: 5, url: buildCustomerAreaUrl(5) },
  ipiranga: { slug: 'ipiranga', evoUnitId: 6, url: buildCustomerAreaUrl(6) },
}

export function getCustomerAreaLink(slug: string): CustomerAreaLink | undefined {
  return CUSTOMER_AREA_BY_SLUG[slug]
}
