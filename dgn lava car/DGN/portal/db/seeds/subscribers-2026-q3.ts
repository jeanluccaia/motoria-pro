/**
 * Seed idempotente dos 13 assinantes detectados / a validar (Fase 4 do brief).
 *
 * Uso:
 *   tsx db/seeds/subscribers-2026-q3.ts --dry-run
 *   tsx db/seeds/subscribers-2026-q3.ts --apply
 *
 * Regras:
 * - subscription_status = 'detectado'         → há agendamento futuro ou evidência forte
 * - subscription_status = 'pendente_validacao' → falta plano/ciclo/confirmação
 * - subscription_status = 'ativo'              → NUNCA por este seed (exige ação humana)
 * - Founders 001/002/003 preservados quando encontrados por nome/plate
 * - Paulo é sempre marcado para conciliação manual (nome incompleto)
 * - Iara mantém a assinatura Priority detectada; NÃO promove founder (vaga Nº004 reaberta)
 */

import type { NormalizedName } from "../../lib/growth/db/normalizers.ts"; // node runtime needs the .ts extension
import { normalizeName, normalizePhone, normalizePlate } from "../../lib/growth/db/normalizers.ts";

type SubscriptionPlan = "Essential" | "Smart" | "Priority" | "Não identificado";
type SubscriptionCycle = "mensal" | "semestral" | "anual" | "outro" | "não identificado";
type SubscriptionStatus = "detectado" | "pendente_validacao";

interface SubscriberSeed {
  name: string;
  aliases?: string[];             // outros nomes conhecidos que devem casar
  phoneHint?: string | null;
  plates: string[];
  plan: SubscriptionPlan;
  cycle: SubscriptionCycle;
  status: SubscriptionStatus;
  nextScheduledServiceAt: string | null; // ISO date
  sourceReference: string;
  requiresManualReview?: boolean;
  notes?: string;
}

