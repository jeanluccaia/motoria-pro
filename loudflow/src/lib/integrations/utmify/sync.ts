import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/types";
import type {
  UtmifyClient,
  AdCampaignRow,
  UtmifyFetchError,
} from "./types";
import { parseCampaignUnit, type ParsedAlias } from "./parser";
import { rangeDays } from "../../dates/period";

type Admin = SupabaseClient<Database>;

export type SyncOptions = {
  organizationId: string;
  fromYmd: string;
  toYmd: string;
  triggeredBy: "manual" | "cron" | "bootstrap";
};

export type SyncOutcome = {
  runId: string;
  status: "success" | "partial" | "error";
  campaignsSeen: number;
  rowsUpserted: number;
  errors: Array<{ date: string; error: UtmifyFetchError }>;
};

// Executa a sincronização de um intervalo de dias. É idempotente: reexecutar
// o mesmo período faz `upsert` por (campaign_id, snapshot_date) — sem duplicar.
// Falhas parciais NÃO apagam snapshots anteriores; o `sync_runs` fica com
// status `partial` ou `error` e a mensagem sanitizada.
export async function runUtmifySync(
  admin: Admin,
  client: UtmifyClient,
  options: SyncOptions,
): Promise<SyncOutcome> {
  const aliases = await loadAliases(admin, options.organizationId);
  const run = await admin
    .from("sync_runs")
    .insert({
      organization_id: options.organizationId,
      provider: "meta",
      status: "running",
      triggered_by: options.triggeredBy,
      period_from: options.fromYmd,
      period_to: options.toYmd,
    })
    .select("id")
    .single();

  if (run.error || !run.data) {
    throw new Error(`Não foi possível registrar sync_run: ${run.error?.message}`);
  }

  const runId = run.data.id;
  const errors: SyncOutcome["errors"] = [];
  let campaignsSeen = 0;
  let rowsUpserted = 0;

  for (const dateYmd of rangeDays(options.fromYmd, options.toYmd)) {
    const day = await client.fetchDay(dateYmd);
    if (!day.ok) {
      errors.push({ date: dateYmd, error: day.error });
      continue;
    }
    if (day.day.rows.length === 0) continue;

    const persisted = await persistDay(admin, options.organizationId, dateYmd, day.day.rows, aliases);
    campaignsSeen += persisted.campaignsSeen;
    rowsUpserted += persisted.snapshotsUpserted;
  }

  const status: SyncOutcome["status"] =
    errors.length === 0 ? "success" : errors.length === rangeDays(options.fromYmd, options.toYmd).length ? "error" : "partial";

  await admin
    .from("sync_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      rows_upserted: rowsUpserted,
      campaigns_seen: campaignsSeen,
      error_code: errors[0]?.error.code ?? null,
      error_message: errors[0]?.error.message ?? null,
    })
    .eq("id", runId);

  return { runId, status, campaignsSeen, rowsUpserted, errors };
}

async function loadAliases(admin: Admin, organizationId: string): Promise<ParsedAlias[]> {
  const { data, error } = await admin
    .from("campaign_unit_aliases")
    .select("alias, unit_id")
    .eq("organization_id", organizationId);
  if (error) throw new Error(`Não foi possível carregar aliases: ${error.message}`);
  return (data ?? []).map((a) => ({ alias: a.alias, unitId: a.unit_id }));
}

async function persistDay(
  admin: Admin,
  organizationId: string,
  dateYmd: string,
  rows: AdCampaignRow[],
  aliases: ParsedAlias[],
): Promise<{ campaignsSeen: number; snapshotsUpserted: number }> {
  const now = new Date().toISOString();
  const campaignIds = new Map<string, string>();

  for (const row of rows) {
    const parse = parseCampaignUnit(row.name, aliases);
    const externalKey = `${row.provider}:${row.externalId}`;
    const existing = await admin
      .from("campaigns")
      .select("id, unit_id, unit_source")
      .eq("organization_id", organizationId)
      .eq("provider", row.provider)
      .eq("external_id", row.externalId)
      .maybeSingle();

    let campaignId: string;
    if (existing.data) {
      campaignId = existing.data.id;
      // Regra: mapeamento manual NUNCA é sobrescrito pelo automático.
      const shouldTouchUnit = existing.data.unit_source !== "manual";
      const nextUnit = shouldTouchUnit
        ? parse.source === "auto"
          ? { unit_id: parse.unitId, unit_source: "auto" as const }
          : { unit_id: null, unit_source: "unresolved" as const }
        : {};
      const { error } = await admin
        .from("campaigns")
        .update({
          name: row.name,
          status: row.status,
          external_account_name: row.externalAccountName,
          last_seen_at: now,
          archived_at: null,
          ...nextUnit,
        })
        .eq("id", campaignId);
      if (error) throw new Error(`update campaign ${externalKey}: ${error.message}`);
    } else {
      const insertPayload = {
        organization_id: organizationId,
        provider: row.provider,
        external_account_id: row.externalAccountId,
        external_account_name: row.externalAccountName,
        external_id: row.externalId,
        name: row.name,
        status: row.status,
        unit_id: parse.source === "auto" ? parse.unitId : null,
        unit_source: parse.source === "auto" ? ("auto" as const) : ("unresolved" as const),
        first_seen_at: now,
        last_seen_at: now,
      };
      const { data, error } = await admin
        .from("campaigns")
        .insert(insertPayload)
        .select("id")
        .single();
      if (error || !data) throw new Error(`insert campaign ${externalKey}: ${error?.message}`);
      campaignId = data.id;
    }

    campaignIds.set(externalKey, campaignId);
  }

  // Snapshots — upsert em (campaign_id, snapshot_date). Não colocamos
  // organization_id no conflict target porque a UNIQUE já é por campaign.
  const snapshotsPayload = rows
    .map((row) => {
      const externalKey = `${row.provider}:${row.externalId}`;
      const campaignId = campaignIds.get(externalKey);
      if (!campaignId) return null;
      return {
        organization_id: organizationId,
        campaign_id: campaignId,
        provider: row.provider,
        snapshot_date: dateYmd,
        spend_cents: row.spendCents,
        impressions: row.impressions,
        clicks: row.clicks,
        landing_page_views: row.landingPageViews,
        initiate_checkouts: row.initiateCheckouts,
        leads: row.leads,
        frequency: row.frequency,
        synced_at: now,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (snapshotsPayload.length === 0) {
    return { campaignsSeen: rows.length, snapshotsUpserted: 0 };
  }

  const { error } = await admin
    .from("campaign_snapshots")
    .upsert(snapshotsPayload, { onConflict: "campaign_id,snapshot_date" });
  if (error) throw new Error(`upsert snapshots ${dateYmd}: ${error.message}`);

  return { campaignsSeen: rows.length, snapshotsUpserted: snapshotsPayload.length };
}
