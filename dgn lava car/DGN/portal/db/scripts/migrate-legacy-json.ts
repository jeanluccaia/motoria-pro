/**
 * Migração idempotente do JSON legado (lib/growth/dgn-customers.json) para o
 * schema persistente crm_*.
 *
 * Uso:
 *   node --test-reporter spec db/scripts/migrate-legacy-json.ts --dry-run
 *   node db/scripts/migrate-legacy-json.ts --dry-run
 *   node db/scripts/migrate-legacy-json.ts --dry-run --select db/scripts/example-selection.json
 *   node db/scripts/migrate-legacy-json.ts --apply
 *
 * Regras críticas:
 * - preserva legacy_id (id do JSON) em crm_customers.legacy_id
 * - preserva Founders Nº001 (Benedito), Nº002 (José), Nº003 (Rikardo)
 * - Iara Nº004 no JSON legado NÃO é promovida — vira candidata "recomendada",
 *   audit log registra reabertura da vaga
 * - assinantes detectados são apenas os que o seed 13-assinantes aplica depois
 * - nunca faz merge automático em casos ambíguos (regras 5, 6 da conciliação)
 *
 * Modos:
 * - --dry-run           processa toda a base (2354 linhas) sem gravar
 * - --dry-run --select  processa APENAS os legacy_ids listados no arquivo dado
 *                       (aceita JSON com string[] ou {ids:string[]}, ou texto
 *                       com um id por linha). Usado como preview da importação
 *                       seletiva antes de habilitar --apply.
 * - --apply             ainda não implementado (aguarda decisão de importação
 *                       seletiva; ver retomada 2026-07-15 em db/reports/)
 *
 * Requer as 3 variáveis do Supabase para modo --apply:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  normalizeName,
  normalizePhone,
  normalizePlate,
  type NormalizedName,
  type NormalizedPhone,
  type NormalizedPlate,
} from "../../lib/growth/db/normalizers.ts"; // node runtime needs the .ts extension
import { rankCandidates, type ReconciliationSubject } from "../../lib/growth/db/reconciliation.ts";
import {
  computeDgnScore,
  DGN_SCORE_VERSION,
  type DataQualityIssue,
  type ScoreInput,
} from "../../lib/growth/db/score-engine.ts";
import { SUBSCRIBERS_2026_Q3 } from "../seeds/subscribers-2026-q3.ts";
import type {
  CampaignMemberWrite,
  CrmRepository,
  CustomerWrite,
  SubscriptionWrite,
  VehicleWrite,
  WriteAction,
} from "../../lib/growth/db/repositories.ts";

// ---------------------------------------------------------------------------
// Tipos do JSON legado
// ---------------------------------------------------------------------------

export interface LegacyCustomer {
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
  recommendedPlan: string;
  commercialStatus: string;
  recurrence: string;
  averageVisitIntervalDays: number;
  curation: {
    profile: string;
    originGroup: string;
    commercialProfile: string;
    idealSchedule: string;
    founderDecision: string;
    founderNumber: string;
    internalNotes: string;
  };
  campaign: {
    currentCampaign: string;
    founderSelected: boolean;
    founderNumber: string;
    founderCondition: string;
    campaignStatus: string;
    personalizedPagePath: string;
    paymentLink: string;
    lastAction: string;
    nextAction: string;
    lastContact: string;
    conversationStatus: string;
    notes: string;
    kitStatus: string;
    cardStatus: string;
  };
}

// ---------------------------------------------------------------------------
// Preserved Founders (project rule)
// ---------------------------------------------------------------------------

export const PRESERVED_FOUNDERS: Record<string, { number: string; legacyIdHint?: string }> = {
  "benedito constantino": { number: "001" },
  "jose moreira":          { number: "002" },
  "rikardo oliveira":      { number: "003", legacyIdHint: "rikardo-oliveira" },
};

// Iara aparece no JSON legado com founderNumber 004. Não promover.
const REOPEN_FOUNDER_LEGACY = new Set<string>(["iara"]); // legacy_id que devem ter Nº004 reaberto
export const SELECTIVE_APPLY_CONFIRMATION = "APPLY_SELECTIVE_DGN_CRM";
export const APPROVED_SELECTIVE_IDS = new Set(["benedito-constantino", "jose-moreira", "rikardo-oliveira", "iara"]);
export type ApplyRepository = Pick<CrmRepository,
  "findCustomerByExternalId" | "findCustomersByNormalizedPhone" | "createCustomer" | "updateCustomer" |
  "upsertVehicle" | "upsertSubscription" | "upsertCampaignMember" | "createAuditLog" | "createInteraction"
>;

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

interface DryRunReport {
  totalInput: number;
  newRecords: number;
  updatedRecords: number;
  rejectedRecords: Array<{ legacy_id: string; reason: string }>;
  duplicateCandidates: Array<{
    source_legacy_id: string;
    target_legacy_id: string;
    matchType: string;
    reviewStatus: string;
    confidence: number;
  }>;
  founderPreservation: Array<{ legacy_id: string; founder_number: string; status: string }>;
  founderReopened: Array<{ legacy_id: string; previous_founder_number: string; reason: string }>;
  dataQualityWarnings: Array<{ legacy_id: string; issues: DataQualityIssue[] }>;
  scoreDistribution: {
    prioridade_maxima: number;
    forte_candidato: number;
    precisa_curadoria: number;
    baixa_prioridade: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers de transformação
// ---------------------------------------------------------------------------

const STRATEGIC_ORIGINS = new Set([
  "genebra", "costa e silva", "cury", "monsoes", "monsões", "taquaral",
  "lumini", "avalon", "praca capital", "praça capital", "medley", "merse", "radial",
]);

function inferPlanFit(recommended: string): ScoreInput["planFit"] {
  const norm = recommended?.toLowerCase();
  if (norm === "priority") return "priority";
  if (norm === "smart") return "smart";
  if (norm === "corporate care" || norm === "corporate") return "corporate";
  return "não_identificado";
}

function daysBetween(fromISO: string, toISO: string): number | null {
  if (!fromISO || !toISO) return null;
  const from = Date.parse(fromISO);
  const to = Date.parse(toISO);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

function assessDataQuality(row: LegacyCustomer, phone: NormalizedPhone, name: NormalizedName): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  if (!row.vehicle || row.vehicle.trim().toLowerCase() === "a definir") issues.push("veiculo_indefinido");
  if (phone.classification === "vazio") issues.push("telefone_ausente");
  else if (phone.classification === "invalido") issues.push("telefone_invalido");
  if (name.hasArtificialPrefix) issues.push("nome_com_prefixo");
  return issues;
}

function buildScoreInput(row: LegacyCustomer, phone: NormalizedPhone, name: NormalizedName, hasDetectedSubscription: boolean): ScoreInput {
  const strategic = STRATEGIC_ORIGINS.has((row.origin || "").toLowerCase()) ||
    STRATEGIC_ORIGINS.has((row.companyLink || "").toLowerCase());
  const daysSinceLast = daysBetween(row.lastAttendance, new Date().toISOString().slice(0, 10));
  const isDataQualityAntigo = daysSinceLast !== null && daysSinceLast > 240;
  const issues = assessDataQuality(row, phone, name);
  if (isDataQualityAntigo) issues.push("atendimento_antigo");

  const avgTicket = row.washCount > 0 ? row.historicalValue / row.washCount : 0;
  return {
    averageIntervalDays: row.averageVisitIntervalDays || null,
    daysSinceLastService: daysSinceLast,
    serviceCount: row.washCount || 0,
    historicalValue: row.historicalValue || 0,
    averageTicket: avgTicket,
    planFit: inferPlanFit(row.recommendedPlan),
    dataQualityIssues: issues,
    strategicLink: strategic,
    relationshipStrength: row.curation?.founderDecision === "Sim" ? 2 : 0,
    hasDetectedSubscription,
  };
}

interface PreparedCustomer {
  legacy: LegacyCustomer;
  name: NormalizedName;
  phone: NormalizedPhone;
  plate: NormalizedPlate;
  score: ReturnType<typeof computeDgnScore>;
  subject: ReconciliationSubject;
  dataQualityIssues: DataQualityIssue[];
}

function prepare(row: LegacyCustomer): PreparedCustomer {
  const name = normalizeName(row.name);
  const phone = normalizePhone(row.phone);
  const plate = normalizePlate(row.plate);
  const scoreInput = buildScoreInput(row, phone, name, false);
  const score = computeDgnScore(scoreInput);
  return {
    legacy: row,
    name,
    phone,
    plate,
    score,
    dataQualityIssues: scoreInput.dataQualityIssues,
    subject: {
      name,
      phone: phone.classification === "valido" ? phone : null,
      plates: plate.classification.startsWith("valida") ? [plate] : [],
    },
  };
}

// ---------------------------------------------------------------------------
// Núcleo do dry-run
// ---------------------------------------------------------------------------

export function runDryRun(rows: LegacyCustomer[]): DryRunReport {
  const prepared = rows.map(prepare);
  const report: DryRunReport = {
    totalInput: rows.length,
    newRecords: 0,
    updatedRecords: 0,
    rejectedRecords: [],
    duplicateCandidates: [],
    founderPreservation: [],
    founderReopened: [],
    dataQualityWarnings: [],
    scoreDistribution: {
      prioridade_maxima: 0,
      forte_candidato: 0,
      precisa_curadoria: 0,
      baixa_prioridade: 0,
    },
  };

  // 1) preservar/rejeitar Founders + Iara
  for (const p of prepared) {
    const legacyId = p.legacy.id;
    const preserved = PRESERVED_FOUNDERS[p.name.normalized];
    if (preserved) {
      report.founderPreservation.push({
        legacy_id: legacyId,
        founder_number: preserved.number,
        status: "confirmado",
      });
      continue;
    }
    if (REOPEN_FOUNDER_LEGACY.has(legacyId) && p.legacy.curation?.founderNumber) {
      report.founderReopened.push({
        legacy_id: legacyId,
        previous_founder_number: p.legacy.curation.founderNumber,
        reason: "sem confirmação comercial — vaga reaberta por decisão manual do owner (2026-07-12)",
      });
    }
  }

  // 2) contabilizar distribuição de score e problemas de qualidade
  for (const p of prepared) {
    report.scoreDistribution[p.score.tier] += 1;
    if (p.dataQualityIssues.length > 0) {
      report.dataQualityWarnings.push({
        legacy_id: p.legacy.id,
        issues: p.dataQualityIssues,
      });
    }
  }

  // 3) detectar duplicidades: comparar cada um com os anteriores por bloqueio
  //    (por telefone/placa exatos, para não fazer O(n²) cheio quando não precisa)
  const phoneIndex = new Map<string, number[]>();
  const plateIndex = new Map<string, number[]>();
  const nameIndex = new Map<string, number[]>();

  prepared.forEach((p, i) => {
    if (p.phone.classification === "valido") {
      const key = p.phone.digits;
      const arr = phoneIndex.get(key) ?? [];
      arr.push(i);
      phoneIndex.set(key, arr);
    }
    if (p.plate.classification.startsWith("valida")) {
      const arr = plateIndex.get(p.plate.compact) ?? [];
      arr.push(i);
      plateIndex.set(p.plate.compact, arr);
    }
    if (p.name.normalized) {
      const arr = nameIndex.get(p.name.normalized) ?? [];
      arr.push(i);
      nameIndex.set(p.name.normalized, arr);
    }
  });

  const dedupSeen = new Set<string>();
  function pushDup(sourceIdx: number, targetIdx: number) {
    if (sourceIdx === targetIdx) return;
    const s = prepared[sourceIdx];
    const t = prepared[targetIdx];
    const key = [Math.min(sourceIdx, targetIdx), Math.max(sourceIdx, targetIdx)].join("::");
    if (dedupSeen.has(key)) return;
    dedupSeen.add(key);
    const ranked = rankCandidates(s.subject, [t.subject]);
    if (!ranked.length) return;
    const outcome = ranked[0].outcome;
    if (outcome.reviewStatus === "sem_correspondencia") return;
    report.duplicateCandidates.push({
      source_legacy_id: s.legacy.id,
      target_legacy_id: t.legacy.id,
      matchType: outcome.matchType,
      reviewStatus: outcome.reviewStatus,
      confidence: outcome.confidence,
    });
  }

  for (const bucket of phoneIndex.values()) {
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        pushDup(bucket[i], bucket[j]);
      }
    }
  }
  for (const bucket of plateIndex.values()) {
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        pushDup(bucket[i], bucket[j]);
      }
    }
  }
  for (const bucket of nameIndex.values()) {
    // apenas quando o bucket é pequeno para não ferrar performance
    if (bucket.length > 5) continue;
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        pushDup(bucket[i], bucket[j]);
      }
    }
  }

  // 4) contagem "new" assume banco vazio; em modo --apply o número real vem do banco
  report.newRecords = prepared.length;

  return report;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function loadLegacyJson(): Promise<LegacyCustomer[]> {
  const here = dirname(fileURLToPath(import.meta.url));
  const jsonPath = resolve(here, "../../lib/growth/dgn-customers.json");
  const raw = await readFile(jsonPath, "utf8");
  return JSON.parse(raw) as LegacyCustomer[];
}

/**
 * Carrega uma lista explícita de legacy_ids para importação seletiva.
 * Aceita:
 *   - JSON com string[]           → ["id-1", "id-2"]
 *   - JSON com {ids: string[]}    → {"ids": ["id-1", "id-2"]}
 *   - texto puro, um id por linha (linhas iniciadas por # são ignoradas)
 * Sempre normaliza para Set<string>. Lança erro se o arquivo estiver vazio
 * ou em formato desconhecido — preferimos falhar cedo a rodar tudo por engano.
 */
