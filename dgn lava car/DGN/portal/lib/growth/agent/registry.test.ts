import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AGENT_SKILL_REGISTRY, isReadOnlyRegistry } from "./registry.ts";

// -----------------------------------------------------------------------------
// Garantia estática de read-only. Duas provas:
// 1. Runtime: todo item do registry tem mode "read_only".
// 2. Source: nenhuma skill importa camada de escrita (repositories/write/...);
//    isso é uma prova barata que impede alguém adicionar mutação sem quebrar.
// -----------------------------------------------------------------------------

test("registry contém apenas skills com mode read_only", () => {
  assert.ok(AGENT_SKILL_REGISTRY.length >= 6, "esperado pelo menos 6 skills");
  assert.ok(isReadOnlyRegistry(), "registry deve ser read-only");
  for (const skill of AGENT_SKILL_REGISTRY) {
    assert.equal(skill.mode, "read_only", `${skill.name} não é read_only`);
  }
});

test("todas as skills declaradas existem como identificadores esperados", () => {
  const names = AGENT_SKILL_REGISTRY.map((s) => s.name);
  const expected = [
    "get_daily_briefing",
    "get_founder_attention",
    "get_curation_opportunities",
    "get_subscriber_attention",
    "get_customer_summary",
    "suggest_next_action",
  ];
  for (const name of expected) assert.ok(names.includes(name), `skill faltando: ${name}`);
});

test("nenhum arquivo em skills/ importa camada de escrita do Growth", () => {
  const files = [
    "skills/daily-briefing.ts",
    "skills/founder-attention.ts",
    "skills/curation-opportunities.ts",
    "skills/subscriber-attention.ts",
    "skills/customer-summary.ts",
    "skills/next-action.ts",
  ];
  const forbidden = [
    "founder-curation-write",
    "commercial-write",
    "campaign-write",
    "founder-curation-route",
    "getSupabaseAdminClient",
    "repositories",
    "supabase.from",
  ];
  for (const file of files) {
    const src = readFileSync(resolve(import.meta.dirname, file), "utf8");
    for (const term of forbidden) {
      assert.ok(!src.includes(term), `${file} contém import proibido: ${term}`);
    }
  }
});
