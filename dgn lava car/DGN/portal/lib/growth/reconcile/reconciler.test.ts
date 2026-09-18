import test from "node:test";
import assert from "node:assert/strict";
import type { DgnCustomer } from "../dgn-growth-utils.ts";
import { reconcile } from "./reconciler.ts";
import type { ReconcileSubscriptionRow, ReconcileVehicleRow } from "./types.ts";

// ---------------------------------------------------------------------------
// Fixtures determinísticas — não dependem do JSON real. Refletem o estado
// Production pós-Lote 1 nos casos que Jean listou como regressão.
// ---------------------------------------------------------------------------

function customer(overrides: Partial<DgnCustomer> & Pick<DgnCustomer, "id" | "name" | "phone">): DgnCustomer {
  return {
    vehicle: "",
    plate: "",
    companyLink: "",
    origin: "",
    attendanceHistory: [],
    washCount: 0,
    historicalValue: 0,
    customerSince: "",
    lastAttendance: "",
    scoreDgn: 0,
    recommendedPlan: "Smart",
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "",
    averageVisitIntervalDays: 0,
    hasValidPhone: true,
    subscription: null,
    portalAccess: null,
    curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "", founderDecision: "", founderNumber: "", internalNotes: "" },
    campaign: {
      currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "",
      nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "", founderStatus: "nao_avaliado",
      commercialStage: "aguardando_analise", selectionReason: "", lostReason: "",
      kitStatusRaw: "nao_aplicavel", cardStatusRaw: "nao_aplicavel",
      dates: { inviteCreatedAt: "", inviteSentAt: "", viewedAt: "", respondedAt: "", conversationStartedAt: "", paymentSentAt: "", convertedAt: "", lostAt: "", kitUpdatedAt: "", cardUpdatedAt: "" },
      history: [], engagement: { viewedAt: "", lastViewedAt: "", viewCount: 0, confirmClickedAt: "", confirmClickCount: 0, vipClickedAt: "", vipClickCount: 0 },
      curation: { recommendedPlanCode: "", recommendedPlanName: "", recommendedPlanVersion: "", recommendedContractingMode: "", recommendedContractingModeLabel: "", recommendedCommitmentMonths: null, recommendedMonthlyPrice: null, recommendedBillingRule: "", recommendedVehicleCategory: "", recommendationReasonInternal: "", recommendationMessagePublic: "", curatedBy: "", curatedAt: "", approvedAt: "", planSnapshot: null, publicLink: null, inviteSentAt: "" },
      updatedAt: "",
    },
    ...overrides,
  } as DgnCustomer;
}

function sub(overrides: Partial<ReconcileSubscriptionRow> & Pick<ReconcileSubscriptionRow, "id" | "customer_id">): ReconcileSubscriptionRow {
  return {
    subscription_plan: "Priority",
    subscription_cycle: "semestral",
    subscription_status: "ativo",
    is_active_subscriber: true,
    provider_customer_id: null,
    provider_subscription_id: null,
    vehicle_id: null,
    cycle_ends_at: null,
    billing_due_at: null,
    source_reference: null,
    payment_status: "confirmed",
    payment_evidence_source: "manual",
    ...overrides,
  };
}

function veh(overrides: Partial<ReconcileVehicleRow> & Pick<ReconcileVehicleRow, "id" | "customer_id" | "plate">): ReconcileVehicleRow {
  return { brand: null, model: null, ...overrides };
}

// Fixtures dos casos regressão do Jean
const benedito = customer({ id: "benedito-constantino", name: "Benedito Constantino", phone: "19981723362" });
const jose = customer({ id: "jose-moreira", name: "Jose Moreira", phone: "19998115400" });
const rikardo = customer({ id: "rikardo-oliveira", name: "Rikardo Oliveira", phone: "19999037494" });
const wellington = customer({ id: "wellington-felix", name: "Wellington Felix", phone: "19981260520" });
const ana = customer({ id: "ana-silveira", name: "Ana Silveira", phone: "11992357937" });
const debora = customer({ id: "debora", name: "Debora", phone: "19991704872" });
const suely = customer({ id: "suely-maria-diniz", name: "Suely Maria Diniz", phone: "19997983530" });
const gustavo = customer({ id: "gustavo-plensack", name: "Gustavo Plensack", phone: "11963585627" });
const joseSergio = customer({ id: "jose-sergio-bressan", name: "Jose Sergio Bressan Junior", phone: "19999999999" });
const david = customer({ id: "david-lisboa", name: "David Lisboa", phone: "11999758344" });
const ronaldoLegacy = customer({ id: "ronaldo", name: "Ronaldo", phone: "19997621279" });
const ronaldoFaria = customer({ id: "ronaldo-faria", name: "Ronaldo Faria", phone: "19997621279" });
const viviane1 = customer({ id: "viviane-cruz", name: "Viviane Cruz dos Santos", phone: "19999479030" });
const viviane2 = customer({ id: "viviane-guerra", name: "Viviane Guerra", phone: "19981385635" });
const viviane3 = customer({ id: "viviane-tabata", name: "Viviane Tabata Manja", phone: "" });

