import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listAgentActions,
  AgentActionsWriteError,
  type AgentActionRow,
} from "./agent-actions-write.ts";

export interface PulseSummary {
  totalPending: number;
  counts: {
    opportunity: number;
    alert: number;
    followupTask: number;
    campaignDraft: number;
  };
  topActions: AgentActionRow[];
  loadError: string | null;
}

const DEFAULT_TOP = 3;

export function derivePulseSummary(rows: AgentActionRow[], topN = DEFAULT_TOP): PulseSummary {
  const pending = rows.filter((r) => r.status === "pending_review");

  const counts = {
    opportunity: 0,
    alert: 0,
    followupTask: 0,
    campaignDraft: 0,
  };
  for (const r of pending) {
    if (r.kind === "opportunity") counts.opportunity += 1;
    else if (r.kind === "alert") counts.alert += 1;
    else if (r.kind === "followup_task") counts.followupTask += 1;
    else if (r.kind === "campaign_draft") counts.campaignDraft += 1;
  }

  const kindPriority: Record<AgentActionRow["kind"], number> = {
    alert: 0,
    opportunity: 1,
    followup_task: 2,
    campaign_draft: 3,
  };
  const topActions = [...pending]
    .sort((a, b) => {
      const kindDiff = kindPriority[a.kind] - kindPriority[b.kind];
      if (kindDiff !== 0) return kindDiff;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, Math.max(0, topN));

  return {
    totalPending: pending.length,
    counts,
    topActions,
    loadError: null,
  };
}

export async function loadPulseSummary(options?: {
  db?: SupabaseClient;
  topN?: number;
}): Promise<PulseSummary> {
  try {
    const rows = await listAgentActions({
      status: "pending_review",
      limit: 100,
      db: options?.db,
    });
    return derivePulseSummary(rows, options?.topN);
  } catch (error) {
    const message =
      error instanceof AgentActionsWriteError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Erro inesperado.";
    return {
      totalPending: 0,
      counts: { opportunity: 0, alert: 0, followupTask: 0, campaignDraft: 0 },
      topActions: [],
      loadError: message,
    };
  }
}
