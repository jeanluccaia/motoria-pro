import { readFileSync } from "node:fs";
import { extname } from "node:path";
import type { PagBankImportFile, PagBankSubscriptionInput } from "./types.ts";

// -----------------------------------------------------------------------------
// Parser do arquivo local do PagBank.
//
// Aceita JSON (formato canônico) ou CSV simples com cabeçalho. O parser é
// tolerante a colunas extras — só falha se faltar campo obrigatório.
//
// NUNCA loga o conteúdo bruto do arquivo — só metadados (nome, N linhas).
// -----------------------------------------------------------------------------

const REQUIRED_COLUMNS = [
  "provider_subscription_id",
  "customer_name",
  "plan",
  "cycle",
  "amount_monthly",
  "status",
  "payment_method",
  "payment_status",
  "payment_evidence_source",
  "migration_status",
] as const;

const VALID_PLANS = new Set(["Essential", "Smart", "Priority"]);
const VALID_CYCLES = new Set(["mensal", "semestral", "anual", "outro"]);
const VALID_STATUS = new Set(["ACTIVE", "PENDING", "CANCELLED", "ENDED"]);
const VALID_PAYMENT_METHOD = new Set(["CARD_RECURRING", "MANUAL", "UNKNOWN"]);
const VALID_PAYMENT_STATUS = new Set([
  "CONFIRMED",
  "PENDING",
  "FAILED",
  "REFUNDED",
  "UNKNOWN",
]);
const VALID_PAYMENT_EVIDENCE_SOURCE = new Set([
  "PROVIDER",
  "MANUAL",
  "LEGACY",
  "UNKNOWN",
]);
const VALID_MIGRATION_STATUS = new Set(["NOT_NEEDED", "PENDING", "COMPLETE"]);

export function loadPagBankFile(path: string): PagBankImportFile {
  const ext = extname(path).toLowerCase();
  const raw = readFileSync(path, "utf8");
  if (ext === ".json") return parseJson(raw, path);
  if (ext === ".csv") return parseCsv(raw, path);
  throw new Error(`Extensão não suportada (${ext}). Use .json ou .csv.`);
}

function parseJson(raw: string, path: string): PagBankImportFile {
  const parsed = JSON.parse(raw) as Partial<PagBankImportFile>;
  if (!parsed.meta || !Array.isArray(parsed.subscriptions)) {
    throw new Error(`Arquivo ${path} inválido: faltam meta ou subscriptions.`);
  }
  for (const [i, row] of parsed.subscriptions.entries()) {
    validateRow(row as PagBankSubscriptionInput, i + 1, path);
  }
  return parsed as PagBankImportFile;
}

function parseCsv(raw: string, path: string): PagBankImportFile {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error(`CSV ${path} vazio ou sem linhas de dados.`);
  const header = splitCsvLine(lines[0]!).map((h) => h.trim());
  for (const col of REQUIRED_COLUMNS) {
    if (!header.includes(col)) {
      throw new Error(`CSV ${path}: coluna obrigatória "${col}" ausente.`);
    }
  }
  const subscriptions: PagBankSubscriptionInput[] = [];
  for (let li = 1; li < lines.length; li += 1) {
    const cells = splitCsvLine(lines[li]!);
    const row: Record<string, unknown> = {};
    for (const [ci, name] of header.entries()) {
      row[name] = cells[ci] ?? null;
    }
    row.amount_monthly = Number(row.amount_monthly);
    validateRow(row as unknown as PagBankSubscriptionInput, li + 1, path);
    subscriptions.push(row as unknown as PagBankSubscriptionInput);
  }
  return {
    meta: {
      generated_at: new Date().toISOString(),
      source: `CSV ${path}`,
    },
    subscriptions,
  };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => (s === "" ? "" : s.trim()));
}

function validateRow(row: PagBankSubscriptionInput, lineNo: number, path: string): void {
  for (const col of REQUIRED_COLUMNS) {
    const v = (row as unknown as Record<string, unknown>)[col];
    if (v === undefined || v === null || v === "") {
      throw new Error(`${path}:linha ${lineNo}: campo obrigatório "${col}" vazio.`);
    }
  }
  if (!VALID_PLANS.has(row.plan)) {
    throw new Error(`${path}:linha ${lineNo}: plan "${row.plan}" inválido. Aceito: ${[...VALID_PLANS].join(", ")}.`);
  }
  if (!VALID_CYCLES.has(row.cycle)) {
    throw new Error(`${path}:linha ${lineNo}: cycle "${row.cycle}" inválido.`);
  }
  if (!VALID_STATUS.has(row.status)) {
    throw new Error(`${path}:linha ${lineNo}: status "${row.status}" inválido.`);
  }
  if (!VALID_PAYMENT_METHOD.has(row.payment_method)) {
    throw new Error(`${path}:linha ${lineNo}: payment_method "${row.payment_method}" inválido.`);
  }
  if (!VALID_PAYMENT_STATUS.has(row.payment_status)) {
    throw new Error(`${path}:linha ${lineNo}: payment_status "${row.payment_status}" inválido.`);
  }
  if (!VALID_PAYMENT_EVIDENCE_SOURCE.has(row.payment_evidence_source)) {
    throw new Error(
      `${path}:linha ${lineNo}: payment_evidence_source "${row.payment_evidence_source}" inválido.`,
    );
  }
  if (!VALID_MIGRATION_STATUS.has(row.migration_status)) {
    throw new Error(`${path}:linha ${lineNo}: migration_status "${row.migration_status}" inválido.`);
  }
  if (!Number.isFinite(row.amount_monthly) || row.amount_monthly <= 0) {
    throw new Error(`${path}:linha ${lineNo}: amount_monthly "${row.amount_monthly}" inválido.`);
  }
}
