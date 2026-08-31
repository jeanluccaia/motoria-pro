// Formatter único pt-BR — usado por qualquer superfície que exibe data ao
// operador (Perfil 360, Agent, cards). ISO original nunca vai para a UI.
//
// Convenções:
//   formatDatePtBr("2026-08-31")           → "31/08/2026"
//   formatDatePtBr("2026-08-31T09:42:00Z") → "31/08/2026"
//   formatDateTimePtBr("2026-08-31T09:42Z") → "31/08/2026 às 06:42"
//                                                 (timezone do runtime aplicado)
//
// Se a entrada não é uma data reconhecível, devolve `fallback` — nunca lança.

const DEFAULT_FALLBACK = "—";

function isYYYYMMDD(raw: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(raw);
}

function toDateSafe(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // yyyy-mm-dd "cru" — evita shift de timezone tratando como UTC-noon.
  if (isYYYYMMDD(trimmed)) {
    const [y, m, d] = trimmed.split("-").map((s) => Number.parseInt(s, 10));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const ts = Date.parse(trimmed);
  if (!Number.isFinite(ts)) return null;
  return new Date(ts);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDatePtBr(iso: string | null | undefined, fallback = DEFAULT_FALLBACK): string {
  if (!iso) return fallback;
  const date = toDateSafe(iso);
  if (!date) return fallback;
  return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

export function formatDateTimePtBr(iso: string | null | undefined, fallback = DEFAULT_FALLBACK): string {
  if (!iso) return fallback;
  const date = toDateSafe(iso);
  if (!date) return fallback;
  const base = `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
  return `${base} às ${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
}
