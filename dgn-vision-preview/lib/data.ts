/**
 * FONTE ÚNICA de dados demonstrativos do DGN Vision Preview.
 *
 * Todos os módulos consomem destes exports — nenhum número hardcoded fora daqui.
 * Nenhum dado representa cliente real ou receita confirmada.
 *
 * Regras de ouro:
 *   1. Agregados (MRR, Assinantes totais) são derivados de AGGREGATE_SIM — nunca inventados.
 *   2. Operação ao vivo (em atendimento, aguardando, concluídos) deriva de SIM_CLOCK × APPOINTMENTS.
 *   3. Projeções financeiras obedecem Projection.argument: só exibir "ganho de receita"
 *      quando withOfferValue > baselineValue. Caso contrário, apresentar como previsibilidade
 *      ou economia (não inventar aumento onde há queda).
 *   4. assertDataConsistency() valida tudo isso em dev.
 */

/* ========== CONSTANTES DEMONSTRATIVAS ========== */

export const DEMO_DATE = {
  iso: "2026-10-22",
  weekday: "Quarta-feira",
  display: "Quarta-feira · 22 de outubro de 2026",
  shortDisplay: "Quarta · 22/10",
};

/** Hora corrente demonstrativa — usada para derivar status de atendimentos. */
export const SIM_CLOCK = {
  nowHHMM: "09:12",
  nowMinutes: 9 * 60 + 12,
  display: "Quarta · 09:12",
};

export const DEMO_UNIT = {
  name: "Unidade Jardins",
  slug: "jardins",
  address: "R. Oscar Freire, 2.040 · São Paulo",
  city: "São Paulo",
  /** Capacidade de slots do dia (08:00–18:00 em janelas de ~45min) */
  totalDailySlots: 13,
};

export const DEMO_OPERATOR = {
  firstName: "Digo",
  fullName: "Diogo Carvalho",
};

/* ========== CATÁLOGO DE PLANOS (canônico) ========== */

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

/* ========== OPORTUNIDADES ========== */

export type OpportunityKind = "new_subscription" | "upgrade" | "corporate";

/**
 * Tipo de argumento comercial:
 *   revenue_gain  – withOfferValue > baselineValue (ganho real para a operação)
 *   client_saving – withOfferValue < baselineValue (economia para o cliente, trade de LTV)
 *   predictability – similar em valor, troca por previsibilidade/mais serviço
 */
export type ProjectionArgument =
  | "revenue_gain"
  | "client_saving"
  | "predictability";

