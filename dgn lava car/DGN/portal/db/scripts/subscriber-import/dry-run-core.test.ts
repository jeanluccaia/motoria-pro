import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalPlan,
  classifyInactive,
  classifyPaymentCondition,
  classifySubscriber,
  detectSemestralLegacy,
  findCandidates,
  indexDuesByPhone,
  isForbiddenPlanLabel,
  parseBrDate,
  rankCandidates,
  type CrmSnapshot,
  type CustomerRow,
  type VehicleRow,
  type SubscriptionRow,
  type CampaignMemberRow,
} from "./dry-run-core.ts";
import { normalizeName, normalizePhone, normalizePlate } from "../../../lib/growth/db/normalizers.ts";
import type { SpreadsheetActiveSubscriber, SpreadsheetDueEntry, SpreadsheetInactive } from "./parse-spreadsheet.ts";

// ---------- helpers ----------
function subj(name: string, phone: string, plates: string[]) {
  return {
    name: normalizeName(name),
    phone: normalizePhone(phone),
    plates: plates.map((p) => normalizePlate(p)),
  };
}

function cust(id: string, name: string, normalized_phone: string | null, legacy_id: string | null = null): CustomerRow {
  return {
    id,
    legacy_id,
    name,
    normalized_name: name.toLowerCase(),
    primary_phone: normalized_phone,
    normalized_phone,
  };
}

function veh(id: string, customer_id: string, plate: string): VehicleRow {
  return {
    id,
    customer_id,
    brand: null,
    model: null,
    plate,
    normalized_plate: plate.toUpperCase(),
    is_primary: true,
  };
}

function sub(customer_id: string, plan: string, status = "detectado"): SubscriptionRow {
  return {
    id: `sub-${customer_id}`,
    customer_id,
    is_active_subscriber: false,
    subscription_plan: plan,
    subscription_cycle: "não identificado",
    subscription_status: status,
    subscription_source: "Importação",
    next_scheduled_service_at: null,
    source_reference: null,
    notes: null,
  };
}

function member(customer_id: string, founder_status: string | null, founder_number: string | null): CampaignMemberRow {
  return {
    id: `cm-${customer_id}`,
    campaign_id: "founders-2026",
    customer_id,
    founder_status,
    founder_number,
    commercial_stage: null,
  };
}

function makeRow(overrides: Partial<SpreadsheetActiveSubscriber>): SpreadsheetActiveSubscriber {
  return {
    index: 0,
    name: "",
    whatsapp: "",
    planLabel: "DGN Smart",
    vehicles: [],
    lastUsageBr: null,
    usesInPeriod: null,
    lastOsStatus: null,
    situationForCrm: null,
    observations: null,
    ...overrides,
  };
}

const EMPTY: CrmSnapshot = { customers: [], vehicles: [], subscriptions: [], campaignMembers: [] };

// ============================================================
// Normalização de telefone
// ============================================================
test("telefone igual com e sem prefixo 55 casam", () => {
  const withPrefix = normalizePhone("5519999037494");
  const withoutPrefix = normalizePhone("19999037494");
  assert.equal(withPrefix.digits, withoutPrefix.digits);
  assert.equal(withPrefix.classification, "valido");
});

test("placa igual casa mesmo com hífen/espaço", () => {
  assert.equal(normalizePlate("BRY-0H64").compact, "BRY0H64");
  assert.equal(normalizePlate(" bry 0h64 ").compact, "BRY0H64");
});

// ============================================================
// Nome não usado como merge automático
// ============================================================
test("nome semelhante sem telefone/placa fica bloqueado no motor comum", () => {
  const a = subj("Paulo Daniel", "", []);
  const b = subj("Paulo Daniel", "", []);
  // Ambos sem telefone válido — motor deve devolver bloqueado
  const outcome = rankCandidates(a, [b]);
  const first = outcome[0];
  assert.ok(first);
  assert.equal(first.outcome.reviewStatus, "bloqueado");
});

