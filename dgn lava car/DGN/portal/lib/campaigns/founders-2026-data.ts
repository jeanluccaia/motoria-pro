export type FounderCampaignStatus =
  | "Pendente"
  | "Convite enviado"
  | "Visualizou"
  | "Respondeu"
  | "Link aberto"
  | "Pagamento pendente"
  | "Convertido"
  | "Perdido";

export type FounderPaymentStatus = "Pendente" | "Link enviado" | "Pago";
export type FounderKitStatus = "Pendente" | "Separado" | "Entregue";

export interface CommercialTimelineItem {
  title: string;
  detail: string;
  dateLabel: string;
}

export interface FounderCampaignGuest {
  id: string;
  founderNumber: string;
  slug: string | null;
  name: string;
  phone: string;
  vehicle: string;
  maskedPlate: string;
  customerProfile: {
    customerSince: string;
    attendances: number | null;
    historicalValue: number | null;
    lastAttendance: string;
    relationshipScore: "Founder ativo" | "A preencher";
  };
  recommendedPlan: string;
  founderConditions: {
    smart: string;
    priority: string;
  };
  campaignParticipation: {
    personalizedPagePath: string | null;
    paymentLink: string | null;
    status: FounderCampaignStatus;
    paymentStatus: FounderPaymentStatus;
    kitStatus: FounderKitStatus;
    lastAction: string;
    nextAction: string;
    notes: string;
    potentialRevenue: number;
    confirmedRevenue: number;
    commercialTimeline: CommercialTimelineItem[];
  };
  isPlaceholder?: boolean;
}

export const founders2026Statuses: FounderCampaignStatus[] = [
  "Pendente",
  "Convite enviado",
  "Visualizou",
  "Respondeu",
  "Link aberto",
  "Pagamento pendente",
  "Convertido",
  "Perdido",
];

export const founders2026WhatsappTemplates = {
  initialInvite: ({ name, personalizedPageUrl }: { name: string; personalizedPageUrl: string }) =>
    `Olá, ${name}. Aqui é da DGN.

Preparamos um convite personalizado para você fazer parte da primeira geração de Membros Fundadores do DGN Club.

Sua página está pronta aqui:
${personalizedPageUrl}

Dá uma olhada e me chama por aqui para confirmar sua vaga.`,
};

const benedito: FounderCampaignGuest = {
  id: "founder-001",
  founderNumber: "Nº001",
  slug: "benedito-constantino",
  name: "Benedito Constantino",
  phone: "19981723362",
  vehicle: "BYD Song Plus",
  maskedPlate: "Não exibida",
  customerProfile: {
    customerSince: "2022",
    attendances: 70,
    historicalValue: 465.01,
    lastAttendance: "06/06/2026",
    relationshipScore: "Founder ativo",
  },
  recommendedPlan: "DGN Priority Semestral",
  founderConditions: {
    smart: "6x de R$ 110",
    priority: "6x de R$ 200",
  },
  campaignParticipation: {
    personalizedPagePath: "/founders/benedito-constantino",
    paymentLink: null,
    status: "Convertido",
    paymentStatus: "Pago",
    kitStatus: "Pendente",
    lastAction: "Assinatura confirmada",
    nextAction: "Acompanhar utilização",
    notes: "Plano Priority Semestral já fechado e confirmado.",
    potentialRevenue: 1200,
    confirmedRevenue: 1200,
    commercialTimeline: [
      {
        title: "Assinatura confirmada",
        detail: "Founder Nº001 — Priority Semestral ativo.",
        dateLabel: "Confirmado",
      },
    ],
  },
};

const joseMoreira: FounderCampaignGuest = {
  id: "founder-002",
  founderNumber: "Nº002",
  slug: "jose-moreira",
  name: "José Moreira",
  phone: "19998115400",
  vehicle: "Honda Fit",
  maskedPlate: "Não exibida",
  customerProfile: {
    customerSince: "2022",
    attendances: 36,
    historicalValue: 2430.9,
    lastAttendance: "18/06/2026",
    relationshipScore: "Founder ativo",
  },
  recommendedPlan: "DGN Smart Semestral",
  founderConditions: {
    smart: "6x de R$ 110",
    priority: "6x de R$ 200",
  },
  campaignParticipation: {
    personalizedPagePath: "/founders/jose-moreira",
    paymentLink: null,
    status: "Convertido",
    paymentStatus: "Pago",
    kitStatus: "Pendente",
    lastAction: "Assinatura confirmada",
    nextAction: "Acompanhar utilização",
    notes: "Plano Smart Semestral já fechado e confirmado.",
    potentialRevenue: 660,
    confirmedRevenue: 660,
    commercialTimeline: [
      {
        title: "Página personalizada criada",
        detail: "Convite público individual disponível para conferência interna.",
        dateLabel: "Hoje",
      },
      {
        title: "Convite pendente",
        detail: "Aguardando envio manual pela equipe DGN.",
        dateLabel: "Pendente",
      },
      {
        title: "Aguardando envio",
        detail: "Mensagem assistida disponível no Campaign Center.",
        dateLabel: "Próxima ação",
      },
      {
        title: "Aguardando resposta",
        detail: "Status deve ser atualizado manualmente nesta primeira versão.",
        dateLabel: "Futuro",
      },
    ],
  },
};