export type Projection = {
  /** O que o cliente gasta hoje */
  baselineLabel: string;
  baselineValue: number;
  /** Com a oferta */
  withOfferLabel: string;
  withOfferValue: number;
  /** Diferença *computada*: withOfferValue - baselineValue (positivo = ganho) */
  deltaValue: number;
  /** Headline curto. Nunca prometer ganho se o delta for negativo. */
  deltaDisplay: string;
  argument: ProjectionArgument;
  period: "mês" | "trimestre" | "ano";
  /** Explicação longa com a conta explícita */
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

/* ========== VEÍCULOS ========== */

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

/* ========== ATENDIMENTOS ========== */

export type AppointmentStatus =
  | "Confirmado"
  | "A confirmar"
  | "Em andamento"
  | "Concluído";

export type Appointment = {
  id: string;
  customerId: string;
  vehicleId: string;
  dateIso: string;
  weekday: string;
  dateDisplay: string;
  time: string; // "HH:MM"
  /** Duração estimada em minutos para derivar término. */
  durationMin: number;
  service: string;
  bay: string;
  /** Status estático declarado pelo autor (base). O status efetivo é derivado por appointmentStatus(). */
  baseStatus: AppointmentStatus;
};

/** Converte "HH:MM" em minutos desde 00:00. */
function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Status efetivo derivado de SIM_CLOCK.nowMinutes.
 *   now < start                        → mantém baseStatus (Confirmado/A confirmar)
 *   start ≤ now ≤ start+duration       → Em andamento
 *   now > start+duration               → Concluído (overrides baseStatus)
 */
export function appointmentStatus(a: Appointment, now = SIM_CLOCK.nowMinutes): AppointmentStatus {
  const start = hhmmToMin(a.time);
  const end = start + a.durationMin;
  if (now < start) return a.baseStatus;
  if (now <= end) return "Em andamento";
  return "Concluído";
}

/** Marca "próximo" o primeiro appointment do dia com início > now. */
export function isNextAppointment(a: Appointment, all: Appointment[], now = SIM_CLOCK.nowMinutes): boolean {
  const futureSorted = all
    .filter((x) => hhmmToMin(x.time) > now)
    .sort((a, b) => hhmmToMin(a.time) - hhmmToMin(b.time));
  return futureSorted[0]?.id === a.id;
}

/* ========== HISTÓRICO ========== */

export type HistoryItem = {
  dateDisplay: string;
  service: string;
  unit: string;
  nps?: number;
  /** Valor cobrado — só preenchido em avulsos; permite verificar ticket médio. */
  amount?: number;
};

/* ========== ASSINATURA ATUAL ========== */

export type ActivePlan = {
  key: PlanKey;
  label: string;
  priceDisplay: string;
  cycle: string;
  nextVisitText: string;
};

/* ========== CLIENTE ========== */

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
  vehicleId: string;
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

/* ========== DADOS FICTÍCIOS ========== */

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

/* ========== PROJEÇÕES — pré-calculadas e verificáveis ========== */

// ROBERTA: avulsa, consome R$ 480 em serviço aproximadamente a cada 30 dias → 3 visitas/trimestre.
// Caso realmente comparemos "mesmo trimestre": 3 × 480 = 1.440 (avulso) vs 3 × 596 = 1.788 (Priority).
// A Priority custa R$ 348 a mais no trimestre, mas entrega 6 atendimentos premium (vs 3 avulsos).
// Argumento: previsibilidade + 2x em serviço entregue. Não vendemos como "ganho de receita".
const ROBERTA_BASELINE = 3 * 480; // 1.440 trimestre avulso (3 visitas de R$ 480)
const ROBERTA_WITH_OFFER = 3 * PLAN_CATALOG.priority.priceMonthly; // 1.788 trimestre
const ROBERTA_DELTA = ROBERTA_WITH_OFFER - ROBERTA_BASELINE; // +348 (ganho real para a operação)

// CAMILA: Smart (R$ 329/mês) + 3 serviços avulsos extras no trimestre a R$ 480 = sinal de upgrade.
const CAMILA_BASELINE = 3 * PLAN_CATALOG.smart.priceMonthly + 3 * 480; // 987 + 1.440 = 2.427
const CAMILA_WITH_OFFER = 3 * PLAN_CATALOG.priority.priceMonthly; // 1.788
const CAMILA_DELTA = CAMILA_WITH_OFFER - CAMILA_BASELINE; // -639 (economia para o cliente)

// ANDRÉ: Priority individual + 3 veículos corporativos adicionais (Corporate Care).
const ANDRE_BASELINE = PLAN_CATALOG.priority.priceMonthly; // 596
const ANDRE_FLEET_MONTHLY = 3 * PLAN_CATALOG.priority.priceMonthly; // 1.788
const ANDRE_WITH_OFFER = ANDRE_BASELINE + ANDRE_FLEET_MONTHLY; // 2.384
const ANDRE_DELTA = ANDRE_WITH_OFFER - ANDRE_BASELINE; // +1.788

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
      "Valoriza pontualidade e lounge silencioso. Prefere veículo pronto antes das 16h",
    vehicleId: "veh-roberta-01",
    casual: {
      label: "Cliente avulso premium",
      lastService: "Detalhamento Executivo — 29/09/2026",
    },
    opportunity: {
      kind: "new_subscription",
      title: "Pronta para assinatura Priority",
      reason:
        "3 atendimentos avulsos em 90 dias, ticket médio R$ 480, NPS 10. A Priority mantém a frequência e dobra o número de serviços premium entregues",
      recommendedPlan: "priority",
      projection: {
        baselineLabel: "Hoje (avulso)",
        baselineValue: ROBERTA_BASELINE,
        withOfferLabel: "Com Priority",
        withOfferValue: ROBERTA_WITH_OFFER,
        deltaValue: ROBERTA_DELTA,
        deltaDisplay: "Previsibilidade mensal + 2× em serviço entregue",
        argument: "predictability",
        period: "trimestre",
        explain:
          "Baseline: 3 visitas avulsas × R$ 480 = R$ 1.440 por trimestre. Com Priority: 3 × R$ 596 = R$ 1.788, com 6 atendimentos premium inclusos (vs. 3 avulsos). Diferença: +R$ 348 por trimestre em receita recorrente — e o cliente recebe o dobro de serviço entregue",
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
      { dateDisplay: "29/09/2026", service: "Detalhamento Executivo", unit: "Jardins", nps: 10, amount: 480 },
      { dateDisplay: "28/08/2026", service: "Lavagem Premium + Enceramento", unit: "Jardins", nps: 10, amount: 480 },
      { dateDisplay: "22/07/2026", service: "Higienização interna + externa", unit: "Jardins", nps: 10, amount: 480 },
      { dateDisplay: "02/06/2026", service: "Detalhamento Executivo", unit: "Jardins", nps: 9, amount: 480 },
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
      "Titular de 4 CNPJs do Grupo Pellegrino. Flexível na janela da manhã, prefere box 01",
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
        "Já é Priority individual. CNPJ do titular tem mais 3 veículos corporativos identificados — oportunidade de estender o cuidado à frota com contrato empresarial",
      corporateFleet: {
        vehicles: 3,
        monthlyEstimate: ANDRE_FLEET_MONTHLY,
        monthlyDisplay: `R$ ${ANDRE_FLEET_MONTHLY.toLocaleString("pt-BR")} / mês`,
      },
      projection: {
        baselineLabel: "Hoje (Priority individual)",
        baselineValue: ANDRE_BASELINE,
        withOfferLabel: "Com Corporate Care",
        withOfferValue: ANDRE_WITH_OFFER,
        deltaValue: ANDRE_DELTA,
        deltaDisplay: `+ R$ ${ANDRE_DELTA.toLocaleString("pt-BR")} / mês incremental`,
        argument: "revenue_gain",
        period: "mês",
        explain:
          `Mantém a Priority individual (R$ ${ANDRE_BASELINE}). Adiciona ${3} veículos corporativos a R$ ${PLAN_CATALOG.priority.priceMonthly} cada = R$ ${ANDRE_FLEET_MONTHLY}/mês incrementais, sob um único contrato empresarial com NF-e consolidada`,
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
      "Agenda a cada 15 dias sem falha. Pagou 3 serviços avulsos extras no último trimestre",
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
        "Smart + 3 avulsos pagos em 90 dias indicam demanda acima do plano atual. Priority inclui o que ela já consome e adiciona proteção cerâmica",
      recommendedPlan: "priority",
      projection: {
        baselineLabel: "Hoje (Smart + 3 extras)",
        baselineValue: CAMILA_BASELINE,
        withOfferLabel: "Com Priority",
        withOfferValue: CAMILA_WITH_OFFER,
        deltaValue: CAMILA_DELTA,
        deltaDisplay: `Economia de R$ ${Math.abs(CAMILA_DELTA).toLocaleString("pt-BR")} no trimestre + proteção superior`,
        argument: "client_saving",
        period: "trimestre",
        explain:
          `Baseline: 3 × Smart (R$ ${PLAN_CATALOG.smart.priceMonthly}) + 3 avulsos extras (R$ 480 cada) = R$ ${CAMILA_BASELINE.toLocaleString("pt-BR")}. Com Priority (R$ ${PLAN_CATALOG.priority.priceMonthly} × 3) = R$ ${CAMILA_WITH_OFFER.toLocaleString("pt-BR")}, com os extras já inclusos e proteção cerâmica anual. Ganho para DGN: fidelização e previsibilidade do ticket (receita se estabiliza em R$ ${PLAN_CATALOG.priority.priceMonthly}/mês)`,
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
      { dateDisplay: "22/09/2026", service: "Correção pontual (extra)", unit: "Jardins", nps: 10, amount: 480 },
      { dateDisplay: "08/09/2026", service: "Smart quinzenal", unit: "Jardins", nps: 9 },
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

/* ========== AGENDA DO DIA ========== */

export const APPOINTMENTS: Appointment[] = [
  {
    id: "appt-andre-am",
    customerId: "andre-pellegrino",
    vehicleId: "veh-andre-01",
    dateIso: DEMO_DATE.iso,
    weekday: "Quarta",
    dateDisplay: "22/10",
    time: "08:30",
    durationMin: 60,
    service: "Priority mensal — Correção leve + proteção",
    bay: "Box 01 · Lounge Fundador",
    baseStatus: "Confirmado",
  },
  {
    id: "appt-roberta-am",
    customerId: "roberta-vinciguerra",
    vehicleId: "veh-roberta-01",
    dateIso: DEMO_DATE.iso,
    weekday: "Quarta",
    dateDisplay: "22/10",
    time: "09:30",
    durationMin: 90,
    service: "Enceramento técnico + revisão de couro",
    bay: "Box 02 · Lounge",
    baseStatus: "Confirmado",
  },
  {
    id: "appt-camila-am",
    customerId: "camila-arantes",
    vehicleId: "veh-camila-01",
    dateIso: DEMO_DATE.iso,
    weekday: "Quarta",
    dateDisplay: "22/10",
    time: "11:15",
    durationMin: 60,
    service: "Smart quinzenal — Lavagem premium + interior",
    bay: "Box 03",
    baseStatus: "A confirmar",
  },
  {
    id: "appt-corporate-pm",
    customerId: "andre-pellegrino",
    vehicleId: "veh-andre-01",
    dateIso: DEMO_DATE.iso,
    weekday: "Quarta",
    dateDisplay: "22/10",
    time: "14:00",
    durationMin: 60,
    service: "Reunião Corporate Care — Grupo Pellegrino",
    bay: "Lounge executivo",
    baseStatus: "Confirmado",
  },
];

/** Próximo atendimento canônico por cliente (usado nas fichas) */
export const nextAppointmentByCustomer = (customerId: string): Appointment | undefined =>
  APPOINTMENTS.find((a) => a.customerId === customerId);

/* ========== DERIVAÇÕES AO VIVO (SIM_CLOCK × APPOINTMENTS) ========== */

export type OperationBreakdown = {
  emAtendimento: number;
  aguardando: number;
  agendados: number;
  concluidos: number;
};

export function operationBreakdown(now = SIM_CLOCK.nowMinutes): OperationBreakdown {
  let emAtendimento = 0;
  let aguardando = 0;
  let agendados = 0;
  let concluidos = 0;

  for (const a of APPOINTMENTS) {
    const status = appointmentStatus(a, now);
    if (status === "Em andamento") emAtendimento++;
    else if (status === "Concluído") concluidos++;
    else if (isNextAppointment(a, APPOINTMENTS, now)) aguardando++;
    else agendados++;
  }

  return { emAtendimento, aguardando, agendados, concluidos };
}

export type CapacityInfo = {
  used: number;
  total: number;
  percent: number;
  percentDisplay: string;
};

export function dailyCapacity(): CapacityInfo {
  const used = APPOINTMENTS.length;
  const total = DEMO_UNIT.totalDailySlots;
  const percent = Math.round((used / total) * 100);
  return { used, total, percent, percentDisplay: `${percent}%` };
}

/* ========== AGREGADO DEMONSTRATIVO (MRR + assinantes totais) ========== */

/**
 * Breakdown fictício plausível para UMA unidade pequena.
 * A soma dos planos × preço = MRR. Nenhum número é inventado isoladamente —
 * tudo deriva deste objeto. Rotulado como "contexto agregado demonstrativo"
 * na UI pra não ser confundido com tração real.
 */
export const AGGREGATE_SIM = {
  essentialSubscribers: 10,
  smartSubscribers: 15,
  prioritySubscribers: 7,
  /** Delta mensal plausível: 2 novos Essential + 1 Smart no mês = R$ 707 */
  monthDeltaValue: 2 * PLAN_CATALOG.essential.priceMonthly + PLAN_CATALOG.smart.priceMonthly,
  monthDeltaLabel: "vs. setembro",
} as const;

export function aggregateStats() {
  const totalSubs =
    AGGREGATE_SIM.essentialSubscribers +
    AGGREGATE_SIM.smartSubscribers +
    AGGREGATE_SIM.prioritySubscribers;
  const mrrValue =
    AGGREGATE_SIM.essentialSubscribers * PLAN_CATALOG.essential.priceMonthly +
    AGGREGATE_SIM.smartSubscribers * PLAN_CATALOG.smart.priceMonthly +
    AGGREGATE_SIM.prioritySubscribers * PLAN_CATALOG.priority.priceMonthly;
  const mrrDisplay = `R$ ${(mrrValue / 1000).toFixed(1).replace(".", ",")}k`;
  const deltaDisplay = `+ R$ ${AGGREGATE_SIM.monthDeltaValue.toLocaleString("pt-BR")} ${AGGREGATE_SIM.monthDeltaLabel}`;
  const newSubsThisWeek = 3;
  return {
    totalSubs,
    totalSubsDelta: `+${newSubsThisWeek} esta semana`,
    mrrValue,
    mrrDisplay,
    mrrDelta: deltaDisplay,
  };
}

/* ========== PULSO DO DIA (deriva de APPOINTMENTS) ========== */

export type PulseItem = {
  time: string;
  title: string;
  detail: string;
  kind: "operacional" | "atendimento" | "pendente" | "comercial";
  highlight?: boolean;
};

export function todayPulse(now = SIM_CLOCK.nowMinutes): PulseItem[] {
  const items: PulseItem[] = [
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
      const liveStatus = appointmentStatus(a, now);
      const titleBase = a.service.split("—")[0].trim();
      return {
        time: a.time,
        title: isMeeting ? a.service : `${titleBase} — ${c.name}`,
        detail: isMeeting
          ? `${v.make} ${v.model} · ${a.bay}`
          : `${v.make} ${v.model} · ${a.bay}${liveStatus === "Em andamento" ? "" : a.baseStatus === "A confirmar" ? " · aguardando confirmação" : ""}`,
        kind: isMeeting
          ? "comercial"
          : a.baseStatus === "A confirmar"
          ? "pendente"
          : "atendimento",
        highlight: liveStatus === "Em andamento",
      };
    }),
  ];
  return items;
}

/* ========== HERO DO COMMAND CENTER (1 linha derivada) ========== */

export function heroSummary(now = SIM_CLOCK.nowMinutes): string {
  const op = operationBreakdown(now);
  const total = APPOINTMENTS.length;
  const highOpps = CUSTOMERS.filter((c) => c.opportunity.priority === "alta").length;

  const parts: string[] = [];
  parts.push(`${total} atendimentos hoje`);
  if (op.emAtendimento > 0) {
    parts.push(`${op.emAtendimento} em andamento`);
  }
  if (highOpps > 0) {
    parts.push(
      `${highOpps} oportunidade${highOpps === 1 ? "" : "s"} de alta prioridade esperando sua decisão`
    );
  }
  return parts.join(" · ");
}

/* ========== PRÓXIMA AÇÃO RECOMENDADA ========== */

export const NEXT_RECOMMENDED_ACTION = {
  customerId: "roberta-vinciguerra",
  headline: "Oferecer Priority para Roberta antes do atendimento das 09:30",
  rationale:
    "3 avulsos em 90 dias a R$ 480 · NPS 10 · perfil VIP. Priority mantém a cadência mensal e dobra o serviço premium entregue",
};

/* ========== VERIFICAÇÃO DE CONSISTÊNCIA ========== */

export function assertDataConsistency(): string[] {
  const issues: string[] = [];

  for (const c of CUSTOMERS) {
    if (!vehicleById(c.vehicleId)) {
      issues.push(`Customer ${c.id}: vehicleId ${c.vehicleId} não existe`);
    }
  }

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
    // Assinante Priority NÃO deve receber oferta Priority como nova.
    if (
      o.kind === "new_subscription" &&
      c.plan?.key === o.recommendedPlan
    ) {
      issues.push(
        `Customer ${c.id}: new_subscription recomendando plano que ele já tem (${o.recommendedPlan})`
      );
    }

    // Projection: delta computado deve bater com withOffer − baseline.
    const delta = o.projection.withOfferValue - o.projection.baselineValue;
    if (delta !== o.projection.deltaValue) {
      issues.push(
        `Customer ${c.id}: projection.deltaValue=${o.projection.deltaValue} ≠ ${delta} (withOffer-baseline)`
      );
    }

    // Projection: argument deve ser coerente com sinal do delta.
    if (o.projection.argument === "revenue_gain" && delta <= 0) {
      issues.push(
        `Customer ${c.id}: projection argumenta "revenue_gain" mas delta=${delta} não é ganho`
      );
    }
    if (o.projection.argument === "client_saving" && delta >= 0) {
      issues.push(
        `Customer ${c.id}: projection argumenta "client_saving" mas delta=${delta} não é economia`
      );
    }
  }

  // Operation breakdown deve somar APPOINTMENTS.length.
  const op = operationBreakdown();
  const sum = op.emAtendimento + op.aguardando + op.agendados + op.concluidos;
  if (sum !== APPOINTMENTS.length) {
    issues.push(
      `operationBreakdown soma ${sum}, esperado ${APPOINTMENTS.length}`
    );
  }

  // Capacidade: used ≤ total.
  const cap = dailyCapacity();
  if (cap.used > cap.total) {
    issues.push(`Capacity used=${cap.used} > total=${cap.total}`);
  }

  // Ticket médio Roberta deve bater com history amounts.
  const roberta = customerById("roberta-vinciguerra")!;
  const amts = roberta.history.filter((h) => h.amount != null).map((h) => h.amount!);
  if (amts.length) {
    const avg = amts.reduce((a, b) => a + b, 0) / amts.length;
    if (avg !== 480) {
      issues.push(`Roberta ticket médio real = ${avg}, declarado R$ 480`);
    }
  }

  return issues;
}
