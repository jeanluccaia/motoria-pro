export interface Plan {
  slug: string
  name: string
  badge: string
  price: string
  period: string
  description: string
  featured: boolean
  /** Texto contratual exibido antes do CTA (ex.: "Fidelidade de 12 meses" ou "Sem fidelidade"). */
  commitment: string
  firstPayment?: { label: string; value: string }
  checkoutUrl?: string | null
}

const standardPlans: Plan[] = [
  {
    slug: 'power-plus',
    name: 'Power Plus',
    badge: 'MAIS ESCOLHIDO',
    price: 'R$ 119,90',
    period: '/mês',
    description: 'Cobrança mensal recorrente com a menor mensalidade da rede.',
    featured: true,
    commitment: 'Fidelidade de 12 meses',
    firstPayment: { label: 'Primeira mensalidade por', value: 'R$ 9,90' },
    checkoutUrl: null,
  },
  {
    slug: 'power',
    name: 'Power',
    badge: 'FLEXÍVEL',
    price: 'R$ 149,90',
    period: '/mês',
    description: 'Mensalidade recorrente para quem prefere liberdade contratual.',
    featured: false,
    commitment: 'Sem fidelidade',
    checkoutUrl: null,
  },
]

const ipirangaPlans: Plan[] = [
  {
    slug: 'power-plus',
    name: 'Power Plus',
    badge: 'MAIS ESCOLHIDO',
    price: 'R$ 179,90',
    period: '/mês',
    description: 'Cobrança mensal recorrente com a menor mensalidade da unidade.',
    featured: true,
    commitment: 'Fidelidade de 12 meses',
    firstPayment: { label: 'Primeira mensalidade por', value: 'R$ 9,90' },
    checkoutUrl: null,
  },
  {
    slug: 'power',
    name: 'Power',
    badge: 'FLEXÍVEL',
    price: 'R$ 199,90',
    period: '/mês',
    description: 'Mensalidade recorrente para quem prefere liberdade contratual.',
    featured: false,
    commitment: 'Sem fidelidade',
    checkoutUrl: null,
  },
]

/** Ipiranga tem tabela de preços própria; as demais unidades usam a tabela padrão. */
export function getPlans(unitSlug?: string): Plan[] {
  return unitSlug === 'ipiranga' ? ipirangaPlans : standardPlans
}

/**
 * Fonte central de benefícios da rede Loud Fit.
 * Exibidos dentro do painel expansível "Ver benefícios e condições" em
 * todos os cards de planos (Home + páginas de unidade).
 * Sem ponto final por regra de copy.
 */
export const networkBenefits = [
  'Musculação',
  'Aulas coletivas inclusas',
  'Estrutura completa',
  'Reconhecimento facial',
  'Máquina de gelo',
  'Convidados: até 5 acessos',
  'Aula experimental grátis',
] as const

/** Alias retido para compatibilidade com consumidores existentes. */
export const planBenefits = networkBenefits

/** Descrição curta do plano exibida no card. Reutilizada por Home e unidades. */
export const planShortDescriptions: Record<string, string> = {
  'power-plus': 'Menor mensalidade da rede',
  'power': 'Liberdade sem compromisso de longo prazo',
}

/** Texto de condições exibido dentro do painel expansível de cada plano. */
export const planConditions: Record<string, string> = {
  'power-plus':
    'Plano com fidelidade de 12 meses e cobrança mensal recorrente no cartão — sem comprometer de uma só vez o valor total do contrato no limite do cartão. Primeira mensalidade por R$ 9,90.',
  'power':
    'Mensalidade recorrente sem fidelidade contratual. Você mantém liberdade para encerrar quando quiser.',
}

/** Mapa slug → nome legível, importável em Client Components */
export const PLAN_NAMES: Record<string, string> = {
  'power-plus': 'Power Plus',
  'power': 'Power',
}
