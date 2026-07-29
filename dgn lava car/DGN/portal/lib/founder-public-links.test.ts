import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { normalizeFounderSlug, parseFounderPublicLink } from "./founder-public-links.ts";

const row = (overrides: Record<string, unknown> = {}) => ({
  slug: "teste-founder-a1b2c3d4", enabled: true, is_test: true, expires_at: "2099-01-01T00:00:00Z", campaign_member_id: "member-safe",
  crm_campaign_members: { campaign_id: "founders-2026", founder_number: null, crm_customers: { legacy_id: "teste-founder-a1b2c3d4", name: "Cliente Teste Founder" } }, ...overrides,
});

test("normaliza apenas slugs URL-safe", () => {
  assert.equal(normalizeFounderSlug(" Benedito-Constantino "), "benedito-constantino");
  for (const invalid of ["x", "../../admin", "josé-moreira", "com espaço", "a--b"]) assert.equal(normalizeFounderSlug(invalid), null);
});

test("resolve link habilitado, futuro e sintético sem PII", () => {
  const resolved = parseFounderPublicLink(row(), new Date("2026-07-29T00:00:00Z"));
  assert.deepEqual(resolved, { slug: "teste-founder-a1b2c3d4", publicName: "Cliente Teste Founder", isTest: true, customerLegacyId: "teste-founder-a1b2c3d4", campaignMemberId: "member-safe" });
  for (const pii of ["phone", "email", "plate", "score"]) assert.equal(pii in resolved!, false);
});

test("recusa desabilitado, expirado, inexistente, campanha errada e member inválido", () => {
  assert.equal(parseFounderPublicLink(null), null); assert.equal(parseFounderPublicLink(row({ enabled: false })), null);
  assert.equal(parseFounderPublicLink(row({ expires_at: "2020-01-01T00:00:00Z" })), null);
  assert.equal(parseFounderPublicLink(row({ crm_campaign_members: { campaign_id: "outra" } })), null);
  assert.equal(parseFounderPublicLink(row({ campaign_member_id: null })), null);
});

test("link de teste exige expiração, cliente sintético e ausência de Founder number", () => {
  assert.equal(parseFounderPublicLink(row({ expires_at: null })), null);
  assert.equal(parseFounderPublicLink(row({ crm_campaign_members: { campaign_id: "founders-2026", founder_number: "004", crm_customers: { legacy_id: "teste-founder-x", name: "Cliente Teste Founder" } } })), null);
  assert.equal(parseFounderPublicLink(row({ crm_campaign_members: { campaign_id: "founders-2026", founder_number: null, crm_customers: { legacy_id: "cliente-real", name: "Pessoa Real" } } })), null);
});

test("migration preserva 001-003, RLS, unicidade e permissões", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260729130000_founder_public_links.sql", import.meta.url), "utf8");
  for (const pair of ["'001','benedito-constantino'", "'002','jose-moreira'", "'003','rikardo-oliveira'"]) assert.ok(sql.includes(pair));
  assert.match(sql, /count\(\*\)[\s\S]*<> 1/i); assert.match(sql, /where enabled/i); assert.match(sql, /force row level security/i);
  assert.match(sql, /revoke all[\s\S]*public, anon, authenticated/i); assert.match(sql, /grant select, insert, update, delete[\s\S]*service_role/i);
  assert.match(sql, /not is_test or expires_at is not null/i); assert.doesNotMatch(sql, /founder_number.*004/i);
  assert.match(sql, /teste-founder-\[0-9a-f\]\{8,32\}/i);
});

test("endpoint e página compartilham resolver; IDs do browser são recusados", () => {
  const endpoint = readFileSync(new URL("../app/api/public/founders/[slug]/events/route.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("./founder-public-page.tsx", import.meta.url), "utf8");
  const dynamicPage = readFileSync(new URL("../app/founders/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(endpoint, /resolveFounderPublicLink\(slug\)/); assert.doesNotMatch(endpoint, /getFounderBySlug/);
  assert.match(endpoint, /Object\.keys\(payload\)\.length !== 1/); assert.match(page, /resolveFounderPublicLink\(slug\)/);
  assert.match(page, /FounderNeutralPage/); assert.match(dynamicPage, /renderFounderPublicPage/);
});
