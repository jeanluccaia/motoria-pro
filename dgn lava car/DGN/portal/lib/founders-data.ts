export interface FounderVehicle {
  model: string;
  platesMasked: string[];
}

export interface FounderHistoryCard {
  label: string;
  value: string;
}

export interface FounderTimelineItem {
  year: string;
  event: string;
}

export interface FounderMonthPlan {
  month: string;
  service: string;
}

export interface FounderPlan {
  name: string;
  subtitle: string;
  installments: number;
  monthlyValue: number;
  recommended: boolean;
}

export interface FounderLinks {
  whatsappVip: string;
  checkoutSmartFounder: string;
  checkoutPriorityFounder: string;
}

export interface Founder {
  id: string;
  number: string;
  slug: string;
  fullName: string;
  firstName: string;
  vehicle: FounderVehicle;
  memberSince: string;
  memberSinceYear: number;
  firstServiceDate: string;
  lastServiceDate: string;
  totalServices: number;
  totalSpent: string;
  historyCards: FounderHistoryCard[];
  timeline: FounderTimelineItem[];
  monthPlan: FounderMonthPlan[];
  recommendedPlan: FounderPlan;
  alternativePlan: FounderPlan;
  links: FounderLinks;
  adminStatus: {
    pageCreated: boolean;
    inviteSent: boolean;
    pageViewed: boolean;
    signatureConfirmed: boolean;
    paymentStatus: string;
    kitStatus: string;
  };
}

const WA_BASE = "https://wa.me/5500000000000";
const WA_MSG = encodeURIComponent(
  "Olá, recebi meu convite personalizado para ser Membro Fundador DGN Club e quero garantir minha vaga."
);
const WA_LINK = `${WA_BASE}?text=${WA_MSG}`;

export const founders: Founder[] = [
  {
    id: "001",
    number: "Nº001",
    slug: "jose-moreira",
    fullName: "José Moreira",
    firstName: "José",
    vehicle: {
      model: "Honda Fit",
      platesMasked: ["Honda Fit"],
    },
    memberSince: "fevereiro de 2022",
    memberSinceYear: 2022,
    firstServiceDate: "11/02/2022",
    lastServiceDate: "18/06/2026",
    totalServices: 37,
    totalSpent: "R$ 3.050,90",
    historyCards: [
      { label: "Cliente desde", value: "2022" },
      { label: "Atendimentos", value: "37" },
      { label: "Último atendimento", value: "18/06/2026" },
      { label: "Total registrado", value: "R$ 3.050,90" },
      { label: "Veículo principal", value: "Honda Fit" },
    ],
    timeline: [
      { year: "2022", event: "Primeiro atendimento registrado" },
      { year: "2023", event: "Relacionamento recorrente com a DGN" },
      { year: "2024", event: "Histórico de cuidados mantido" },
      { year: "2025", event: "Cliente frequente da base DGN" },
      { year: "2026", event: "Retorno ao modelo de assinatura" },
      { year: "Julho 2026", event: "Convite para Founder Nº001" },
    ],
    monthPlan: [
      { month: "Julho", service: "Entrada no Clube + ativação do Smart Semestral" },
      { month: "Agosto", service: "Lavagem programada" },
      { month: "Setembro", service: "Cuidado interno recomendado" },
      { month: "Outubro", service: "Enceramento recomendado" },
      { month: "Novembro", service: "Rotina de manutenção" },
      { month: "Dezembro", service: "Revisão estética de fim de ano" },
    ],
    recommendedPlan: {
      name: "DGN Smart Semestral",
      subtitle:
        "Pelo seu histórico de uso e recorrência, o DGN Smart Semestral é a escolha mais coerente para manter seu Honda Fit sempre cuidado, com previsibilidade, conveniência e prioridade.",
      installments: 6,
      monthlyValue: 110,
      recommended: true,
    },
    alternativePlan: {
      name: "DGN Priority",
      subtitle:
        "Se você quiser uma experiência com maior frequência e prioridade máxima, o DGN Priority também está disponível.",
      installments: 6,
      monthlyValue: 200,
      recommended: false,
    },
    links: {
      whatsappVip: WA_LINK,
      checkoutSmartFounder: WA_LINK,
      checkoutPriorityFounder: WA_LINK,
    },
    adminStatus: {
      pageCreated: true,
      inviteSent: false,
      pageViewed: false,
      signatureConfirmed: false,
      paymentStatus: "Pendente",
      kitStatus: "Pendente",
    },
  },
];

export function getFounderBySlug(slug: string): Founder | undefined {
  return founders.find((f) => f.slug === slug);
}
