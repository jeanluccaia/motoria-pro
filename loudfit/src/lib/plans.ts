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
  /** Primeira mensalidade promocional. Quando presente, o card mostra "1º MÊS" + valor. */
  firstPayment?: { label: string; value: string }
  /** Linha auxiliar exibida junto do primeiro mês (ex.: "Taxa de inscrição: R$ 9,90"). */
  firstPaymentNote?: string
  checkoutUrl?: string | null
}

/** Menor mensalidade de rede exibida na Home ("depois R$ …/mês"). */
export const NETWORK_MIN_MONTHLY_PRICE = 'R$ 119,00'

// Campanha de setembro/2026:
//  • Mensal Recorrente vira o card recomendado — 1º mês R$ 69, sem fidelidade.
//  • Power Plus continua como alternativa com fidelidade de 12 meses:
//    1º mês R$ 0,00 + taxa de inscrição R$ 9,90.
//  • Power segue sem promoção (avulso, pagamento na unidade).
const standardPlans: Plan[] = [
  {
    slug: 'power-recorrente',
    name: 'Mensal Recorrente',
    badge: 'RECOMENDADO',
    price: 'R$ 139,00',
    period: '/mês',
    description: 'Sem fidelidade de 12 meses · cobrança recorrente no cartão',
    featured: true,
    tier: 'featured',
    commitment: 'Sem fidelidade de 12 meses',
    firstPayment: { label: '1º mês por', value: 'R$ 69,00' },
    checkoutUrl: null,
  },
  {
    slug: 'power-plus',
    name: 'Power Plus',
    badge: 'MAIS VANTAJOSO',
    price: 'R$ 119,00',
    period: '/mês',
    description: 'A menor mensalidade da rede',
    featured: false,
    tier: 'accent',
    commitment: 'Fidelidade de 12 meses',
    firstPayment: { label: '1º mês por', value: 'R$ 0,00' },
    firstPaymentNote: 'Taxa de inscrição: R$ 9,90',
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
    slug: 'power-recorrente',
    name: 'Mensal Recorrente',
    badge: 'RECOMENDADO',
    price: 'R$ 189,00',
    period: '/mês',
    description: 'Sem fidelidade de 12 meses · cobrança recorrente no cartão',
    featured: true,
    tier: 'featured',
    commitment: 'Sem fidelidade de 12 meses',
    firstPayment: { label: '1º mês por', value: 'R$ 69,00' },
    checkoutUrl: null,
  },
  {
    slug: 'power-plus',
    name: 'Power Plus',
    badge: 'MAIS VANTAJOSO',
    price: 'R$ 179,90',
    period: '/mês',
    description: 'A menor mensalidade desta unidade',
    featured: false,
    tier: 'accent',
    commitment: 'Fidelidade de 12 meses',
    firstPayment: { label: '1º mês por', value: 'R$ 0,00' },
    firstPaymentNote: 'Taxa de inscrição: R$ 9,90',
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
  'power-recorrente': 'Sem fidelidade de 12 meses · cobrança recorrente no cartão',
  'power-plus': 'A menor mensalidade da rede',
  'power': 'Sem compromisso',
}

/** Texto de condições exibido dentro do painel expansível de cada plano. */
export const planConditions: Record<string, string[]> = {
  'power-recorrente': [
    'Sem fidelidade de 12 meses',
    'Primeira mensalidade por R$ 69,00',
    'A partir do segundo mês, valor mensal cheio desta unidade',
    'Cobrança recorrente no cartão cadastrado',
  ],
  'power-plus': [
    'Fidelidade contratual de 12 meses',
    'Primeiro mês por R$ 0,00',
    'Taxa de inscrição de R$ 9,90',
    'A partir do segundo mês, valor mensal cheio desta unidade',
    'Cobrança mensal recorrente no cartão',
  ],
  'power': [
    'Sem fidelidade',
    'Pagamento mensal',
    'Formas de pagamento disponíveis na unidade',
  ],
}

/** Mapa slug → nome legível, importável em Client Components */
export const PLAN_NAMES: Record<string, string> = {
  'power-recorrente': 'Mensal Recorrente',
  'power-plus': 'Power Plus',
  'power': 'Power',
}
