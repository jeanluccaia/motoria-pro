export interface Plan {
  slug: string
  name: string
  badge: string
  price: string
  period: string
  description: string
  featured: boolean
  firstPayment?: { label: string; value: string }
  checkoutUrl?: string | null
}

const standardPlans: Plan[] = [
  {
    slug: 'power-mensal',
    name: 'Power Mensal',
    badge: 'FLEXÍVEL',
    price: 'R$149,90',
    period: '/mês',
    description: 'Mês a mês, sem cobrança automática e sem compromisso de longo prazo.',
    featured: false,
    checkoutUrl: null,
  },
  {
    slug: 'power-mensal-recorrente',
    name: 'Power Mensal Recorrente',
    badge: 'PRÁTICO',
    price: 'R$139,90',
    period: '/mês',
    description: 'Cobrança automática todo mês. Você treina, a renovação é automática.',
    featured: false,
    checkoutUrl: null,
  },
  {
    slug: 'power-semestral-recorrente',
    name: 'Power Semestral Recorrente',
    badge: 'ECONOMIA',
    price: 'R$129,90',
    period: '/mês',
    description: 'Seis meses de treino com mensalidade mais baixa que o plano mensal.',
    featured: false,
    checkoutUrl: null,
  },
  {
    slug: 'power-anual-recorrente',
    name: 'Power Anual Recorrente',
    badge: 'MELHOR VALOR',
    price: 'R$119,90',
    period: '/mês',
    description:
      'Plano de 12 meses com cobrança mensal no cartão — sem travar o limite total do cartão.',
    featured: true,
    firstPayment: { label: 'Primeira mensalidade por', value: 'R$9,90' },
    checkoutUrl: null,
  },
]

const ipirangaPlans: Plan[] = [
  {
    slug: 'power-mensal',
    name: 'Power Mensal',
    badge: 'FLEXÍVEL',
    price: 'R$199,90',
    period: '/mês',
    description: 'Mês a mês, sem cobrança automática e sem compromisso de longo prazo.',
    featured: false,
    checkoutUrl: null,
  },
  {
    slug: 'power-mensal-recorrente',
    name: 'Power Mensal Recorrente',
    badge: 'PRÁTICO',
    price: 'R$189,00',
    period: '/mês',
    description: 'Cobrança automática todo mês. Você treina, a renovação é automática.',
    featured: false,
    checkoutUrl: null,
  },
  {
    slug: 'power-semestral-recorrente',
    name: 'Power Semestral Recorrente',
    badge: 'ECONOMIA',
    price: 'R$179,90',
    period: '/mês',
    description: 'Seis meses de treino com mensalidade mais baixa que o plano mensal.',
    featured: false,
    checkoutUrl: null,
  },
  {
    slug: 'power-anual-recorrente',
    name: 'Power Anual Recorrente',
    badge: 'MELHOR VALOR',
    price: 'R$179,90',
    period: '/mês',
    description:
      'Plano de 12 meses com cobrança mensal no cartão — sem travar o limite total do cartão.',
    featured: true,
    firstPayment: { label: 'Primeira mensalidade por', value: 'R$9,90' },
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
  'power-mensal': 'Mês a mês, sem compromisso',
  'power-mensal-recorrente': 'Cobrança automática mensal',
  'power-semestral-recorrente': '6 meses com mensalidade reduzida',
  'power-anual-recorrente': '12 meses com a menor mensalidade',
}

/** Texto de condições exibido dentro do painel expansível de cada plano. */
export const planConditions: Record<string, string> = {
  'power-mensal':
    'Mês a mês, sem cobrança automática. Ideal para quem quer experimentar sem compromisso de longo prazo.',
  'power-mensal-recorrente':
    'Cobrança automática todo mês. Você treina, a renovação acontece sozinha.',
  'power-semestral-recorrente':
    'Seis meses de treino com mensalidade mais baixa que o plano mensal. Cobrança mensal automática.',
  'power-anual-recorrente':
    'Plano de 12 meses com a menor mensalidade. Cobrança mensal recorrente, sem comprometer de uma só vez o valor total do contrato no limite do cartão. Primeira mensalidade por R$ 9,90.',
}

/** Mapa slug → nome legível, importável em Client Components */
export const PLAN_NAMES: Record<string, string> = {
  'power-mensal': 'Power Mensal',
  'power-mensal-recorrente': 'Power Mensal Recorrente',
  'power-semestral-recorrente': 'Power Semestral Recorrente',
  'power-anual-recorrente': 'Power Anual Recorrente',
}
