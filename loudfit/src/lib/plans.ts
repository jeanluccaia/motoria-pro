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

// Campanha de outubro/2026:
//  • Trimestral entra como card destaque — 3 meses por R$ 99/mês (R$ 297
//    no total, à vista ou em 3×), com camiseta Loud Fit de presente.
//  • Mensal Recorrente volta ao preço cheio de tabela (sem 1º mês
//    promocional), mantendo "sem fidelidade" como diferencial.
//  • Power Plus continua como alternativa com fidelidade de 12 meses,
//    1ª mensalidade promocional de R$ 9,90.
//  • Power segue sem promoção (avulso, pagamento na unidade).
const standardPlans: Plan[] = [
  {
    slug: 'power-trimestral',
    name: 'Trimestral',
    badge: 'MAIS VANTAJOSO',
    price: 'R$ 99',
    period: '/mês',
    description: 'Musculação, cardio e aulas coletivas',
    featured: true,
    tier: 'featured',
    commitment: 'Contratação única de 3 meses',
    totalPrice: 'R$ 297 nos 3 meses',
    paymentTerms: 'À vista ou em 3× de R$ 99',
    giftLine: 'Ganhe uma camiseta Loud Fit',
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
// Trimestral Ipiranga: R$ 139/mês, total R$ 417 (à vista ou 3× R$ 139).
const ipirangaPlans: Plan[] = [
  {
    slug: 'power-trimestral',
    name: 'Trimestral',
    badge: 'MAIS VANTAJOSO',
    price: 'R$ 139',
    period: '/mês',
    description: 'Musculação, cardio e aulas coletivas',
    featured: true,
    tier: 'featured',
    commitment: 'Contratação única de 3 meses',
    totalPrice: 'R$ 417 nos 3 meses',
    paymentTerms: 'À vista ou em 3× de R$ 139',
    giftLine: 'Ganhe uma camiseta Loud Fit',
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
  'power-trimestral': 'Musculação, cardio e aulas coletivas',
  'power-recorrente': 'Sem fidelidade • Cancele sem multa\nCobrança recorrente no cartão',
  'power-plus': 'A menor mensalidade da rede',
  'power': 'Sem compromisso',
}

/** Texto de condições exibido dentro do painel expansível de cada plano. */
export const planConditions: Record<string, string[]> = {
  'power-trimestral': [
    'Contratação única do trimestre (3 meses)',
    'Não é mensalidade recorrente',
    'À vista pode ser pago por qualquer forma de pagamento',
    'Parcelamento em até 3× no cartão',
    'Camiseta Loud Fit de presente na retirada',
  ],
  'power-recorrente': [
    'Sem fidelidade',
    'Cancelamento sem multa',
    'Valor mensal cheio desta unidade',
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
