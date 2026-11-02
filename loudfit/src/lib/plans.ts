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
  /** Linha auxiliar exibida junto do primeiro mês (ex.: "Taxa de inscrição: R$ 0,00"). */
  firstPaymentNote?: string
  /** Total contratado no ciclo do plano (ex.: "R$ 297 nos 3 meses"). */
  totalPrice?: string
  /** Condições de pagamento (ex.: "À vista ou em 3× de R$ 99"). */
  paymentTerms?: string
  /** Presente físico/adicional destacado no próprio card (ex.: "Camiseta Loud Fit de presente"). */
  giftLine?: string
  checkoutUrl?: string | null
}

// Campanha Black Friday/2026:
//  • Trimestral entra como card destaque — Treine 3 meses, pague apenas 2:
//    R$ 119,90/mês em 2 pagamentos (total R$ 239,80) para 3 meses de treino.
//  • Mensal Recorrente mantém 1ª mensalidade promocional de R$ 69 e
//    "sem fidelidade" como diferencial.
//  • Power Plus continua como alternativa com fidelidade de 12 meses,
//    1ª mensalidade promocional de R$ 9,90.
//  • Power segue sem promoção (avulso, pagamento na unidade).
const standardPlans: Plan[] = [
  {
    slug: 'power-trimestral',
    name: 'Trimestral',
    badge: 'BLACK FRIDAY',
    price: 'R$ 119,90',
    period: '/mês',
    description: 'Treine 3 meses, pague apenas 2',
    featured: true,
    tier: 'featured',
    commitment: 'Contratação única de 3 meses',
    totalPrice: 'R$ 239,80 em 2 pagamentos',
    paymentTerms: 'Treine 3 meses · pague apenas 2× de R$ 119,90',
    checkoutUrl: null,
  },
  {
    slug: 'power-recorrente',
    name: 'Mensal Recorrente',
    badge: 'SEM FIDELIDADE',
    price: 'R$ 139,90',
    period: '/mês',
    description: 'Sem fidelidade • Cancele sem multa\nCobrança recorrente no cartão',
    featured: false,
    tier: 'accent',
    commitment: 'Sem fidelidade • Cancele sem multa',
    firstPayment: { label: '1º mês por', value: 'R$ 69' },
    checkoutUrl: null,
  },
  {
    slug: 'power-plus',
    name: 'Power Plus',
    badge: 'MAIS ECONÔMICO',
    price: 'R$ 119,00',
    period: '/mês',
    description: 'A menor mensalidade da rede',
    featured: false,
    tier: 'accent',
    commitment: 'Fidelidade de 12 meses',
    firstPayment: { label: '1º mês por', value: 'R$ 9,90' },
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
// Trimestral Ipiranga Black Friday: R$ 169,90/mês × 2 pagamentos (total
// R$ 339,80) para 3 meses de treino — "pague 2, treine 3".
const ipirangaPlans: Plan[] = [
  {
    slug: 'power-trimestral',
    name: 'Trimestral',
    badge: 'BLACK FRIDAY',
    price: 'R$ 169,90',
    period: '/mês',
    description: 'Treine 3 meses, pague apenas 2',
    featured: true,
    tier: 'featured',
    commitment: 'Contratação única de 3 meses',
    totalPrice: 'R$ 339,80 em 2 pagamentos',
    paymentTerms: 'Treine 3 meses · pague apenas 2× de R$ 169,90',
    checkoutUrl: null,
  },
  {
    slug: 'power-recorrente',
    name: 'Mensal Recorrente',
    badge: 'SEM FIDELIDADE',
    price: 'R$ 189,00',
    period: '/mês',
    description: 'Sem fidelidade • Cancele sem multa\nCobrança recorrente no cartão',
    featured: false,
    tier: 'accent',
    commitment: 'Sem fidelidade • Cancele sem multa',
    firstPayment: { label: '1º mês por', value: 'R$ 69' },
    checkoutUrl: null,
  },
  {
    slug: 'power-plus',
    name: 'Power Plus',
    badge: 'MAIS ECONÔMICO',
    price: 'R$ 179,90',
    period: '/mês',
    description: 'A menor mensalidade desta unidade',
    featured: false,
    tier: 'accent',
    commitment: 'Fidelidade de 12 meses',
    firstPayment: { label: '1º mês por', value: 'R$ 9,90' },
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
  'power-trimestral': 'Treine 3 meses, pague apenas 2',
  'power-recorrente': 'Sem fidelidade • Cancele sem multa\nCobrança recorrente no cartão',
  'power-plus': 'A menor mensalidade da rede',
  'power': 'Sem compromisso',
}

/** Texto de condições exibido dentro do painel expansível de cada plano. */
export const planConditions: Record<string, string[]> = {
  'power-trimestral': [
    'Oferta Black Friday: treine 3 meses pagando apenas 2',
    'Contratação única do trimestre (3 meses)',
    'Não é mensalidade recorrente',
    'À vista ou em 2× no cartão',
    'A 3ª mensalidade é bonificada pela Loud Fit',
  ],
  'power-recorrente': [
    'Sem fidelidade',
    'Cancelamento sem multa',
    'R$ 69 somente no primeiro mês',
    'A partir do segundo mês, valor mensal cheio desta unidade',
    'Cobrança recorrente no cartão cadastrado',
  ],
  'power-plus': [
    'Fidelidade contratual de 12 meses',
    'Primeira mensalidade por R$ 9,90',
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
  'power-trimestral': 'Trimestral',
  'power-recorrente': 'Mensal Recorrente',
  'power-plus': 'Power Plus',
  'power': 'Power',
}
