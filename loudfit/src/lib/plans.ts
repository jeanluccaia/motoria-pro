export interface Plan {
  name: string
  badge: string
  price: string
  period: string
  description: string
  featured: boolean
  firstPayment?: { label: string; value: string }
}

const standardPlans: Plan[] = [
  {
    name: 'Power Mensal',
    badge: 'SEM CONTRATO LONGO',
    price: 'R$149,90',
    period: '/mês',
    description: 'Liberdade para treinar mês a mês, sem cobrança automática.',
    featured: false,
  },
  {
    name: 'Power Mensal Recorrente',
    badge: 'PRÁTICO',
    price: 'R$139,90',
    period: '/mês',
    description: 'Cobrança automática todo mês. Você treina, a gente cuida da renovação.',
    featured: false,
  },
  {
    name: 'Power Semestral Recorrente',
    badge: 'ECONOMIA',
    price: 'R$129,90',
    period: '/mês',
    description: 'Seis meses de treino com mensalidade mais baixa que o plano mensal.',
    featured: false,
  },
  {
    name: 'Power Anual Recorrente',
    badge: 'MELHOR VALOR',
    price: 'R$119,90',
    period: '/mês',
    description:
      'Melhor valor da LoudFit, com cobrança mensal recorrente e sem comprometer o limite total do cartão.',
    featured: true,
    firstPayment: { label: 'Primeira mensalidade por', value: 'R$9,90' },
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
  },
  {
    name: 'Power Mensal Recorrente',
    badge: 'PRÁTICO',
    price: 'R$189,00',
    period: '/mês',
    description: 'Cobrança automática todo mês. Você treina, a gente cuida da renovação.',
    featured: false,
  },
  {
    name: 'Power Semestral Recorrente',
    badge: 'ECONOMIA',
    price: 'R$179,90',
    period: '/mês',
    description: 'Seis meses de treino com mensalidade mais baixa que o plano mensal.',
    featured: false,
  },
  {
    name: 'Power Anual Recorrente',
    badge: 'MELHOR VALOR',
    price: 'R$179,90',
    period: '/mês',
    description:
      'Melhor valor da unidade Ipiranga, com cobrança mensal recorrente e sem comprometer o limite total do cartão.',
    featured: true,
    firstPayment: { label: 'Primeira parcela por', value: 'R$9,90' },
  },
]

/** Ipiranga tem tabela de preços própria; as demais unidades usam a tabela padrão. */
export function getPlans(unitSlug?: string): Plan[] {
  return unitSlug === 'ipiranga' ? ipirangaPlans : standardPlans
}

export const planBenefits = [
  'Musculação',
  'Aulas coletivas',
  'Estrutura completa',
  'Acesso por reconhecimento facial',
] as const
