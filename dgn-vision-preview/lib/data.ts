export type Plan = "essential" | "smart" | "priority";

export type Customer = {
  id: string;
  name: string;
  firstName: string;
  avatarInitials: string;
  since: string; // ano
  tier: "Fundador" | "VIP" | "Ativo" | "Prospect";
  vehicle: {
    make: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    photo: string;
  };
  plan?: {
    tier: Plan;
    label: string;
    price: string;
    cycle: string;
    nextVisit: string;
  };
  casual?: {
    label: string;
    lastService: string;
  };
  nextAppointment: {
    date: string;
    weekday: string;
    time: string;
    service: string;
    bay: string;
    status: "Confirmado" | "A confirmar" | "Em andamento";
  };
  history: Array<{
    date: string;
    service: string;
    unit: string;
    nps?: number;
  }>;
  opportunity: {
    title: string;
    reason: string;
    cta: string;
    value: string;
    priority: "alta" | "média" | "baixa";
  };
  stats: {
    attendances: number;
    retention: string;
    lifetime: string;
  };
};

export const customers: Customer[] = [
  {
    id: "roberta-vinciguerra",
    name: "Roberta Vinciguerra",
    firstName: "Roberta",
    avatarInitials: "RV",
    since: "2024",
    tier: "VIP",
    vehicle: {
      make: "Land Rover",
      model: "Range Rover Sport HSE",
      year: 2024,
      plate: "RVC-7A24",
      color: "Preto Santorini",
      photo: "/vehicles/range-rover-sport.jpg",
    },
    casual: {
      label: "Cliente avulso premium",
      lastService: "Detalhamento Executivo — há 23 dias",
    },
    nextAppointment: {
      date: "22/10",
      weekday: "Quarta",
      time: "09:30",
      service: "Enceramento técnico + revisão de couro",
      bay: "Box 02 · Lounge",
      status: "Confirmado",
    },
    history: [
      { date: "29/09", service: "Detalhamento Executivo", unit: "Unidade Jardins", nps: 10 },
      { date: "11/08", service: "Lavagem Premium", unit: "Unidade Jardins", nps: 9 },
      { date: "22/07", service: "Enceramento técnico", unit: "Unidade Jardins", nps: 10 },
      { date: "02/06", service: "Higienização interna", unit: "Unidade Jardins", nps: 10 },
    ],
    opportunity: {
      title: "Pronta para assinatura Priority",
      reason:
        "4 atendimentos em 4 meses, ticket médio R$ 480 e NPS 10. O custo mensal de uma Priority (R$ 596) equivale a 1 visita avulsa — a assinatura garante 2 por mês.",
      cta: "Oferecer assinatura",
      value: "+ R$ 1.188 / trimestre",
      priority: "alta",
    },
    stats: {
      attendances: 7,
      retention: "100%",
      lifetime: "R$ 3.420",
    },
  },
  {
    id: "andre-pellegrino",
    name: "André Pellegrino",
    firstName: "André",
    avatarInitials: "AP",
    since: "2023",
    tier: "Fundador",
    vehicle: {
      make: "Mercedes-Benz",
      model: "AMG GT R",
      year: 2023,
      plate: "APL-3B19",
      color: "Cinza Selenita Fosco",
      photo: "/vehicles/mercedes-amg-gt-r.jpg",
    },
    plan: {
      tier: "priority",
      label: "Priority",
      price: "R$ 596 / mês",
      cycle: "Mensal · desde mar/2024",
      nextVisit: "Próxima visita inclusa em 11 dias",
    },
    nextAppointment: {
      date: "20/10",
      weekday: "Segunda",
      time: "14:00",
      service: "Priority mensal — Correção leve + proteção",
      bay: "Box 01 · Lounge Fundador",
      status: "Confirmado",
    },
    history: [
      { date: "25/09", service: "Priority mensal", unit: "Unidade Jardins", nps: 10 },
      { date: "28/08", service: "Priority mensal", unit: "Unidade Jardins", nps: 10 },
      { date: "30/07", service: "Priority mensal", unit: "Unidade Jardins", nps: 9 },
    ],
    opportunity: {
      title: "Upsell — Corporate Care para a frota",
      reason:
        "Já é Priority individual. CNPJ do titular tem mais 3 veículos corporativos identificados — oportunidade de contrato empresarial que estende o cuidado a toda a frota.",
      cta: "Apresentar Corporate Care",
      value: "+ R$ 1.788 / mês",
      priority: "média",
    },
    stats: {
      attendances: 19,
      retention: "100%",
      lifetime: "R$ 11.320",
    },
  },
  {
    id: "camila-arantes",
    name: "Camila Arantes",
    firstName: "Camila",
    avatarInitials: "CA",
    since: "2025",
    tier: "Ativo",
    vehicle: {
      make: "Audi",
      model: "RS6 Avant",
      year: 2024,
      plate: "CAM-9D08",
      color: "Preto Mythos",
      photo: "/vehicles/audi-rs6.jpg",
    },
    plan: {
      tier: "smart",
      label: "Smart",
      price: "R$ 329 / mês",
      cycle: "Mensal · desde jun/2025",
      nextVisit: "Próxima visita inclusa em 4 dias",
    },
    nextAppointment: {
      date: "21/10",
      weekday: "Terça",
      time: "10:15",
      service: "Smart quinzenal — Lavagem premium + interior",
      bay: "Box 03",
      status: "A confirmar",
    },
    history: [
      { date: "06/10", service: "Smart quinzenal", unit: "Unidade Jardins", nps: 9 },
      { date: "22/09", service: "Smart quinzenal", unit: "Unidade Jardins", nps: 10 },
      { date: "08/09", service: "Correção pontual", unit: "Unidade Jardins", nps: 9 },
    ],
    opportunity: {
      title: "Upsell — upgrade natural para Priority",
      reason:
        "Em 4 meses pagou 3 serviços avulsos acima do pacote Smart. O upgrade elimina adicionais e aumenta percepção de cuidado — diferença de apenas R$ 267/mês.",
      cta: "Oferecer upgrade Priority",
      value: "+ R$ 267 / mês",
      priority: "alta",
    },
    stats: {
      attendances: 11,
      retention: "100%",
      lifetime: "R$ 2.740",
    },
  },
];

