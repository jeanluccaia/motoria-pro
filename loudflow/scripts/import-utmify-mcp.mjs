#!/usr/bin/env node
// Import controlado a partir de payloads reais exportados pelo MCP
// oficial da UTMify (tool `mcp__claude_ai_utmify__get_meta_ad_objects`,
// nível "campaign"). Este script NÃO faz chamadas HTTP contra a UTMify —
// ele lê arquivos JSON locais gerados por chamadas MCP feitas pelo
// operador em ambiente de desenvolvimento.
//
// Uso:
//   node --env-file=.env.local scripts/import-utmify-mcp.mjs <payloads_dir> [--org-slug=loud-fit] [--dry-run]
//
// Formato esperado de cada arquivo:
//   <payloads_dir>/YYYY-MM-DD.json
//   → { "results": [ {level:"campaign", ...}, ... ], "untrackedCount": 0 }
//
// Regras aplicadas (idem `src/lib/integrations/utmify/mcp.ts`):
//   * spend/revenue/grossRevenue em centavos, preservados como int.
//   * reach = round(impressions/frequency) apenas quando frequency > 0;
//     caso contrário null (não é zero — é "não foi possível estimar").
//   * approvedOrdersCount é a única fonte de vendas aprovadas.
//   * leads/initiateCheckout/conversations NUNCA viram matrícula.
//   * salesFromFacebook é ignorado (atribuição de pixel, não venda).
//
// Idempotência:
//   * campaigns: upsert por (organization_id, provider, external_id);
//     unit_source='manual' NUNCA é sobrescrito pelo automático.
//   * campaign_snapshots: upsert por (campaign_id, snapshot_date);
//     reexecutar o mesmo período atualiza os valores sem duplicar.
//   * sync_runs: uma linha por execução, source='utmify_mcp',
//     triggered_by='bootstrap' (import controlado, não é operação regular).

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
if (!args.dir) {
  console.error("uso: import-utmify-mcp.mjs <payloads_dir> [--org-slug=loud-fit] [--dry-run] [--keep-zero]");
  process.exit(2);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("faltam envs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const orgSlug = args["org-slug"] || "loud-fit";
const org = await admin
  .from("organizations")
  .select("id, name, slug")
  .eq("slug", orgSlug)
  .single();
if (org.error || !org.data) {
  console.error(`organização "${orgSlug}" não encontrada: ${org.error?.message ?? "?"}`);
  process.exit(2);
}
const orgId = org.data.id;

// -------- carregar aliases --------
const aliasRes = await admin
  .from("campaign_unit_aliases")
  .select("alias, unit_id")
  .eq("organization_id", orgId);
if (aliasRes.error) throw new Error(`aliases: ${aliasRes.error.message}`);
const aliases = (aliasRes.data ?? []).map((a) => ({ alias: a.alias, unitId: a.unit_id }));

// -------- descobrir arquivos --------
const files = fs
  .readdirSync(args.dir)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .sort();
if (files.length === 0) {
  console.error(`nenhum arquivo YYYY-MM-DD.json em ${args.dir}`);
  process.exit(2);
}

const fromYmd = files[0].replace(/\.json$/, "");
const toYmd = files[files.length - 1].replace(/\.json$/, "");
console.log(`[import-utmify-mcp] org=${org.data.name} (${orgSlug}) período=${fromYmd}..${toYmd} arquivos=${files.length}`);
console.log(`[import-utmify-mcp] dry-run=${!!args["dry-run"]} keep-zero=${!!args["keep-zero"]}`);

// -------- registrar sync_run --------
let runId = null;
if (!args["dry-run"]) {
  const runInsert = await admin
    .from("sync_runs")
    .insert({
      organization_id: orgId,
      provider: "meta",
      status: "running",
      triggered_by: "bootstrap",
      source: "utmify_mcp",
      period_from: fromYmd,
      period_to: toYmd,
    })
    .select("id")
    .single();
  if (runInsert.error || !runInsert.data) {
    console.error(`sync_runs insert falhou: ${runInsert.error?.message}`);
    process.exit(2);
  }
  runId = runInsert.data.id;
}

// -------- processar dias --------
let totalRows = 0;
let totalCampaigns = 0;
let totalErrors = 0;
let firstErrorCode = null;
let firstErrorMessage = null;

for (const file of files) {
  const date = file.replace(/\.json$/, "");
  const fullPath = path.join(args.dir, file);
  try {
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    const daily = normalizeMcpMetaResponse({ date, payload: raw }, { keepZeroExposure: !!args["keep-zero"] });
    console.log(`  [${date}] rows=${daily.rows.length}`);
    totalRows += daily.rows.length;
    if (args["dry-run"]) continue;
    const persisted = await persistDay(admin, orgId, date, daily.rows, aliases);
    totalCampaigns += persisted.campaignsSeen;
  } catch (err) {
    totalErrors += 1;
    firstErrorCode = firstErrorCode ?? "parse-or-persist";
    firstErrorMessage = firstErrorMessage ?? sanitizeErr(err);
    console.error(`  [${date}] ERRO: ${sanitizeErr(err)}`);
  }
}

// -------- finalizar sync_run --------
if (!args["dry-run"] && runId) {
  const status = totalErrors === 0 ? "success" : totalErrors === files.length ? "error" : "partial";
  await admin
    .from("sync_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      rows_upserted: totalRows,
      campaigns_seen: totalCampaigns,
      error_code: firstErrorCode,
      error_message: firstErrorMessage,
    })
    .eq("id", runId);
  console.log(`[import-utmify-mcp] runId=${runId} status=${status} rows=${totalRows} campaignsSeen=${totalCampaigns}`);
} else {
  console.log(`[import-utmify-mcp] dry-run: totalRows previstos=${totalRows}`);
}

// ============================================================================
// Normalização MCP (espelha src/lib/integrations/utmify/mcp.ts)
// ============================================================================
function deriveReachEstimated(impressions, frequency) {
  if (impressions == null || frequency == null) return null;
  if (!Number.isFinite(impressions) || !Number.isFinite(frequency)) return null;
  if (frequency <= 0) return null;
  const reach = impressions / frequency;
  return Number.isFinite(reach) ? Math.round(reach) : null;
}
function toIntNonNegative(v) {
  if (v == null || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v));
}
function toIntNullable(v) {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.max(0, Math.round(v));
}
function toCents(v) {
  if (v == null || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v));
}
function pickAccountName(o) {
  const raw = o.ca ?? o.externalAccountName ?? null;
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  return trimmed.length === 0 ? null : trimmed;
}
function pickStatus(o) {
  const raw = o.effectiveStatus ?? o.status ?? "UNKNOWN";
  return String(raw);
}
function normalizeMcpRow(o) {
  const impressions = toIntNonNegative(o.impressions);
  const frequency = o.frequency == null || !Number.isFinite(o.frequency) ? null : Number(o.frequency);
  return {
    provider: "meta",
    externalAccountId: String(o.accountId),
    externalAccountName: pickAccountName(o),
    externalId: String(o.campaignId ?? o.id),
    name: String(o.name),
    status: pickStatus(o),
    spendCents: toCents(o.spend),
    impressions,
    clicks: toIntNonNegative(o.inlineLinkClicks),
    landingPageViews: toIntNullable(o.landingPageViews),
    initiateCheckouts: toIntNullable(o.initiateCheckout),
    leads: toIntNullable(o.leads),
    frequency,
    reachEstimated: deriveReachEstimated(impressions, frequency),
    conversations: toIntNullable(o.conversations),
    approvedOrdersCount: toIntNonNegative(o.approvedOrdersCount),
    pendingOrdersCount: toIntNonNegative(o.pendingOrdersCount),
    refundedOrdersCount: toIntNonNegative(o.refundedOrdersCount),
    revenueCents: toCents(o.revenue),
    grossRevenueCents: toCents(o.grossRevenue),
  };
}
function normalizeMcpMetaResponse(input, options = {}) {
  const keepZero = options.keepZeroExposure === true;
  const raw = input.payload.results ?? [];
  const rows = [];
  for (const item of raw) {
    if (item.level !== "campaign") continue;
    if (!item.campaignId && !item.id) continue;
    const row = normalizeMcpRow(item);
    if (!keepZero) {
      const hasSignal =
        row.spendCents > 0 ||
        row.impressions > 0 ||
        row.clicks > 0 ||
        (row.leads ?? 0) > 0 ||
        (row.landingPageViews ?? 0) > 0 ||
        (row.initiateCheckouts ?? 0) > 0 ||
        (row.conversations ?? 0) > 0 ||
        row.approvedOrdersCount > 0 ||
        row.pendingOrdersCount > 0 ||
        row.revenueCents > 0 ||
        row.grossRevenueCents > 0;
      if (!hasSignal) continue;
    }
    rows.push(row);
  }
  return { date: input.date, rows };
}