export async function loadSelection(selectionPath: string): Promise<Set<string>> {
  const raw = await readFile(selectionPath, "utf8");
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`arquivo de seleção "${selectionPath}" está vazio — abortando`);
  }
  let ids: string[] = [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      ids = parsed.filter((v): v is string => typeof v === "string");
    } else if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { ids?: unknown }).ids)
    ) {
      ids = ((parsed as { ids: unknown[] }).ids).filter((v): v is string => typeof v === "string");
    } else {
      throw new Error(
        `formato JSON não reconhecido em "${selectionPath}" — use string[] ou {"ids": string[]}`,
      );
    }
  } else {
    ids = trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
  }
  const set = new Set(ids.map((id) => id.trim()).filter(Boolean));
  if (set.size === 0) {
    throw new Error(`nenhum legacy_id válido em "${selectionPath}"`);
  }
  return set;
}

function readFlagValue(argv: string[], flag: string): string | null {
  const idx = argv.indexOf(flag);
  if (idx === -1) return null;
  const next = argv[idx + 1];
  if (!next || next.startsWith("--")) {
    throw new Error(`flag ${flag} exige um valor (caminho de arquivo)`);
  }
  return next;
}

export function validateApplyGate(argv: string[], selectedIds: Set<string>): void {
  if (!argv.includes("--apply")) return;
  if (!argv.includes("--select")) throw new Error("--apply exige --select <arquivo>");
  const confirmation = readFlagValue(argv, "--confirm");
  if (confirmation !== SELECTIVE_APPLY_CONFIRMATION) {
    throw new Error(`confirmação inválida: use --confirm ${SELECTIVE_APPLY_CONFIRMATION}`);
  }
  if (readFlagValue(argv, "--target") !== "remote") {
    throw new Error("ambiente não identificado: use --target remote");
  }
  if (selectedIds.size === 0) throw new Error("seleção vazia");
  const unauthorized = [...selectedIds].filter((id) => !APPROVED_SELECTIVE_IDS.has(id));
  const missingApproved = [...APPROVED_SELECTIVE_IDS].filter((id) => !selectedIds.has(id));
  if (unauthorized.length || missingApproved.length || selectedIds.size !== APPROVED_SELECTIVE_IDS.size) {
    throw new Error("apply bloqueado: esta etapa aceita exatamente os quatro IDs aprovados");
  }
}