// ============================================================
// CREATE — sem candidato
// ============================================================
test("CREATE quando telefone e placa não existem no CRM", () => {
  const row = makeRow({
    name: "Cliente Novo",
    whatsapp: "19988888888",
    vehicles: [{ plate: "AAA1B23", model: "Civic", raw: "AAA1B23 — Civic" }],
    planLabel: "DGN Smart",
  });
  const entry = classifySubscriber(row, EMPTY);
  assert.equal(entry.action, "CREATE");
  assert.equal(entry.confidence, 1);
});

// ============================================================
// UPDATE — match por telefone, sem diffs → NO_OP
// ============================================================
test("NO_OP quando telefone bate, nomes iguais e nenhum diff", () => {
  const c = cust("c1", "Rikardo Oliveira", "5519999037494", "rikardo");
  const v = veh("v1", "c1", "QXP9H50");
  const s = sub("c1", "Priority");
  const snapshot: CrmSnapshot = { customers: [c], vehicles: [v], subscriptions: [s], campaignMembers: [] };
  const row = makeRow({
    name: "Rikardo Oliveira",
    whatsapp: "19999037494",
    vehicles: [{ plate: "QXP9H50", model: "Onix", raw: "QXP9H50 — Onix" }],
    planLabel: "DGN Priority",
  });
  const entry = classifySubscriber(row, snapshot);
  assert.equal(entry.action, "NO_OP");
});

// ============================================================
// UPDATE — telefone bate mas veículo da planilha ausente no CRM
// ============================================================
test("UPDATE quando planilha traz veículo adicional (Guilherme Lopes)", () => {
  const c = cust("g1", "Guilherme Lopes", "5519993890842");
  const v1 = veh("v1", "g1", "TKO5G04");
  const snapshot: CrmSnapshot = { customers: [c], vehicles: [v1], subscriptions: [], campaignMembers: [] };
  const row = makeRow({
    name: "Guilherme Lopes",
    whatsapp: "19993890842",
    vehicles: [
      { plate: "TKO5G04", model: "Song Plus", raw: "TKO5G04 — Song Plus" },
      { plate: "TJX2D23", model: "Ora 03", raw: "TJX2D23 — Ora 03" },
    ],
    planLabel: "DGN Priority",
  });
  const entry = classifySubscriber(row, snapshot);
  assert.equal(entry.action, "UPDATE");
  const veiculoDiff = entry.diffs.find((d) => d.field === "vehicle.plate");
  assert.ok(veiculoDiff, "esperava diff de veículo faltante");
});

// ============================================================
// MERGE — dois cadastros distintos, ambos com placa/telefone alta-confiança
// ============================================================
test("MERGE quando dois clientes distintos casam alta_confianca simultaneamente", () => {
  const c1 = cust("c1", "Maria Souza", "5519991111111");
  const c2 = cust("c2", "Maria Souza", null);
  const v1 = veh("v1", "c1", "ABC1D23");
  const v2 = veh("v2", "c2", "ABC1D23"); // mesma placa em dois clientes
  const snapshot: CrmSnapshot = { customers: [c1, c2], vehicles: [v1, v2], subscriptions: [], campaignMembers: [] };
  const row = makeRow({
    name: "Maria Souza",
    whatsapp: "19991111111",
    vehicles: [{ plate: "ABC1D23", model: null, raw: "ABC1D23" }],
    planLabel: "DGN Smart",
  });
  const entry = classifySubscriber(row, snapshot);
  assert.equal(entry.action, "MERGE");
  assert.ok(entry.candidateCustomerIds.length >= 2);
});

