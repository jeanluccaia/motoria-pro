// Catálogo canônico dos planos DGN Club para a Curadoria Founder.
//
// Separação obrigatória:
//   plan_code        → essential | smart | priority
//   contracting_mode → monthly | loyalty_6 | loyalty_12
//   vehicle_category → hatch | sedan | suv | picape
//
// A duração NUNCA faz parte do nome do plano. Não usar "semestral", "anual" ou
// "trimestral" em código, snapshot, filtro ou label público. O valor mensal
// vem exclusivamente da matriz oficial abaixo (server-side) — nunca é digitado
// pelo navegador.

export type FounderPlanCode = "essential" | "smart" | "priority";
export type FounderContractingMode = "monthly" | "loyalty_6" | "loyalty_12";
export type FounderServiceFrequency = "mensal" | "quinzenal" | "semanal";
export type FounderVehicleCategory = "hatch" | "sedan" | "suv" | "picape";

export const FOUNDER_CATALOG_VERSION = "founders-2026-v2" as const;
export type FounderCatalogVersion = typeof FOUNDER_CATALOG_VERSION;

export const founderPlanCodes: readonly FounderPlanCode[] = ["essential", "smart", "priority"] as const;
export const founderContractingModes: readonly FounderContractingMode[] = ["monthly", "loyalty_6", "loyalty_12"] as const;
export const founderVehicleCategories: readonly FounderVehicleCategory[] = ["hatch", "sedan", "suv", "picape"] as const;

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

export const vehicleCategoryLabels: Readonly<Record<FounderVehicleCategory, string>> = {
  hatch: "Hatch",
  sedan: "Sedan",
  suv: "SUV",
  picape: "Picape",
};

// Matriz oficial extraída de https://dgnclub.com/ (data-prices dos cards
// "MENSAL"). Fonte única de verdade — não editar sem revalidação comercial.
export const monthlyPriceMatrix: Readonly<Record<FounderPlanCode, Readonly<Record<FounderVehicleCategory, number>>>> = {
  essential: { hatch: 70, sedan: 80, suv: 90, picape: 100 },
  smart: { hatch: 130, sedan: 150, suv: 170, picape: 190 },
  priority: { hatch: 210, sedan: 240, suv: 270, picape: 300 },
};

export type FounderPlanPositioning =
  | "Entrada para recorrência"
  | "Plano recomendado / melhor equilíbrio"
  | "Experiência premium / prioridade máxima";

export type FounderPriorityLabel =
  | "Prioridade sobre avulsos"
  | "Prioridade superior ao Essential"
  | "Prioridade máxima na agenda";

interface FounderPlanDefinition {
  planCode: FounderPlanCode;
  planName: string;
  description: string;
  serviceFrequency: FounderServiceFrequency;
  serviceQuantity: number;
  /** Percentual de desconto em serviços de Estética DGN — 7 / 15 / 20. */
  aestheticDiscountPercent: number;
  benefits: readonly string[];
  publicRules: readonly string[];
  positioning: FounderPlanPositioning;
  priorityLabel: FounderPriorityLabel;
}

