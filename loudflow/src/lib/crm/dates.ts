// Helpers de data específicos do CRM. Reaproveitamos o fuso canônico de
// America/Sao_Paulo definido em lib/tasks/dates para manter uma única
// convenção de timezone em todo o app.

import { APP_TZ } from "@/lib/tasks/dates";

export type NextContactBucket = "overdue" | "today" | "upcoming" | "none";

const dateOnlyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toLocalYmd(d: Date): string {
  return dateOnlyFmt.format(d);
}

export function nextContactBucket(iso: string | null, now: Date = new Date()): NextContactBucket {
  if (!iso) return "none";
  const target = new Date(iso);
  const today = toLocalYmd(now);
  const day = toLocalYmd(target);
  if (day === today) return "today";
  if (day < today) return "overdue";
  return "upcoming";
}

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return dateTimeFmt.format(new Date(iso));
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return dateFmt.format(new Date(iso));
}

// Converte "2026-10-07 15:30" interpretado como BRT para ISO UTC.
// Diferente de localInputToUtcIso em lib/tasks: aqui aceitamos tanto o
// formato de <input type="datetime-local"> quanto um "YYYY-MM-DD" puro
// (dia sem horário). Dia-só vira meia-noite BRT.
export function brtInputToUtcIso(local: string): string | null {
  if (!local) return null;

  const dateTimeMatch = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  const dateOnlyMatch = local.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const m = dateTimeMatch ?? dateOnlyMatch;
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = dateTimeMatch ? Number(dateTimeMatch[4]) : 0;
  const minute = dateTimeMatch ? Number(dateTimeMatch[5]) : 0;

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetMinutes = tzOffsetMinutes(new Date(utcGuess), APP_TZ);
  return new Date(utcGuess - offsetMinutes * 60_000).toISOString();
}

export function utcIsoToBrtInput(iso: string | null): string {
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
