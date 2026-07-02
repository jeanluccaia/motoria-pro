export const plans = [
  {
    name: 'Power Anual',
    badge: 'MAIS ECONÔMICO',
    price: 'R$119,90',
    period: '/mês',
    description: 'Melhor valor para quem quer treinar o ano inteiro pagando menos.',
    featured: true,
  },
  {
    name: 'Power Semestral',
    badge: 'EQUILÍBRIO',
    price: 'R$129,90',
    period: '/mês',
    description: 'Plano ideal para manter constância com economia.',
    featured: false,
  },
  {
    name: 'Power Recorrente',
    badge: 'MAIS FLEXÍVEL',
    price: 'R$139,90',
    period: '/mês',
    description: 'Para começar agora com mais liberdade.',
    featured: false,
  },
] as const

export const planBenefits = [
  'Musculação',
  'Aulas coletivas',
  'Estrutura completa',
  'Acesso por reconhecimento facial',
] as const
