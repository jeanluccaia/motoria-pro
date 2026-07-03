export interface FounderVehicle {
  model: string;
  image: string | null;
  platesMasked: string[];
}

export interface FounderHistoryCard {
  label: string;
  value: string;
}

export interface FounderTimelineItem {
  label: string;
  title: string;
  description: string;
  icon: "flag" | "car" | "star" | "handshake" | "crown";
}

export interface FounderMonthPlan {
  month: string;
  service: string;
  description: string;
}

export interface FounderPlan {
  name: string;
  subtitle: string;
  installments: number;
  monthlyValue: number;
  recommended: boolean;
}

export interface FounderCondition {
  name: string;
  installments: number;
  monthlyValue: number;
  note: string;
}

export interface FounderLinks {
  whatsappVip: string;
  checkoutSmartFounder: string;
  checkoutPriorityFounder: string;
}

export interface FounderMessage {
  title: string;
  body: string;
  signature: string;
  role: string;
  photo: string | null;
  initials: string;
}

export interface Founder {
  id: string;
  founderId: string;
  totalFounders: number;
  number: string;
  slug: string;
  name: string;
  fullName: string;
  firstName: string;
  vehicle: FounderVehicle;
  vehicleImage: string | null;
  customerSince: string;
  memberSince: string;
  memberSinceYear: number;
  firstServiceDate: string;
  lastVisit: string;
  lastServiceDate: string;
  totalVisits: number;
  totalServices: number;
  totalInvestment: string;
  totalSpent: string;
  historyCards: FounderHistoryCard[];
  timeline: FounderTimelineItem[];
  carePlan: FounderMonthPlan[];
  monthPlan: FounderMonthPlan[];
  recommendedPlan: FounderPlan;
  alternativePlan: FounderPlan;
  founderConditionSmart: FounderCondition;
  founderConditionPriority: FounderCondition;
  checkoutSmart: string;
  checkoutPriority: string;
  whatsappVip: string;
  links: FounderLinks;
  founderMessage: FounderMessage;
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
  "Olá, recebi meu convite personalizado para ser Membro Fundador DGN Club e quero confirmar minha vaga."
);
const WA_LINK = `${WA_BASE}?text=${WA_MSG}`;

export const founders: Founder[] = [
  {
    id: "001",
    founderId: "001",
    totalFounders: 30,
    number: "Nº001",
    slug: "jose-moreira",
    name: "José Moreira",
    fullName: "José Moreira",
    firstName: "José",
    vehicle: {
      model: "Honda Fit",
      image: null,
      platesMasked: ["Honda Fit"],
    },
    vehicleImage: null,
    customerSince: "2022",
    memberSince: "fevereiro de 2022",
    memberSinceYear: 2022,
    firstServiceDate: "11/02/2022",
    lastVisit: "18/06/2026",
    lastServiceDate: "18/06/2026",
    totalVisits: 37,
    totalServices: 37,
    totalInvestment: "R$ 3.050,90",
    totalSpent: "R$ 3.050,90",
    historyCards: [
      { label: "Cliente desde", value: "2022" },
      { label: "Atendimentos realizados", value: "37" },
      { label: "Investimento em cuidados", value: "R$ 3.050,90" },
      { label: "Último atendimento", value: "18/06/2026" },
      { label: "Veículo cuidado", value: "Honda Fit" },
    ],
    timeline: [
      {
        label: "Início",
        title: "Primeiro atendimento",
        description: "O primeiro registro de cuidado com a DGN.",
        icon: "flag",
      },
      {
        label: "Recorrência",
        title: "Cliente recorrente",
        description: "Uma relação construída em visitas, confiança e constância.",
        icon: "car",
      },
      {
        label: "Cuidado",
        title: "Histórico de cuidados",
        description: "37 atendimentos realizados e acompanhados pela nossa equipe.",
        icon: "star",
      },
      {
        label: "Convite",
        title: "Convite para Membro Fundador",
        description: "Um convite reservado para quem já faz parte da história da DGN.",
        icon: "handshake",
      },
      {
        label: "Fundação",
        title: "Founder Nº001 de 30",
        description: "A primeira vaga da geração fundadora do DGN Club.",
        icon: "crown",
      },
    ],
    carePlan: [
      {
        month: "Julho",
        service: "Entrada no Clube",
        description: "Ativação da sua experiência Founder.",
      },
      {
        month: "Agosto",
        service: "Lavagem programada",
        description: "Rotina de cuidado organizada com antecedência.",
      },
      {
        month: "Setembro",
        service: "Proteção recomendada",
        description: "Avaliação para preservar acabamento e uso diário.",
      },
      {
        month: "Outubro",
        service: "Enceramento",
        description: "Camada extra de proteção e brilho para o seu Honda Fit.",
      },
      {
        month: "Novembro",
        service: "Manutenção",
        description: "Cuidado preventivo para manter o padrão DGN.",
      },
      {
        month: "Dezembro",
        service: "Preparação para fim de ano",
        description: "Seu veículo pronto para encerrar o ano bem cuidado.",
      },
    ],
    monthPlan: [
      {
        month: "Julho",
        service: "Entrada no Clube",
        description: "Ativação da sua experiência Founder.",
      },
      {
        month: "Agosto",
        service: "Lavagem programada",
        description: "Rotina de cuidado organizada com antecedência.",
      },
      {
        month: "Setembro",
        service: "Proteção recomendada",
        description: "Avaliação para preservar acabamento e uso diário.",
      },
      {
        month: "Outubro",
        service: "Enceramento",
        description: "Camada extra de proteção e brilho para o seu Honda Fit.",
      },
      {
        month: "Novembro",
        service: "Manutenção",
        description: "Cuidado preventivo para manter o padrão DGN.",
      },
      {
        month: "Dezembro",
        service: "Preparação para fim de ano",
        description: "Seu veículo pronto para encerrar o ano bem cuidado.",
      },
    ],
    recommendedPlan: {
      name: "DGN Smart Semestral",
      subtitle:
        "Pelo seu histórico de uso e recorrência, o DGN Smart Semestral é a escolha mais coerente para manter seu Honda Fit cuidado com previsibilidade, conveniência e prioridade.",
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
    founderConditionSmart: {
      name: "DGN Smart",
      installments: 6,
      monthlyValue: 110,
      note: "Condição Founder para a primeira geração de clientes convidados.",
    },
    founderConditionPriority: {
      name: "DGN Priority",
      installments: 6,
      monthlyValue: 200,
      note: "Alternativa com maior frequência e prioridade máxima.",
    },
    checkoutSmart: WA_LINK,
    checkoutPriority: WA_LINK,
    whatsappVip: WA_LINK,
    links: {
      whatsappVip: WA_LINK,
      checkoutSmartFounder: WA_LINK,
      checkoutPriorityFounder: WA_LINK,
    },
    founderMessage: {
      title: "Uma mensagem do fundador",
      body:
        "José,\n\nObrigado por confiar na DGN durante todos esses anos.\n\nSerá uma honra ter você entre os primeiros Membros Fundadores da nossa história.",
      signature: "Rodrigo Carmo",
      role: "Fundador - DGN Club",
      photo: null,
      initials: "RC",
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