// ============================================================
// CONFLICT — placa bate mas nomes divergem fortemente
// ============================================================
test("CONFLICT quando placa bate mas nomes divergentes (Ronaldo vs Thais)", () => {
  const c = cust("t1", "Thais Lambert", null);
  const v = veh("v1", "t1", "TCZ6A61");
  const snapshot: CrmSnapshot = { customers: [c], vehicles: [v], subscriptions: [], campaignMembers: [] };
  const row = makeRow({
    name: "Ronaldo Faria",
    whatsapp: "19997621279",
    vehicles: [{ plate: "TCZ6A61", model: "Commander", raw: "TCZ6A61 — Commander" }],
    planLabel: "DGN Essential",
  });
  const entry = classifySubscriber(row, snapshot);
  assert.equal(entry.action, "CONFLICT");
});

// ============================================================
// CONFLICT — nomenclatura de plano proibida sem canônico
// ============================================================
test("CONFLICT quando planLabel usa nomenclatura proibida sem canônico", () => {
  const row = makeRow({
    name: "Fulano",
    whatsapp: "11988887777",
    planLabel: "Elite Premium",
    vehicles: [{ plate: "ABC1D23", model: null, raw: "ABC1D23" }],
  });
  const entry = classifySubscriber(row, EMPTY);
  assert.equal(entry.action, "CONFLICT");
});

// ============================================================
// IGNORE / Renovação pendente — planilha diz "Renovação pendente"
// ============================================================
test("Renovação pendente: sugestão nunca libera novo ciclo (William)", () => {
  const c = cust("w1", "William Farias", "5519993658346");
  const v = veh("v1", "w1", "BSZ7C83");
  const snapshot: CrmSnapshot = { customers: [c], vehicles: [v], subscriptions: [sub("w1", "Smart")], campaignMembers: [] };
  const row = makeRow({
    name: "William Farias",
    whatsapp: "19993658346",
    vehicles: [{ plate: "BSZ7C83", model: "Polo", raw: "BSZ7C83 — Polo" }],
    planLabel: "DGN Smart",
    situationForCrm: "Renovação pendente",
    observations: "Renovação solicitada",
  });
  const dues: SpreadsheetDueEntry[] = [
    {
      name: "William Farias",
      whatsapp: "19993658346",
      planLabel: "DGN Smart",
      vehiclesRaw: "BSZ7C83 — Polo",
      dueDateBr: null,
      daysUntilDue: null,
      condition: "Renovar",
      controlSituation: "RENOVAÇÃO PENDENTE",
      whatsappAction: null,
      note: null,
    },
  ];
  const entry = classifySubscriber(row, snapshot, { dueByPhoneDigits: indexDuesByPhone(dues) });
  assert.equal(entry.isRenewalPending, true);
  assert.equal(entry.paymentClassification, "renewal_pending");
  // Não pode ser NO_OP e não pode ter suggestion de liberar saldo
  assert.notEqual(entry.action, "NO_OP");
  assert.ok(entry.suggestedAction.includes("pendente_validacao") || entry.suggestedAction.includes("não liberar"));
});

// ============================================================
// Plano válido: canonical
// ============================================================
test("planos válidos: Essential/Smart/Priority são canonicalizados", () => {
  assert.equal(canonicalPlan("DGN Essential"), "Essential");
  assert.equal(canonicalPlan("DGN Smart"), "Smart");
  assert.equal(canonicalPlan("DGN Priority"), "Priority");
  assert.equal(canonicalPlan("Elite"), null);
  assert.equal(canonicalPlan("Premium"), null);
  assert.equal(canonicalPlan("Daily"), null);
});

// ============================================================
// Nomenclatura semestral: sempre tratada como dado legado
// ============================================================
test("nomenclatura semestral é sinalizada como legado", () => {
  assert.equal(detectSemestralLegacy("Serviço 4u com nomenclatura semestral"), "semestral_legacy");
  assert.equal(detectSemestralLegacy("Plano legado quinzenal"), "semestral_legacy");
  assert.equal(detectSemestralLegacy("Cadastro empresarial"), null);
});

test("plano proibido detectado", () => {
  assert.equal(isForbiddenPlanLabel("Elite"), true);
  assert.equal(isForbiddenPlanLabel("Premium"), true);
  assert.equal(isForbiddenPlanLabel("Daily"), true);
  assert.equal(isForbiddenPlanLabel("DGN Smart"), false);
});

