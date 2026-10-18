/**
 * FONTE ÚNICA de dados do DGN Vision Preview.
 *
 * Todos os módulos devem consumir destes exports — nunca duplicar informação.
 * Nenhum dado aqui representa cliente real ou receita confirmada.
 */

/* ---------- CONSTANTES DEMONSTRATIVAS ---------- */

/** Data de referência fixa do preview — não usar new Date() em componentes. */
export const DEMO_DATE = {
  iso: "2026-10-22",
  weekday: "Quarta-feira",
  display: "Quarta-feira · 22 de outubro de 2026",
  shortDisplay: "Quarta · 22/10",
};

export const DEMO_UNIT = {
  name: "Unidade Jardins",
  slug: "jardins",
  address: "R. Oscar Freire, 2.040 · São Paulo",
  city: "São Paulo",
};

export const DEMO_OPERATOR = {
  firstName: "Digo",
  fullName: "Diogo Carvalho",
};

/* ---------- CATÁLOGO DE PLANOS (canônico) ---------- */

export type PlanKey = "essential" | "smart" | "priority";

export type PlanCatalogItem = {
  key: PlanKey;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceDisplay: string;
  cadence: string;
  included: string[];
  tierRank: 1 | 2 | 3;
};

export const PLAN_CATALOG: Record<PlanKey, PlanCatalogItem> = {
  essential: {
    key: "essential",
    name: "Essential",
    tagline: "Cuidado consistente, sem complicação",
    priceMonthly: 189,
    priceDisplay: "R$ 189",
    cadence: "/ mês",
    tierRank: 1,
    included: [
      "Lavagem premium mensal",
      "Higienização externa + rodas",
      "Agendamento prioritário em slot aberto",
      "Relatório trimestral de cuidado",
    ],
  },
  smart: {
    key: "smart",
    name: "Smart",
    tagline: "O equilíbrio ideal entre frequência e proteção",
    priceMonthly: 329,
    priceDisplay: "R$ 329",
    cadence: "/ mês",
    tierRank: 2,
    included: [
      "Lavagem premium quinzenal",
      "Higienização interna rotativa",
      "Enceramento técnico trimestral",
      "Avaliação estética semestral",
      "Agendamento garantido",
    ],
  },
  priority: {
    key: "priority",
    name: "Priority",
    tagline: "O programa dos clientes que exigem o máximo",
    priceMonthly: 596,
    priceDisplay: "R$ 596",
    cadence: "/ mês",
    tierRank: 3,
    included: [
      "Dois atendimentos premium por mês",
      "Correção leve de pintura inclusa",
      "Proteção cerâmica anual",
      "Lounge exclusivo + horário reservado",
      "Gerente de conta dedicado",
    ],
  },
};

export const PLANS_ARRAY: PlanCatalogItem[] = [
  PLAN_CATALOG.essential,
  PLAN_CATALOG.smart,
  PLAN_CATALOG.priority,
];

/* ---------- OPORTUNIDADES ---------- */

export type OpportunityKind = "new_subscription" | "upgrade" | "corporate";

export type Projection = {
  /** Baseline — o que o cliente gasta hoje */
  baselineLabel: string;
  baselineValue: number;
  /** Com a oferta */
  withOfferLabel: string;
  withOfferValue: number;
  /** Delta mensal/trimestral/anual */
  deltaValue: number;
  deltaDisplay: string;
  period: "mês" | "trimestre" | "ano";
  explain: string;
};

export type Opportunity = {
  kind: OpportunityKind;
  title: string;
  reason: string;
  recommendedPlan?: PlanKey; // só para new_subscription e upgrade
  corporateFleet?: {
    vehicles: number;
    monthlyEstimate: number;
    monthlyDisplay: string;
  };
  projection: Projection;
  priority: "alta" | "média" | "baixa";
};

/* ---------- VEÍCULOS ---------- */

export type Vehicle = {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  photo: string;
};

/* ---------- ATENDIMENTOS ---------- */

export type AppointmentStatus =
  | "Confirmado"
  | "A confirmar"
  | "Em andamento"
  | "Concluído";

