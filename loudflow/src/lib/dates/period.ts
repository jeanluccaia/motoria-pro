// Datas em `America/Sao_Paulo` — usadas pelo painel de resultados.
// A UTMify entrega dados sempre por dia "fechado" no fuso do dashboard
// (GMT-3, sem horário de verão desde 2019). O painel precisa combinar
// fronteiras corretas mesmo se o servidor rodar em UTC.

export const APP_TZ = "America/Sao_Paulo";

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Data ISO (YYYY-MM-DD) do "hoje" em São Paulo.
export function todayYmd(now: Date = new Date()): string {
  return ymdFmt.format(now);
}

// Data ISO (YYYY-MM-DD) do dia anterior em São Paulo.
export function yesterdayYmd(now: Date = new Date()): string {
  const nowMinus1d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return ymdFmt.format(nowMinus1d);
}

// Adiciona/subtrai dias mantendo a semântica de "data local em SP".
// Só usamos matemática de dias inteiros, então o resultado é estável.
export function addDaysYmd(dateYmd: string, days: number): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const next = new Date(utc + days * 24 * 60 * 60 * 1000);
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Lista de datas (YYYY-MM-DD), inclusive, em ordem crescente.
export function rangeDays(fromYmd: string, toYmd: string): string[] {
  if (toYmd < fromYmd) return [];
  const out: string[] = [];
  let cursor = fromYmd;
  while (cursor <= toYmd) {
    out.push(cursor);
    cursor = addDaysYmd(cursor, 1);
  }
  return out;
}

// Presets do painel — todos usam "ontem" como fronteira final (dados
// fechados) para não misturar dia corrente ainda em movimento.
export type PeriodPreset = "yesterday" | "last7" | "last30" | "custom";

export function presetRange(preset: PeriodPreset, now: Date = new Date()):
  | { fromYmd: string; toYmd: string }
  | null {
  const yday = yesterdayYmd(now);
  switch (preset) {
    case "yesterday":
      return { fromYmd: yday, toYmd: yday };
    case "last7":
      return { fromYmd: addDaysYmd(yday, -6), toYmd: yday };
    case "last30":
      return { fromYmd: addDaysYmd(yday, -29), toYmd: yday };
    case "custom":
      return null;
  }
}

// GMT-3 é fixo desde 2019 — não usamos DST. Convertemos "YYYY-MM-DD" em um
// intervalo ISO com offset explícito, aceito pela API da UTMify.
export function toSaoPauloDayRange(dateYmd: string): { fromIso: string; toIso: string } {
  return {
    fromIso: `${dateYmd}T00:00:00-03:00`,
    toIso: `${dateYmd}T23:59:59-03:00`,
  };
}

const longFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDateBr(dateYmd: string): string {
  // Interpretamos como meio-dia UTC só para escolher o ponto neutro do dia;
  // como o formatter usa o fuso de SP, o dia formatado bate.
  const [y, m, d] = dateYmd.split("-").map(Number);
  return longFmt.format(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
}

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTimeBr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return dateTimeFmt.format(d);
}