// Ordem = a mesma da lista do brief.
export const SUBSCRIBERS_2026_Q3: SubscriberSeed[] = [
  {
    name: "Medley Nina",
    plates: ["QOW8A93"],
    plan: "Smart",
    cycle: "não identificado",
    status: "detectado",
    nextScheduledServiceAt: "2026-07-30",
    sourceReference: "4uCar/agendamento_2026-07-30",
    notes: "Veículo Up. Plano Smart detectado, ciclo a confirmar.",
  },
  {
    name: "Viviane",
    aliases: ["Marm Viviane"],
    plates: ["BIJ0J75"],
    plan: "Smart",
    cycle: "mensal",
    status: "detectado",
    nextScheduledServiceAt: "2026-07-30",
    sourceReference: "4uCar/agendamento_2026-07-30",
    notes: "Veículo Fastback. Ciclo mensal informado.",
  },
  {
    name: "Rikardo Oliveira",
    plates: ["QXP9H50"],
    plan: "Priority",
    cycle: "mensal",
    status: "detectado",
    nextScheduledServiceAt: "2026-07-18",
    sourceReference: "Founder Nº003 confirmado",
    notes: "Preservar Founder Nº003. Não promover assinatura para 'ativo' sem revisão humana explícita.",
  },
  {
    name: "Benedito Constantino",
    plates: ["BRY0H64"],
    plan: "Priority",
    cycle: "semestral",
    status: "detectado",
    nextScheduledServiceAt: "2026-07-18",
    sourceReference: "Founder Nº001 confirmado",
    notes: "Preservar Founder Nº001. Não promover assinatura para 'ativo' sem revisão humana explícita.",
  },
  {
    name: "Iara Menezes",
    aliases: ["Iara"],
    plates: ["FUR8369"],
    plan: "Priority",
    cycle: "não identificado",
    status: "detectado",
    nextScheduledServiceAt: "2026-07-17",
    sourceReference: "4uCar/agendamento_2026-07-17",
    notes: "Vaga Nº004 reaberta — assinatura Priority detectada, mas sem confirmação Founder. Aparece em 'Assinantes detectados / validação', não na fila de aquisição comum.",
  },
  {
    name: "José Moreira",
    aliases: ["Jose Moreira"],
    plates: ["EOA3940"],
    plan: "Smart",
    cycle: "semestral",
    status: "detectado",
    nextScheduledServiceAt: "2026-07-14",
    sourceReference: "Founder Nº002 confirmado",
    notes: "Preservar Founder Nº002. Não promover assinatura para 'ativo' sem revisão humana explícita.",
  },
  {
    name: "Ana Silveira",
    plates: ["SIT9F03"],
    plan: "Smart",
    cycle: "não identificado",
    status: "pendente_validacao",
    nextScheduledServiceAt: "2026-07-13",
    sourceReference: "4uCar/agendamento_2026-07-13",
    notes: "Veículo Onix. Ciclo a confirmar.",
  },
  {
    name: "Guilherme Lopes",
    plates: ["TKO5G04", "TJX2D23"],
    plan: "Priority",
    cycle: "não identificado",
    status: "detectado",
    nextScheduledServiceAt: null,
    sourceReference: "4uCar/recorrencia_julho_2026",
    notes: "2 veículos ativos (Song Plus + Ora 03). Atendimentos recorrentes em julho/2026.",
  },
  {
    name: "Wellington Felix",
    plates: ["SWR0J66"],
    plan: "Priority",
    cycle: "semestral",
    status: "detectado",
    nextScheduledServiceAt: null,
    sourceReference: "4uCar/atendimento_julho_2026",
    notes: "Veículo ZR-V. Atendimento de assinatura em julho/2026.",
  },
  {
    name: "Paulo",
    plates: ["FMP4C02"],
    plan: "Priority",
    cycle: "mensal",
    status: "pendente_validacao",
    nextScheduledServiceAt: null,
    sourceReference: "4uCar/atendimento_julho_2026",
    requiresManualReview: true,
    notes: "Nome incompleto — exige conciliação manual antes de qualquer ação comercial. Veículo Gol placa FMP4C02.",
  },
  {
    name: "Suely Maria Diniz",
    plates: ["FQV2H04"],
    plan: "Smart",
    cycle: "não identificado",
    status: "pendente_validacao",
    nextScheduledServiceAt: null,
    sourceReference: "4uCar/atendimento_junho_2026",
    notes: "Veículo Renegade. Última evidência: atendimento em junho/2026.",
  },
  {
    name: "Gustavo Plensack",
    plates: ["FLW2D77"],
    plan: "Smart",
    cycle: "não identificado",
    status: "pendente_validacao",
    nextScheduledServiceAt: null,
    sourceReference: "4uCar/atendimento_junho_2026",
    notes: "Veículo Civic. Última evidência: atendimento em junho/2026.",
  },
  {
    name: "Rodney Carvalho",
    plates: ["TCU9A06"],
    plan: "Smart",
    cycle: "não identificado",
    status: "pendente_validacao",
    nextScheduledServiceAt: null,
    sourceReference: "4uCar/atendimento_junho_2026",
    notes: "Veículo Jeep Commander. Última evidência: atendimento em junho/2026.",
  },
];

// ---------------------------------------------------------------------------
// Conciliação com JSON legado (dry-run)
// ---------------------------------------------------------------------------

interface LegacyRow {
  id: string;
  name: string;
  phone?: string;
  plate?: string;
}

interface SeedMatchReport {
  seedName: string;
  matched: boolean;
  matchedLegacyId?: string;
  matchReason: string;
  requiresManualReview: boolean;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  cycle: SubscriptionCycle;
  warnings: string[];
}