export type Appointment = {
  id: string;
  customerId: string;
  vehicleId: string;
  dateIso: string; // referência DEMO_DATE
  weekday: string;
  dateDisplay: string; // ex "22/10"
  time: string; // "09:30"
  service: string;
  bay: string;
  status: AppointmentStatus;
  /** Marca o atendimento como "próximo" na timeline do dia */
  isNext?: boolean;
  /** Marca como item em andamento no exato momento DEMO_DATE */
  isLive?: boolean;
};

/* ---------- HISTÓRICO ---------- */

export type HistoryItem = {
  dateDisplay: string;
  service: string;
  unit: string;
  nps?: number;
};

/* ---------- ASSINATURA ATUAL ---------- */

export type ActivePlan = {
  key: PlanKey;
  label: string;
  priceDisplay: string;
  cycle: string;
  nextVisitText: string;
};

/* ---------- CLIENTE ---------- */

export type Tier = "Fundador" | "VIP" | "Ativo" | "Prospect";

export type Customer = {
  id: string;
  name: string;
  firstName: string;
  avatarInitials: string;
  tier: Tier;
  since: string; // ano
  email: string;
  phoneMasked: string;
  preferredChannel: "WhatsApp" | "E-mail" | "Telefone";
  unitSlug: string;
  observation: string;
  vehicleId: string; // link para VEHICLES
  plan?: ActivePlan;
  casual?: { label: string; lastService: string };
  opportunity: Opportunity;
  stats: {
    attendancesYear: number;
    retentionDisplay: string;
    lifetimeDisplay: string;
    lifetimeValue: number;
  };
  history: HistoryItem[];
};

/* ---------- DADOS FICTÍCIOS ---------- */

export const VEHICLES: Vehicle[] = [
  {
    id: "veh-roberta-01",
    customerId: "roberta-vinciguerra",
    make: "Land Rover",
    model: "Range Rover Sport HSE",
    year: 2024,
    plate: "RVC-7A24",
    color: "Preto Santorini",
    photo: "/vehicles/range-rover-sport.jpg",
  },
  {
    id: "veh-andre-01",
    customerId: "andre-pellegrino",
    make: "Mercedes-Benz",
    model: "AMG GT R",
    year: 2023,
    plate: "APL-3B19",
    color: "Cinza Selenita Fosco",
    photo: "/vehicles/mercedes-amg-gt-r.jpg",
  },
  {
    id: "veh-camila-01",
    customerId: "camila-arantes",
    make: "Audi",
    model: "RS6 Avant",
    year: 2024,
    plate: "CAM-9D08",
    color: "Preto Mythos",
    photo: "/vehicles/audi-rs6.jpg",
  },
];

export const vehicleById = (id: string) => VEHICLES.find((v) => v.id === id);
export const vehicleByCustomer = (customerId: string) =>
  VEHICLES.find((v) => v.customerId === customerId);

