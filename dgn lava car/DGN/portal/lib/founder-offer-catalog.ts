export interface FounderPlanSnapshot {
  code: "smart-founder-semestral" | "priority-founder-semestral";
  name: string;
  version: "founders-2026-v1";
  description: string;
  frequency: string;
  benefits: string[];
  displayedValue: string;
  vehicleCategory: null;
  billingCondition: string;
  publicRules: string[];
}

// Fonte canônica local: condições já publicadas e aprovadas nos convites 001–003.
// Não adicionar uma oferta aqui sem uma condição comercial oficial completa.
export const founderOfferCatalog: readonly FounderPlanSnapshot[] = [
  {
    code: "smart-founder-semestral",
    name: "DGN Smart Semestral",
    version: "founders-2026-v1",
    description: "Cuidado essencial com previsibilidade.",
    frequency: "Semestral",
    benefits: ["Cuidado essencial", "Previsibilidade"],
    displayedValue: "6x de R$ 110",
    vehicleCategory: null,
    billingCondition: "6 parcelas de R$ 110",
    publicRules: ["Condição Founder para a primeira geração de clientes convidados."],
  },
  {
    code: "priority-founder-semestral",
    name: "DGN Priority Semestral",
    version: "founders-2026-v1",
    description: "Maior frequência de cuidados com prioridade máxima.",
    frequency: "Semestral",
    benefits: ["Maior frequência de cuidados", "Prioridade máxima"],
    displayedValue: "6x de R$ 200",
    vehicleCategory: null,
    billingCondition: "6 parcelas de R$ 200",
    publicRules: ["Condição Founder para a primeira geração de clientes convidados."],
  },
] as const;

export type FounderPlanCode = FounderPlanSnapshot["code"];

export function getFounderOffer(code: unknown): FounderPlanSnapshot | null {
  if (typeof code !== "string") return null;
  return founderOfferCatalog.find((offer) => offer.code === code) ?? null;
}

export function createFounderPlanSnapshot(code: unknown): FounderPlanSnapshot | null {
  const offer = getFounderOffer(code);
  return offer ? structuredClone(offer) : null;
}
