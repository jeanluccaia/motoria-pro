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
  image?: {
    src: string
    alt: string
    width: number
    height: number
  }
  visual?: {
    bigLabel: string
    unitLabel?: string
    captionLabel?: string
  }
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
  eyebrowLocation?: string
  heroPersonalNote?: string
  headline: string[]
  supportText: string
  supportSecondary?: string
  heroCtaLabel: string
  offerTitle: string[]
  offerSubtitle: string
  suggestionLabel: string
  cardEyebrow: string
  cardCtaLabel: string
  cardValidityText?: string
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
  planIds?: CampaignPlan['id'][]
  hidePlanSelector?: boolean
  showFirstMonthPrice?: boolean
  firstMonthPriceOverride?: string
  firstMonthPriceValueOverride?: number
  regularPriceOverride?: string
  regularPriceValueOverride?: number
  unitIds?: string[]
  productImage?: {
    src: string
    alt: string
    width: number
    height: number
  }
  giftChips?: string[]
  headlineHighlights?: string[]
  checkoutHref?: string
  checkoutCtaLabel?: string
  checkoutSupportText?: string
  assistanceCtaLabel?: string
  assistanceHref?: string
  showLeadForm?: boolean
  benefitsHighlight?: {
    videoSlot?: {
      note: string
    }
  }
  tracking: CampaignTrackingEvents
  metadata: {
    title: string
    description: string
  }
}

export const conviteConfig: CampaignPageConfig = {
  id: 'convite',
  audience: 'new_customer',
  headerLabel: 'Convite VIP · Loud Fit Ipiranga',
  eyebrow: 'CONVITE VIP',
  eyebrowLocation: 'LOUD FIT IPIRANGA · SÃO PAULO',
  heroPersonalNote: 'Este convite foi liberado para você',
  headline: ['ENTRE AGORA', 'E LEVE ALGUÉM', 'COM VOCÊ'],
  supportText:
    'Reservado para quem receber este convite. Válido até 31 de julho na nova Loud Fit Ipiranga',
  heroCtaLabel: 'GARANTIR MEU CONVITE',
  offerTitle: ['SEU CONVITE', 'ESTÁ ATIVO'],
  offerSubtitle:
    'Matricule-se no Plano Mensal Recorrente e receba os dois presentes da inauguração',
  suggestionLabel: 'Plano da campanha',
  cardEyebrow: 'Seu convite VIP',
  cardCtaLabel: 'GARANTIR MEU CONVITE',
  cardValidityText:
    'Mensalidade recorrente com os presentes exclusivos deste convite',
  benefitsTitle: ['O QUE VEM', 'NO SEU CONVITE'],
  benefitsSupport:
    'Dois presentes exclusivos entregues com a sua matrícula na Loud Fit Ipiranga',
  benefits: [
    {
      n: '01',
      title: 'COQUETELEIRA LOUD FIT',
      desc: 'Item físico da rede Loud Fit entregue na retirada da sua matrícula',
      visual: {
        bigLabel: '01',
        unitLabel: 'ITEM',
        captionLabel: 'presente físico',
      },
    },
    {
      n: '02',
      title: '30 DIAS PARA PRESENTEAR',
      desc: 'Escolha uma pessoa para treinar durante 30 dias na Loud Fit ao seu lado',
      visual: {
        bigLabel: '30',
        unitLabel: 'DIAS',
        captionLabel: 'para presentear',
      },
    },
  ],
  eligibilityText:
    'Presentes liberados após a confirmação da matrícula no Plano Mensal Recorrente. A pessoa presenteada segue o cadastro e as regras de utilização da unidade Ipiranga.',
  scarcity: {
    label: 'CONVITE ATIVO ATÉ 31 DE JULHO',
    detail: 'Reservado para você — presentes sujeitos às regras da unidade',
  },
  formTitle: ['QUERO COMEÇAR', 'NA LOUD FIT'],
  formSupport:
    'Deixe seus dados que a equipe da Loud Fit continua o atendimento por você',
  formCtaLabel: 'QUERO GARANTIR A OFERTA',
  successTitle: 'INTERESSE CONFIRMADO',
  successMessage:
    'Recebemos seus dados. A equipe da Loud Fit entrará em contato para confirmar sua matrícula e explicar como retirar os benefícios.',
  leadSource: 'new_customer_invite',
  campaignId: 'convite_inauguracao',
  showPartnerBenefit: false,
  planIds: ['mensal-recorrente'],
  hidePlanSelector: true,
  showFirstMonthPrice: true,
  firstMonthPriceOverride: 'R$ 69,90',
  firstMonthPriceValueOverride: 69.9,
  regularPriceOverride: 'R$ 179,00',
  regularPriceValueOverride: 179,
  unitIds: ['ipiranga'],
  headlineHighlights: ['ALGUÉM'],
  giftChips: [
    'Ganhe uma coqueteleira Loud Fit',
    'Ganhe 30 dias para presentear alguém',
  ],
  checkoutHref: '/matricula/ipiranga?utm_source=convite&utm_medium=campanha&utm_campaign=convite_inauguracao',
  checkoutCtaLabel: 'MATRICULAR AGORA',
  checkoutSupportText:
    'Cadastro seguro no checkout oficial EVO da Loud Fit Ipiranga',
  assistanceCtaLabel: 'FALAR NO WHATSAPP',
  assistanceHref:
    'https://wa.me/5511937334895?text=Ol%C3%A1%2C%20quero%20aproveitar%20a%20oferta%20de%20inaugura%C3%A7%C3%A3o%20da%20Loud%20Fit%20Ipiranga.',
  showLeadForm: false,
  tracking: buildTracking('new_customer'),
  metadata: {
    title: 'Oferta de inauguração | Loud Fit',
    description:
      'Matricule-se no Plano Mensal Recorrente e ganhe uma coqueteleira Loud Fit + 30 dias de treino para presentear quem você escolher.',
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
