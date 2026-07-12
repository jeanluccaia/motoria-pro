export interface FounderPlan {
  id: 'mensal' | 'mensal-recorrente' | 'semestral-recorrente' | 'anual-recorrente'
  name: string
  shortLabel: string
  regularPrice: string
  founderPrice: string
  regularPriceValue: number
  founderPriceValue: number
}

export const founderPlans: FounderPlan[] = [
  {
    id: 'mensal',
    name: 'Mensal',
    shortLabel: 'Mensal',
    regularPrice: 'R$ 149,90',
    founderPrice: 'R$ 139,90',
    regularPriceValue: 149.9,
    founderPriceValue: 139.9,
  },
  {
    id: 'mensal-recorrente',
    name: 'Mensal Recorrente',
    shortLabel: 'Mensal recorrente',
    regularPrice: 'R$ 139,90',
    founderPrice: 'R$ 129,90',
    regularPriceValue: 139.9,
    founderPriceValue: 129.9,
  },
  {
    id: 'semestral-recorrente',
    name: 'Semestral Recorrente',
    shortLabel: 'Semestral',
    regularPrice: 'R$ 129,90',
    founderPrice: 'R$ 119,90',
    regularPriceValue: 129.9,
    founderPriceValue: 119.9,
  },
  {
    id: 'anual-recorrente',
    name: 'Anual Recorrente',
    shortLabel: 'Anual',
    regularPrice: 'R$ 119,90',
    founderPrice: 'R$ 109,90',
    regularPriceValue: 119.9,
    founderPriceValue: 109.9,
  },
]

export const DEFAULT_FOUNDER_PLAN_ID: FounderPlan['id'] = 'anual-recorrente'

export function getFounderPlan(id: string): FounderPlan {
  return founderPlans.find((p) => p.id === id) ?? founderPlans[3]
}
