#!/usr/bin/env node
/**
 * DGN Growth — Supabase backup (read-only).
 *
 * Reads env from process.env (populated by `node --env-file=.env.local`).
 * Paginates SELECT * on every relevant CRM table and writes one JSON file
 * per table plus a manifest with row counts.
 *
 * Output directory is passed as CLI arg or defaults to a sibling folder of
 * the repo root so backups never enter Git. This script performs NO writes
 * to Supabase.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

const OUT_DIR = process.argv[2];
if (!OUT_DIR) {
  console.error("usage: node backup.mjs <out_dir>");
  process.exit(2);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

const TABLES = [
  "crm_customers",
  "crm_vehicles",
  "crm_subscriptions",
  "crm_campaign_members",
  "crm_interactions",
  "crm_audit_logs",
  "crm_score_snapshots",
  "crm_duplicate_candidates",
  "crm_founder_public_links",
  "crm_founder_public_events",
];

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PAGE = 1000;

async function dumpTable(table) {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      // some tables may not use an `id` order; try without ordering
      const alt = await supabase.from(table).select("*").range(from, from + PAGE - 1);
      if (alt.error) throw new Error(`${table}: ${error.message}`);
      rows.push(...(alt.data ?? []));
      if (!alt.data || alt.data.length < PAGE) break;
    } else {
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }
    from += PAGE;
  }
  const file = path.join(OUT_DIR, `${table}.json`);
  fs.writeFileSync(file, JSON.stringify(rows, null, 2));
  return { table, rowCount: rows.length, file };
}

const manifest = {
  createdAt: new Date().toISOString(),
  supabaseProject: "wzjjdlzgxkvfynmpsczf",
  urlHost: new URL(url).host,
  tables: [],
  writeAttempted: false,
  restoreMethod:
    "Manual: para restaurar uma tabela, use `\\copy` via psql ou reimporte o JSON via Supabase Studio. " +
    "Não usar restore automático nesta fase — cada tabela tem triggers, RLS e integridade referencial. " +
    "Restaurar somente com aprovação explícita, com projeto pausado e backup de segurança adicional.",
};

for (const table of TABLES) {
  process.stderr.write(`[backup] ${table} …`);
  try {
    const info = await dumpTable(table);
    manifest.tables.push(info);
    process.stderr.write(` ${info.rowCount}\n`);
  } catch (err) {
    manifest.tables.push({ table, error: err.message });
    process.stderr.write(` ERROR ${err.message}\n`);
  }
}

const manifestPath = path.join(OUT_DIR, "MANIFEST.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
process.stderr.write(`[backup] manifest → ${manifestPath}\n`);
process.stdout.write(JSON.stringify(manifest, null, 2));