// ============================================================================
// Parser + persistência (espelha src/lib/integrations/utmify/parser.ts + sync.ts)
// ============================================================================
function normalizeName(raw) {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[|/\\_,;:.\-—–]+/g, " ")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}
function matchAliases(name, aliases) {
  const normalized = " " + normalizeName(name) + " ";
  const matched = [];
  const sorted = [...aliases].sort((a, b) => b.alias.length - a.alias.length);
  const consumed = [];
  const overlaps = (start, end) => consumed.some(([s, e]) => start < e && end > s);
  for (const a of sorted) {
    const needle = " " + a.alias + " ";
    let cursor = 0;
    while (true) {
      const idx = normalized.indexOf(needle, cursor);
      if (idx < 0) break;
      const start = idx + 1;
      const end = start + a.alias.length;
      if (!overlaps(start, end)) {
        consumed.push([start, end]);
        if (!matched.some((m) => m.unitId === a.unitId)) matched.push(a);
        break;
      }
      cursor = idx + 1;
    }
  }
  return matched;
}
function parseCampaignUnit(name, aliases) {
  const matched = matchAliases(name, aliases);
  if (matched.length === 1) return { source: "auto", unitId: matched[0].unitId, matchedAlias: matched[0].alias };
  if (matched.length === 0) return { source: "unresolved", reason: "no-match", candidates: [] };
  return { source: "unresolved", reason: "ambiguous", candidates: matched.map((m) => m.alias) };
}

