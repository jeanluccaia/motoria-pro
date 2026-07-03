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

export const dgnCustomers: DgnCustomer[] = [
  {
    id: "jose-moreira",
    name: "Jose Moreira",
    phone: "",
    vehicle: "Honda Fit",
    plate: "ABC1D23",
    companyLink: "Cliente particular",
    origin: "Base historica DGN",
    attendanceHistory: ["Lavagem completa", "Higienizacao interna", "Manutencao de cuidado"],
    washCount: 37,
    historicalValue: 3050.9,
    customerSince: "2022",
    lastAttendance: "18/06/2026",
    scoreDgn: 97,
    recommendedPlan: "Smart",
    commercialStatus: "Convite Criado",
    recurrence: "Recorrente de alta confianca",
    averageVisitIntervalDays: 42,
    curation: {
      profile: "Pessoa fisica",
      originGroup: "Outro",
      commercialProfile: "Valoriza cuidado",
      idealSchedule: "Mensal",
      founderDecision: "Sim",
      founderNumber: "001",
      internalNotes: "Founder real com pagina personalizada ja criada.",
    },
    campaign: {
      currentCampaign: "Founders 2026",
      founderSelected: true,
      founderNumber: "001",
      founderCondition: "Smart Founder - 6x de R$ 110",
      campaignStatus: "Convite criado",
      personalizedPagePath: "/founders/jose-moreira",
      paymentLink: "",
      lastAction: "Pagina personalizada criada",
      nextAction: "Enviar convite manual pelo WhatsApp",
      lastContact: "",
      conversationStatus: "Aguardando envio",
      notes: "Telefone mantido vazio ate validacao interna.",
    },
  },
  {
    id: "ana-paula-costa",
    name: "Ana Paula Costa",
    phone: "19988887777",
    vehicle: "Jeep Compass",
    plate: "FND8A41",
    companyLink: "Condominio Genebra",
    origin: "Genebra",
    attendanceHistory: ["Lavagem premium", "Cristalizacao", "Aspiracao tecnica"],
    washCount: 22,
    historicalValue: 2180,
    customerSince: "2023",
    lastAttendance: "22/06/2026",
    scoreDgn: 91,
    recommendedPlan: "Priority",
    commercialStatus: "Selecionado Founder",
    recurrence: "Quinzenal com bom ticket medio",
    averageVisitIntervalDays: 18,
    curation: {
      profile: "Pessoa fisica",
      originGroup: "Genebra",
      commercialProfile: "Valoriza comodidade",
      idealSchedule: "Quinzenal",
      founderDecision: "Sim",
      founderNumber: "002",
      internalNotes: "Boa aderencia para convite pela recorrencia.",
    },
    campaign: {
      currentCampaign: "Founders 2026",
      founderSelected: true,
      founderNumber: "002",
      founderCondition: "Priority Founder - 6x de R$ 200",
      campaignStatus: "Selecionado",
      personalizedPagePath: "",
      paymentLink: "",
      lastAction: "Selecionada para campanha",
      nextAction: "Criar pagina personalizada",
      lastContact: "",
      conversationStatus: "Aguardando convite",
      notes: "Validar melhor horario de contato.",
    },
  },
  {
    id: "grupo-lumini",
    name: "Grupo Lumini",
    phone: "19977776666",
    vehicle: "Frota executiva",
    plate: "LMI2F00",
    companyLink: "Lumini",
    origin: "Lumini",
    attendanceHistory: ["Lavagens recorrentes", "Atendimento em lote", "Cuidado executivo"],
    washCount: 44,
    historicalValue: 6420,
    customerSince: "2021",
    lastAttendance: "26/06/2026",
    scoreDgn: 89,
    recommendedPlan: "Corporate Care",
    commercialStatus: "Curado",
    recurrence: "Uso corporativo recorrente",
    averageVisitIntervalDays: 14,
    curation: {
      profile: "Empresa",
      originGroup: "Lumini",
      commercialProfile: "Cliente estrategico",
      idealSchedule: "Semanal",
      founderDecision: "Nao",
      founderNumber: "",
      internalNotes: "Manter como oportunidade futura de Corporate Care.",
    },
    campaign: {
      currentCampaign: "",
      founderSelected: false,
      founderNumber: "",
      founderCondition: "",
      campaignStatus: "",
      personalizedPagePath: "",
      paymentLink: "",
      lastAction: "Curadoria realizada",
      nextAction: "Retomar em campanha Corporate Care",
      lastContact: "",
      conversationStatus: "Relacionamento ativo",
      notes: "Nao priorizar Founders individual.",
    },
  },
  {
    id: "marcos-vieira",
    name: "Marcos Vieira",
    phone: "19966665555",
    vehicle: "Toyota Corolla",
    plate: "MRC4B72",
    companyLink: "Costa e Silva",
    origin: "Indicacao",
    attendanceHistory: ["Lavagem premium", "Protecao de pintura"],
    washCount: 16,
    historicalValue: 1520,
    customerSince: "2024",
    lastAttendance: "20/06/2026",
    scoreDgn: 84,
    recommendedPlan: "Smart",
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "Mensal estavel",
    averageVisitIntervalDays: 31,
    curation: {
      profile: "",
      originGroup: "Costa e Silva",
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
      nextAction: "Realizar curadoria DGN",
      lastContact: "",
      conversationStatus: "Sem contato recente",
      notes: "",
    },
  },
  {
    id: "patricia-mendes",
    name: "Patricia Mendes",
    phone: "19955554444",
    vehicle: "BMW X1",
    plate: "PTM9C11",
    companyLink: "Taquaral",
    origin: "Base DGN",
    attendanceHistory: ["Lavagem premium", "Higienizacao", "Vitrificacao consultiva"],
    washCount: 19,
    historicalValue: 2860,
    customerSince: "2023",
    lastAttendance: "14/06/2026",
    scoreDgn: 88,
    recommendedPlan: "Priority",
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "Alto valor historico",
    averageVisitIntervalDays: 27,
    curation: {
      profile: "",
      originGroup: "Taquaral",
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
      nextAction: "Validar perfil comercial",
      lastContact: "",
      conversationStatus: "Sem contato recente",
      notes: "",
    },
  },
  {
    id: "rafael-cury",
    name: "Rafael Cury",
    phone: "19944443333",
    vehicle: "Audi A3",
    plate: "RCY3D90",
    companyLink: "Cury",
    origin: "Cury",
    attendanceHistory: ["Lavagem completa", "Cera premium"],
    washCount: 13,
    historicalValue: 1180,
    customerSince: "2024",
    lastAttendance: "12/06/2026",
    scoreDgn: 78,
    recommendedPlan: "Smart",
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "Boa aderencia, ticket moderado",
    averageVisitIntervalDays: 36,
    curation: {
      profile: "",
      originGroup: "Cury",
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
      nextAction: "Realizar curadoria DGN",
      lastContact: "",
      conversationStatus: "Sem contato recente",
      notes: "",
    },
  },
  {
    id: "igreja-vida-nova",
    name: "Igreja Vida Nova",
    phone: "19933332222",
    vehicle: "Van executiva",
    plate: "IVN7H18",
    companyLink: "Igreja",
    origin: "Indicacao",
    attendanceHistory: ["Lavagem de van", "Atendimento agendado"],
    washCount: 9,
    historicalValue: 1620,
    customerSince: "2025",
    lastAttendance: "08/06/2026",
    scoreDgn: 72,
    recommendedPlan: "Corporate Care",
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "Uso institucional",
    averageVisitIntervalDays: 45,
    curation: {
      profile: "Igreja",
      originGroup: "Outro",
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
      nextAction: "Validar se entra em Corporate Care",
      lastContact: "",
      conversationStatus: "Sem contato recente",
      notes: "",
    },
  },
  {
    id: "claudia-monsoes",
    name: "Claudia Monsoes",
    phone: "19922221111",
    vehicle: "T-Cross",
    plate: "CLD1J63",
    companyLink: "Monsoes",
    origin: "Monsoes",
    attendanceHistory: ["Lavagem completa", "Aspiracao", "Acabamento"],
    washCount: 11,
    historicalValue: 970,
    customerSince: "2024",
    lastAttendance: "02/06/2026",
    scoreDgn: 69,
    recommendedPlan: "Smart",
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "Mensal irregular",
    averageVisitIntervalDays: 39,
    curation: {
      profile: "",
      originGroup: "Monsoes",
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
      nextAction: "Realizar curadoria DGN",
      lastContact: "",
      conversationStatus: "Sem contato recente",
      notes: "",
    },
  },
];

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
      },
    };
  });
}

export function getCustomerById(id: string) {
  return dgnCustomers.find((customer) => customer.id === id);
}

export function maskPlate(plate: string) {
  if (!plate) return "Nao cadastrada";
  const clean = plate.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}***${clean.slice(-1)}`;
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
      detail: "Perfil pronto para validacao manual pelo Rodrigo/equipe DGN.",
      dateLabel: "MVP",
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

  return `Ola, ${firstName}. Aqui e da DGN.

Preparamos um convite personalizado para voce fazer parte da primeira geracao de Membros Fundadores do DGN Club.

Sua pagina esta pronta aqui:
${link}

Da uma olhada e me chama por aqui para confirmar sua vaga.`;
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
