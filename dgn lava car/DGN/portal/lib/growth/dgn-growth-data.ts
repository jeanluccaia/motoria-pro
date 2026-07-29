import rawCustomers from "./dgn-customers.json" with { type: "json" };

export const DGN_OPERATIONAL_CUTOFF = "2025-01-01";

export const CONFIRMED_FOUNDER_LEGACY_IDS = [
  "benedito-constantino",
  "jose-moreira",
  "rikardo-oliveira",
] as const;

export const commercialStatuses = [
  "Aguardando Curadoria DGN",
  "Curado",
  "Selecionado Founder",
  "Convite Criado",
  "Convite Enviado",
  "Visualizou",
  "Conversando",
  "Pagamento Enviado",
  "Assinante Ativo",
  "Aguardando Kit Founder",
  "Perdido",
  "Nao Prioritario",
] as const;

export type CommercialStatus = (typeof commercialStatuses)[number];

export const recommendedPlans = ["Smart", "Priority", "Corporate Care"] as const;
export type RecommendedPlan = (typeof recommendedPlans)[number];

export const curationProfiles = [
  "Pessoa fisica",
  "Empresa",
  "Reembolso empresa",
  "Condominio",
  "Igreja",
  "Bairro",
  "Indicacao",
] as const;

export const originGroups = [
  "Genebra",
  "Costa e Silva",
  "Cury",
  "Monsoes",
  "Taquaral",
  "Lumini",
  "Avalon",
  "Praca Capital",
  "Medley",
  "Merse",
  "Radial",
  "Outro",
] as const;

export const commercialProfiles = [
  "Valoriza cuidado",
  "Valoriza comodidade",
  "Busca preco",
  "Indica clientes",
  "Cliente estrategico",
] as const;

export const idealSchedules = ["Mensal", "Quinzenal", "Semanal"] as const;
export type FounderDecision = "Sim" | "Nao" | "";

export const foundersPipelineStatuses = [
  "Selecionado",
  "Convite criado",
  "Mensagem enviada",
  "Visualizou",
  "Conversando",
  "Pagamento enviado",
  "Assinante ativo",
  "Aguardando Kit Founder",
  "Perdido",
] as const;

export type FoundersPipelineStatus = (typeof foundersPipelineStatuses)[number];

export const founderKitStatuses = ["Pendente", "Separado", "Entregue"] as const;
export type FounderKitStatus = (typeof founderKitStatuses)[number] | "";

export const founderCardStatuses = ["Pendente", "Gerado", "Enviado"] as const;
export type FounderCardStatus = (typeof founderCardStatuses)[number] | "";

export interface DgnTimelineItem {
  title: string;
  detail: string;
  dateLabel: string;
}

export interface DgnCustomer {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  companyLink: string;
  origin: string;
  attendanceHistory: string[];
  washCount: number;
  historicalValue: number;
  customerSince: string;
  lastAttendance: string;
  scoreDgn: number;
  recommendedPlan: RecommendedPlan;
  commercialStatus: CommercialStatus;
  recurrence: string;
  averageVisitIntervalDays: number;
  dataQualityStatus?: string;
  dataQualityNotes?: string;
  hasValidPhone?: boolean;
  commercial?: {
    owner: string;
    commercialNotes: string;
    nextAction: string;
    nextActionAt: string;
    priority: "baixa" | "normal" | "alta" | "urgente";
    updatedAt: string;
  };
  curation: {
    profile: (typeof curationProfiles)[number] | "";
    originGroup: (typeof originGroups)[number] | "";
    commercialProfile: (typeof commercialProfiles)[number] | "";
    idealSchedule: (typeof idealSchedules)[number] | "";
    founderDecision: FounderDecision;
    founderNumber: string;
    internalNotes: string;
  };
  campaign: {
    currentCampaign: "Founders 2026" | "";
    founderSelected: boolean;
    founderNumber: string;
    founderCondition: string;
    campaignStatus: FoundersPipelineStatus | "";
    personalizedPagePath: string;
    paymentLink: string;
    lastAction: string;
    nextAction: string;
    lastContact: string;
    conversationStatus: string;
    notes: string;
    kitStatus: FounderKitStatus;
    cardStatus: FounderCardStatus;
    founderStatus?: "nao_avaliado" | "recomendado" | "selecionado" | "confirmado" | "lista_espera" | "descartado";
    commercialStage?: "aguardando_analise" | "pronto_para_contato" | "contato_preparado" | "contatado" | "visualizou" | "respondeu" | "conversando" | "pagamento_enviado" | "convertido" | "descartado";
    selectionReason?: string;
    lostReason?: string;
    kitStatusRaw?: "nao_aplicavel" | "pendente" | "em_preparacao" | "pronto" | "entregue";
    cardStatusRaw?: "nao_aplicavel" | "pendente" | "solicitado" | "produzido" | "entregue";
    dates?: Record<string, string>;
    history?: { type: string; description: string; occurredAt: string; actor: string }[];
    engagement?: {
      viewedAt: string; lastViewedAt: string; viewCount: number;
      confirmClickedAt: string; confirmClickCount: number;
      vipClickedAt: string; vipClickCount: number;
    };
    updatedAt?: string;
  };
}

