export interface Plan {
  slug: string
  name: string
  badge: string
  price: string
  period: string
  description: string
  featured: boolean
  /** Tratamento visual do card. `featured` = destaque escuro; `accent` = intermediário; `neutral` = claro. */
  tier: 'featured' | 'accent' | 'neutral'
  /** Texto contratual exibido antes do CTA (ex.: "Fidelidade de 12 meses" ou "Sem fidelidade"). */
  commitment: string
  firstPayment?: { label: string; value: string }
  checkoutUrl?: string | null
}

/** Menor mensalidade da rede — usada na Home para "a partir de R$ ...". */
export const NETWORK_MIN_MONTHLY_PRICE = 'R$ 119,00'

const standardPlans: Plan[] = [
  {
    slug: 'power-plus',
    name: 'Power Plus',
    badge: 'MAIS VANTAJOSO',
    price: 'R$ 119,00',
    period: '/mês',
    description: 'A menor mensalidade da rede',
    featured: true,
    tier: 'featured',
    commitment: 'Fidelidade de 12 meses · Taxa de adesão R$ 19,90',
    firstPayment: { label: '1º mês por', value: 'R$ 9,90' },
    checkoutUrl: null,
  },
  {
    slug: 'power-recorrente',
    name: 'Power Recorrente',
    badge: 'RECORRENTE',
    price: 'R$ 139,00',
    period: '/mês',
    description: 'Sem fidelidade, cobrança mensal no cartão',
    featured: false,
    tier: 'accent',
    commitment: 'Sem fidelidade',
    checkoutUrl: null,
  },
  {
    slug: 'power',
    name: 'Power',
    badge: 'SEM COMPROMISSO',
    price: 'R$ 149,00',
    period: '/mês',
    description: 'Sem compromisso',
    featured: false,
    tier: 'neutral',
    commitment: 'Sem fidelidade',
    checkoutUrl: null,
  },
]

// Ipiranga mantém tabela de preços própria — confirmada nos dados existentes
// (Power Plus R$ 179,90; Power R$ 199,90) e no override de campanha
// (Mensal Recorrente R$ 189,00 documentado em `campaigns.ts`).
const ipirangaPlans: Plan[] = [
  {
    slug: 'power-plus',
    name: 'Power Plus',
    badge: 'MAIS VANTAJOSO',
    price: 'R$ 179,90',
    period: '/mês',
    description: 'A menor mensalidade desta unidade',
    featured: true,
    tier: 'featured',
    commitment: 'Fidelidade de 12 meses · Taxa de adesão R$ 19,90',
    firstPayment: { label: '1º mês por', value: 'R$ 9,90' },
    checkoutUrl: null,
  },
  {
    slug: 'power-recorrente',
    name: 'Power Recorrente',
    badge: 'RECORRENTE',
    price: 'R$ 189,00',
    period: '/mês',
    description: 'Sem fidelidade, cobrança mensal no cartão',
    featured: false,
    tier: 'accent',
    commitment: 'Sem fidelidade',
    checkoutUrl: null,
  },
  {
    slug: 'power',
    name: 'Power',
    badge: 'SEM COMPROMISSO',
    price: 'R$ 199,90',
    period: '/mês',
    description: 'Sem compromisso',
    featured: false,
    tier: 'neutral',
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
  'Convidados: até 5 acessos por mês',
  'Aula experimental grátis',
] as const

/** Alias retido para compatibilidade com consumidores existentes. */
export const planBenefits = networkBenefits

/** Descrição curta do plano exibida no card. Reutilizada por Home e unidades. */
export const planShortDescriptions: Record<string, string> = {
  'power-plus': 'A menor mensalidade da rede',
  'power-recorrente': 'Sem fidelidade, cobrança mensal no cartão',
  'power': 'Sem compromisso',
}

/** Texto de condições exibido dentro do painel expansível de cada plano. */
export const planConditions: Record<string, string[]> = {
  'power-plus': [
    'Fidelidade contratual de 12 meses',
    'Taxa de adesão de R$ 19,90',
    'Primeira mensalidade por R$ 9,90',
    'Cobrança mensal recorrente no cartão',
  ],
  'power-recorrente': [
    'Sem fidelidade',
    'Cancelamento mediante aviso prévio de 30 dias',
    'Cobrança recorrente no cartão cadastrado',
  ],
  'power': [
    'Sem fidelidade',
    'Pagamento mensal',
    'Formas de pagamento disponíveis na unidade',
  ],
}

/** Mapa slug → nome legível, importável em Client Components */
export const PLAN_NAMES: Record<string, string> = {
  'power-plus': 'Power Plus',
  'power-recorrente': 'Power Recorrente',
  'power': 'Power',
}