const customers = [benedito, jose, rikardo, wellington, ana, debora, suely, gustavo, joseSergio, david, ronaldoLegacy, ronaldoFaria, viviane1, viviane2, viviane3];

// Subscriptions pós-Lote 1
const subscriptions: ReconcileSubscriptionRow[] = [
  // 4 promovidos (manual, sem provider)
  sub({ id: "sub-benedito", customer_id: benedito.id, subscription_plan: "Priority", subscription_cycle: "semestral", cycle_ends_at: "2026-12-31T03:00:00+00:00" }),
  sub({ id: "sub-jose", customer_id: jose.id, subscription_plan: "Smart", subscription_cycle: "semestral", cycle_ends_at: "2026-12-31T03:00:00+00:00" }),
  sub({ id: "sub-rikardo", customer_id: rikardo.id, subscription_plan: "Priority", subscription_cycle: "mensal", cycle_ends_at: "2026-10-04T03:00:00+00:00" }),
  sub({ id: "sub-wellington", customer_id: wellington.id, subscription_plan: "Priority", subscription_cycle: "não identificado", cycle_ends_at: "2026-12-31T03:00:00+00:00" }),
  // Gustavo: PagBank Priority
  sub({ id: "sub-gustavo", customer_id: gustavo.id, subscription_plan: "Priority", subscription_cycle: "mensal", provider_customer_id: "CUST_G", provider_subscription_id: "SUBS_G", payment_evidence_source: "provider" }),
  // Jose Sergio: 2 subs Smart, cada uma com veículo distinto
  sub({ id: "sub-jose-sergio-basalt", customer_id: joseSergio.id, subscription_plan: "Smart", subscription_cycle: "mensal", vehicle_id: "veh-basalt", provider_customer_id: "CUST_JS", provider_subscription_id: "SUBS_JS1", payment_evidence_source: "provider" }),
  sub({ id: "sub-jose-sergio-hb20", customer_id: joseSergio.id, subscription_plan: "Smart", subscription_cycle: "mensal", vehicle_id: "veh-hb20", provider_customer_id: "CUST_JS", provider_subscription_id: "SUBS_JS2", payment_evidence_source: "provider" }),
  // David: 2 subs sem vehicle (o caso ambíguo)
  sub({ id: "sub-david-1", customer_id: david.id, subscription_plan: "Smart", provider_customer_id: "CUST_D", provider_subscription_id: "SUBS_D1", payment_evidence_source: "provider" }),
  sub({ id: "sub-david-2", customer_id: david.id, subscription_plan: "Smart", provider_customer_id: "CUST_D", provider_subscription_id: "SUBS_D2", payment_evidence_source: "provider" }),
  // Ronaldo Faria (novo, PagBank)
  sub({ id: "sub-ronaldo-faria", customer_id: ronaldoFaria.id, subscription_plan: "Essential", provider_customer_id: "CUST_R", provider_subscription_id: "SUBS_R", payment_evidence_source: "provider" }),
];

const vehicles: ReconcileVehicleRow[] = [
  veh({ id: "veh-basalt", customer_id: joseSergio.id, plate: "TKE5H15", model: "Basalt" }),
  veh({ id: "veh-hb20", customer_id: joseSergio.id, plate: "UQG0C00", model: "HB20" }),
  veh({ id: "veh-benedito", customer_id: benedito.id, plate: "BRY0H64", model: "Song Plus" }),
];

const run = (rows: Parameters<typeof reconcile>[0]["rows"]) =>
  reconcile({ rows, customers, subscriptions, vehicles, dataOrigin: "db", now: new Date("2026-09-18T12:00:00Z") });

// ---------------------------------------------------------------------------
// REGRESSÕES obrigatórias
// ---------------------------------------------------------------------------

test("Benedito confirmando estado atual → ALREADY_CORRECT", () => {
  const r = run([{ name: "Benedito Constantino", phone: "19981723362", plan: "Priority", status: "ativo", paid_until: "31/12/2026" }]);
  assert.equal(r.items[0]!.classification, "ALREADY_CORRECT");
});