export async function assertRemoteIdentity(projectRoot: string, rawUrl: string | undefined): Promise<void> {
  if (!rawUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente no ambiente server-side");
  let hostname: string;
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL inválida");
  }
  const linkedRef = (await readFile(resolve(projectRoot, "supabase/.temp/project-ref"), "utf8")).trim();
  if (!linkedRef || hostname !== `${linkedRef}.supabase.co`) {
    throw new Error("projeto remoto do ambiente não corresponde ao projeto vinculado pela Supabase CLI");
  }
}

interface ApplyReport {
  selected: number;
  created: number;
  updated: number;
  ignored: number;
  conflicts: number;
  audits: number;
  interactions: number;
  failures: Array<{ legacy_id: string; error: string }>;
  records: Array<{ legacy_id: string; customer: WriteAction; vehicle: WriteAction; subscription: WriteAction; campaign: WriteAction }>;
}

function qualityStatus(issues: DataQualityIssue[]): CustomerWrite["data_quality_status"] {
  if (issues.length === 0 || issues.every((issue) => issue === "atendimento_antigo")) return "ok";
  if (issues.length > 1) return "multiplas_pendencias";
  if (issues[0] === "telefone_invalido" || issues[0] === "telefone_ausente") return "telefone_invalido";
  if (issues[0] === "veiculo_indefinido") return "placa_invalida";
  return "incompleto";
}

