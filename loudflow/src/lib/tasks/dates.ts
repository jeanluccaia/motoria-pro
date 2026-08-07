// Utilitários de data em America/Sao_Paulo para as tarefas.
// Regra: horários são armazenados em UTC (timestamptz) e sempre EXIBIDOS em
// pt-BR/São Paulo. O bucket "hoje/atrasada/próxima" também é calculado no
// fuso local — não no UTC — para não empurrar tarefas do dia atual para
// depois da meia-noite BRT.

export const APP_TZ = "America/Sao_Paulo";

const dateOnlyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toLocalYmd(d: Date): string {
  // en-CA emite YYYY-MM-DD, o que facilita comparação lexicográfica.
  return dateOnlyFmt.format(d);
}

export function todayYmdInAppTz(now: Date = new Date()): string {
  return toLocalYmd(now);
}

export type DueBucket = "overdue" | "today" | "upcoming" | "none";

export function bucketFor(dueAtIso: string | null, now: Date = new Date()): DueBucket {
  if (!dueAtIso) return "none";
  const due = new Date(dueAtIso);
  const today = toLocalYmd(now);
  const dueDay = toLocalYmd(due);
  if (dueDay === today) return "today";
  if (dueDay < today) return "overdue";
  return "upcoming";
}

const fullFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatTodayLong(now: Date = new Date()): string {
  const s = fullFmt.format(now);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const dueFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TZ,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDueAt(dueAtIso: string | null): string {
  if (!dueAtIso) return "sem prazo";
  return dueFmt.format(new Date(dueAtIso));
}

// Converte um <input type="datetime-local"> (que vem sem timezone) em ISO UTC,
// interpretando o horário como se fosse America/Sao_Paulo. Isso evita que o
// prazo escolhido pela pessoa vire "3 horas antes" no banco.
export function localInputToUtcIso(local: string): string | null {
  if (!local) return null;
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  // Interpreta como São Paulo: BRT (UTC-3) sem horário de verão desde 2019.
  // Estratégia robusta: montar como UTC e ajustar pelo offset observado do fuso.
  const utcGuess = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0,
  );
  const offsetMinutes = tzOffsetMinutes(new Date(utcGuess), APP_TZ);
  return new Date(utcGuess - offsetMinutes * 60_000).toISOString();
}

// Formato usado por <input type="datetime-local"> para o valor default de edição.
export function utcIsoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function tzOffsetMinutes(instant: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(instant);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === "24" ? "00" : map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return (asUtc - instant.getTime()) / 60_000;
}