test("Jose Moreira idem → ALREADY_CORRECT", () => {
  const r = run([{ name: "Jose Moreira", phone: "19998115400", plan: "Smart", status: "ativo", paid_until: "31/12/2026" }]);
  assert.equal(r.items[0]!.classification, "ALREADY_CORRECT");
});

test("Rikardo idem → ALREADY_CORRECT", () => {
  const r = run([{ name: "Rikardo Oliveira", phone: "19999037494", plan: "Priority", status: "ativo", paid_until: "04/10/2026" }]);
  assert.equal(r.items[0]!.classification, "ALREADY_CORRECT");
});

test("Wellington idem → ALREADY_CORRECT", () => {
  const r = run([{ name: "Wellington Felix", phone: "19981260520", plan: "Priority", status: "ativo", paid_until: "31/12/2026" }]);
  assert.equal(r.items[0]!.classification, "ALREADY_CORRECT");
});

test("Ana renovacao_pendente → RENEWAL_PENDING", () => {
  const r = run([{ name: "Ana Silveira", phone: "11992357937", plan: "Smart", status: "renovacao_pendente" }]);
  assert.equal(r.items[0]!.classification, "RENEWAL_PENDING");
  assert.equal(r.items[0]!.applyEnabled, false);
});

test("Débora renovacao_pendente → RENEWAL_PENDING", () => {
  const r = run([{ name: "Debora", phone: "19991704872", plan: "Smart", status: "renovacao_pendente" }]);
  assert.equal(r.items[0]!.classification, "RENEWAL_PENDING");
});

test("Suely renovacao_pendente → RENEWAL_PENDING", () => {
  const r = run([{ name: "Suely Maria Diniz", phone: "19997983530", plan: "Smart", status: "renovacao_pendente" }]);
  assert.equal(r.items[0]!.classification, "RENEWAL_PENDING");
});

test("Gustavo Smart contra PagBank Priority → CONFLICT (nunca alterar automaticamente)", () => {
  const r = run([{ name: "Gustavo Plensack", phone: "11963585627", plan: "Smart", status: "ativo" }]);
  assert.equal(r.items[0]!.classification, "CONFLICT");
  assert.equal(r.items[0]!.applyEnabled, false);
});

test("Gustavo Priority idem → ALREADY_CORRECT (PagBank)", () => {
  const r = run([{ name: "Gustavo Plensack", phone: "11963585627", plan: "Priority", status: "ativo" }]);
  assert.equal(r.items[0]!.classification, "ALREADY_CORRECT");
});

test("José Sergio placa Basalt → alvo correto, não colapsa em uma", () => {
  const r = run([{ name: "Jose Sergio Bressan Junior", phone: "19999999999", plate: "TKE5H15", plan: "Smart", status: "ativo" }]);
  const item = r.items[0]!;
  assert.equal(item.facts.subscriptionMatch?.subscriptionId, "sub-jose-sergio-basalt");
  // PagBank ativo → ALREADY_CORRECT (nunca alterar via reconciliador)
  assert.equal(item.classification, "ALREADY_CORRECT");
});

test("José Sergio sem placa (2 subs ativas) → UPDATE_EXISTING_REVIEW", () => {
  const r = run([{ name: "Jose Sergio Bressan Junior", phone: "19999999999", plan: "Smart", status: "ativo" }]);
  assert.equal(r.items[0]!.classification, "UPDATE_EXISTING_REVIEW");
  assert.equal(r.items[0]!.applyEnabled, false);
});

test("David 2 subs sem vehicle → UPDATE_EXISTING_REVIEW", () => {
  const r = run([{ name: "David Lisboa", phone: "11999758344", plan: "Smart", status: "ativo" }]);
  assert.equal(r.items[0]!.classification, "UPDATE_EXISTING_REVIEW");
});

test("Ronaldo phone 5519997621279 bate em 2 customers → POSSIBLE_MATCH", () => {
  const r = run([{ name: "Ronaldo Faria", phone: "19997621279", plan: "Essential", status: "ativo" }]);
  assert.equal(r.items[0]!.classification, "POSSIBLE_MATCH");
  assert.ok(r.items[0]!.customer.ambiguousIds.length >= 1);
});

test("Viviane fuzzy name → POSSIBLE_MATCH (3 candidatas)", () => {
  const r = run([{ name: "Viviane", plan: "Smart", status: "ativo" }]);
  assert.equal(r.items[0]!.classification, "POSSIBLE_MATCH");
});

