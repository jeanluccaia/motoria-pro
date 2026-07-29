import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildDedupeKey, DEDUPE_WINDOW_MS, founderCookieOptions, isFounderEvent, isKnownPreviewBot } from "./founder-tracking.ts";

test("eventos, dedupe, cookie e bots", () => {
  for (const value of ["page_view", "confirm_whatsapp_click", "vip_whatsapp_click"]) assert.equal(isFounderEvent(value), true);
  assert.equal(isFounderEvent("converted"), false);
  const base = DEDUPE_WINDOW_MS * 100;
  assert.equal(buildDedupeKey("v", "s", "page_view", base + 1), buildDedupeKey("v", "s", "page_view", base + 1000));
  assert.notEqual(buildDedupeKey("v", "s", "page_view", base + 1), buildDedupeKey("v", "s", "page_view", base + DEDUPE_WINDOW_MS));
  assert.deepEqual(founderCookieOptions(true), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 15552000 });
  for (const ua of ["WhatsApp/2", "facebookexternalhit/1.1", "Googlebot", "bingbot", "Slackbot", "Discordbot", "Twitterbot"]) assert.equal(isKnownPreviewBot(ua), true);
  assert.equal(isKnownPreviewBot("Mozilla/5.0 Chrome/140"), false);
});

test("migration garante transacao, limites, pipeline, auditoria e permissoes", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260729120000_founder_public_tracking.sql", import.meta.url), "utf8");
  assert.match(sql, /dedupe_key text not null unique/i); assert.match(sql, /on conflict\(dedupe_key\) do nothing/i);
  assert.match(sql, /occurred_at>v_now-interval '30 minutes'/i);
  assert.match(sql, />= 20/); assert.match(sql, />= 200/); assert.match(sql, /v_stage in \('aguardando_analise','pronto_para_contato','contato_preparado','contatado'\)/i);
  assert.match(sql, /system:founder_tracking/); assert.match(sql, /revoke all on function[\s\S]*from public, anon, authenticated/i); assert.match(sql, /force row level security/i);
  assert.doesNotMatch(sql, /ip_address|user_agent|fingerprint/i);
});

test("cliente respeita preview, visibilidade, atraso, beacon e funil real", () => {
  const client = readFileSync(new URL("../components/FounderPublicTracking.tsx", import.meta.url), "utf8");
  const workspace = readFileSync(new URL("../components/growth/DgnGrowthWorkspace.tsx", import.meta.url), "utf8");
  assert.match(client, /preview.*=== "1"/); assert.match(client, /visibilityState/); assert.match(client, /1500/); assert.match(client, /sendBeacon/); assert.match(client, /keepalive: true/);
  assert.match(workspace, /\?preview=1/); assert.match(workspace, /engagement\?\.viewedAt/);
});