export interface DgnIntelligenceRow {
  nome?: string;
  telefone?: string;
  veiculo?: string;
  placa?: string;
  empresaVinculo?: string;
  origem?: string;
  atendimentos?: string | number;
  lavagens?: string | number;
  valorHistorico?: string | number;
  clienteDesde?: string;
  ultimoAtendimento?: string;
  scoreDgn?: string | number;
  planoRecomendado?: string;
}

const planRevenue: Record<RecommendedPlan, number> = {
  Smart: 660,
  Priority: 1200,
  "Corporate Care": 1800,
};

export const planMonthlyLabel: Record<RecommendedPlan, string> = {
  Smart: "Smart semestral - 6x de R$ 110",
  Priority: "Priority semestral - 6x de R$ 200",
  "Corporate Care": "Corporate Care - proposta assistida",
};

const importedCustomers = rawCustomers as unknown as DgnCustomer[];
const parsedCutoffTimestamp = parseDgnDateAsUtcTimestamp(DGN_OPERATIONAL_CUTOFF);

if (parsedCutoffTimestamp === null) {
  throw new Error(`DGN_OPERATIONAL_CUTOFF invalido: ${DGN_OPERATIONAL_CUTOFF}`);
}

const cutoffTimestamp: number = parsedCutoffTimestamp;

export const allDgnCustomers: DgnCustomer[] = importedCustomers;

export const dgnCustomers: DgnCustomer[] = allDgnCustomers.filter(isOperationalDgnCustomer);

export function parseDgnDateAsUtcTimestamp(value: string | null | undefined): number | null {
  if (typeof value !== "string") return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
}

export function hasOperationalLastAttendance(customer: Pick<DgnCustomer, "lastAttendance">) {
  const lastAttendanceTimestamp = parseDgnDateAsUtcTimestamp(customer.lastAttendance);
  return lastAttendanceTimestamp !== null && lastAttendanceTimestamp >= cutoffTimestamp;
}

export function isConfirmedFounder(customer: Pick<DgnCustomer, "id">) {
  return CONFIRMED_FOUNDER_LEGACY_IDS.includes(
    customer.id as (typeof CONFIRMED_FOUNDER_LEGACY_IDS)[number]
  );
}

export function isConfirmedActiveSubscriber(
  customer: Pick<DgnCustomer, "commercialStatus" | "campaign">
) {
  return (
    customer.commercialStatus === "Assinante Ativo" ||
    customer.campaign.campaignStatus === "Assinante ativo"
  );
}

export function isOperationalDgnCustomer(customer: DgnCustomer) {
  return (
    hasOperationalLastAttendance(customer) ||
    isConfirmedFounder(customer) ||
    isConfirmedActiveSubscriber(customer)
  );
}

export function parseDgnIntelligenceRows(rows: DgnIntelligenceRow[]): DgnCustomer[] {
  return rows.map((row, index) => {
    const score = Number(row.scoreDgn ?? 0);
    const plan = normalizePlan(row.planoRecomendado);

    return {
      id: slugify(row.nome || `cliente-${index + 1}`),
      name: row.nome || `Cliente ${index + 1}`,
      phone: row.telefone || "",
      vehicle: row.veiculo || "A definir",
      plate: row.placa || "",
      companyLink: row.empresaVinculo || "A definir",
      origin: row.origem || "DGN Intelligence 3.0",
      attendanceHistory: ["Importado da DGN Intelligence 3.0"],
      washCount: Number(row.lavagens ?? row.atendimentos ?? 0),
      historicalValue: Number(row.valorHistorico ?? 0),
      customerSince: row.clienteDesde || "A definir",
      lastAttendance: row.ultimoAtendimento || "A definir",
      scoreDgn: Number.isFinite(score) ? score : 0,
      recommendedPlan: plan,
      commercialStatus: "Aguardando Curadoria DGN",
      recurrence: "A validar na curadoria",
      averageVisitIntervalDays: 0,
      curation: {
        profile: "",
        originGroup: "",
        commercialProfile: "",
        idealSchedule: "",
        founderDecision: "",
        founderNumber: "",
        internalNotes: "",
      },
      campaign: {
        currentCampaign: "",
        founderSelected: false,
        founderNumber: "",
        founderCondition: "",
        campaignStatus: "",
        personalizedPagePath: "",
        paymentLink: "",
        lastAction: "Cliente importado",
        nextAction: "Aguardando Curadoria DGN",
        lastContact: "",
        conversationStatus: "Sem contato recente",
        notes: "",
        kitStatus: "",
        cardStatus: "",
      },
    };
  });
}

