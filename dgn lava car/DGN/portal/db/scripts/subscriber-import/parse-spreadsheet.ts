/**
 * Parser puro da planilha ASSINANTES_ATIVOS_4UCAR_2026-08-16.xlsx.
 *
 * Recebe o objeto já lido por read-xlsx.mjs (sheets: [{name, rows[]}]) e
 * expõe listas tipadas para o motor de dry-run. Não faz I/O, não escreve.
 */

export interface SpreadsheetVehicleRef {
  plate: string;
  model: string | null;
  raw: string;
}

export interface SpreadsheetActiveSubscriber {
  index: number;
  name: string;
  whatsapp: string;
  planLabel: string;
  vehicles: SpreadsheetVehicleRef[];
  lastUsageBr: string | null;
  usesInPeriod: number | null;
  lastOsStatus: string | null;
  situationForCrm: string | null;
  observations: string | null;
}

export interface SpreadsheetDueEntry {
  name: string;
  whatsapp: string;
  planLabel: string;
  vehiclesRaw: string;
  dueDateBr: string | null;
  daysUntilDue: number | null;
  condition: string | null;
  controlSituation: string | null;
  whatsappAction: string | null;
  note: string | null;
}

export interface SpreadsheetConflict {
  target: string;
  plates: string;
  confirmation: string;
  actionInCrm: string;
}

export interface SpreadsheetInactive {
  name: string;
  whatsapp: string;
  plan: string;
  vehicle: string;
  lastPlanUseBr: string | null;
  daysWithoutPlanUse: number | null;
  lastGeneralServiceBr: string | null;
  status: string | null;
  classification: string | null;
  whatsappAction: string | null;
  note: string | null;
}

export interface SpreadsheetSummary {
  clientsConsolidated: number | null;
  planEssential: number | null;
  planSmart: number | null;
  planPriority: number | null;
  readyForReview: number | null;
  renewalPending: number | null;
  unresolvedConflicts: number | null;
  inactiveRecent: number | null;
}

export interface ParsedSpreadsheet {
  summary: SpreadsheetSummary;
  active: SpreadsheetActiveSubscriber[];
  dues: SpreadsheetDueEntry[];
  conflicts: SpreadsheetConflict[];
  inactive: SpreadsheetInactive[];
}