function match(seed: SubscriberSeed, rows: LegacyRow[]): SeedMatchReport {
  const warnings: string[] = [];
  const seedName = normalizeName(seed.name);
  const seedAliases = (seed.aliases ?? []).map(normalizeName);
  const seedPlates = seed.plates.map(normalizePlate).filter((p) => p.classification.startsWith("valida"));
  const seedPhone = seed.phoneHint ? normalizePhone(seed.phoneHint) : null;

  const nameSet = new Set<string>([seedName.normalized, ...seedAliases.map((a) => a.normalized)].filter(Boolean));
  const plateSet = new Set<string>(seedPlates.map((p) => p.compact));

  // Match forte: telefone exato ou placa exata
  const byPhone = seedPhone && seedPhone.classification === "valido"
    ? rows.find((r) => {
        const p = normalizePhone(r.phone);
        return p.classification === "valido" && p.digits === seedPhone.digits;
      })
    : undefined;

  const byPlate = plateSet.size > 0
    ? rows.find((r) => {
        const p = normalizePlate(r.plate);
        return p.classification.startsWith("valida") && plateSet.has(p.compact);
      })
    : undefined;

  const byName = rows.find((r) => {
    const n = normalizeName(r.name);
    if (!n.normalized) return false;
    return nameSet.has(n.normalized);
  });

  const matched = byPhone ?? byPlate ?? byName;

  if (!matched) {
    warnings.push("nenhum candidato encontrado no JSON legado — criar cliente novo");
    return {
      seedName: seed.name,
      matched: false,
      matchReason: "no_match",
      requiresManualReview: seed.requiresManualReview ?? isIncomplete(seedName),
      status: seed.status,
      plan: seed.plan,
      cycle: seed.cycle,
      warnings,
    };
  }

  let reason = "match_by_name";
  if (byPhone) reason = "match_by_phone";
  else if (byPlate) reason = "match_by_plate";

  if (isIncomplete(seedName)) {
    warnings.push("nome do seed é incompleto — exige revisão manual mesmo com match");
  }

  return {
    seedName: seed.name,
    matched: true,
    matchedLegacyId: matched.id,
    matchReason: reason,
    requiresManualReview: seed.requiresManualReview ?? isIncomplete(seedName),
    status: seed.status,
    plan: seed.plan,
    cycle: seed.cycle,
    warnings,
  };
}

function isIncomplete(n: NormalizedName): boolean {
  return n.isIncomplete;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function loadLegacy(): Promise<LegacyRow[]> {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const here = dirname(fileURLToPath(import.meta.url));
  const jsonPath = resolve(here, "../../lib/growth/dgn-customers.json");
  const raw = await readFile(jsonPath, "utf8");
  return JSON.parse(raw) as LegacyRow[];
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has("--apply");
  const dryRun = args.has("--dry-run") || !apply;

  const rows = await loadLegacy();
  const reports = SUBSCRIBERS_2026_Q3.map((s) => match(s, rows));

  const line = "─".repeat(60);
  console.log("\n" + line);
  console.log("Seed 13 assinantes — dry-run");
  console.log(line);
  reports.forEach((r) => {
    const flag = r.matched ? `✓ ${r.matchReason}` : "✗ sem match";
    const review = r.requiresManualReview ? " [REVISAR MANUAL]" : "";
    console.log(`- ${r.seedName.padEnd(24)} ${flag}${review}  → status=${r.status}, plan=${r.plan}, cycle=${r.cycle}`);
    r.warnings.forEach((w) => console.log(`      ⚠ ${w}`));
    if (r.matchedLegacyId) console.log(`      legacy_id=${r.matchedLegacyId}`);
  });
  console.log(line);

  const matched = reports.filter((r) => r.matched).length;
  const manual = reports.filter((r) => r.requiresManualReview).length;
  console.log(`Matches: ${matched}/${reports.length}  |  Revisão manual: ${manual}\n`);

  if (apply) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("ERRO: --apply requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.\n");
      process.exit(2);
    }
    console.error("Apply ainda não implementado — depende do Supabase estar plugado.\n");
    process.exit(3);
  }
  void dryRun;
}

// Só executa quando rodado como script (não quando importado pelo Next).
const isDirectRun = typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url.startsWith("file:") &&
  process.argv[1].replace(/\\/g, "/").endsWith("subscribers-2026-q3.ts");

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