export function getCustomerById(id: string) {
  return dgnCustomers.find((customer) => customer.id === id);
}

export function matchesDgnCustomerSearch(customer: DgnCustomer, query: string) {
  const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const normalizedQuery = normalizeSearch(query.trim());
  if (!normalizedQuery) return true;

  return normalizeSearch([
    customer.name,
    customer.vehicle,
    customer.companyLink,
    customer.origin,
    customer.phone,
    customer.plate,
  ].join(" ")).includes(normalizedQuery);
}

export function searchDgnCustomers(query: string, customers: DgnCustomer[] = dgnCustomers) {
  return customers.filter((customer) => matchesDgnCustomerSearch(customer, query));
}

export function maskPlate(plate: string) {
  if (!plate) return "Nao cadastrada";
  const clean = plate.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}***${clean.slice(-1)}`;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "Não cadastrado";
  const local = digits.slice(-11);
  if (local.length < 10) return "Telefone inválido";
  return `(${local.slice(0, 2)}) *****-${local.slice(-4)}`;
}

export function getTicketAverage(customer: DgnCustomer) {
  if (!customer.washCount) return 0;
  return customer.historicalValue / customer.washCount;
}

export function getPotentialRevenue(customer: DgnCustomer) {
  return planRevenue[customer.recommendedPlan];
}

export function getCustomerTimeline(customer: DgnCustomer): DgnTimelineItem[] {
  const items: DgnTimelineItem[] = [
    {
      title: "Cliente importado",
      detail: "Registro carregado a partir da estrutura DGN Intelligence 3.0.",
      dateLabel: customer.customerSince,
    },
    {
      title: "Aguardando curadoria",
      detail: "Perfil pronto para validação manual pela equipe DGN.",
      dateLabel: "Em análise",
    },
  ];

  if (customer.commercialStatus !== "Aguardando Curadoria DGN") {
    items.push({
      title: "Curadoria realizada",
      detail: customer.curation.internalNotes || "Cliente recebeu validacao comercial inicial.",
      dateLabel: "Atual",
    });
  }

  if (customer.campaign.founderSelected) {
    items.push({
      title: "Selecionado para campanha",
      detail: `Founder ${customer.campaign.founderNumber || customer.curation.founderNumber}.`,
      dateLabel: "Founders 2026",
    });
  }

  if (customer.campaign.personalizedPagePath) {
    items.push({
      title: "Convite criado",
      detail: "Pagina personalizada vinculada ao perfil interno.",
      dateLabel: "Pronto",
    });
  }

  if (customer.campaign.campaignStatus) {
    items.push({
      title: customer.campaign.campaignStatus,
      detail: customer.campaign.nextAction || "Status atualizado manualmente.",
      dateLabel: customer.campaign.lastAction || "Pipeline",
    });
  }

  return items;
}

export function buildFounderWhatsappMessage(customer: DgnCustomer, origin: string) {
  const pagePath = customer.campaign.personalizedPagePath;
  const link = pagePath ? `${origin}${pagePath}` : "[LINK_PERSONALIZADO]";
  const firstName = customer.name.split(" ")[0] || customer.name;

  return `Olá, ${firstName}.

É uma satisfação ter você entre os primeiros membros da DGN Club.

Você foi selecionado como Founder DGN, fazendo parte do início de uma nova fase no cuidado automotivo por assinatura.

Seu acesso Founder:
${link}

Acesse para confirmar seus dados, cadastrar seu veículo e acompanhar sua experiência DGN.

DGN Club
Lavagens por assinatura`;
}

export function buildWhatsappUrl(customer: DgnCustomer, message: string) {
  const digits = customer.phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
}

function normalizePlan(value?: string): RecommendedPlan {
  if (value === "Priority") return "Priority";
  if (value === "Corporate Care") return "Corporate Care";
  return "Smart";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
