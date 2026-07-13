export interface CampaignPlan {
  id: 'mensal' | 'mensal-recorrente' | 'semestral-recorrente' | 'anual-recorrente'
  name: string
  shortLabel: string
  firstMonthPrice: string
  firstMonthPriceValue: number
  regularPrice: string
  regularPriceValue: number
  recurrenceLabel: string
}

export const campaignPlans: CampaignPlan[] = [
  {
    id: 'mensal',
    name: 'Mensal',
    shortLabel: 'Mensal',
    firstMonthPrice: 'R$ 9,90',
    firstMonthPriceValue: 9.9,
    regularPrice: 'R$ 149,90',
    regularPriceValue: 149.9,
    recurrenceLabel: 'Mês a mês, sem cobrança automática',
  },
  {
    id: 'mensal-recorrente',
    name: 'Mensal Recorrente',
    shortLabel: 'Mensal recorrente',
    firstMonthPrice: 'R$ 9,90',
    firstMonthPriceValue: 9.9,
    regularPrice: 'R$ 139,90',
    regularPriceValue: 139.9,
    recurrenceLabel: 'Cobrança mensal recorrente',
  },
  {
    id: 'semestral-recorrente',
    name: 'Semestral Recorrente',
    shortLabel: 'Semestral',
    firstMonthPrice: 'R$ 9,90',
    firstMonthPriceValue: 9.9,
    regularPrice: 'R$ 129,90',
    regularPriceValue: 129.9,
    recurrenceLabel: '6 meses com cobrança mensal',
  },
  {
    id: 'anual-recorrente',
    name: 'Anual Recorrente',
    shortLabel: 'Anual',
    firstMonthPrice: 'R$ 9,90',
    firstMonthPriceValue: 9.9,
    regularPrice: 'R$ 119,90',
    regularPriceValue: 119.9,
    recurrenceLabel: '12 meses com cobrança mensal',
  },
]

export const DEFAULT_CAMPAIGN_PLAN_ID: CampaignPlan['id'] = 'anual-recorrente'

export function getCampaignPlan(id: string): CampaignPlan {
  return campaignPlans.find((p) => p.id === id) ?? campaignPlans[3]
}

export const STANDARD_PLAN_BENEFITS = [
  'Musculação',
  'Cardio',
  'Aulas coletivas incluídas',
] as const

export type CampaignAudience = 'new_customer' | 'reactivation'

export interface CampaignBenefit {
  n: string
  title: string
  desc: string
  note?: string
}

export interface CampaignTrackingEvents {
  view: string
  offerView: string
  planSelect: string
  ctaClick: string
  formStart: string
  formSubmit: string
  formSuccess: string
  formError: string
}

function buildTracking(prefix: string): CampaignTrackingEvents {
  return {
    view: `${prefix}_invite_view`,
    offerView: `${prefix}_offer_view`,
    planSelect: `${prefix}_plan_select`,
    ctaClick: `${prefix}_cta_click`,
    formStart: `${prefix}_form_start`,
    formSubmit: `${prefix}_form_submit`,
    formSuccess: `${prefix}_form_success`,
    formError: `${prefix}_form_error`,
  }
}

export interface CampaignPageConfig {
  id: string
  audience: CampaignAudience
  headerLabel: string
  eyebrow: string
  headline: string[]
  supportText: string
  supportSecondary?: string
  heroCtaLabel: string
  offerTitle: string[]
  offerSubtitle: string
  suggestionLabel: string
  cardEyebrow: string
  cardCtaLabel: string
  benefitsTitle: string[]
  benefitsSupport?: string
  benefits: CampaignBenefit[]
  eligibilityText?: string
  scarcity: {
    label: string
    detail: string
  }
  formTitle: string[]
  formSupport: string
  formCtaLabel: string
  successTitle: string
  successMessage: string
  leadSource: string
  campaignId: string
  showPartnerBenefit: boolean
  tracking: CampaignTrackingEvents
  metadata: {
    title: string
    description: string
  }
}

