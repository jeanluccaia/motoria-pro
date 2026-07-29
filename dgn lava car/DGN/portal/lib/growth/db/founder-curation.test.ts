import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const migrationPath = new URL("../../../supabase/migrations/20260729150000_founder_individual_curation.sql", import.meta.url);

test("migration protege concorrência, permissões, slugs e Founders existentes", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /is distinct from p_expected_updated_at/i);
  assert.match(sql, /errcode='40001'/i);
  assert.match(sql, /convite-'\|\|encode\(gen_random_bytes\(18\),'hex'\)/i);
  assert.match(sql, /benedito-constantino.*jose-moreira.*rikardo-oliveira/i);
  assert.match(sql, /revoke all on function[\s\S]*from public,anon,authenticated/i);
  assert.match(sql, /grant execute on function[\s\S]*to service_role/i);
  assert.doesNotMatch(sql, /founder_number\s*=/i);
});

test("migration separa criação, envio e versionamento sem regredir funil", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /p_action='mark_sent'[\s\S]*invite_sent_at=coalesce/i);
  assert.match(sql, /max\(version\),0\)\+1/i);
  assert.match(sql, /enabled=false,revoked_at=v_now/i);
  assert.match(sql, /v_old is distinct from v_new/i);
});

test("página de snapshot não expõe campos internos", async () => {
  const source = await readFile(new URL("../../../components/FounderSnapshotPage.tsx", import.meta.url), "utf8");
  for (const forbidden of ["scoreDgn", "historicalValue", "recommendationReasonInternal", "plate", "phone", "curatedBy"]) assert.doesNotMatch(source, new RegExp(forbidden));
  assert.match(source, /trackFounderEvent\(slug, "confirm_whatsapp_click"\)/);
});