// ---------------------------------------------------------------------------
// APPLY candidates: PROMOTE_EXISTING e CREATE_NEW
// ---------------------------------------------------------------------------

test("Sub detectada + relatório ativo → PROMOTE_EXISTING (applyEnabled)", () => {
  // Simular sub detectada: modificamos localmente
  const localSubs = [...subscriptions, sub({ id: "sub-x", customer_id: viviane1.id, subscription_status: "detectado", is_active_subscriber: false, subscription_plan: "Smart" })];
  const r = reconcile({
    rows: [{ name: "Viviane Cruz dos Santos", phone: "19999479030", plan: "Smart", status: "ativo", paid_until: "31/12/2026", notes: "pago" }],
    customers, subscriptions: localSubs, vehicles, dataOrigin: "db",
    now: new Date("2026-09-18T12:00:00Z"),
  });
  const item = r.items[0]!;
  assert.equal(item.classification, "PROMOTE_EXISTING");
  assert.equal(item.applyEnabled, true);
  assert.equal(item.proposed?.kind, "PROMOTE_EXISTING");
  if (item.proposed?.kind === "PROMOTE_EXISTING") {
    assert.equal(item.proposed.subscriptionId, "sub-x");
    assert.equal(item.proposed.expectedCustomerId, viviane1.id);
    assert.equal(item.proposed.paymentStatus, "confirmed");
    assert.equal(item.proposed.paymentEvidenceSource, "manual");
    assert.equal(item.proposed.cycleEndsAtIso, "2026-12-31T03:00:00+00:00");
  }
});

test("Customer sem sub + plano explícito + status ativo → CREATE_NEW (applyEnabled)", () => {
  const emptyCustomer = customer({ id: "novo-cliente", name: "Novo Cliente Teste", phone: "11987654321" });
  const r = reconcile({
    rows: [{ name: "Novo Cliente Teste", phone: "11987654321", plan: "Priority", status: "ativo", paid_until: "01/10/2027", notes: "pago" }],
    customers: [...customers, emptyCustomer], subscriptions, vehicles, dataOrigin: "db",
    now: new Date("2026-09-18T12:00:00Z"),
  });
  const item = r.items[0]!;
  assert.equal(item.classification, "CREATE_NEW");
  assert.equal(item.applyEnabled, true);
  assert.equal(item.proposed?.kind, "CREATE_NEW");
  if (item.proposed?.kind === "CREATE_NEW") {
    assert.equal(item.proposed.customerId, "novo-cliente");
    assert.equal(item.proposed.plan, "Priority");
    assert.equal(item.proposed.paymentStatus, "confirmed");
    assert.equal(item.proposed.cycleEndsAtIso, "2027-10-01T03:00:00+00:00");
  }
});

test("Customer sem sub + plano ausente → CONFLICT (sem apply)", () => {
  const emptyCustomer = customer({ id: "sem-plano", name: "Sem Plano", phone: "11955555555" });
  const r = reconcile({
    rows: [{ name: "Sem Plano", phone: "11955555555", status: "ativo" }],
    customers: [...customers, emptyCustomer], subscriptions, vehicles, dataOrigin: "db",
    now: new Date("2026-09-18T12:00:00Z"),
  });
  assert.equal(r.items[0]!.classification, "CONFLICT");
  assert.equal(r.items[0]!.applyEnabled, false);
});

test("Customer não encontrado → CUSTOMER_NOT_FOUND", () => {
  const r = run([{ name: "Zzzz Não Existe", phone: "83999999999", plan: "Smart", status: "ativo" }]);
  assert.equal(r.items[0]!.classification, "CUSTOMER_NOT_FOUND");
  assert.equal(r.items[0]!.applyEnabled, false);
});

test("Summary sempre inclui frase sobre PagBank", () => {
  const r = run([{ name: "Benedito Constantino", phone: "19981723362", plan: "Priority", status: "ativo" }]);
  assert.match(r.summary, /nenhuma cobrança PagBank será alterada/i);
});

test("Counts totalizam totalRows", () => {
  const r = run([
    { name: "Benedito Constantino", phone: "19981723362", plan: "Priority", status: "ativo" },
    { name: "Ana Silveira", phone: "11992357937", plan: "Smart", status: "renovacao_pendente" },
    { name: "Zzzz Não Existe", phone: "83999999999", plan: "Smart", status: "ativo" },
  ]);
  const total = Object.values(r.counts).reduce((a, b) => a + b, 0);
  assert.equal(total, r.totalRows);
  assert.equal(r.totalRows, 3);
});