// Fonte canônica dos benefícios exibidos ao Founder. UI (`FounderSnapshotPage`
// e o painel do CRM), snapshot e testes leem daqui. Nunca duplicar bullets
// em componente. Ordem dos bullets = ordem exibida no card.
export const founderPlanDefinitions: readonly FounderPlanDefinition[] = [
  {
    planCode: "essential",
    planName: "DGN Essential",
    description: "Plano de entrada para começar uma rotina recorrente de cuidado.",
    serviceFrequency: "mensal",
    serviceQuantity: 1,
    aestheticDiscountPercent: 7,
    benefits: [
      "1 Lavagem Padrão DGN por mês",
      "Frequência mensal",
      "Vaga programada",
      "Prioridade sobre atendimentos avulsos",
      "Histórico de cuidados",
      "Leva & Traz programado conforme região, rota e disponibilidade",
      "7% de desconto em serviços de Estética DGN",
    ],
    publicRules: ["Condição Founder para a primeira geração de clientes convidados."],
    positioning: "Entrada para recorrência",
    priorityLabel: "Prioridade sobre avulsos",
  },
  {
    planCode: "smart",
    planName: "DGN Smart",
    description: "Cuidado com previsibilidade e prioridade superior ao Essential.",
    serviceFrequency: "quinzenal",
    serviceQuantity: 2,
    aestheticDiscountPercent: 15,
    benefits: [
      "2 Lavagens Padrão DGN por mês",
      "Frequência recomendada a cada 15 dias",
      "Vaga programada",
      "Prioridade superior ao Essential e aos avulsos",
      "Histórico e benefícios de assinante",
      "Leva & Traz programado conforme região, rota e disponibilidade",
      "15% de desconto em serviços de Estética DGN",
    ],
    publicRules: ["Condição Founder para a primeira geração de clientes convidados."],
    positioning: "Plano recomendado / melhor equilíbrio",
    priorityLabel: "Prioridade superior ao Essential",
  },
  {
    planCode: "priority",
    planName: "DGN Priority",
    description: "Maior frequência de cuidados com prioridade máxima.",
    serviceFrequency: "semanal",
    serviceQuantity: 4,
    aestheticDiscountPercent: 20,
    benefits: [
      "4 Lavagens Padrão DGN por mês",
      "Frequência semanal",
      "Vaga fixa ou programada",
      "Prioridade máxima na agenda",
      "Prioridade logística máxima no Leva & Traz",
      "Histórico e benefícios de assinante",
      "20% de desconto em serviços de Estética DGN",
    ],
    publicRules: ["Condição Founder para a primeira geração de clientes convidados."],
    positioning: "Experiência premium / prioridade máxima",
    priorityLabel: "Prioridade máxima na agenda",
  },
] as const;

export interface FounderCatalogOffer {
  planCode: FounderPlanCode;
  planName: string;
  description: string;
  serviceFrequency: FounderServiceFrequency;
  serviceQuantity: number;
  aestheticDiscountPercent: number;
  benefits: readonly string[];
  publicRules: readonly string[];
  positioning: FounderPlanPositioning;
  priorityLabel: FounderPriorityLabel;
  contractingMode: FounderContractingMode;
  contractingModeLabel: string;
  commitmentMonths: number;
  monthlyPrice: number | null;
  billingRule: string;
  vehicleCategory: FounderVehicleCategory | null;
  vehicleCategoryLabel: string | null;
  active: boolean;
  catalogVersion: FounderCatalogVersion;
}

export function isFounderPlanCode(value: unknown): value is FounderPlanCode {
  return typeof value === "string" && (founderPlanCodes as readonly string[]).includes(value);
}

export function isFounderContractingMode(value: unknown): value is FounderContractingMode {
  return typeof value === "string" && (founderContractingModes as readonly string[]).includes(value);
}

export function isFounderVehicleCategory(value: unknown): value is FounderVehicleCategory {
  return typeof value === "string" && (founderVehicleCategories as readonly string[]).includes(value);
}

export function getFounderPlan(planCode: unknown) {
  if (!isFounderPlanCode(planCode)) return null;
  return founderPlanDefinitions.find((plan) => plan.planCode === planCode) ?? null;
}

export function resolveMonthlyPrice(planCode: FounderPlanCode, category: FounderVehicleCategory): number {
  return monthlyPriceMatrix[planCode][category];
}

// Heurística client-side para pré-selecionar a categoria a partir do modelo
// operacional (4uCar). Fallback: retorna null e o operador escolhe manualmente.
// NUNCA usar como fonte de verdade: só serve para reduzir cliques.
export function detectFounderVehicleCategory(model: string | null | undefined): FounderVehicleCategory | null {
  if (!model) return null;
  const m = model.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  if (!m) return null;
  if (/\b(hilux|ranger|amarok|s10|frontier|saveiro|strada|toro|montana|maverick|f 150|colorado|commander|dakota|l200)\b/.test(m)) {
    return "picape";
  }
  if (/\b(x1|x3|x5|q3|q5|q7|q8|renegade|compass|tiggo|creta|kicks|hr v|zr v|cr v|nivus|taos|tucson|santa fe|tracker|equinox|sw4|pajero|outlander|corolla cross|rav4|forester|xv|3008|2008|c4 cactus|duster|ecosport|territory|bronco|song plus|atto|fastback|fofox|dolphin|yuan plus|ora 03)\b/.test(m)) {
    return "suv";
  }
  if (/\b(civic|corolla(?! cross)|jetta|city|virtus|onix plus|prisma|logan|voyage|versa|sentra|cerato|elantra|passat|a4|a6|3 series|c class|e class)\b/.test(m)) {
    return "sedan";
  }
  if (/\b(onix|fit|palio|gol|polo|golf|up|ka|hb20|argo|mobi|kwid|celta|corsa|clio|sandero|c3|c4 hatch|astra|siena|fox|renault kwid)\b/.test(m)) {
    return "hatch";
  }
  return null;
}

