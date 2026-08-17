/**
 * Motor puro do dry-run de importação real (ETAPA 7).
 *
 * Sem I/O. Recebe a planilha já parseada + snapshot já carregado do Supabase
 * (backup) e devolve, para cada assinante da planilha, uma classificação de
 * ação: CREATE / UPDATE / MERGE / CONFLICT / NO_OP / IGNORE.
 *
 * Regras fortes desta camada:
 *   - Reconciliação por telefone > placa > nome (nome nunca sozinho).
 *   - Planos válidos: apenas DGN Essential | Smart | Priority.
 *   - Renovação pendente (William, Paulo, Nina) nunca vai como ativo renovado.
 *   - "Semestral" na 4uCar é dado legado — não converte para loyalty_6.
 *   - Pix / Cartão / Recorrência ≠ pagamento confirmado.
 *   - Founders 001/002/003 têm founder_status/number preservados.
 *   - Próximo atendimento nunca é derivado do vencimento.
 *   - Saldo nunca é inventado.
 */

import {
  normalizeName,
  normalizePhone,
  normalizePlate,
  type NormalizedName,
  type NormalizedPhone,
  type NormalizedPlate,
} from "../../../lib/growth/db/normalizers.ts";
import {
  rankCandidates,
  reconcile,
  type ReconciliationSubject,
  type ReconciliationOutcome,
} from "../../../lib/growth/db/reconciliation.ts";
import type {
  SpreadsheetActiveSubscriber,
  SpreadsheetDueEntry,
  SpreadsheetInactive,
} from "./parse-spreadsheet.ts";

// ---------------------------------------------------------------------------
// Snapshot mínimo do Supabase (subset de colunas relevantes)
// ---------------------------------------------------------------------------

export interface CustomerRow {
  id: string;
  legacy_id: string | null;
  name: string;
  normalized_name: string;
  primary_phone: string | null;
  normalized_phone: string | null;
}

export interface VehicleRow {
  id: string;
  customer_id: string;
  brand: string | null;
  model: string | null;
  plate: string | null;
  normalized_plate: string | null;
  is_primary: boolean | null;
}

export interface SubscriptionRow {
  id: string;
  customer_id: string;
  is_active_subscriber: boolean | null;
  subscription_plan: string | null;
  subscription_cycle: string | null;
  subscription_status: string | null;
  subscription_source: string | null;
  next_scheduled_service_at: string | null;
  source_reference: string | null;
  notes: string | null;
}

export interface CampaignMemberRow {
  id: string;
  campaign_id: string;
  customer_id: string;
  founder_status: string | null;
  founder_number: string | null;
  commercial_stage: string | null;
}

export interface CrmSnapshot {
  customers: CustomerRow[];
  vehicles: VehicleRow[];
  subscriptions: SubscriptionRow[];
  campaignMembers: CampaignMemberRow[];
}

// ---------------------------------------------------------------------------
// Classificação
// ---------------------------------------------------------------------------

export type DryRunAction =
  | "CREATE"
  | "UPDATE"
  | "MERGE"
  | "CONFLICT"
  | "NO_OP"
  | "IGNORE";

export type FieldDiff = {
  field: string;
  before: unknown;
  after: unknown;
  reason: string;
};

export interface DryRunEntry {
  spreadsheetIndex: number;
  spreadsheetName: string;
  maskedPhone: string;
  normalizedPhone: string | null;
  plates: string[];              // compact form (uppercase)
  vehiclesFromSheet: Array<{ plate: string; model: string | null }>;
  // vehiclesCurrent: valores diretos das linhas de `crm_vehicles`, onde
  // `plate` pode ser NULL no banco (veículo sem placa cadastrada).

  action: DryRunAction;
  confidence: number;
  reasons: string[];
  matchedCustomerId: string | null;
  matchedCustomerLegacyId: string | null;
  matchedCustomerName: string | null;
  candidateCustomerIds: string[]; // when MERGE/CONFLICT
  planFromSheet: string | null;   // "Essential" | "Smart" | "Priority" | null
  planCurrent: string | null;
  vehiclesCurrent: Array<{ plate: string | null; model: string | null }>;
  dueDateFromSheet: string | null; // ISO or null
  dueConditionFromSheet: string | null;
  paymentClassification: "informed_paid" | "pix_not_confirmed" | "card_not_confirmed" | "recurring_not_confirmed" | "renewal_pending" | "unknown";
  cycleHintFromObservation: "semestral_legacy" | null;
  isRenewalPending: boolean;
  founderPreserved: {
    founder_status: string | null;
    founder_number: string | null;
  } | null;
  diffs: FieldDiff[];
  conflicts: string[];
  suggestedAction: string;
}