export const customerById = (id: string) => customers.find((c) => c.id === id);

export const prospectCustomers = customers.filter((c) => !c.plan);
export const upsellCustomers = customers.filter((c) => !!c.plan);

export const commandMetrics = {
  activeSubscribers: { value: 184, delta: "+6 esta semana" },
  openOpportunities: { value: 12, delta: "3 priorizadas por valor" },
  todayAppointments: { value: 9, delta: "2 em andamento agora" },
  mrr: { value: "R$ 72.4k", delta: "+ R$ 4.2k vs. set" },
};

export const todayPulse = [
  {
    time: "08:00",
    title: "Abertura da unidade Jardins",
    detail: "Checklist operacional concluído por Lucas",
    kind: "operacional",
  },
  {
    time: "08:30",
    title: "Priority mensal — André Pellegrino",
    detail: "Porsche Macan GTS · Box 01 · 2h estimadas",
    kind: "atendimento",
    highlight: true,
  },
  {
    time: "09:30",
    title: "Enceramento técnico — Roberta Vinciguerra",
    detail: "BMW X5 · Box 02 · oportunidade Priority ativa",
    kind: "atendimento",
  },
  {
    time: "10:15",
    title: "Smart quinzenal — Camila Arantes",
    detail: "Volvo XC60 · Box 03 · precisa confirmar com cliente",
    kind: "pendente",
  },
  {
    time: "11:00",
    title: "Reunião comercial Corporate Care",
    detail: "Pellegrino Participações · frota de 4 veículos",
    kind: "comercial",
  },
  {
    time: "14:00",
    title: "Priority — chegada agendada",
    detail: "Box Fundador reservado para Pellegrino (segunda visita do mês)",
    kind: "atendimento",
  },
];

export const nextRecommendedAction = {
  customerId: "roberta-vinciguerra",
  customerName: "Roberta Vinciguerra",
  headline: "Oferecer assinatura Priority para Roberta antes do próximo atendimento",
  rationale:
    "4 atendimentos em 4 meses, NPS 10, ticket médio R$ 480. Priority custa menos que uma visita avulsa e previsibiliza R$ 1.188 por trimestre.",
  signal: "Oportunidade alta prioridade",
};