// Constrói a oferta com preço/atividade resolvidos server-side.
// - monthly + categoria válida → active=true, monthlyPrice = matriz[plan][cat]
// - loyalty_6 / loyalty_12 (qualquer categoria) → active=false, monthlyPrice=null
// - monthly sem categoria → active=false, monthlyPrice=null (aguarda escolha)
export function getFounderOffer(
  planCode: unknown,
  contractingMode: unknown,
  vehicleCategory: unknown = null,
): FounderCatalogOffer | null {
  const plan = getFounderPlan(planCode);
  if (!plan || !isFounderContractingMode(contractingMode)) return null;
  const category = isFounderVehicleCategory(vehicleCategory) ? vehicleCategory : null;
  const isMonthly = contractingMode === "monthly";
  const active = isMonthly && category !== null;
  const monthlyPrice = active && category ? monthlyPriceMatrix[plan.planCode][category] : null;
  return {
    planCode: plan.planCode,
    planName: plan.planName,
    description: plan.description,
    serviceFrequency: plan.serviceFrequency,
    serviceQuantity: plan.serviceQuantity,
    aestheticDiscountPercent: plan.aestheticDiscountPercent,
    benefits: plan.benefits,
    publicRules: plan.publicRules,
    positioning: plan.positioning,
    priorityLabel: plan.priorityLabel,
    contractingMode,
    contractingModeLabel: contractingModeLabels[contractingMode],
    commitmentMonths: commitmentMonthsByMode[contractingMode],
    monthlyPrice,
    billingRule: billingRuleByMode[contractingMode],
    vehicleCategory: category,
    vehicleCategoryLabel: category ? vehicleCategoryLabels[category] : null,
    active,
    catalogVersion: FOUNDER_CATALOG_VERSION,
  };
}

// Enumera todas as combinações possíveis do catálogo (3 planos × 3 modalidades
// × 4 categorias + 3 planos × 2 modalidades loyalty). Uma combinação está
// "ativa" apenas quando o preço mensal foi validado — hoje: 12 monthly.
export const founderOfferCatalog: readonly FounderCatalogOffer[] = (() => {
  const result: FounderCatalogOffer[] = [];
  for (const plan of founderPlanDefinitions) {
    for (const mode of founderContractingModes) {
      if (mode === "monthly") {
        for (const category of founderVehicleCategories) {
          const offer = getFounderOffer(plan.planCode, mode, category);
          if (offer) result.push(offer);
        }
      } else {
        const offer = getFounderOffer(plan.planCode, mode, null);
        if (offer) result.push(offer);
      }
    }
  }
  return result;
})();

export interface FounderPlanSnapshot {
  planCode: FounderPlanCode;
  planName: string;
  description: string;
  serviceFrequency: FounderServiceFrequency;
  serviceQuantity: number;
  aestheticDiscountPercent: number;
  benefits: string[];
  publicRules: string[];
  positioning: FounderPlanPositioning;
  priorityLabel: FounderPriorityLabel;
  contractingMode: FounderContractingMode;
  contractingModeLabel: string;
  commitmentMonths: number;
  monthlyPrice: number | null;
  billingRule: string;
  vehicleCategory: FounderVehicleCategory | null;
  vehicleCategoryLabel: string | null;
  catalogVersion: FounderCatalogVersion;
}

