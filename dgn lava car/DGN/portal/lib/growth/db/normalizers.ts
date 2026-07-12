/**
 * Normalizers centralizados para telefone, placa e nome.
 * Puros, sem I/O — seguros para rodar em migração, cliente e testes.
 */

// ---------------------------------------------------------------------------
// Telefone brasileiro
// ---------------------------------------------------------------------------

export type PhoneClassification = "valido" | "invalido" | "vazio";

export interface NormalizedPhone {
  original: string;
  digits: string;              // apenas dígitos, com 55 quando aplicável
  local: string;               // sem prefixo 55 (DDD+número)
  ddd: string | null;
  classification: PhoneClassification;
  reason?: string;
}

const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
].map(String));

export function normalizePhone(raw: string | null | undefined): NormalizedPhone {
  const original = (raw ?? "").toString();
  const digits = original.replace(/\D/g, "");

  if (!digits) {
    return {
      original,
      digits: "",
      local: "",
      ddd: null,
      classification: "vazio",
    };
  }

  // Aceitar com ou sem 55, sem duplicar
  let local = digits;
  if (local.startsWith("55") && local.length >= 12) {
    local = local.slice(2);
  }

  // Depois de tirar 55, esperamos 10 (fixo) ou 11 (celular) dígitos
  if (local.length !== 10 && local.length !== 11) {
    return {
      original,
      digits,
      local,
      ddd: null,
      classification: "invalido",
      reason: `comprimento inesperado (${local.length} dígitos)`,
    };
  }

  const ddd = local.slice(0, 2);
  if (!VALID_DDDS.has(ddd)) {
    return {
      original,
      digits: `55${local}`,
      local,
      ddd,
      classification: "invalido",
      reason: `DDD ${ddd} inválido`,
    };
  }

  // Celular deve começar com 9 depois do DDD; se não, é fixo (10 dígitos)
  if (local.length === 11 && local[2] !== "9") {
    return {
      original,
      digits: `55${local}`,
      local,
      ddd,
      classification: "invalido",
      reason: `celular sem 9 após DDD`,
    };
  }

  return {
    original,
    digits: `55${local}`,
    local,
    ddd,
    classification: "valido",
  };
}

// ---------------------------------------------------------------------------
// Placa (antigo AAA-9999 e Mercosul AAA9A99)
// ---------------------------------------------------------------------------

export type PlateClassification = "valida_antiga" | "valida_mercosul" | "invalida" | "vazia";

export interface NormalizedPlate {
  original: string;
  compact: string;             // sem hífen/espaços, uppercase
  masked: string;              // AAA***9
  classification: PlateClassification;
  reason?: string;
}

const OLD_PLATE = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL_PLATE = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export function normalizePlate(raw: string | null | undefined): NormalizedPlate {
  const original = (raw ?? "").toString();
  const compact = original.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  if (!compact) {
    return { original, compact: "", masked: "Não cadastrada", classification: "vazia" };
  }

  const masked = compact.length >= 4
    ? `${compact.slice(0, 3)}***${compact.slice(-1)}`
    : compact;

  if (OLD_PLATE.test(compact)) {
    return { original, compact, masked, classification: "valida_antiga" };
  }

  if (MERCOSUL_PLATE.test(compact)) {
    return { original, compact, masked, classification: "valida_mercosul" };
  }

  return {
    original,
    compact,
    masked,
    classification: "invalida",
    reason: "não corresponde ao padrão antigo nem Mercosul",
  };
}

// ---------------------------------------------------------------------------
// Nome
// ---------------------------------------------------------------------------

export interface NormalizedName {
  original: string;
  display: string;            // trim + espaços colapsados, preservando capitalização original
  normalized: string;         // lowercase + sem acento (para comparação)
  isIncomplete: boolean;      // nome com apenas 1 token (ex.: "Paulo")
  hasArtificialPrefix: boolean;
  prefixRemoved: string | null;
}

const ARTIFICIAL_PREFIXES = ["1", "4", "Q", "D", "PC", "RDA"];

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalizeName(raw: string | null | undefined): NormalizedName {
  const original = (raw ?? "").toString();
  const display = original.replace(/\s+/g, " ").trim();

  let prefixRemoved: string | null = null;
  let hasArtificialPrefix = false;
  let workingDisplay = display;
  const firstToken = display.split(" ")[0]?.toUpperCase() ?? "";
  if (firstToken && ARTIFICIAL_PREFIXES.includes(firstToken)) {
    hasArtificialPrefix = true;
    prefixRemoved = firstToken;
    workingDisplay = display.split(" ").slice(1).join(" ").trim();
  }

  const normalized = stripDiacritics(workingDisplay).toLowerCase();
  const tokenCount = normalized ? normalized.split(" ").filter(Boolean).length : 0;
  const isIncomplete = tokenCount <= 1;

  return {
    original,
    display,
    normalized,
    isIncomplete,
    hasArtificialPrefix,
    prefixRemoved,
  };
}