function subscriptionFor(row: LegacyCustomer): SubscriptionWrite | null {
  const normalized = normalizeName(row.name).normalized;
  const seed = SUBSCRIBERS_2026_Q3.find((candidate) =>
    [candidate.name, ...(candidate.aliases ?? [])].some((name) => normalizeName(name).normalized === normalized),
  );
  if (!seed) return null;
  return {
    customer_id: "",
    is_active_subscriber: false,
    subscription_plan: seed.plan,
    subscription_cycle: seed.cycle,
    subscription_status: seed.status,
    subscription_source: "Importação",
    subscription_detected_at: null,
    next_scheduled_service_at: seed.nextScheduledServiceAt,
    source_reference: seed.sourceReference,
    notes: seed.notes ?? null,
  };
}

function customerWrite(prepared: PreparedCustomer): CustomerWrite {
  const row = prepared.legacy;
  return {
    legacy_id: row.id,
    name: row.id === "iara" ? "Iara Menezes" : row.name,
    normalized_name: row.id === "iara" ? normalizeName("Iara Menezes").normalized : prepared.name.normalized,
    primary_phone: row.phone || null,
    normalized_phone: prepared.phone.classification === "valido" ? prepared.phone.digits : null,
    email: null,
    company_or_link: row.companyLink || null,
    origin: row.origin || null,
    first_service_at: row.customerSince || null,
    last_service_at: row.lastAttendance || null,
    service_count: row.washCount || 0,
    historical_value: row.historicalValue || 0,
    average_ticket: row.washCount ? Math.round((row.historicalValue / row.washCount) * 100) / 100 : 0,
    average_interval_days: row.averageVisitIntervalDays || null,
    data_quality_status: qualityStatus(prepared.dataQualityIssues),
    data_quality_notes: prepared.dataQualityIssues.length ? prepared.dataQualityIssues.join(", ") : null,
  };
}