// ============================================================
// Pagamento: Pix e recorrência ≠ pago
// ============================================================
test("Pix e cartão e recorrência jamais viram informed_paid", () => {
  assert.equal(classifyPaymentCondition("Pix", "A VENCER"), "pix_not_confirmed");
  assert.equal(classifyPaymentCondition("Cartão de crédito", "A VENCER"), "card_not_confirmed");
  assert.equal(classifyPaymentCondition("Recorrência no cartão", "A VENCER"), "recurring_not_confirmed");
  assert.equal(classifyPaymentCondition("Pago", "PAGO"), "informed_paid");
  assert.equal(classifyPaymentCondition("Renovar", "RENOVAÇÃO PENDENTE"), "renewal_pending");
});

// ============================================================
// Founder preservado
// ============================================================
test("Founder confirmado é preservado no dry-run", () => {
  const c = cust("b1", "Benedito Constantino", "5519981723362");
  const v = veh("v1", "b1", "BRY0H64");
  const s = sub("b1", "Priority");
  const m = member("b1", "confirmado", "001");
  const snapshot: CrmSnapshot = { customers: [c], vehicles: [v], subscriptions: [s], campaignMembers: [m] };
  const row = makeRow({
    name: "Benedito Constantino",
    whatsapp: "19981723362",
    vehicles: [{ plate: "BRY0H64", model: "Song Plus", raw: "BRY0H64 — Song Plus" }],
    planLabel: "DGN Priority",
    observations: "Serviço 4u com nomenclatura semestral",
  });
  const entry = classifySubscriber(row, snapshot);
  assert.equal(entry.founderPreserved?.founder_status, "confirmado");
  assert.equal(entry.founderPreserved?.founder_number, "001");
  assert.ok(entry.action === "NO_OP" || entry.suggestedAction.includes("founder_number=001"));
});

// ============================================================
// Cadastro empresarial: 1 veículo, sem duplicar
// ============================================================
test("empresarial não gera dois clientes por ter 1 veículo pessoa jurídica", () => {
  const row = makeRow({
    name: "Rodmich Equipamentos Ltda",
    whatsapp: "19982256428",
    vehicles: [{ plate: "QSY3E68", model: "Saveiro", raw: "QSY3E68 — Saveiro" }],
    planLabel: "DGN Smart",
    observations: "Cadastro empresarial",
  });
  const entry = classifySubscriber(row, EMPTY);
  assert.equal(entry.action, "CREATE");
});

// ============================================================
// Vencimento não é próximo atendimento
// ============================================================
test("vencimento nunca sugere alteração em next_scheduled_service_at", () => {
  const c = cust("c1", "Guido Sabbadin", "5519981118226");
  const v = veh("v1", "c1", "SIC4F94");
  const s = sub("c1", "Essential");
  const snapshot: CrmSnapshot = { customers: [c], vehicles: [v], subscriptions: [s], campaignMembers: [] };
  const row = makeRow({
    name: "Guido Sabbadin",
    whatsapp: "19981118226",
    vehicles: [{ plate: "SIC4F94", model: "Onix Plus", raw: "SIC4F94 — Onix Plus" }],
    planLabel: "DGN Essential",
  });
  const dues: SpreadsheetDueEntry[] = [
    {
      name: "Guido Sabbadin",
      whatsapp: "19981118226",
      planLabel: "DGN Essential",
      vehiclesRaw: "SIC4F94 — Onix Plus",
      dueDateBr: "14/09/2026",
      daysUntilDue: 29,
      condition: "Pix",
      controlSituation: "A VENCER",
      whatsappAction: null,
      note: null,
    },
  ];
  const entry = classifySubscriber(row, snapshot, { dueByPhoneDigits: indexDuesByPhone(dues) });
  for (const d of entry.diffs) {
    assert.notEqual(d.field, "subscription.next_scheduled_service_at");
    if (d.field.includes("next_due_hint")) {
      assert.ok(d.reason.includes("jamais em next_scheduled_service_at"));
    }
  }
});

