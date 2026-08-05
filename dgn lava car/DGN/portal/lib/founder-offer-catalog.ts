// Catálogo canônico dos planos DGN Club para a Curadoria Founder.
//
// Separação obrigatória:
//   plan_code        → essential | smart | priority
//   contracting_mode → monthly | loyalty_6 | loyalty_12
//
// A duração NUNCA faz parte do nome do plano. Não usar "semestral", "anual" ou
// "trimestral" em código, snapshot, filtro ou label público. O valor mensal só
// pode vir deste catálogo — nunca digitado pelo navegador.

export type FounderPlanCode = "essential" | "smart" | "priority";
export type FounderContractingMode = "monthly" | "loyalty_6" | "loyalty_12";
export type FounderServiceFrequency = "mensal" | "quinzenal" | "semanal";

export const FOUNDER_CATALOG_VERSION = "founders-2026-v2" as const;
export type FounderCatalogVersion = typeof FOUNDER_CATALOG_VERSION;

export const founderPlanCodes: readonly FounderPlanCode[] = ["essential", "smart", "priority"] as const;
export const founderContractingModes: readonly FounderContractingMode[] = ["monthly", "loyalty_6", "loyalty_12"] as const;

export const contractingModeLabels: Readonly<Record<FounderContractingMode, string>> = {
  monthly: "Mensal",
  loyalty_6: "Fidelidade de 6 meses",
  loyalty_12: "Fidelidade de 12 meses",
};

export const commitmentMonthsByMode: Readonly<Record<FounderContractingMode, number>> = {
  monthly: 0,
  loyalty_6: 6,
  loyalty_12: 12,
};

export const billingRuleByMode: Readonly<Record<FounderContractingMode, string>> = {
  monthly: "cobrança mensal sem período de fidelidade",
  loyalty_6: "cobrança mensal durante o período de fidelidade de 6 meses",
  loyalty_12: "cobrança mensal durante o período de fidelidade de 12 meses",
};

interface FounderPlanDefinition {
  planCode: FounderPlanCode;
  planName: string;
  description: string;
  serviceFrequency: FounderServiceFrequency;
  serviceQuantity: number;
  benefits: readonly string[];
  publicRules: readonly string[];
}

export const founderPlanDefinitions: readonly FounderPlanDefinition[] = [
  {
    planCode: "essential",
    planName: "DGN Essential",
    description: "Plano de entrada para começar uma rotina recorrente de cuidado.",
    serviceFrequency: "mensal",
    serviceQuantity: 1,
    benefits: [
      "1 Lavagem Padrão DGN por mês",
      "Vaga programada",
      "Prioridade sobre atendimentos avulsos",
      "Histórico de cuidados",
      "Leva & Traz programado conforme região, rota e disponibilidade",
    ],
    publicRules: ["Condição Founder para a primeira geração de clientes convidados."],
  },
  {
    planCode: "smart",
    planName: "DGN Smart",
    description: "Cuidado essencial com previsibilidade.",
    serviceFrequency: "quinzenal",
    serviceQuantity: 2,
    benefits: ["Cuidado essencial", "Previsibilidade"],
    publicRules: ["Condição Founder para a primeira geração de clientes convidados."],
  },
  {
    planCode: "priority",
    planName: "DGN Priority",
    description: "Maior frequência de cuidados com prioridade máxima.",
    serviceFrequency: "semanal",
    serviceQuantity: 4,
    benefits: ["Maior frequência de cuidados", "Prioridade máxima"],
    publicRules: ["Condição Founder para a primeira geração de clientes convidados."],
  },
] as const;

export interface FounderCatalogOffer {
  planCode: FounderPlanCode;
  planName: string;
  description: string;
  serviceFrequency: FounderServiceFrequency;
  serviceQuantity: number;
  benefits: readonly string[];
  publicRules: readonly string[];
  contractingMode: FounderContractingMode;
  contractingModeLabel: string;
  commitmentMonths: number;
  monthlyPrice: number | null;
  billingRule: string;
  vehicleCategory: string | null;
  active: boolean;
  catalogVersion: FounderCatalogVersion;
}

function buildOffer(plan: FounderPlanDefinition, mode: FounderContractingMode): FounderCatalogOffer {
  return {
    planCode: plan.planCode,
    planName: plan.planName,
    description: plan.description,
    serviceFrequency: plan.serviceFrequency,
    serviceQuantity: plan.serviceQuantity,
    benefits: plan.benefits,
    publicRules: plan.publicRules,
    contractingMode: mode,
    contractingModeLabel: contractingModeLabels[mode],
    commitmentMonths: commitmentMonthsByMode[mode],
    monthlyPrice: null,
    billingRule: billingRuleByMode[mode],
    vehicleCategory: null,
    active: false,
    catalogVersion: FOUNDER_CATALOG_VERSION,
  };
}

// Nenhuma combinação está comercialmente validada ainda: monthlyPrice=null e
// active=false em todas. A aprovação e a criação de página são bloqueadas
// enquanto uma combinação estiver incompleta. Não hardcodar preços aqui sem
// validação oficial da tabela comercial.
export const founderOfferCatalog: readonly FounderCatalogOffer[] = founderPlanDefinitions.flatMap((plan) =>
  founderContractingModes.map((mode) => buildOffer(plan, mode)),
);

export function isFounderPlanCode(value: unknown): value is FounderPlanCode {
  return typeof value === "string" && (founderPlanCodes as readonly string[]).includes(value);
}

export function isFounderContractingMode(value: unknown): value is FounderContractingMode {
  return typeof value === "string" && (founderContractingModes as readonly string[]).includes(value);
}