function sameWrite(current: Record<string, unknown>, wanted: Record<string, unknown>): boolean {
  return Object.entries(wanted).every(([key, value]) => JSON.stringify(current[key] ?? null) === JSON.stringify(value ?? null));
}

export async function applySelected(rows: LegacyCustomer[], repository: ApplyRepository): Promise<ApplyReport> {
  const report: ApplyReport = { selected: rows.length, created: 0, updated: 0, ignored: 0, conflicts: 0, audits: 0, interactions: 0, failures: [], records: [] };
  for (const row of rows) {
    try {
      const prepared = prepare(row);
      const wantedCustomer = customerWrite(prepared);
      let customer = await repository.findCustomerByExternalId(row.id);
      if (!customer && wantedCustomer.normalized_phone) {
        const phoneMatches = await repository.findCustomersByNormalizedPhone(wantedCustomer.normalized_phone);
        if (phoneMatches.length > 1 || (phoneMatches.length === 1 && phoneMatches[0].legacy_id !== row.id)) {
          report.conflicts += 1;
          throw new Error("duplicidade ambígua por telefone normalizado");
        }
        customer = phoneMatches[0] ?? null;
      }

      let customerAction: WriteAction;
      if (!customer) {
        customer = await repository.createCustomer(wantedCustomer);
        customerAction = "created";
      } else if (sameWrite(customer, wantedCustomer)) {
        customerAction = "noop";
      } else {
        customer = await repository.updateCustomer(customer.id, wantedCustomer);
        customerAction = "updated";
      }

      const vehicle: VehicleWrite = {
        customer_id: customer.id,
        brand: null,
        model: row.vehicle && row.vehicle.toLowerCase() !== "a definir" ? row.vehicle : null,
        normalized_model: row.vehicle && row.vehicle.toLowerCase() !== "a definir" ? row.vehicle.trim().toLowerCase() : null,
        plate: row.plate || null,
        masked_plate: row.plate || null,
        normalized_plate: prepared.plate.classification.startsWith("valida") ? prepared.plate.compact : null,
        is_primary: true,
        source: "legacy-json-selective",
      };
      const vehicleResult = await repository.upsertVehicle(vehicle);

      const subscription = subscriptionFor(row);
      if (!subscription) throw new Error("evidência de assinatura controlada não encontrada");
      subscription.customer_id = customer.id;
      const subscriptionResult = await repository.upsertSubscription(subscription);

      const founder = PRESERVED_FOUNDERS[prepared.name.normalized];
      const campaign: CampaignMemberWrite = {
        campaign_id: "founders-2026",
        customer_id: customer.id,
        founder_status: founder ? "confirmado" : "selecionado",
        commercial_stage: founder ? "convertido" : "aguardando_analise",
        recommendation_reason: founder ? `Founder ${founder.number} preservado` : "Vaga 004 reaberta; requer confirmação humana",
        commercial_notes: row.curation.internalNotes || row.campaign.notes || null,
        founder_number: founder?.number ?? null,
        kit_status: "não_aplicável",
        card_status: "não_aplicável",
      };
      const campaignResult = await repository.upsertCampaignMember(campaign);

      const actions = [customerAction, vehicleResult.action, subscriptionResult.action, campaignResult.action];
      const changed = actions.some((action) => action !== "noop");
      if (changed) {
        await repository.createAuditLog({
          entity_type: "customer",
          entity_id: customer.id,
          action: customerAction === "created" ? "selective_import.created" : "selective_import.reconciled",
          previous_value: null,
          new_value: { legacy_id: row.id, customer: customerAction, vehicle: vehicleResult.action, subscription: subscriptionResult.action, campaign: campaignResult.action },
          actor: "dgn-selective-import",
          reason: "apply seletivo aprovado",
        });
        await repository.createInteraction({ customer_id: customer.id, campaign_id: "founders-2026", interaction_type: "importação", channel: "server-script", description: "Registro conciliado pelo apply seletivo", metadata: { legacy_id: row.id }, actor: "dgn-selective-import" });
        report.audits += 1;
        report.interactions += 1;
      }
      report[customerAction === "created" ? "created" : customerAction === "updated" ? "updated" : "ignored"] += 1;
      report.records.push({ legacy_id: row.id, customer: customerAction, vehicle: vehicleResult.action, subscription: subscriptionResult.action, campaign: campaignResult.action });
    } catch (error) {
      report.failures.push({ legacy_id: row.id, error: error instanceof Error ? error.message : "erro desconhecido" });
      break;
    }
  }
  return report;
}