// ============================================================
// parseBrDate
// ============================================================
test("parseBrDate converte dd/mm/aaaa para ISO", () => {
  assert.equal(parseBrDate("10/08/2026"), "2026-08-10");
  assert.equal(parseBrDate(null), null);
  assert.equal(parseBrDate("31-12-2026"), null);
});

// ============================================================
// Saldo não inventado
// ============================================================
test("dry-run nunca produz saldo inventado nas sugestões", () => {
  const row = makeRow({
    name: "Cliente Novo",
    whatsapp: "19988887777",
    vehicles: [{ plate: "AAA1B23", model: null, raw: "AAA1B23" }],
    planLabel: "DGN Smart",
  });
  const entry = classifySubscriber(row, EMPTY);
  // Nenhum campo/entry menciona "saldo:", "washesUsed", "washesTotal"
  const dump = JSON.stringify(entry).toLowerCase();
  assert.ok(!/saldo:\s*\d/.test(dump));
  assert.ok(!/washes(used|total)/.test(dump));
});

// ============================================================
// Inativos: nunca importados como ativos
// ============================================================
test("inativo com 'voltou avulso' vira SUGEST_REACTIVATION", () => {
  const row: SpreadsheetInactive = {
    name: "Evanilson Silva",
    whatsapp: "19981563937",
    plan: "Plano legado quinzenal — DGN Smart provável",
    vehicle: "DSB9388 — Palio",
    lastPlanUseBr: "05/05/2026",
    daysWithoutPlanUse: 103,
    lastGeneralServiceBr: "05/08/2026",
    status: "Pago",
    classification: "Plano inativo; cliente voltou avulso",
    whatsappAction: "Abordar retomada do DGN Smart",
    note: "",
  };
  const entry = classifyInactive(row, EMPTY);
  assert.equal(entry.action, "SUGEST_REACTIVATION");
});

test("inativo comum vira IGNORE", () => {
  const row: SpreadsheetInactive = {
    name: "Lucas Brito",
    whatsapp: "19986008889",
    plan: "DGN Priority",
    vehicle: "GEL3G06 — Cruze",
    lastPlanUseBr: "09/06/2026",
    daysWithoutPlanUse: 68,
    lastGeneralServiceBr: "09/06/2026",
    status: "Pago",
    classification: "Inativo recente — confirmar vigência",
    whatsappAction: null,
    note: "",
  };
  const entry = classifyInactive(row, EMPTY);
  assert.equal(entry.action, "IGNORE");
});

// ============================================================
// findCandidates: telefone só encontra se ambos válidos
// ============================================================
test("findCandidates ignora telefone vazio ou inválido", () => {
  const c = cust("c1", "Fulano", null);
  const snapshot: CrmSnapshot = { customers: [c], vehicles: [], subscriptions: [], campaignMembers: [] };
  const subject = subj("Fulano", "", []);
  assert.equal(findCandidates(subject, snapshot).length, 0);
});

// ============================================================
// Wellington Felix: dois veículos + semestral legado
// ============================================================
test("dois veículos + semestral legado: CREATE gera diffs corretos", () => {
  const row = makeRow({
    name: "Wellington Felix",
    whatsapp: "19981260520",
    vehicles: [
      { plate: "SWR0J66", model: "ZR-V", raw: "SWR0J66 — ZR-V" },
      { plate: "DEF8553", model: "Golf", raw: "DEF8553 — Golf" },
    ],
    planLabel: "DGN Priority",
    observations: "Dois veículos; serviço 4u com nomenclatura semestral",
  });
  const entry = classifySubscriber(row, EMPTY);
  assert.equal(entry.action, "CREATE");
  assert.equal(entry.cycleHintFromObservation, "semestral_legacy");
  assert.equal(entry.plates.length, 2);
});