export const conviteConfig: CampaignPageConfig = {
  id: 'convite',
  audience: 'new_customer',
  headerLabel: 'Convite Especial',
  eyebrow: 'CONVITE ESPECIAL',
  headline: ['COMECE NA', 'LOUD FIT', 'POR R$ 9,90'],
  supportText: 'Seu primeiro mês por R$ 9,90 em um dos planos desta campanha',
  supportSecondary: 'Depois, o plano segue pelo valor normal escolhido',
  heroCtaLabel: 'VER MEU CONVITE',
  offerTitle: ['SUA CONDIÇÃO', 'ESPECIAL'],
  offerSubtitle:
    'Seu primeiro mês por R$ 9,90 em qualquer um dos planos desta campanha',
  suggestionLabel: 'Sugestão de campanha',
  cardEyebrow: 'Seu convite especial',
  cardCtaLabel: 'QUERO APROVEITAR O CONVITE',
  benefitsTitle: ['O QUE VEM', 'COM SEU CONVITE'],
  benefitsSupport:
    'Uma condição especial para começar a treinar com a Loud Fit',
  benefits: [
    {
      n: '01',
      title: 'PRIMEIRO MÊS POR R$ 9,90',
      desc: 'Comece em um dos planos desta campanha pagando R$ 9,90 no primeiro mês',
    },
    {
      n: '02',
      title: 'CAMISETA EXCLUSIVA LOUD FIT',
      desc: 'Confirme sua matrícula e receba uma camiseta exclusiva da Loud Fit',
      note: 'Sujeita à disponibilidade de tamanho e estoque',
    },
  ],
  scarcity: {
    label: 'OPORTUNIDADE LIMITADA',
    detail: 'Convite ativo por tempo limitado · vagas por unidade',
  },
  formTitle: ['QUERO TREINAR', 'NA LOUD FIT'],
  formSupport: 'Preencha seus dados para a equipe continuar seu atendimento',
  formCtaLabel: 'QUERO APROVEITAR O CONVITE',
  successTitle: 'INTERESSE CONFIRMADO',
  successMessage:
    'Recebemos seus dados. A equipe da Loud Fit continuará o atendimento pelo contato informado.',
  leadSource: 'new_customer_invite',
  campaignId: 'convite_novo_cliente',
  showPartnerBenefit: false,
  tracking: buildTracking('new_customer'),
  metadata: {
    title: 'Convite Especial | Loud Fit',
    description:
      'Comece na Loud Fit por R$ 9,90 no primeiro mês em um dos planos desta campanha.',
  },
}

export const volteConfig: CampaignPageConfig = {
  id: 'volte',
  audience: 'reactivation',
  headerLabel: 'Convite de Retorno',
  eyebrow: 'CONVITE DE RETORNO',
  headline: ['VOLTE PARA A', 'LOUD FIT', 'POR R$ 9,90'],
  supportText: 'Seu primeiro mês de volta por R$ 9,90 em um dos planos desta campanha',
  supportSecondary: 'Depois, o plano segue pelo valor normal escolhido',
  heroCtaLabel: 'VER MINHA CONDIÇÃO',
  offerTitle: ['SEU RETORNO', 'COMEÇA AQUI'],
  offerSubtitle:
    'Seu primeiro mês de volta por R$ 9,90 em qualquer um dos planos desta campanha',
  suggestionLabel: 'Sugestão de campanha',
  cardEyebrow: 'Sua condição de retorno',
  cardCtaLabel: 'QUERO VOLTAR',
  benefitsTitle: ['UM CONVITE', 'PARA RECOMEÇAR'],
  benefitsSupport: 'Uma condição especial para recomeçar seu treino na Loud Fit',
  benefits: [
    {
      n: '01',
      title: 'PRIMEIRO MÊS POR R$ 9,90',
      desc: 'Reative seu treino em um dos planos desta campanha',
    },
    {
      n: '02',
      title: 'CAMISETA EXCLUSIVA LOUD FIT',
      desc: 'Reative seu plano e receba uma camiseta exclusiva da Loud Fit',
      note: 'Sujeita à disponibilidade de tamanho e estoque',
    },
  ],
  scarcity: {
    label: 'OPORTUNIDADE LIMITADA',
    detail: 'Convite de retorno ativo por tempo limitado · vagas por unidade',
  },
  eligibilityText: 'Condição destinada a clientes elegíveis sem plano ativo',
  formTitle: ['QUERO VOLTAR', 'PARA A LOUD FIT'],
  formSupport: 'Confirme seus dados para a equipe verificar sua condição de retorno',
  formCtaLabel: 'QUERO REATIVAR MEU PLANO',
  successTitle: 'INTERESSE CONFIRMADO',
  successMessage:
    'Recebemos seus dados. A equipe da Loud Fit verificará sua condição e continuará o atendimento pelo contato informado.',
  leadSource: 'inactive_customer_reactivation',
  campaignId: 'campanha_volte_loud_fit',
  showPartnerBenefit: false,
  tracking: buildTracking('reactivation'),
  metadata: {
    title: 'Volte para a Loud Fit | Convite de Retorno',
    description:
      'Retorne para a Loud Fit por R$ 9,90 no primeiro mês em um dos planos desta campanha.',
  },
}
