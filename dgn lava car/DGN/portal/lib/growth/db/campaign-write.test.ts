import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { handleCampaignPatch } from "./campaign-route.ts";
import { CampaignWriteError, validateCampaignPayload } from "./campaign-write.ts";
const request = (payload: unknown) => ({ cookies: { get: () => undefined }, json: async () => payload });
const valid = { campaignId: "founders-2026", founderStatus: "selecionado", selectionReason: "Aprovado por Rodrigo", expectedUpdatedAt: "2026-07-22T12:00:00Z" };
test("rota exige autenticação", async () => assert.equal((await handleCampaignPatch(request(valid), "iara", { authorize: async () => false, source: "db", write: async () => ({ changed: false, customerId: "iara", campaign: {} }) })).status, 401));
test("payload rejeita campo extra e valor inválido", () => { assert.throws(() => validateCampaignPayload({ ...valid, extra: true }), CampaignWriteError); assert.throws(() => validateCampaignPayload({ ...valid, founderStatus: "automático" }), CampaignWriteError); });
test("seleção explícita nunca cria Nº004", () => { const parsed = validateCampaignPayload(valid); assert.equal(parsed.patch.founderStatus, "selecionado"); assert.equal(parsed.patch.founderNumber, undefined); });
test("no-op retorna sucesso", async () => { const response = await handleCampaignPatch(request(valid), "iara", { authorize: async () => true, source: "db", write: async () => ({ changed: false, customerId: "iara", campaign: {} }) }); assert.equal(response.status, 200); assert.equal((await response.json()).changed, false); });
test("404 e conflito 409 são propagados", async () => { for (const status of [404, 409]) { const response = await handleCampaignPatch(request(valid), "iara", { authorize: async () => true, source: "db", write: async () => { throw new CampaignWriteError("controlado", status); } }); assert.equal(response.status, status); } });
test("migration protege limite, unicidade e Founders 001-003", async () => {
  const sql = await readFile(new URL("../../../supabase/migrations/20260722170000_founders_pipeline.sql", import.meta.url), "utf8");
  assert.match(sql, /confirmed_count>=30/); assert.match(sql, /número Founder duplicado/);
  assert.match(sql, /benedito-constantino[\s\S]*jose-moreira[\s\S]*rikardo-oliveira/);
});
test("migration preserva a primeira data com coalesce", async () => {
  const sql = await readFile(new URL("../../../supabase/migrations/20260722170000_founders_pipeline.sql", import.meta.url), "utf8");
  for (const field of ["invite_created_at", "invite_sent_at", "viewed_at", "responded_at", "conversation_started_at", "payment_sent_at", "converted_at", "lost_at"]) assert.match(sql, new RegExp(`coalesce\\(${field},now\\(\\)\\)`));
});
test("migration trata no-op antes de auditoria e interação", async () => {
  const sql = await readFile(new URL("../../../supabase/migrations/20260722170000_founders_pipeline.sql", import.meta.url), "utf8");
  assert.ok(sql.indexOf("if old=nxt") < sql.indexOf("insert into public.crm_interactions"));
  assert.ok(sql.indexOf("if old=nxt") < sql.indexOf("insert into public.crm_audit_logs"));
});
test("migration separa kit, cartão, assinatura e Founder", async () => {
  const sql = await readFile(new URL("../../../supabase/migrations/20260722170000_founders_pipeline.sql", import.meta.url), "utf8");
  assert.match(sql, /kit_status=/); assert.match(sql, /card_status=/); assert.doesNotMatch(sql, /update public\.crm_subscriptions/);
});
test("migration exige motivo para descarte e reabertura", async () => {
  const sql = await readFile(new URL("../../../supabase/migrations/20260722170000_founders_pipeline.sql", import.meta.url), "utf8");
  assert.match(sql, /descarte exige motivo/); assert.match(sql, /retorno de etapa exige confirmação e motivo/);
});