function createPlaceholderSlot(index: number): FounderCampaignGuest {
  const number = String(index).padStart(3, "0");

  return {
    id: `founder-${number}`,
    founderNumber: `Nº${number}`,
    slug: null,
    name: `Founder ${number}`,
    phone: "",
    vehicle: "A definir",
    maskedPlate: "A definir",
    customerProfile: {
      customerSince: "A definir",
      attendances: null,
      historicalValue: null,
      lastAttendance: "A definir",
      relationshipScore: "A preencher",
    },
    recommendedPlan: "A definir",
    founderConditions: {
      smart: "A definir",
      priority: "A definir",
    },
    campaignParticipation: {
      personalizedPagePath: null,
      paymentLink: null,
      status: "Pendente",
      paymentStatus: "Pendente",
      kitStatus: "Pendente",
      lastAction: "Slot reservado",
      nextAction: "Preencher dados do convidado",
      notes: "Slot interno para expansão da campanha. Não publicar página personalizada sem dados reais.",
      potentialRevenue: 0,
      confirmedRevenue: 0,
      commercialTimeline: [
        {
          title: "Slot reservado",
          detail: "Aguardando definição do convidado.",
          dateLabel: "Interno",
        },
      ],
    },
    isPlaceholder: true,
  };
}

const rikardo: FounderCampaignGuest = {
  id: "founder-003",
  founderNumber: "Nº003",
  slug: "rikardo-oliveira",
  name: "Rikardo Oliveira",
  phone: "19999037494",
  vehicle: "Onix",
  maskedPlate: "Não exibida",
  customerProfile: {
    customerSince: "2022",
    attendances: 59,
    historicalValue: 1027.02,
    lastAttendance: "20/06/2026",
    relationshipScore: "Founder ativo",
  },
  recommendedPlan: "DGN Priority Semestral",
  founderConditions: {
    smart: "6x de R$ 110",
    priority: "6x de R$ 200",
  },
  campaignParticipation: {
    personalizedPagePath: "/founders/rikardo-oliveira",
    paymentLink: null,
    status: "Convertido",
    paymentStatus: "Pago",
    kitStatus: "Pendente",
    lastAction: "Assinatura confirmada",
    nextAction: "Acompanhar utilização",
    notes: "Plano Priority Semestral já fechado e confirmado.",
    potentialRevenue: 1200,
    confirmedRevenue: 1200,
    commercialTimeline: [
      {
        title: "Assinatura confirmada",
        detail: "Founder Nº003 — Priority Semestral ativo.",
        dateLabel: "Confirmado",
      },
    ],
  },
};

export const founders2026Guests: FounderCampaignGuest[] = [
  benedito,
  joseMoreira,
  rikardo,
  ...Array.from({ length: 27 }, (_, index) => createPlaceholderSlot(index + 4)),
];

export const founders2026Campaign = {
  id: "founders-2026",
  name: "Campaign Center Founders 2026",
  route: "/admin/growth/founders-2026",
  capacity: 30,
  guests: founders2026Guests,
};

export function getFounders2026GuestById(id: string) {
  return founders2026Guests.find((guest) => guest.id === id);
}

export function getFounderPersonalizedPath(guest: FounderCampaignGuest) {
  return guest.campaignParticipation.personalizedPagePath;
}

export function buildFounderWhatsappMessage(guest: FounderCampaignGuest, origin: string) {
  const pagePath = getFounderPersonalizedPath(guest);
  const personalizedPageUrl = pagePath ? `${origin}${pagePath}` : "Link personalizado pendente";
  const firstName = guest.name.split(" ")[0] || guest.name;

  return founders2026WhatsappTemplates.initialInvite({
    name: firstName,
    personalizedPageUrl,
  });
}

export function buildFounderWhatsappUrl(guest: FounderCampaignGuest, message: string) {
  const digits = guest.phone.replace(/\D/g, "");
  const target = digits ? `55${digits}` : "";

  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}