function printSummary(report: DryRunReport) {
  const line = "─".repeat(60);
  console.log("\n" + line);
  console.log("DGN CRM — dry-run report");
  console.log(line);
  console.log(`Total de registros no JSON: ${report.totalInput}`);
  console.log(`Novos (assumindo banco vazio): ${report.newRecords}`);
  console.log(`Rejeitados: ${report.rejectedRecords.length}`);
  console.log(`Duplicidades prováveis: ${report.duplicateCandidates.length}`);
  console.log(`  ↳ alta confiança:  ${report.duplicateCandidates.filter((d) => d.reviewStatus === "alta_confianca").length}`);
  console.log(`  ↳ precisa revisar: ${report.duplicateCandidates.filter((d) => d.reviewStatus === "precisa_revisar").length}`);
  console.log(`  ↳ bloqueado:       ${report.duplicateCandidates.filter((d) => d.reviewStatus === "bloqueado").length}`);
  console.log(`Founders preservados: ${report.founderPreservation.length}`);
  report.founderPreservation.forEach((f) => {
    console.log(`  ↳ Nº${f.founder_number}  legacy_id=${f.legacy_id}  status=${f.status}`);
  });
  console.log(`Founder reaberto: ${report.founderReopened.length}`);
  report.founderReopened.forEach((f) => {
    console.log(`  ↳ legacy_id=${f.legacy_id}  ex-Nº${f.previous_founder_number}  motivo="${f.reason}"`);
  });
  console.log(`Distribuição de score (${DGN_SCORE_VERSION}):`);
  console.log(`  prioridade_maxima  ${report.scoreDistribution.prioridade_maxima}`);
  console.log(`  forte_candidato    ${report.scoreDistribution.forte_candidato}`);
  console.log(`  precisa_curadoria  ${report.scoreDistribution.precisa_curadoria}`);
  console.log(`  baixa_prioridade   ${report.scoreDistribution.baixa_prioridade}`);
  console.log(`Registros com problema de qualidade: ${report.dataQualityWarnings.length}`);
  console.log(line + "\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const argSet = new Set(argv);
  const apply = argSet.has("--apply");
  const dryRun = argSet.has("--dry-run") || !apply;
  const selectionPath = readFlagValue(argv, "--select");

  const allRows = await loadLegacyJson();

  let rows = allRows;
  let selectionInfo: { total: number; selected: number; missing: string[] } | null = null;
  if (selectionPath) {
    const selectedIds = await loadSelection(selectionPath);
    const present = allRows.filter((r) => selectedIds.has(r.id));
    const foundIds = new Set(present.map((r) => r.id));
    const missing = [...selectedIds].filter((id) => !foundIds.has(id));
    rows = present;
    selectionInfo = {
      total: selectedIds.size,
      selected: present.length,
      missing,
    };
    console.log(
      `\nModo seletivo: --select ${selectionPath}\n` +
      `  IDs solicitados: ${selectedIds.size}\n` +
      `  Encontrados no legado: ${present.length}\n` +
      `  Ausentes: ${missing.length}${missing.length ? " → " + missing.slice(0, 5).join(", ") + (missing.length > 5 ? " …" : "") : ""}\n`,
    );
    if (present.length === 0) {
      console.error("Nenhum dos IDs selecionados existe no JSON legado — abortando.\n");
      process.exit(4);
    }
    if (missing.length) {
      throw new Error(`IDs inexistentes no legado: ${missing.join(", ")}`);
    }
  }

  if (dryRun) {
    const report = runDryRun(rows);
    printSummary(report);
    const outPath = resolve(dirname(fileURLToPath(import.meta.url)), "../reports");
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(outPath, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const prefix = selectionInfo ? "dry-run-selective" : "dry-run";
    const file = resolve(outPath, `${prefix}-${stamp}.json`);
    const payload = selectionInfo ? { ...report, selection: selectionInfo } : report;
    await writeFile(file, JSON.stringify(payload, null, 2), "utf8");
    console.log(`Relatório completo: ${file}\n`);
    return;
  }

  if (apply) {
    if (!selectionPath) throw new Error("--apply exige --select <arquivo>");
    const selectedIds = await loadSelection(selectionPath);
    validateApplyGate(argv, selectedIds);
    console.log(`Ambiente: REMOTO\nRegistros autorizados antes da escrita: ${rows.length}`);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
        process.loadEnvFile(resolve(projectRoot, ".env.local"));
      } catch {
        // A mensagem segura abaixo cobre ambiente ausente sem expor valores.
      }
    }
    const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
    await assertRemoteIdentity(projectRoot, process.env.NEXT_PUBLIC_SUPABASE_URL);
    const { CrmRepository } = await import("../../lib/growth/db/repositories.ts");
    const repository = new CrmRepository();
    const report = await applySelected(rows, repository);
    const outPath = resolve(dirname(fileURLToPath(import.meta.url)), "../reports");
    await mkdir(outPath, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = resolve(outPath, `apply-selective-${stamp}.json`);
    await writeFile(file, JSON.stringify(report, null, 2), "utf8");
    console.log(`Resultado: criados=${report.created} atualizados=${report.updated} ignorados=${report.ignored} conflitos=${report.conflicts} auditorias=${report.audits} falhas=${report.failures.length}`);
    console.log(`Relatório local: ${file}`);
    if (report.failures.length) throw new Error(`apply interrompido em ${report.failures[0].legacy_id}: ${report.failures[0].error}`);
    return;
  }
}

const isDirectRun = typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url.startsWith("file:") &&
  process.argv[1].replace(/\\/g, "/").endsWith("migrate-legacy-json.ts");

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