interface RawWorkbook {
  file?: string;
  sheets: Array<{ name: string; rows: Array<Record<string, unknown>> }>;
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function splitVehicles(raw: string): SpreadsheetVehicleRef[] {
  const s = toStr(raw);
  if (!s) return [];
  return s.split("|").map((chunk) => {
    const trimmed = chunk.trim();
    const dash = trimmed.indexOf("—");
    if (dash === -1) {
      return { plate: trimmed, model: null, raw: trimmed };
    }
    const plate = trimmed.slice(0, dash).trim();
    const model = trimmed.slice(dash + 1).trim() || null;
    return { plate, model, raw: trimmed };
  });
}

function findSheet(wb: RawWorkbook, name: string) {
  return wb.sheets.find((s) => s.name === name);
}

function parseSummary(wb: RawWorkbook): SpreadsheetSummary {
  const summary: SpreadsheetSummary = {
    clientsConsolidated: null,
    planEssential: null,
    planSmart: null,
    planPriority: null,
    readyForReview: null,
    renewalPending: null,
    unresolvedConflicts: null,
    inactiveRecent: null,
  };
  const sheet = findSheet(wb, "Resumo");
  if (!sheet) return summary;
  for (const row of sheet.rows) {
    const left = toStr(row["DGN Club — Assinantes com uso recente na 4uCar"]);
    const qtyLeft = toNum(row["__EMPTY"]);
    const right = toStr(row["__EMPTY_2"]);
    const qtyRight = toNum(row["__EMPTY_3"]);
    if (left === "Clientes consolidados") summary.clientsConsolidated = qtyLeft;
    else if (left === "DGN Essential") summary.planEssential = qtyLeft;
    else if (left === "DGN Smart") summary.planSmart = qtyLeft;
    else if (left === "DGN Priority") summary.planPriority = qtyLeft;
    else if (left === "Inativos recentes") summary.inactiveRecent = qtyLeft;
    if (right === "Prontos para revisão") summary.readyForReview = qtyRight;
    else if (right === "Renovação pendente") summary.renewalPending = qtyRight;
    else if (right === "Conflitos não resolvidos") summary.unresolvedConflicts = qtyRight;
  }
  return summary;
}

function parseActive(wb: RawWorkbook): SpreadsheetActiveSubscriber[] {
  const sheet = findSheet(wb, "Assinantes ativos");
  if (!sheet) return [];
  const out: SpreadsheetActiveSubscriber[] = [];
  sheet.rows.forEach((row, i) => {
    const name = toStr(row["Nome"]);
    const whatsapp = toStr(row["WhatsApp"]);
    if (!name && !whatsapp) return;
    out.push({
      index: i,
      name,
      whatsapp,
      planLabel: toStr(row["Plano normalizado"]),
      vehicles: splitVehicles(toStr(row["Veículos"])),
      lastUsageBr: toStr(row["Última utilização"]) || null,
      usesInPeriod: toNum(row["Usos no período"]),
      lastOsStatus: toStr(row["Status da OS mais recente"]) || null,
      situationForCrm: toStr(row["Situação para CRM/App"]) || null,
      observations: toStr(row["Observações"]) || null,
    });
  });
  return out;
}

function parseDues(wb: RawWorkbook): SpreadsheetDueEntry[] {
  const sheet = findSheet(wb, "Datas de vencimento");
  if (!sheet) return [];
  const out: SpreadsheetDueEntry[] = [];
  for (const row of sheet.rows) {
    const name = toStr(row["DGN Club — Controle de vencimentos das assinaturas"]);
    const whatsapp = toStr(row["__EMPTY"]);
    // Skip header/subheader/notes rows: must have a phone-like value in __EMPTY.
    if (!/^\d{10,13}$/.test(whatsapp)) continue;
    out.push({
      name,
      whatsapp,
      planLabel: toStr(row["__EMPTY_1"]),
      vehiclesRaw: toStr(row["__EMPTY_2"]),
      dueDateBr: toStr(row["__EMPTY_3"]) || null,
      daysUntilDue: toNum(row["__EMPTY_4"]),
      condition: toStr(row["__EMPTY_5"]) || null,
      controlSituation: toStr(row["__EMPTY_6"]) || null,
      whatsappAction: toStr(row["__EMPTY_7"]) || null,
      note: toStr(row["__EMPTY_8"]) || null,
    });
  }
  return out;
}

function parseConflicts(wb: RawWorkbook): SpreadsheetConflict[] {
  const sheet = findSheet(wb, "Conflitos cadastrais");
  if (!sheet) return [];
  const out: SpreadsheetConflict[] = [];
  for (const row of sheet.rows) {
    const target = toStr(row["Cliente/cadastro"]);
    if (!target) continue;
    out.push({
      target,
      plates: toStr(row["Placa(s)"]),
      confirmation: toStr(row["Atualização confirmada"]),
      actionInCrm: toStr(row["Ação no CRM/App"]),
    });
  }
  return out;
}

function parseInactive(wb: RawWorkbook): SpreadsheetInactive[] {
  const sheet = findSheet(wb, "Inativos recentes");
  if (!sheet) return [];
  const out: SpreadsheetInactive[] = [];
  for (const row of sheet.rows) {
    const name = toStr(row["DGN Club — Oportunidades de reativação em 180 dias"]);
    const whatsapp = toStr(row["__EMPTY"]);
    if (!/^\d{10,13}$/.test(whatsapp)) continue;
    out.push({
      name,
      whatsapp,
      plan: toStr(row["__EMPTY_1"]),
      vehicle: toStr(row["__EMPTY_2"]),
      lastPlanUseBr: toStr(row["__EMPTY_3"]) || null,
      daysWithoutPlanUse: toNum(row["__EMPTY_4"]),
      lastGeneralServiceBr: toStr(row["__EMPTY_5"]) || null,
      status: toStr(row["__EMPTY_6"]) || null,
      classification: toStr(row["__EMPTY_7"]) || null,
      whatsappAction: toStr(row["__EMPTY_8"]) || null,
      note: toStr(row["__EMPTY_9"]) || null,
    });
  }
  return out;
}

export function parseWorkbook(wb: RawWorkbook): ParsedSpreadsheet {
  return {
    summary: parseSummary(wb),
    active: parseActive(wb),
    dues: parseDues(wb),
    conflicts: parseConflicts(wb),
    inactive: parseInactive(wb),
  };
}
