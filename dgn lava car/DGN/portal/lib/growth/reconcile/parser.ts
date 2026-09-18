/**
 * Parser tolerante para texto colado pelo operador (CSV / TSV / pipe-separated).
 *
 * Regras:
 *   - primeira linha não vazia é cabeçalho;
 *   - separador auto-detectado (vírgula / tab / ponto-e-vírgula / pipe);
 *   - campos ausentes ficam undefined — nunca inventar;
 *   - aliases comuns de cabeçalho são normalizados (`nome` -> name, etc.);
 *   - linhas totalmente vazias são ignoradas.
 */

import type { ReconcileInputRow } from "./types.ts";

const HEADER_ALIASES: Record<string, keyof ReconcileInputRow> = {
  nome: "name", name: "name", cliente: "name",
  telefone: "phone", phone: "phone", celular: "phone", whatsapp: "phone",
  placa: "plate", plate: "plate",
  plano: "plan", plan: "plan",
  status: "status", situacao: "status", "situação": "status",
  modalidade: "cycle", cycle: "cycle", ciclo: "cycle",
  paid_until: "paid_until", "vigente até": "paid_until", vigencia: "paid_until",
  "vigência": "paid_until", "validade": "paid_until",
  payment_method: "payment_method", pagamento: "payment_method",
  "forma_pagamento": "payment_method", "forma de pagamento": "payment_method",
  notes: "notes", observacoes: "notes", "observações": "notes", obs: "notes",
  source: "source", origem: "source", fonte: "source",
};

function detectSeparator(headerLine: string): string {
  const candidates = ["\t", ";", "|", ","];
  let best = ",";
  let bestCount = -1;
  for (const sep of candidates) {
    const count = headerLine.split(sep).length;
    if (count > bestCount) {
      best = sep;
      bestCount = count;
    }
  }
  return best;
}

/** Split que respeita aspas duplas comuns em CSVs colados de planilha. */
function splitLine(line: string, sep: string): string[] {
  if (sep === "\t" || sep === "|" || sep === ";") {
    return line.split(sep).map((cell) => cell.trim());
  }
  // vírgula: tratar aspas
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(raw: string): keyof ReconcileInputRow | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  return HEADER_ALIASES[key] ?? null;
}

export interface ParseResult {
  headers: Array<keyof ReconcileInputRow | null>;
  rows: ReconcileInputRow[];
  /** Cabeçalhos que o parser não reconheceu (aparecem para o operador). */
  unknownHeaders: string[];
  /** Linhas totalmente vazias ignoradas. */
  emptyRowsIgnored: number;
}

export function parseReconcileInput(text: string): ParseResult {
  const cleanedLines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/﻿/g, "")) // strip BOM
    .filter((l, idx) => idx === 0 || l.trim().length > 0 || l.trim().length === 0);

  // Encontrar primeira linha não vazia = header
  const firstNonEmpty = cleanedLines.findIndex((l) => l.trim().length > 0);
  if (firstNonEmpty < 0) {
    return { headers: [], rows: [], unknownHeaders: [], emptyRowsIgnored: 0 };
  }

  const headerLine = cleanedLines[firstNonEmpty]!;
  const sep = detectSeparator(headerLine);
  const rawHeaders = splitLine(headerLine, sep);
  const headers = rawHeaders.map(normalizeHeader);
  const unknownHeaders = rawHeaders.filter((h, i) => h && !headers[i]).map((h) => h.trim());

  const rows: ReconcileInputRow[] = [];
  let empties = 0;

  for (let i = firstNonEmpty + 1; i < cleanedLines.length; i++) {
    const line = cleanedLines[i]!;
    if (!line.trim()) {
      empties += 1;
      continue;
    }
    const cells = splitLine(line, sep);
    const row: ReconcileInputRow = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      const value = (cells[c] ?? "").trim();
      if (!value) continue;
      row[key] = value;
    }
    if (Object.keys(row).length === 0) {
      empties += 1;
      continue;
    }
    rows.push(row);
  }

  return { headers, rows, unknownHeaders, emptyRowsIgnored: empties };
}