// ---------------------------------------------------------------------------
// Validação de plano
// ---------------------------------------------------------------------------

const VALID_PLANS = new Set(["Essential", "Smart", "Priority"]);
const PLAN_LABEL_MAP: Record<string, string> = {
  "DGN Essential": "Essential",
  "DGN Smart": "Smart",
  "DGN Priority": "Priority",
  Essential: "Essential",
  Smart: "Smart",
  Priority: "Priority",
};

export function canonicalPlan(label: string | null | undefined): string | null {
  if (!label) return null;
  const trimmed = label.trim();
  const mapped = PLAN_LABEL_MAP[trimmed];
  if (mapped && VALID_PLANS.has(mapped)) return mapped;
  return null;
}

/** Retorna true se o rótulo contém alguma nomenclatura proibida. */
export function isForbiddenPlanLabel(label: string | null | undefined): boolean {
  if (!label) return false;
  const upper = label.toUpperCase();
  return /(ELITE|PREMIUM|DAILY|SEMESTRAL|QUINZENAL)/.test(upper);
}

// ---------------------------------------------------------------------------
// Interpretação de condição de pagamento
// ---------------------------------------------------------------------------

export function classifyPaymentCondition(
  condition: string | null | undefined,
  situation: string | null | undefined,
): DryRunEntry["paymentClassification"] {
  const c = (condition ?? "").toLowerCase();
  const s = (situation ?? "").toUpperCase();
  if (s.includes("RENOVAÇÃO PENDENTE") || c === "renovar") return "renewal_pending";
  if (c === "pago" || s === "PAGO") return "informed_paid";
  if (c.includes("pix")) return "pix_not_confirmed";
  if (c.includes("recorrência") || c.includes("recorrencia")) return "recurring_not_confirmed";
  if (c.includes("cartão") || c.includes("cartao")) return "card_not_confirmed";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Detecção de nomenclatura legada semestral
// ---------------------------------------------------------------------------

export function detectSemestralLegacy(observations: string | null | undefined): "semestral_legacy" | null {
  if (!observations) return null;
  const o = observations.toLowerCase();
  if (/(semestral|quinzenal|plano legado|serviço 4u com nomenclatura)/.test(o)) return "semestral_legacy";
  return null;
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

/** "10/08/2026" → "2026-08-10". */
export function parseBrDate(br: string | null | undefined): string | null {
  if (!br) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// ---------------------------------------------------------------------------
// Reconciliação com o snapshot
// ---------------------------------------------------------------------------

interface CandidateBuilt {
  customer: CustomerRow;
  vehicles: VehicleRow[];
  subject: ReconciliationSubject;
  matchSource: "phone" | "plate" | "name";
}

function customerToSubject(c: CustomerRow, vs: VehicleRow[]): ReconciliationSubject {
  return {
    name: normalizeName(c.name),
    phone: c.normalized_phone
      ? normalizePhone(c.normalized_phone)
      : c.primary_phone
      ? normalizePhone(c.primary_phone)
      : null,
    plates: vs
      .filter((v) => v.normalized_plate || v.plate)
      .map((v) => normalizePlate(v.normalized_plate ?? v.plate)),
  };
}

export function buildSubjectFromSheet(row: SpreadsheetActiveSubscriber): ReconciliationSubject {
  return {
    name: normalizeName(row.name),
    phone: normalizePhone(row.whatsapp),
    plates: row.vehicles.map((v) => normalizePlate(v.plate)),
  };
}

/** Filtra candidatos por telefone/placa; nome é usado apenas para desempate. */
export function findCandidates(
  subject: ReconciliationSubject,
  snapshot: CrmSnapshot,
): CandidateBuilt[] {
  const byPhone = new Map<string, CustomerRow>();
  for (const c of snapshot.customers) {
    if (subject.phone?.classification === "valido" && c.normalized_phone) {
      const cn = normalizePhone(c.normalized_phone);
      if (cn.classification === "valido" && cn.digits === subject.phone.digits) {
        byPhone.set(c.id, c);
      }
    }
  }
  const byPlate = new Map<string, CustomerRow>();
  const plateSet = new Set(
    subject.plates
      .filter((p) => p.classification === "valida_antiga" || p.classification === "valida_mercosul")
      .map((p) => p.compact),
  );
  if (plateSet.size > 0) {
    const custIdsByPlate = new Set<string>();
    for (const v of snapshot.vehicles) {
      const norm = v.normalized_plate ?? v.plate;
      if (norm && plateSet.has(norm.toUpperCase())) custIdsByPlate.add(v.customer_id);
    }
    for (const id of custIdsByPlate) {
      const c = snapshot.customers.find((cc) => cc.id === id);
      if (c) byPlate.set(c.id, c);
    }
  }
  const merged = new Map<string, { c: CustomerRow; src: "phone" | "plate" }>();
  for (const [id, c] of byPhone) merged.set(id, { c, src: "phone" });
  for (const [id, c] of byPlate) {
    if (!merged.has(id)) merged.set(id, { c, src: "plate" });
  }

  const out: CandidateBuilt[] = [];
  for (const { c, src } of merged.values()) {
    const vs = snapshot.vehicles.filter((v) => v.customer_id === c.id);
    out.push({ customer: c, vehicles: vs, subject: customerToSubject(c, vs), matchSource: src });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Classificador principal
// ---------------------------------------------------------------------------

export interface ClassifyOptions {
  dueByPhoneDigits?: Map<string, SpreadsheetDueEntry>;
}

function collectDiffs(
  row: SpreadsheetActiveSubscriber,
  due: SpreadsheetDueEntry | undefined,
  cust: CustomerRow,
  custVehicles: VehicleRow[],
  custSubs: SubscriptionRow[],
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  // Name diff (informativo)
  const nn = normalizeName(row.name);
  const cn = normalizeName(cust.name);
  if (nn.normalized && cn.normalized && nn.normalized !== cn.normalized) {
    diffs.push({
      field: "customer.name",
      before: cust.name,
      after: row.name,
      reason: "planilha informa grafia oficial diferente do CRM",
    });
  }
  // Phone diff
  const sheetPhone = normalizePhone(row.whatsapp);
  const custPhone = cust.normalized_phone ? normalizePhone(cust.normalized_phone) : null;
  if (
    sheetPhone.classification === "valido" &&
    custPhone?.classification === "valido" &&
    sheetPhone.digits !== custPhone.digits
  ) {
    diffs.push({
      field: "customer.primary_phone",
      before: cust.normalized_phone,
      after: sheetPhone.digits,
      reason: "telefone divergente entre planilha e CRM",
    });
  }
  // Vehicle presence diff
  const custPlates = new Set(
    custVehicles
      .filter((v) => v.normalized_plate || v.plate)
      .map((v) => (v.normalized_plate ?? v.plate ?? "").toUpperCase()),
  );
  for (const v of row.vehicles) {
    const p = normalizePlate(v.plate);
    if (p.classification === "vazia" || p.classification === "invalida") continue;
    if (!custPlates.has(p.compact)) {
      diffs.push({
        field: "vehicle.plate",
        before: null,
        after: p.masked,
        reason: `veículo ${p.masked} (${v.model ?? "modelo não informado"}) na planilha e ausente no CRM`,
      });
    }
  }
  // Plan diff
  const sheetPlan = canonicalPlan(row.planLabel);
  const currentPlan = custSubs.length > 0 ? custSubs[0].subscription_plan : null;
  if (sheetPlan && currentPlan && sheetPlan !== currentPlan) {
    diffs.push({
      field: "subscription.subscription_plan",
      before: currentPlan,
      after: sheetPlan,
      reason: "plano da planilha diverge do assinatura atual",
    });
  }
  // Due date diff
  if (due) {
    const dueIso = parseBrDate(due.dueDateBr);
    // next_scheduled_service_at NÃO é vencimento — não sugerir alteração dele.
    // Este diff apenas registra que existe informação nova; não propõe update.
    if (dueIso) {
      diffs.push({
        field: "subscription.next_due_hint (não é next_scheduled_service_at)",
        before: null,
        after: dueIso,
        reason: "vencimento informado pela gestão — armazenar em campo comercial dedicado, jamais em next_scheduled_service_at",
      });
    }
  }
  return diffs;
}

function pickBestOutcome(
  subject: ReconciliationSubject,
  candidates: CandidateBuilt[],
): { outcome: ReconciliationOutcome; candidate: CandidateBuilt } | null {
  if (candidates.length === 0) return null;
  let best: { outcome: ReconciliationOutcome; candidate: CandidateBuilt } | null = null;
  for (const cand of candidates) {
    const outcome = reconcile(subject, cand.subject);
    if (!best || outcome.confidence > best.outcome.confidence) {
      best = { outcome, candidate: cand };
    }
  }
  return best;
}

export function classifySubscriber(
  row: SpreadsheetActiveSubscriber,
  snapshot: CrmSnapshot,
  opts: ClassifyOptions = {},
): DryRunEntry {
  const sheetPhoneN = normalizePhone(row.whatsapp);
  const platesN = row.vehicles.map((v) => normalizePlate(v.plate));
  const subject = buildSubjectFromSheet(row);
  const candidates = findCandidates(subject, snapshot);

  const isRenewalPendingFlag =
    (row.situationForCrm ?? "").toLowerCase().includes("renovação pendente");

  const due = opts.dueByPhoneDigits?.get(sheetPhoneN.digits) ?? undefined;
  const paymentClass = classifyPaymentCondition(due?.condition, due?.controlSituation);
  const cycleHint = detectSemestralLegacy(row.observations);

  const base: DryRunEntry = {
    spreadsheetIndex: row.index,
    spreadsheetName: row.name,
    maskedPhone: sheetPhoneN.classification === "valido"
      ? `${sheetPhoneN.ddd ?? "??"}****${sheetPhoneN.local.slice(-2)}`
      : "TELEFONE_INVALIDO",
    normalizedPhone: sheetPhoneN.classification === "valido" ? sheetPhoneN.digits : null,
    plates: platesN
      .filter((p) => p.classification === "valida_antiga" || p.classification === "valida_mercosul")
      .map((p) => p.compact),
    vehiclesFromSheet: row.vehicles.map((v) => ({ plate: v.plate, model: v.model })),
    action: "IGNORE",
    confidence: 0,
    reasons: [],
    matchedCustomerId: null,
    matchedCustomerLegacyId: null,
    matchedCustomerName: null,
    candidateCustomerIds: [],
    planFromSheet: canonicalPlan(row.planLabel),
    planCurrent: null,
    vehiclesCurrent: [],
    dueDateFromSheet: parseBrDate(due?.dueDateBr ?? null),
    dueConditionFromSheet: due?.condition ?? null,
    paymentClassification: paymentClass,
    cycleHintFromObservation: cycleHint,
    isRenewalPending: isRenewalPendingFlag,
    founderPreserved: null,
    diffs: [],
    conflicts: [],
    suggestedAction: "",
  };

  // Bloqueio duro: plano inválido / proibido
  if (isForbiddenPlanLabel(row.planLabel) && !canonicalPlan(row.planLabel)) {
    base.action = "CONFLICT";
    base.conflicts.push(`nomenclatura de plano não suportada: "${row.planLabel}"`);
    base.suggestedAction = "revisão comercial antes de qualquer gravação";
    return base;
  }

  // 0 candidatos → CREATE
  if (candidates.length === 0) {
    base.action = "CREATE";
    base.confidence = 1;
    base.reasons.push("nenhum cliente compatível por telefone ou placa no CRM");
    base.suggestedAction = "criar cliente + veículo(s) + assinatura detectada (nunca ativo automático)";
    return base;
  }

  // 1+ candidatos → escolher o de maior confiança e ver ambiguidade
  const picked = pickBestOutcome(subject, candidates);
  if (!picked) {
    base.action = "CONFLICT";
    base.conflicts.push("candidatos encontrados mas nenhum reconciliável — revisar manualmente");
    base.suggestedAction = "revisão manual";
    return base;
  }
  const highConf = candidates.filter((c) => {
    const oc = reconcile(subject, c.subject);
    return oc.reviewStatus === "alta_confianca";
  });

  const bestCand = picked.candidate;
  const bestSubs = snapshot.subscriptions.filter((s) => s.customer_id === bestCand.customer.id);
  const bestMembers = snapshot.campaignMembers.filter((m) => m.customer_id === bestCand.customer.id);
  const founder = bestMembers.find((m) => m.campaign_id === "founders-2026");

  base.matchedCustomerId = bestCand.customer.id;
  base.matchedCustomerLegacyId = bestCand.customer.legacy_id;
  base.matchedCustomerName = bestCand.customer.name;
  base.candidateCustomerIds = candidates.map((c) => c.customer.id);
  base.planCurrent = bestSubs[0]?.subscription_plan ?? null;
  base.vehiclesCurrent = bestCand.vehicles.map((v) => ({
    plate: v.plate,
    model: v.model,
  }));
  base.confidence = picked.outcome.confidence;
  base.reasons.push(...picked.outcome.reasons);
  if (founder) {
    base.founderPreserved = {
      founder_status: founder.founder_status,
      founder_number: founder.founder_number,
    };
  }

  // Ambíguo: 2+ high-confidence e customers diferentes → MERGE
  if (highConf.length >= 2) {
    base.action = "MERGE";
    base.reasons.push(`${highConf.length} cadastros com alta confiança apontam para a mesma pessoa`);
    base.suggestedAction =
      "mesclagem manual — preservar founder_status, founder_number, tracking e histórico do primário";
    base.conflicts.push("dois ou mais candidatos alta_confianca — merge automático proibido");
    return base;
  }

  if (picked.outcome.reviewStatus === "bloqueado" || picked.outcome.reviewStatus === "precisa_revisar") {
    base.action = "CONFLICT";
    base.conflicts.push(
      `reconciliação classificada como ${picked.outcome.reviewStatus} pelo motor comum`,
    );
    base.suggestedAction = "revisão humana antes de qualquer alteração";
    return base;
  }

  // alta_confianca → UPDATE ou NO_OP conforme diffs
  const diffs = collectDiffs(row, opts.dueByPhoneDigits?.get(sheetPhoneN.digits), bestCand.customer, bestCand.vehicles, bestSubs);
  base.diffs = diffs;
  if (diffs.length === 0 && !isRenewalPendingFlag) {
    base.action = "NO_OP";
    base.suggestedAction = "nenhuma alteração cadastral";
    return base;
  }
  base.action = "UPDATE";
  const bits: string[] = [];
  if (isRenewalPendingFlag) {
    bits.push(
      "não liberar novo ciclo/saldo — assinatura fica em subscription_status='pendente_validacao'",
    );
  }
  if (diffs.length > 0) bits.push(`aplicar ${diffs.length} diff(s) cadastrais listados`);
  if (base.founderPreserved) {
    bits.push(
      `preservar founder_status=${base.founderPreserved.founder_status} e founder_number=${base.founderPreserved.founder_number ?? "null"}`,
    );
  }
  base.suggestedAction = bits.join("; ");
  return base;
}

// ---------------------------------------------------------------------------
// Utilitário: mapa de vencimentos por telefone normalizado
// ---------------------------------------------------------------------------

export function indexDuesByPhone(dues: SpreadsheetDueEntry[]): Map<string, SpreadsheetDueEntry> {
  const map = new Map<string, SpreadsheetDueEntry>();
  for (const d of dues) {
    const n = normalizePhone(d.whatsapp);
    if (n.classification === "valido") map.set(n.digits, d);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Classificação de inativos (nunca vira ativo)
// ---------------------------------------------------------------------------

export interface DryRunInactiveEntry {
  spreadsheetName: string;
  maskedPhone: string;
  plate: string;
  classification: string;
  matchedCustomerId: string | null;
  action: "IGNORE" | "SUGEST_REACTIVATION" | "MERGE_REVIEW";
  note: string;
}

export function classifyInactive(
  row: SpreadsheetInactive,
  snapshot: CrmSnapshot,
): DryRunInactiveEntry {
  const phone = normalizePhone(row.whatsapp);
  const plateStr = row.vehicle.split("—")[0]?.trim() ?? "";
  const plate = normalizePlate(plateStr);
  const subject: ReconciliationSubject = {
    name: normalizeName(row.name),
    phone: phone.classification === "valido" ? phone : null,
    plates: plate.classification === "vazia" || plate.classification === "invalida" ? [] : [plate],
  };
  const cands = findCandidates(subject, snapshot);
  let matched: CustomerRow | null = null;
  if (cands.length > 0) {
    const picked = pickBestOutcome(subject, cands);
    matched = picked?.candidate.customer ?? null;
  }
  const cls = (row.classification ?? "").toLowerCase();
  let action: DryRunInactiveEntry["action"] = "IGNORE";
  if (cls.includes("voltou avulso") || cls.includes("houve atendimento posterior")) {
    action = "SUGEST_REACTIVATION";
  } else if (cls.includes("conflito")) {
    action = "MERGE_REVIEW";
  }
  return {
    spreadsheetName: row.name,
    maskedPhone: phone.classification === "valido"
      ? `${phone.ddd ?? "??"}****${phone.local.slice(-2)}`
      : "TELEFONE_INVALIDO",
    plate: plate.masked,
    classification: row.classification ?? "",
    matchedCustomerId: matched?.id ?? null,
    action,
    note: row.note ?? "",
  };
}

// ---------------------------------------------------------------------------
// Ranking (reexport para testes que exercitam o motor comum)
// ---------------------------------------------------------------------------

export { rankCandidates };
export type { NormalizedName, NormalizedPhone, NormalizedPlate };