export const CUSTOMERS: Customer[] = [
  {
    id: "roberta-vinciguerra",
    name: "Roberta Vinciguerra",
    firstName: "Roberta",
    avatarInitials: "RV",
    tier: "VIP",
    since: "2024",
    email: "roberta@dgndemo.app",
    phoneMasked: "(11) 9•••• ••12",
    preferredChannel: "WhatsApp",
    unitSlug: "jardins",
    observation:
      "Valoriza pontualidade e lounge silencioso. Prefere veículo pronto antes das 16h.",
    vehicleId: "veh-roberta-01",
    casual: {
      label: "Cliente avulso premium",
      lastService: "Detalhamento Executivo — 29/09/2026",
    },
    opportunity: {
      kind: "new_subscription",
      title: "Pronta para assinatura Priority",
      reason:
        "4 atendimentos avulsos em 4 meses, ticket médio R$ 480 e NPS 10. Uma Priority custa menos que 1,25 atendimento avulso e inclui 2 por mês.",
      recommendedPlan: "priority",
      projection: {
        baselineLabel: "Hoje (avulso)",
        baselineValue: 1920, // 4 × 480
        withOfferLabel: "Com Priority",
        withOfferValue: 1788, // 3 × 596
        deltaValue: 1188,
        deltaDisplay: "+ R$ 1.188 / trimestre em previsibilidade",
        period: "trimestre",
        explain:
          "Baseline: 4 atendimentos a R$ 480 = R$ 1.920 em 90 dias. Com Priority: 3 × R$ 596 = R$ 1.788, com 6 atendimentos premium inclusos. O ganho é previsibilidade + mais serviço, não desconto puro.",
      },
      priority: "alta",
    },
    stats: {
      attendancesYear: 7,
      retentionDisplay: "100%",
      lifetimeDisplay: "R$ 3.420",
      lifetimeValue: 3420,
    },
    history: [
      { dateDisplay: "29/09/2026", service: "Detalhamento Executivo", unit: "Jardins", nps: 10 },
      { dateDisplay: "11/08/2026", service: "Lavagem Premium", unit: "Jardins", nps: 9 },
      { dateDisplay: "22/07/2026", service: "Enceramento técnico", unit: "Jardins", nps: 10 },
      { dateDisplay: "02/06/2026", service: "Higienização interna", unit: "Jardins", nps: 10 },
    ],
  },
  {
    id: "andre-pellegrino",
    name: "André Pellegrino",
    firstName: "André",
    avatarInitials: "AP",
    tier: "Fundador",
    since: "2023",
    email: "andre@dgndemo.app",
    phoneMasked: "(11) 9•••• ••47",
    preferredChannel: "WhatsApp",
    unitSlug: "jardins",
    observation:
      "Titular de 4 CNPJs do Grupo Pellegrino. Flexível na janela da manhã, prefere box 01.",
    vehicleId: "veh-andre-01",
    plan: {
      key: "priority",
      label: "Priority",
      priceDisplay: "R$ 596",
      cycle: "Mensal · desde março de 2024",
      nextVisitText: "Próxima visita inclusa em 11 dias",
    },
    opportunity: {
      kind: "corporate",
      title: "Corporate Care — frota do Grupo Pellegrino",
      reason:
        "Já é Priority individual. CNPJ do titular tem mais 3 veículos corporativos identificados — oportunidade de estender o cuidado à frota com contrato empresarial.",
      corporateFleet: {
        vehicles: 3,
        monthlyEstimate: 1788,
        monthlyDisplay: "R$ 1.788 / mês",
      },
      projection: {
        baselineLabel: "Hoje (Priority individual)",
        baselineValue: 596,
        withOfferLabel: "Com Corporate Care",
        withOfferValue: 2384, // 596 + 1788
        deltaValue: 1788,
        deltaDisplay: "+ R$ 1.788 / mês incremental",
        period: "mês",
        explain:
          "Mantém a Priority individual. Adiciona 3 veículos corporativos a R$ 596 cada = R$ 1.788/mês incrementais, sob um único contrato empresarial.",
      },
      priority: "média",
    },
    stats: {
      attendancesYear: 19,
      retentionDisplay: "100%",
      lifetimeDisplay: "R$ 11.320",
      lifetimeValue: 11320,
    },
    history: [
      { dateDisplay: "25/09/2026", service: "Priority mensal", unit: "Jardins", nps: 10 },
      { dateDisplay: "28/08/2026", service: "Priority mensal", unit: "Jardins", nps: 10 },
      { dateDisplay: "30/07/2026", service: "Priority mensal", unit: "Jardins", nps: 9 },
    ],
  },
  {
    id: "camila-arantes",
    name: "Camila Arantes",
    firstName: "Camila",
    avatarInitials: "CA",
    tier: "Ativo",
    since: "2025",
    email: "camila@dgndemo.app",
    phoneMasked: "(11) 9•••• ••88",
    preferredChannel: "WhatsApp",
    unitSlug: "jardins",
    observation:
      "Agenda a cada 15 dias sem falha. Já contratou 3 serviços avulsos extras no último trimestre.",
    vehicleId: "veh-camila-01",
    plan: {
      key: "smart",
      label: "Smart",
      priceDisplay: "R$ 329",
      cycle: "Mensal · desde junho de 2025",
      nextVisitText: "Próxima visita inclusa em 4 dias",
    },
    opportunity: {
      kind: "upgrade",
      title: "Upgrade natural para Priority",
      reason:
        "Pagou 3 serviços avulsos acima do pacote Smart em 90 dias (R$ 480 cada). Priority elimina os extras e aumenta percepção de cuidado — diferença R$ 267/mês.",
      recommendedPlan: "priority",
      projection: {
        baselineLabel: "Hoje (Smart + extras)",
        baselineValue: 1467, // 3 × 329 + 3 × 160
        withOfferLabel: "Com Priority",
        withOfferValue: 1788, // 3 × 596
        deltaValue: 321,
        deltaDisplay: "+ R$ 321 / trimestre, zero extras",
        period: "trimestre",
        explain:
          "Baseline: 3 × Smart (R$ 329) + 3 serviços extras R$ 160 = R$ 1.467. Com Priority (R$ 596 × 3) = R$ 1.788, com extras já inclusos e correção leve de pintura mensal.",
      },
      priority: "alta",
    },
    stats: {
      attendancesYear: 11,
      retentionDisplay: "100%",
      lifetimeDisplay: "R$ 2.740",
      lifetimeValue: 2740,
    },
    history: [
      { dateDisplay: "06/10/2026", service: "Smart quinzenal", unit: "Jardins", nps: 9 },
      { dateDisplay: "22/09/2026", service: "Smart quinzenal", unit: "Jardins", nps: 10 },
      { dateDisplay: "08/09/2026", service: "Correção pontual (extra)", unit: "Jardins", nps: 9 },
    ],
  },
];