export function createFounderPlanSnapshot(
  planCode: unknown,
  contractingMode: unknown,
  vehicleCategory: unknown = null,
): FounderPlanSnapshot | null {
  const offer = getFounderOffer(planCode, contractingMode, vehicleCategory);
  if (!offer) return null;
  return {
    planCode: offer.planCode,
    planName: offer.planName,
    description: offer.description,
    serviceFrequency: offer.serviceFrequency,
    serviceQuantity: offer.serviceQuantity,
    aestheticDiscountPercent: offer.aestheticDiscountPercent,
    benefits: [...offer.benefits],
    publicRules: [...offer.publicRules],
    positioning: offer.positioning,
    priorityLabel: offer.priorityLabel,
    contractingMode: offer.contractingMode,
    contractingModeLabel: offer.contractingModeLabel,
    commitmentMonths: offer.commitmentMonths,
    monthlyPrice: offer.monthlyPrice,
    billingRule: offer.billingRule,
    vehicleCategory: offer.vehicleCategory,
    vehicleCategoryLabel: offer.vehicleCategoryLabel,
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
    const category = isFounderVehicleCategory(raw.vehicleCategory) ? raw.vehicleCategory : null;
    // Snapshots antigos podem não trazer aestheticDiscountPercent / positioning /
    // priorityLabel. Preencher a partir do catálogo canônico atual, respeitando
    // valor explícito quando presente (nunca inferir preço nem benefícios).
    const plan = getFounderPlan(raw.planCode)!;
    return {
      planCode: raw.planCode,
      planName: typeof raw.planName === "string" ? raw.planName : plan.planName,
      description: typeof raw.description === "string" ? raw.description : plan.description,
      serviceFrequency: (typeof raw.serviceFrequency === "string" ? raw.serviceFrequency : plan.serviceFrequency) as FounderServiceFrequency,
      serviceQuantity: typeof raw.serviceQuantity === "number" ? raw.serviceQuantity : plan.serviceQuantity,
      aestheticDiscountPercent: typeof raw.aestheticDiscountPercent === "number" ? raw.aestheticDiscountPercent : plan.aestheticDiscountPercent,
      benefits: Array.isArray(raw.benefits) ? raw.benefits.filter((item): item is string => typeof item === "string") : [...plan.benefits],
      publicRules: Array.isArray(raw.publicRules) ? raw.publicRules.filter((item): item is string => typeof item === "string") : [...plan.publicRules],
      positioning: typeof raw.positioning === "string" ? (raw.positioning as FounderPlanPositioning) : plan.positioning,
      priorityLabel: typeof raw.priorityLabel === "string" ? (raw.priorityLabel as FounderPriorityLabel) : plan.priorityLabel,
      contractingMode: raw.contractingMode,
      contractingModeLabel: typeof raw.contractingModeLabel === "string" ? raw.contractingModeLabel : contractingModeLabels[raw.contractingMode],
      commitmentMonths: typeof raw.commitmentMonths === "number" ? raw.commitmentMonths : commitmentMonthsByMode[raw.contractingMode],
      monthlyPrice: typeof raw.monthlyPrice === "number" ? raw.monthlyPrice : null,
      billingRule: typeof raw.billingRule === "string" ? raw.billingRule : billingRuleByMode[raw.contractingMode],
      vehicleCategory: category,
      vehicleCategoryLabel: category ? vehicleCategoryLabels[category] : null,
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
      aestheticDiscountPercent: plan.aestheticDiscountPercent,
      benefits: Array.isArray(raw.benefits) ? raw.benefits.filter((item): item is string => typeof item === "string") : [...plan.benefits],
      publicRules: Array.isArray(raw.publicRules) ? raw.publicRules.filter((item): item is string => typeof item === "string") : [...plan.publicRules],
      positioning: plan.positioning,
      priorityLabel: plan.priorityLabel,
      contractingMode: "loyalty_6",
      contractingModeLabel: contractingModeLabels.loyalty_6,
      commitmentMonths: commitmentMonthsByMode.loyalty_6,
      monthlyPrice: null,
      billingRule: billingRuleByMode.loyalty_6,
      vehicleCategory: null,
      vehicleCategoryLabel: null,
      catalogVersion: "founders-2026-v1" as unknown as FounderCatalogVersion,
    };
  }
  return null;
}

export function isCombinationValidatedForPublication(offer: FounderCatalogOffer): boolean {
  return offer.active === true && typeof offer.monthlyPrice === "number" && offer.monthlyPrice > 0;
}

export const INCOMPLETE_OFFER_ADMIN_MESSAGE = "Esta modalidade ainda não possui condição comercial validada.";
