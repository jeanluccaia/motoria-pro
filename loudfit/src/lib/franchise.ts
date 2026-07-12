/**
 * Centralized configuration for the /franquias page.
 *
 * Change values here — do not sprinkle conditionals through the components.
 *
 * FINANCIAL NUMBERS
 * -----------------
 * `showFinancialNumbers` gates every monetary/percentage/area value that
 * comes out of the franchise team. Set to `true` ONLY after formal legal
 * (COF, Lei de Franquias) and financial approval.
 *
 * WHATSAPP
 * --------
 * `expansionWhatsApp.enabled` gates the franchise-specific WhatsApp CTA.
 * Do not fall back to a store number — the form is the primary conversion.
 *
 * LEAD SLA
 * --------
 * `leadResponseSla` controls the wording of the success message. Only set
 * `advertisedHours` when the team has committed to a formal SLA.
 */

export const franchiseConfig = {
  showFinancialNumbers: false as boolean,

  expansionWhatsApp: {
    enabled: false as boolean,
    number: '' as string,
    message: 'Olá! Quero conversar sobre a expansão LoudFit.' as string,
  },

  leadResponseSla: {
    advertisedHours: null as number | null,
  },
} as const

export const franchiseNumbers = {
  franchiseFee: {
    standard: 'R$ 120 mil',
    firstUnits: 'R$ 80 mil',
    firstUnitsLabel: '10 primeiras unidades',
  },
  totalInvestment: 'A partir de R$ 700 mil',
  royalties: '7%',
  publicityFund: '2%',
  minArea: '750 m²',
  paybackEstimate: '15 meses',
  profitabilityRange: '25% a 35%',
} as const

export const franchiseDisclaimer =
  'Estimativas baseadas no modelo atual. Os resultados variam conforme praça, gestão, ponto comercial e operação. Consulte a Circular de Oferta de Franquia.'

/**
 * Capital ranges shown in the form. Kept neutral until commercial team
 * confirms the qualifying thresholds against the real investment.
 */
export const capitalRanges = [
  { value: 'ate_500k', label: 'Até R$ 500 mil' },
  { value: '500_800k', label: 'R$ 500 mil – R$ 800 mil' },
  { value: '800k_1_2mi', label: 'R$ 800 mil – R$ 1,2 mi' },
  { value: 'acima_1_2mi', label: 'Acima de R$ 1,2 mi' },
  { value: 'a_avaliar', label: 'A avaliar com a equipe' },
] as const

export const investmentTimeframes = [
  { value: 'agora', label: 'Agora' },
  { value: '3m', label: 'Em até 3 meses' },
  { value: '6m', label: 'Em até 6 meses' },
  { value: '6m+', label: '6 meses ou mais' },
] as const

export const managementExperience = [
  { value: 'gestao_empresarial', label: 'Gestão empresarial' },
  { value: 'fitness', label: 'Mercado fitness' },
  { value: 'investidor', label: 'Investidor' },
  { value: 'primeiro_negocio', label: 'Primeiro negócio' },
] as const

/**
 * Cities where a candidate is welcome to indicate interest. This does NOT
 * imply territorial exclusivity — that is decided during qualification.
 */
export const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
] as const

export const successCopy = () => {
  const sla = franchiseConfig.leadResponseSla.advertisedHours
  const timing = sla ? ` Nosso time responde em até ${sla} horas úteis.` : ''
  return `Recebemos sua candidatura. Nosso time analisará seu perfil e entrará em contato.${timing}`
}