export const customerById = (id: string) =>
  CUSTOMERS.find((c) => c.id === id);

export const prospectCustomers = CUSTOMERS.filter(
  (c) => c.opportunity.kind === "new_subscription"
);
export const upsellCustomers = CUSTOMERS.filter(
  (c) =>
    c.opportunity.kind === "upgrade" || c.opportunity.kind === "corporate"
);

/* ---------- AGENDA DO DIA ---------- */

export const APPOINTMENTS: Appointment[] = [
  {
    id: "appt-andre-am",
    customerId: "andre-pellegrino",
    vehicleId: "veh-andre-01",
    dateIso: DEMO_DATE.iso,
    weekday: "Quarta",
    dateDisplay: "22/10",
    time: "08:30",
    service: "Priority mensal — Correção leve + proteção",
    bay: "Box 01 · Lounge Fundador",
    status: "Em andamento",
    isLive: true,
  },
  {
    id: "appt-roberta-am",
    customerId: "roberta-vinciguerra",
    vehicleId: "veh-roberta-01",
    dateIso: DEMO_DATE.iso,
    weekday: "Quarta",
    dateDisplay: "22/10",
    time: "09:30",
    service: "Enceramento técnico + revisão de couro",
    bay: "Box 02 · Lounge",
    status: "Confirmado",
    isNext: true,
  },
  {
    id: "appt-camila-am",
    customerId: "camila-arantes",
    vehicleId: "veh-camila-01",
    dateIso: DEMO_DATE.iso,
    weekday: "Quarta",
    dateDisplay: "22/10",
    time: "10:15",
    service: "Smart quinzenal — Lavagem premium + interior",
    bay: "Box 03",
    status: "A confirmar",
  },
  {
    id: "appt-corporate-pm",
    customerId: "andre-pellegrino",
    vehicleId: "veh-andre-01",
    dateIso: DEMO_DATE.iso,
    weekday: "Quarta",
    dateDisplay: "22/10",
    time: "14:00",
    service: "Reunião Corporate Care — Grupo Pellegrino",
    bay: "Lounge executivo",
    status: "Confirmado",
  },
];

/** Próximo atendimento canônico por cliente (usado nas fichas) */
export const nextAppointmentByCustomer = (customerId: string): Appointment | undefined =>
  APPOINTMENTS.find((a) => a.customerId === customerId);

/* ---------- MÉTRICAS DO COMMAND CENTER ---------- */

export const COMMAND_METRICS = {
  activeSubscribers: { value: 184, delta: "+6 esta semana" },
  openOpportunities: {
    value: CUSTOMERS.length,
    delta: `${prospectCustomers.length} nova${
      prospectCustomers.length === 1 ? "" : "s"
    } · ${upsellCustomers.length} upsell${
      upsellCustomers.length === 1 ? "" : "s"
    }`,
  },
  todayAppointments: {
    value: APPOINTMENTS.length,
    delta: `${APPOINTMENTS.filter((a) => a.isLive).length} em andamento agora`,
  },
  mrr: { value: "R$ 72.4k", delta: "+ R$ 4.2k vs. set" },
};

