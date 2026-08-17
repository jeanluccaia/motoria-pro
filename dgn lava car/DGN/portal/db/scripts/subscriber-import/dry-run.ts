/**
 * dry-run.ts — orquestrador de I/O do dry-run da ETAPA 7.
 *
 * READ-ONLY. Nunca escreve no Supabase.
 *
 * Uso:
 *   node --env-file=.env.local db/scripts/subscriber-import/dry-run.ts \
 *     --xlsx "<caminho para ASSINANTES_ATIVOS_4UCAR_2026-08-16.xlsx>" \
 *     --backup "<caminho do diretório do backup>" \
 *     [--out db/reports]
 *
 * Ou passando o snapshot já materializado (fluxo típico):
 *   1) node db/scripts/subscriber-import/read-xlsx.mjs "<xlsx>" > .tmp-xlsx.json
 *   2) node db/scripts/subscriber-import/backup.mjs "<out_dir>"
 *   3) node db/scripts/subscriber-import/dry-run.ts \
 *        --xlsx-json .tmp-xlsx.json --backup <out_dir>
 */
import fs from "node:fs";
import path from "node:path";

import { parseWorkbook } from "./parse-spreadsheet.ts";
import type { ParsedSpreadsheet } from "./parse-spreadsheet.ts";
import {
  classifyInactive,
  classifySubscriber,
  indexDuesByPhone,
  type CampaignMemberRow,
  type CrmSnapshot,
  type CustomerRow,
  type DryRunEntry,
  type DryRunInactiveEntry,
  type SubscriptionRow,
  type VehicleRow,
} from "./dry-run-core.ts";

// ---------- CLI parsing ----------
function arg(name: string): string | null {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const XLSX_PATH = arg("xlsx");
const XLSX_JSON = arg("xlsx-json");
const BACKUP_DIR = arg("backup");
const OUT_DIR = arg("out") ?? "db/reports";
const REDACT = arg("redact") !== "false"; // default: true

if ((!XLSX_PATH && !XLSX_JSON) || !BACKUP_DIR) {
  console.error("uso: dry-run.ts (--xlsx <path> | --xlsx-json <path>) --backup <dir> [--out <dir>]");
  process.exit(2);
}

// ---------- Load workbook ----------
function loadWorkbook(): ParsedSpreadsheet {
  if (XLSX_JSON) {
    const raw = JSON.parse(fs.readFileSync(XLSX_JSON, "utf8"));
    return parseWorkbook(raw);
  }
  // Fallback: chamar read-xlsx.mjs em processo separado seria I/O extra.
  // Aqui exigimos xlsx-json pré-materializado para manter o dry-run puro.
  console.error("--xlsx: gere primeiro o JSON via read-xlsx.mjs e passe --xlsx-json");
  process.exit(2);
}

// ---------- Load backup ----------
function loadBackup(): CrmSnapshot {
  const load = <T>(file: string): T[] => {
    const p = path.join(BACKUP_DIR!, file);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf8")) as T[];
  };
  return {
    customers: load<CustomerRow>("crm_customers.json"),
    vehicles: load<VehicleRow>("crm_vehicles.json"),
    subscriptions: load<SubscriptionRow>("crm_subscriptions.json"),
    campaignMembers: load<CampaignMemberRow>("crm_campaign_members.json"),
  };
}

// ---------- Redaction for MD (não para JSON técnico) ----------
function redactPhone(phone: string | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `${digits.slice(0, 4)}****${digits.slice(-2)}`;
}

// ---------- Report generators ----------
const PRIMARY_BATCH_NAMES = new Set([
  "Rikardo Oliveira",
  "Benedito Constantino",
  "José Moreira",
  "Wellington Felix",
]);

const RENEWAL_PENDING_NAMES = new Set(["William Farias", "Paulo Daniel", "Nina de Melo"]);

interface Report {
  meta: {
    generatedAt: string;
    xlsxPath: string;
    backupDir: string;
    supabaseProject: string;
  };
  spreadsheetSummary: ParsedSpreadsheet["summary"];
  totals: {
    input: number;
    CREATE: number;
    UPDATE: number;
    MERGE: number;
    CONFLICT: number;
    NO_OP: number;
    IGNORE: number;
  };
  entries: DryRunEntry[];
  primaryBatch: DryRunEntry[];
  renewalPending: DryRunEntry[];
  inactive: DryRunInactiveEntry[];
  cadastralNotes: string[];
}

function buildReport(sheet: ParsedSpreadsheet, snap: CrmSnapshot): Report {
  const duesIdx = indexDuesByPhone(sheet.dues);
  const entries = sheet.active.map((r) => classifySubscriber(r, snap, { dueByPhoneDigits: duesIdx }));
  const totals = {
    input: entries.length,
    CREATE: entries.filter((e) => e.action === "CREATE").length,
    UPDATE: entries.filter((e) => e.action === "UPDATE").length,
    MERGE: entries.filter((e) => e.action === "MERGE").length,
    CONFLICT: entries.filter((e) => e.action === "CONFLICT").length,
    NO_OP: entries.filter((e) => e.action === "NO_OP").length,
    IGNORE: entries.filter((e) => e.action === "IGNORE").length,
  };
  const primaryBatch = entries.filter((e) => PRIMARY_BATCH_NAMES.has(e.spreadsheetName));
  const renewalPending = entries.filter((e) => RENEWAL_PENDING_NAMES.has(e.spreadsheetName));
  const inactive = sheet.inactive.map((i) => classifyInactive(i, snap));

  const cadastralNotes: string[] = [];
  // Correções cadastrais obrigatórias — apenas notas informativas; nada é aplicado.
  cadastralNotes.push(
    "Guilherme Lopes: uma única ficha com dois veículos TKO5G04 e TJX2D23; OS pendente é registro operacional e não bloqueia vínculo.",
    "Nina de Melo: manter Nina como titular; Medley é referência profissional (não criar cliente Medley).",
    "Suely Maria: nome oficial é Suely Maria; Genebra é bairro, não pessoa (não criar cliente Genebra).",
    "Ronaldo Faria: titular do veículo TCZ6A61; Thais Lambert é gestora de frotas Trouw (referência operacional).",
    "Lumini III Gustavo Plensack: conciliar como Gustavo Plensack; preservar Lumini III como referência empresarial.",
  );

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      xlsxPath: XLSX_JSON ?? XLSX_PATH!,
      backupDir: BACKUP_DIR!,
      supabaseProject: "wzjjdlzgxkvfynmpsczf",
    },
    spreadsheetSummary: sheet.summary,
    totals,
    entries,
    primaryBatch,
    renewalPending,
    inactive,
    cadastralNotes,
  };
}

