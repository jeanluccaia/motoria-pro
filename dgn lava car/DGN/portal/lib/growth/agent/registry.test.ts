import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AGENT_SKILL_REGISTRY,
  getSkillsByMode,
  isNoWriteRegistry,
  isReadOnlyRegistry,
} from "./registry.ts";

// -----------------------------------------------------------------------------
// Garantias estáticas do registry:
// 1. Runtime: todo skill declara mode read_only OU prepare_only. `write` banido.
// 2. Fase 1.5: as 6 skills read-only originais continuam presentes.
// 3. Fase 2: as 6 skills prepare_only estão presentes com mode correto.
// 4. Source: nenhum arquivo em skills/ importa camada de escrita/mutação —
//    prova barata que reprova alguém adicionando side-effect sem sinalizar.
// -----------------------------------------------------------------------------

test("registry rejeita mode write — só read_only, prepare_only ou record_only", () => {
  assert.ok(isNoWriteRegistry(), "registry deve conter apenas read_only, prepare_only ou record_only");
  const modes = new Set(AGENT_SKILL_REGISTRY.map((s) => s.mode));
  assert.ok(!modes.has("write" as never), "mode write BANIDO");
});

test("Fundação — 3 skills record_only registradas", () => {
  const recordOnly = getSkillsByMode("record_only").map((s) => s.name);
  const expected = ["record_opportunity", "record_alert", "record_campaign_draft"];
  for (const name of expected) {
    assert.ok(recordOnly.includes(name), `skill record_only faltando: ${name}`);
  }
  assert.equal(recordOnly.length, 3, "exatamente 3 skills record_only nesta fase");
});

test("Fase 1.5 + Portal readiness — 9 skills read_only registradas", () => {
  const readOnly = getSkillsByMode("read_only").map((s) => s.name);
  const expected = [
    "get_daily_briefing",
    "get_founder_attention",
    "get_curation_opportunities",
    "get_subscriber_attention",
    "get_customer_summary",
    "suggest_next_action",
    "get_founder_metrics",
    "get_subscriber_portal_readiness",
    "get_portal_access_issues",
  ];
  for (const name of expected) assert.ok(readOnly.includes(name), `skill read_only faltando: ${name}`);
  // isReadOnlyRegistry compat: passa a ser false porque temos prepare_only. Este
  // caso documenta a mudança para que testes antigos que dependiam disso não
  // regridam por engano.
  assert.equal(isReadOnlyRegistry(), false, "registry passou a incluir prepare_only");
});

test("Fase 2 — 6 skills prepare_only registradas", () => {
  const prepareOnly = getSkillsByMode("prepare_only").map((s) => s.name);
  const expected = [
    "prepare_followup_message",
    "prepare_founder_approach",
    "prepare_renewal_message",
    "prepare_customer_contact",
    "prepare_curation_brief",
    "prepare_daily_attack_plan",
  ];
  for (const name of expected) assert.ok(prepareOnly.includes(name), `skill prepare_only faltando: ${name}`);
});

test("skills record_only só importam writers do Agent Core — nunca CRM/supabase direto", () => {
  const files = [
    "skills/record-action.ts",
    "skills/record-opportunity-skill.ts",
    "skills/record-alert-skill.ts",
    "skills/record-campaign-draft-skill.ts",
  ];
  // record_only PODE importar agent-actions-write / agent-campaigns-write via
  // o AgentWriter facade na AgentContext — mas NÃO pode importar camada de
  // escrita de crm_* nem alcançar Supabase direto nem enviar comunicação.
  const forbidden = [
    "founder-curation-write",
    "commercial-write",
    "campaign-write",
    "founder-curation-route",
    "getSupabaseAdminClient",
    "repositories",
    "supabase.from",
    "buildWhatsappUrl",
    "fetch(",
  ];
  for (const file of files) {
    const src = readFileSync(resolve(import.meta.dirname, file), "utf8");
    for (const term of forbidden) {
      assert.ok(!src.includes(term), `${file} contém termo proibido: ${term}`);
    }
  }
});

test("nenhum arquivo em skills/ importa camada de escrita do Growth", () => {
  const files = [
    // Fase 1.5 + hotfix (read_only)
    "skills/daily-briefing.ts",
    "skills/founder-attention.ts",
    "skills/curation-opportunities.ts",
    "skills/subscriber-attention.ts",
    "skills/customer-summary.ts",
    "skills/next-action.ts",
    "skills/founder-metrics-skill.ts",
    "skills/portal-readiness.ts",
    // Fase 2 (prepare_only) — geram texto, não podem importar mutação.
    "skills/prepare-followup-message.ts",
    "skills/prepare-founder-approach.ts",
    "skills/prepare-renewal-message.ts",
    "skills/prepare-customer-contact.ts",
    "skills/prepare-curation-brief.ts",
    "skills/prepare-daily-attack-plan.ts",
  ];
  const forbidden = [
    "founder-curation-write",
    "commercial-write",
    "campaign-write",
    "founder-curation-route",
    "getSupabaseAdminClient",
    "repositories",
    "supabase.from",
    // Também bloqueia envio direto de WhatsApp/HTTP fetch.
    "buildWhatsappUrl",
    "fetch(",
  ];
  for (const file of files) {
    const src = readFileSync(resolve(import.meta.dirname, file), "utf8");
    for (const term of forbidden) {
      assert.ok(!src.includes(term), `${file} contém termo proibido: ${term}`);
    }
  }
});