async function persistDay(admin, organizationId, dateYmd, rows, aliases) {
  const now = new Date().toISOString();
  const campaignIds = new Map();
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
    let campaignId;
    if (existing.data) {
      campaignId = existing.data.id;
      const shouldTouchUnit = existing.data.unit_source !== "manual";
      const nextUnit = shouldTouchUnit
        ? parse.source === "auto"
          ? { unit_id: parse.unitId, unit_source: "auto" }
          : { unit_id: null, unit_source: "unresolved" }
        : {};
      const upd = await admin
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
      if (upd.error) throw new Error(`update campaign ${externalKey}: ${upd.error.message}`);
    } else {
      const ins = await admin
        .from("campaigns")
        .insert({
          organization_id: organizationId,
          provider: row.provider,
          external_account_id: row.externalAccountId,
          external_account_name: row.externalAccountName,
          external_id: row.externalId,
          name: row.name,
          status: row.status,
          unit_id: parse.source === "auto" ? parse.unitId : null,
          unit_source: parse.source === "auto" ? "auto" : "unresolved",
          first_seen_at: now,
          last_seen_at: now,
        })
        .select("id")
        .single();
      if (ins.error || !ins.data) throw new Error(`insert campaign ${externalKey}: ${ins.error?.message}`);
      campaignId = ins.data.id;
    }
    campaignIds.set(externalKey, campaignId);
  }
  const payload = rows
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
        reach_estimated: row.reachEstimated,
        conversations: row.conversations,
        approved_orders_count: row.approvedOrdersCount,
        pending_orders_count: row.pendingOrdersCount,
        refunded_orders_count: row.refundedOrdersCount,
        revenue_cents: row.revenueCents,
        gross_revenue_cents: row.grossRevenueCents,
        synced_at: now,
      };
    })
    .filter(Boolean);
  if (payload.length > 0) {
    const up = await admin
      .from("campaign_snapshots")
      .upsert(payload, { onConflict: "campaign_id,snapshot_date" });
    if (up.error) throw new Error(`upsert snapshots ${dateYmd}: ${up.error.message}`);
  }
  return { campaignsSeen: rows.length, snapshotsUpserted: payload.length };
}

// ============================================================================
function parseArgs(argv) {
  const out = { dir: null };
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      out[k] = v ?? true;
    } else if (out.dir == null) {
      out.dir = a;
    }
  }
  return out;
}
function sanitizeErr(e) {
  const msg = String(e && (e.message || e));
  return msg.replace(/Bearer\s+[^\s]+/gi, "Bearer ***").slice(0, 500);
}
