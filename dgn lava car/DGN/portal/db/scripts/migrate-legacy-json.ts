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

import { readFile } from "node:fs/promises";
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

// ---------------------------------------------------------------------------
// Tipos do JSON legado
// ---------------------------------------------------------------------------

interface LegacyCustomer {
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

const PRESERVED_FOUNDERS: Record<string, { number: string; legacyIdHint?: string }> = {
  "benedito constantino": { number: "001" },
  "jose moreira":          { number: "002" },
  "rikardo oliveira":      { number: "003", legacyIdHint: "rikardo-oliveira" },
};

// Iara aparece no JSON legado com founderNumber 004. Não promover.
const REOPEN_FOUNDER_LEGACY = new Set<string>(["iara"]); // legacy_id que devem ter Nº004 reaberto

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

function runDryRun(rows: LegacyCustomer[]): DryRunReport {
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
async function loadSelection(selectionPath: string): Promise<Set<string>> {
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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("\nERRO: --apply requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.");
      console.error("Configure as variáveis (Vercel / .env.local) antes de rodar a migração real.\n");
      process.exit(2);
    }
    console.error(
      "\n--apply ainda não implementado neste script.\n" +
      "Decisão comercial vigente (retomada 2026-07-15): não migrar os 2354\n" +
      "registros em massa. A 4uCar continua sendo a base operacional; o\n" +
      "Supabase deve receber apenas registros selecionados manualmente\n" +
      "(assinantes confirmados, Founders 001/002/003, candidatos aprovados,\n" +
      "lista de espera).\n\n" +
      "Próximo passo antes de implementar --apply:\n" +
      "  1) montar um arquivo db/scripts/selection-<data>.json com os\n" +
      "     legacy_ids que devem ir para o Supabase.\n" +
      "  2) rodar `node db/scripts/migrate-legacy-json.ts --dry-run --select <arquivo>`\n" +
      "     e conferir o relatório em db/reports/.\n" +
      "  3) só então habilitar apply (ainda por implementar) para essa lista.\n\n" +
      "Ver DGN/portal/db/reports/supabase-auth-resume-*.md para contexto.\n",
    );
    process.exit(3);
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