export function getFounderPlan(planCode: unknown) {
  if (!isFounderPlanCode(planCode)) return null;
  return founderPlanDefinitions.find((plan) => plan.planCode === planCode) ?? null;
}

export function getFounderOffer(planCode: unknown, contractingMode: unknown): FounderCatalogOffer | null {
  if (!isFounderPlanCode(planCode) || !isFounderContractingMode(contractingMode)) return null;
  return founderOfferCatalog.find((offer) => offer.planCode === planCode && offer.contractingMode === contractingMode) ?? null;
}

export interface FounderPlanSnapshot {
  planCode: FounderPlanCode;
  planName: string;
  description: string;
  serviceFrequency: FounderServiceFrequency;
  serviceQuantity: number;
  benefits: string[];
  publicRules: string[];
  contractingMode: FounderContractingMode;
  contractingModeLabel: string;
  commitmentMonths: number;
  monthlyPrice: number | null;
  billingRule: string;
  vehicleCategory: string | null;
  catalogVersion: FounderCatalogVersion;
}

export function createFounderPlanSnapshot(planCode: unknown, contractingMode: unknown): FounderPlanSnapshot | null {
  const offer = getFounderOffer(planCode, contractingMode);
  if (!offer) return null;
  return {
    planCode: offer.planCode,
    planName: offer.planName,
    description: offer.description,
    serviceFrequency: offer.serviceFrequency,
    serviceQuantity: offer.serviceQuantity,
    benefits: [...offer.benefits],
    publicRules: [...offer.publicRules],
    contractingMode: offer.contractingMode,
    contractingModeLabel: offer.contractingModeLabel,
    commitmentMonths: offer.commitmentMonths,
    monthlyPrice: offer.monthlyPrice,
    billingRule: offer.billingRule,
    vehicleCategory: offer.vehicleCategory,
    catalogVersion: offer.catalogVersion,
  };
}

// Compatibilidade de leitura com snapshots antigos gravados antes da separação
// plano × modalidade. Não usar para NOVAS gravações. Retorna null se o snapshot
// não puder ser lido de forma segura.
export function normalizeLegacyFounderSnapshot(input: unknown): FounderPlanSnapshot | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (isFounderPlanCode(raw.planCode) && isFounderContractingMode(raw.contractingMode)) {
    return {
      planCode: raw.planCode,
      planName: typeof raw.planName === "string" ? raw.planName : "",
      description: typeof raw.description === "string" ? raw.description : "",
      serviceFrequency: (typeof raw.serviceFrequency === "string" ? raw.serviceFrequency : "mensal") as FounderServiceFrequency,
      serviceQuantity: typeof raw.serviceQuantity === "number" ? raw.serviceQuantity : 1,
      benefits: Array.isArray(raw.benefits) ? raw.benefits.filter((item): item is string => typeof item === "string") : [],
      publicRules: Array.isArray(raw.publicRules) ? raw.publicRules.filter((item): item is string => typeof item === "string") : [],
      contractingMode: raw.contractingMode,
      contractingModeLabel: typeof raw.contractingModeLabel === "string" ? raw.contractingModeLabel : contractingModeLabels[raw.contractingMode],
      commitmentMonths: typeof raw.commitmentMonths === "number" ? raw.commitmentMonths : commitmentMonthsByMode[raw.contractingMode],
      monthlyPrice: typeof raw.monthlyPrice === "number" ? raw.monthlyPrice : null,
      billingRule: typeof raw.billingRule === "string" ? raw.billingRule : billingRuleByMode[raw.contractingMode],
      vehicleCategory: typeof raw.vehicleCategory === "string" ? raw.vehicleCategory : null,
      catalogVersion: FOUNDER_CATALOG_VERSION,
    };
  }
  // Formato antigo v1: { code: "smart-founder-semestral" | "priority-founder-semestral", ... }
  const legacyCode = typeof raw.code === "string" ? raw.code : null;
  if (legacyCode === "smart-founder-semestral" || legacyCode === "priority-founder-semestral") {
    const planCode: FounderPlanCode = legacyCode === "smart-founder-semestral" ? "smart" : "priority";
    const plan = getFounderPlan(planCode)!;
    return {
      planCode,
      planName: typeof raw.name === "string" ? raw.name : plan.planName,
      description: typeof raw.description === "string" ? raw.description : plan.description,
      serviceFrequency: plan.serviceFrequency,
      serviceQuantity: plan.serviceQuantity,
      benefits: Array.isArray(raw.benefits) ? raw.benefits.filter((item): item is string => typeof item === "string") : [...plan.benefits],
      publicRules: Array.isArray(raw.publicRules) ? raw.publicRules.filter((item): item is string => typeof item === "string") : [...plan.publicRules],
      contractingMode: "loyalty_6",
      contractingModeLabel: contractingModeLabels.loyalty_6,
      commitmentMonths: commitmentMonthsByMode.loyalty_6,
      monthlyPrice: null,
      billingRule: billingRuleByMode.loyalty_6,
      vehicleCategory: null,
      catalogVersion: "founders-2026-v1" as unknown as FounderCatalogVersion,
    };
  }
  return null;
}

export function isCombinationValidatedForPublication(offer: FounderCatalogOffer): boolean {
  return offer.active === true && typeof offer.monthlyPrice === "number" && offer.monthlyPrice > 0;
}

export const INCOMPLETE_OFFER_ADMIN_MESSAGE = "Esta modalidade ainda não possui condição comercial validada.";
