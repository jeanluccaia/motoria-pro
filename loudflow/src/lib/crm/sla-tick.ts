// Cron tick do SLA do CRM Franqueadora.
//
// Responsabilidade: varrer todos os leads ativos (não terminais) e aplicar
// as transições automáticas ditadas pela regra do Jean:
//
//   * due_archive_temporary → pipeline_stage=lost + sla_archive_type=temporary
//   * due_retry             → pipeline_stage=contact_attempt (desarquiva)
//   * due_archive_final     → pipeline_stage=lost + sla_archive_type=final
//
// Cada transição gera uma linha em franchise_lead_activities (activity_type
// 'note' com prefixo "SLA: ...") para rastreabilidade e para o UI mostrar
// o motivo na timeline do lead.
//
// Idempotente: se o lead já está no estado destino, o patch é no-op (não
// mexe no DB) e nenhuma activity é criada.
//
// Query string:
//   * ?dryRun=1 (default) — computa e devolve counters, não escreve.
//   * ?dryRun=0           — efetiva as transições.
//
// Service role bypassa RLS; os patches respeitam explicitamente a estrutura
// (lost com lost_reason, etc.) para passar nas constraints.

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FranchiseLead } from "@/lib/supabase/types";
import { timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import {
  computeSlaState,
  slaIsAutomatableTransition,
  SLA_ARCHIVE_TEMP_REASON,
  SLA_ARCHIVE_FINAL_REASON,
  SLA_RETRY_NEXT_ACTION,
} from "./sla";

type Admin = SupabaseClient<Database>;

export type SlaTickDeps = {
  admin: Admin;
  nowMs?: () => number;
};

type Counters = {
  scanned: number;
  archivedTemporary: number;
  retried: number;
  archivedFinal: number;
  errors: number;
  dryRun: boolean;
};

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return nodeTimingSafeEqual(bufA, bufB);
}

export async function handleSlaTick(
  request: Request,
  deps: SlaTickDeps,
): Promise<Response> {
  // --- 1. Auth (Bearer CRON_SECRET) ----------------------------------
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "cron-not-configured", missing: ["CRON_SECRET"] },
      { status: 503 },
    );
  }
  const authHeader = request.headers.get("authorization") ?? "";
  const providedToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!providedToken || !safeEqual(providedToken, secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRunParam = url.searchParams.get("dryRun");
  // dryRun default FALSO em prod — a regra do Jean é execução automática.
  // Só vira dry run se o operador explicitamente passar ?dryRun=1.
  const dryRun = dryRunParam === "1" || dryRunParam === "true";

  const nowMs = deps.nowMs ? deps.nowMs() : Date.now();
  const now = new Date(nowMs);
  const nowIso = now.toISOString();

  const counters: Counters = {
    scanned: 0,
    archivedTemporary: 0,
    retried: 0,
    archivedFinal: 0,
    errors: 0,
    dryRun,
  };

  const errors: Array<{ leadId: string; message: string }> = [];

  // --- 2. Varre leads candidatos a transição --------------------------
  // Inclui pipeline_stage='lost' (precisa pra due_retry) mas exclui
  // won/disqualified (nunca entram em loop SLA). O índice
  // franchise_leads_org_sla_scan_idx cobre esse filtro.
  const admin = deps.admin;
  const { data: leads, error: readErr } = await admin
    .from("franchise_leads")
    .select("*")
    .in("pipeline_stage", [
      "new",
      "contact_attempt",
      "in_conversation",
      "qualified",
      "meeting_scheduled",
      "cof_sent",
      "negotiating",
      "no_response",
      "lost",
    ]);

  if (readErr) {
    return NextResponse.json(
      { ok: false, error: "read-failed", message: readErr.message },
      { status: 500 },
    );
  }

  const rows: FranchiseLead[] = leads ?? [];

  // --- 3. Para cada lead, computa estado e aplica se for transição ----
  for (const lead of rows) {
    counters.scanned += 1;
    const state = computeSlaState(lead, now);
    if (!slaIsAutomatableTransition(state)) continue;

    const summary = buildTransitionSummary(state.kind);
    if (dryRun) {
      bumpCounter(counters, state.kind);
      continue;
    }

    try {
      await applyTransition(admin, lead, state, nowIso, summary);
      bumpCounter(counters, state.kind);
    } catch (err) {
      counters.errors += 1;
      errors.push({
        leadId: lead.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    at: nowIso,
    counters,
    errors: errors.slice(0, 20), // limita payload
  });
}

function bumpCounter(c: Counters, kind: string): void {
  if (kind === "due_archive_temporary") c.archivedTemporary += 1;
  else if (kind === "due_retry") c.retried += 1;
  else if (kind === "due_archive_final") c.archivedFinal += 1;
}

function buildTransitionSummary(kind: string): string {
  if (kind === "due_archive_temporary") return SLA_ARCHIVE_TEMP_REASON;
  if (kind === "due_retry") return `SLA: ${SLA_RETRY_NEXT_ACTION}`;
  if (kind === "due_archive_final") return SLA_ARCHIVE_FINAL_REASON;
  return "SLA: transição automática";
}

async function applyTransition(
  admin: Admin,
  lead: FranchiseLead,
  state: ReturnType<typeof computeSlaState>,
  nowIso: string,
  summary: string,
): Promise<void> {
  if (
    state.kind !== "due_archive_temporary" &&
    state.kind !== "due_retry" &&
    state.kind !== "due_archive_final"
  ) {
    return;
  }
  const patch = state.patch as Partial<FranchiseLead>;

  const { error: updErr } = await admin
    .from("franchise_leads")
    .update(patch)
    .eq("id", lead.id)
    .eq("organization_id", lead.organization_id);
  if (updErr) throw new Error(updErr.message);

  const { error: actErr } = await admin
    .from("franchise_lead_activities")
    .insert({
      organization_id: lead.organization_id,
      lead_id: lead.id,
      activity_type: "note",
      summary,
      occurred_at: nowIso,
      // created_by null = sistema. A UI já exibe "automático" quando sem autor.
      created_by: null,
    });
  if (actErr) throw new Error(actErr.message);
}
