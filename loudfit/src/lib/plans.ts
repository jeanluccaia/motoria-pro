export interface Plan {
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
    name: 'Power Mensal',
    badge: 'SEM CONTRATO LONGO',
    price: 'R$149,90',
    period: '/mês',
    description: 'Liberdade para treinar mês a mês, sem cobrança automática.',
    featured: false,
    checkoutUrl: null,
  },
  {
    name: 'Power Mensal Recorrente',
    badge: 'PRÁTICO',
    price: 'R$139,90',
    period: '/mês',
    description: 'Cobrança automática todo mês. Você treina, a gente cuida da renovação.',
    featured: false,
    checkoutUrl: null,
  },
  {
    name: 'Power Semestral Recorrente',
    badge: 'ECONOMIA',
    price: 'R$129,90',
    period: '/mês',
    description: 'Seis meses de treino com mensalidade mais baixa que o plano mensal.',
    featured: false,
    checkoutUrl: null,
  },
  {
    name: 'Power Anual Recorrente',
    badge: 'MELHOR VALOR',
    price: 'R$119,90',
    period: '/mês',
    description:
      'Plano de 12 meses com cobrança mensal no cartão — sem travar o limite com o valor do ano.',
    featured: true,
    firstPayment: { label: 'Primeira mensalidade por', value: 'R$9,90' },
    checkoutUrl: null,
  },
]

const ipirangaPlans: Plan[] = [
  {
    name: 'Power Mensal',
    badge: 'SEM CONTRATO LONGO',
    price: 'R$199,90',
    period: '/mês',
    description: 'Liberdade para treinar mês a mês, sem cobrança automática.',
    featured: false,
    checkoutUrl: null,
  },
  {
    name: 'Power Mensal Recorrente',
    badge: 'PRÁTICO',
    price: 'R$189,00',
    period: '/mês',
    description: 'Cobrança automática todo mês. Você treina, a gente cuida da renovação.',
    featured: false,
    checkoutUrl: null,
  },
  {
    name: 'Power Semestral Recorrente',
    badge: 'ECONOMIA',
    price: 'R$179,90',
    period: '/mês',
    description: 'Seis meses de treino com mensalidade mais baixa que o plano mensal.',
    featured: false,
    checkoutUrl: null,
  },
  {
    name: 'Power Anual Recorrente',
    badge: 'MELHOR VALOR',
    price: 'R$179,90',
    period: '/mês',
    description:
      'Plano de 12 meses com cobrança mensal no cartão — sem travar o limite com o valor do ano.',
    featured: true,
    firstPayment: { label: 'Primeira parcela por', value: 'R$9,90' },
    checkoutUrl: null,
  },
]

/** Ipiranga tem tabela de preços própria; as demais unidades usam a tabela padrão. */
export function getPlans(unitSlug?: string): Plan[] {
  return unitSlug === 'ipiranga' ? ipirangaPlans : standardPlans
}

export const planBenefits = [
  'Musculação',
  'Aulas coletivas inclusas',
  'Estrutura completa',
  'Acesso por reconhecimento facial',
] as const