/* ---------- PULSO DO DIA (deriva de APPOINTMENTS + eventos fixos) ---------- */

export type PulseItem = {
  time: string;
  title: string;
  detail: string;
  kind: "operacional" | "atendimento" | "pendente" | "comercial";
  highlight?: boolean;
};

export const TODAY_PULSE: PulseItem[] = [
  {
    time: "08:00",
    title: "Abertura da unidade Jardins",
    detail: "Checklist operacional concluído por Lucas",
    kind: "operacional",
  },
  ...APPOINTMENTS.map<PulseItem>((a) => {
    const c = customerById(a.customerId)!;
    const v = vehicleById(a.vehicleId)!;
    const isMeeting = /Reunião/i.test(a.service);
    return {
      time: a.time,
      title: isMeeting
        ? a.service
        : `${a.service.split("—")[0].trim()} — ${c.name}`,
      detail: isMeeting
        ? `${v.make} ${v.model} · ${a.bay}`
        : `${v.make} ${v.model} · ${a.bay}${a.status === "A confirmar" ? " · aguardando confirmação" : ""}`,
      kind: isMeeting
        ? "comercial"
        : a.status === "A confirmar"
        ? "pendente"
        : "atendimento",
      highlight: a.isLive,
    };
  }),
];

/* ---------- PRÓXIMA AÇÃO RECOMENDADA ---------- */

export const NEXT_RECOMMENDED_ACTION = {
  customerId: "roberta-vinciguerra",
  headline:
    "Oferecer assinatura Priority para Roberta antes do próximo atendimento",
  rationale:
    "4 visitas avulsas em 4 meses, NPS 10, ticket médio R$ 480. Uma Priority custa menos que 1,25 atendimento avulso e inclui 2 atendimentos premium por mês.",
};

/* ---------- VERIFICAÇÃO DE CONSISTÊNCIA ---------- */

/**
 * Executado em dev no PresentationProvider. Se achar inconsistência, lança
 * no console — não quebra o preview.
 */
export function assertDataConsistency(): string[] {
  const issues: string[] = [];

  // Cada customer deve ter vehicle
  for (const c of CUSTOMERS) {
    if (!vehicleById(c.vehicleId)) {
      issues.push(`Customer ${c.id}: vehicleId ${c.vehicleId} não existe`);
    }
  }

  // Appointments devem casar customer×vehicle
  for (const a of APPOINTMENTS) {
    const c = customerById(a.customerId);
    const v = vehicleById(a.vehicleId);
    if (!c) issues.push(`Appointment ${a.id}: customer ${a.customerId} não existe`);
    if (!v) issues.push(`Appointment ${a.id}: vehicle ${a.vehicleId} não existe`);
    if (c && v && v.customerId !== c.id) {
      issues.push(
        `Appointment ${a.id}: vehicle ${v.id} pertence a ${v.customerId}, não a ${c.id}`
      );
    }
  }

  // Oportunidades devem ter forma coerente ao kind
  for (const c of CUSTOMERS) {
    const o = c.opportunity;
    if (o.kind === "corporate" && !o.corporateFleet) {
      issues.push(`Customer ${c.id}: opp corporate sem corporateFleet`);
    }
    if ((o.kind === "upgrade" || o.kind === "new_subscription") && !o.recommendedPlan) {
      issues.push(`Customer ${c.id}: opp ${o.kind} sem recommendedPlan`);
    }
    if (o.kind === "upgrade" && c.plan && o.recommendedPlan) {
      const current = PLAN_CATALOG[c.plan.key];
      const next = PLAN_CATALOG[o.recommendedPlan];
      if (next.tierRank <= current.tierRank) {
        issues.push(
          `Customer ${c.id}: upgrade sugere ${o.recommendedPlan} igual ou inferior ao plano atual ${c.plan.key}`
        );
      }
    }
    if (o.kind === "new_subscription" && c.plan) {
      issues.push(`Customer ${c.id}: opp "new_subscription" mas já tem plano ativo`);
    }
  }

  return issues;
}