function markdown(report: Report): string {
  const L: string[] = [];
  L.push(`# Dry-run — assinantes reais DGN Club (ETAPA 7)`);
  L.push("");
  L.push(`> Gerado em ${report.meta.generatedAt}`);
  L.push(`> Fonte planilha: ${report.meta.xlsxPath}`);
  L.push(`> Snapshot Supabase: backup local em ${report.meta.backupDir}`);
  L.push(`> Projeto Supabase: ${report.meta.supabaseProject}`);
  L.push("");
  L.push(`**Modo:** read-only. Nada foi gravado.`);
  L.push("");

  L.push(`## Resumo esperado × observado (planilha)`);
  const s = report.spreadsheetSummary;
  L.push(`- Clientes consolidados: ${s.clientsConsolidated}`);
  L.push(`- DGN Essential: ${s.planEssential}`);
  L.push(`- DGN Smart: ${s.planSmart}`);
  L.push(`- DGN Priority: ${s.planPriority}`);
  L.push(`- Prontos para revisão: ${s.readyForReview}`);
  L.push(`- Renovação pendente: ${s.renewalPending}`);
  L.push(`- Conflitos não resolvidos: ${s.unresolvedConflicts}`);
  L.push(`- Inativos recentes: ${s.inactiveRecent}`);
  L.push("");

  L.push(`## Totais do dry-run`);
  const t = report.totals;
  L.push(`| Ação | Qtde |`);
  L.push(`| --- | --- |`);
  L.push(`| CREATE | ${t.CREATE} |`);
  L.push(`| UPDATE | ${t.UPDATE} |`);
  L.push(`| MERGE | ${t.MERGE} |`);
  L.push(`| CONFLICT | ${t.CONFLICT} |`);
  L.push(`| NO_OP | ${t.NO_OP} |`);
  L.push(`| IGNORE | ${t.IGNORE} |`);
  L.push(`| **Total planilha** | **${t.input}** |`);
  L.push("");

  L.push(`## Correções cadastrais obrigatórias — notas`);
  for (const n of report.cadastralNotes) L.push(`- ${n}`);
  L.push("");

  L.push(`## Alterações propostas por cliente`);
  for (const e of report.entries) {
    L.push(`### ${e.spreadsheetName}`);
    L.push(`- Telefone (mascarado): ${REDACT ? redactPhone(e.normalizedPhone) : e.normalizedPhone}`);
    L.push(`- Ação sugerida: **${e.action}** (confiança ${e.confidence.toFixed(2)})`);
    L.push(`- Cliente CRM: ${e.matchedCustomerName ?? "—"} ${e.matchedCustomerLegacyId ? `(legacy_id=${e.matchedCustomerLegacyId})` : ""}`);
    L.push(`- Plano planilha: ${e.planFromSheet ?? "—"} · CRM: ${e.planCurrent ?? "—"}`);
    L.push(`- Veículos planilha: ${e.plates.join(", ") || "—"}`);
    L.push(`- Veículos CRM: ${e.vehiclesCurrent.map((v) => v.plate).join(", ") || "—"}`);
    L.push(`- Vencimento informado: ${e.dueDateFromSheet ?? "—"} · condição: ${e.dueConditionFromSheet ?? "—"}`);
    L.push(`- Classificação de pagamento: ${e.paymentClassification}`);
    if (e.cycleHintFromObservation) L.push(`- Cycle hint: ${e.cycleHintFromObservation} (não converter automaticamente)`);
    if (e.isRenewalPending) L.push(`- ⚠️ Renovação pendente — não liberar novo ciclo/saldo`);
    if (e.founderPreserved) {
      L.push(`- 🛡️ Founder preservado: status=${e.founderPreserved.founder_status} number=${e.founderPreserved.founder_number ?? "null"}`);
    }
    if (e.diffs.length > 0) {
      L.push(`- Diffs propostos:`);
      for (const d of e.diffs) {
        L.push(`  - ${d.field}: **${JSON.stringify(d.before)}** → **${JSON.stringify(d.after)}** — ${d.reason}`);
      }
    }
    if (e.conflicts.length > 0) {
      L.push(`- Conflitos:`);
      for (const c of e.conflicts) L.push(`  - ${c}`);
    }
    L.push(`- Sugestão: ${e.suggestedAction || "—"}`);
    L.push("");
  }

  L.push(`## Renovação pendente (William, Paulo, Nina)`);
  for (const e of report.renewalPending) {
    L.push(`- ${e.spreadsheetName}: vencimento=${e.dueDateFromSheet ?? "—"}, ação=${e.action}, sugestão=${e.suggestedAction}`);
  }
  L.push("");

  L.push(`## Primeiro lote controlado (Rikardo, Benedito, José, Wellington Felix)`);
  for (const e of report.primaryBatch) {
    L.push(`- ${e.spreadsheetName}: ação=${e.action}, cliente=${e.matchedCustomerName ?? "novo"}, founder=${e.founderPreserved?.founder_number ?? "—"}`);
    L.push(`  - Sugestão: ${e.suggestedAction || "sem alteração"}`);
  }
  L.push("");

  L.push(`## Inativos recentes (fila separada — nunca importados como ativos)`);
  for (const i of report.inactive) {
    L.push(`- ${i.spreadsheetName} (${i.plate}): classificação="${i.classification}" → ação=${i.action}`);
  }
  L.push("");

  L.push(`## Dependências ainda manuais`);
  L.push(`- **4uCar:** próximo atendimento, vigência real de plano, saldo consumido não vêm da planilha.`);
  L.push(`- **Provedor financeiro:** Pix/Cartão/Recorrência da planilha não substituem confirmação de pagamento.`);
  L.push(`- **Portal do Assinante:** ainda sem autenticação; sem RLS por usuário; nenhum login criado.`);
  L.push(`- **CRM:** os \`crm_subscriptions\` importados devem ir para status \`detectado\` ou \`pendente_validacao\` — nunca \`ativo\` automático.`);
  L.push("");

  L.push(`## Confirmação de leitura-só`);
  L.push(`- Nenhum INSERT/UPDATE/DELETE/MERGE/UPSERT foi executado no Supabase.`);
  L.push(`- Backup timestamped criado em ${report.meta.backupDir}.`);
  L.push(`- Founder 001 (Benedito), 002 (José), 003 (Rikardo) e Iara Nº004 aberta permanecem intactos.`);
  return L.join("\n");
}

// ---------- Run ----------
const sheet = loadWorkbook();
const snap = loadBackup();
const report = buildReport(sheet, snap);

fs.mkdirSync(OUT_DIR, { recursive: true });
const jsonPath = path.join(OUT_DIR, "subscriber-import-dry-run.json");
const mdPath = path.join(OUT_DIR, "subscriber-import-dry-run.md");
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
fs.writeFileSync(mdPath, markdown(report));

process.stderr.write(`[dry-run] entries=${report.totals.input} → ${JSON.stringify(report.totals)}\n`);
process.stderr.write(`[dry-run] JSON: ${jsonPath}\n`);
process.stderr.write(`[dry-run] MD:   ${mdPath}\n`);
