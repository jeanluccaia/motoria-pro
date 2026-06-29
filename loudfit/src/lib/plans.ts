export interface MembershipPlan {
  slug: string
  name: string
  badge: string
  price: string
  description: string
  commitment: string
  economical?: boolean
}

export const membershipPlans: MembershipPlan[] = [
  {
    slug: 'power-anual',
    name: 'Power Anual',
    badge: 'MAIS ECONÔMICO',
    price: 'R$119,90',
    description: 'Pague o ano, treine mais barato. Compromisso de 12 meses.',
    commitment: '12 meses',
    economical: true,
  },
  {
    slug: 'power-semestral',
    name: 'Power Semestral',
    badge: 'EQUILÍBRIO',
    price: 'R$129,90',
    description: '6 meses, preço equilibrado.',
    commitment: '6 meses',
  },
  {
    slug: 'power-recorrente',
    name: 'Power Recorrente',
    badge: 'MAIS FLEXÍVEL',
    price: 'R$139,90',
    description: 'Sem fidelidade longa. Cancele quando quiser.',
    commitment: 'Recorrente',
  },
]

export function getMembershipPlan(slug?: string | string[]) {
  const planSlug = Array.isArray(slug) ? slug[0] : slug
  return membershipPlans.find((plan) => plan.slug === planSlug) ?? null
}

export function enrollmentMessage(planName: string, unitName: string) {
  return `Olá, quero me matricular no plano ${planName} da unidade ${unitName}.`
}
