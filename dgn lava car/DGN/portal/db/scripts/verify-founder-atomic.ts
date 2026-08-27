// Prova end-to-end que Gerar Founder é uma operação única e atômica: seed
// customer, chamar `crm_manage_founder_curation_v2` com create_invite (sem
// commercial-save prévio), verificar member/curadoria/snapshot/link/audit
// /interaction; alterar oferta (replace), confirmar revoke do link anterior e
// exatamente 1 novo link ativo; purgar via `crm_purge_test_founder` e conferir
// resíduo zero. Roda sem sleep/retry — se algum passo precisar de barrier, esse
// script deve falhar aqui (não em produção).

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createFounderPlanSnapshot } from "../../lib/founder-offer-catalog.ts";

type Json = Record<string, unknown>;

function loadEnv(path: string) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv(resolve(process.cwd(), ".env.test.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("[verify-founder-atomic] NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
  process.exit(2);
}

const headers = {
  apikey: serviceRoleKey,
  authorization: `Bearer ${serviceRoleKey}`,
  "content-type": "application/json",
  prefer: "return=representation",
} as const;

async function rest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...(init.headers as Json) } });
  const text = await response.text();
  if (!response.ok) throw new Error(`[${response.status}] ${path} :: ${text.slice(0, 400)}`);
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function assert(condition: unknown, message: string) {
  if (condition) return;
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function fmt(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

async function main() {
  const legacyId = `teste-founder-${randomBytes(8).toString("hex")}`;
  console.log(`[verify-founder-atomic] fixture=${legacyId}`);

  // ---------------------------------------------------------------------------
  // 1) seed customer
  // ---------------------------------------------------------------------------
  const seededRows = await rest<Array<{ id: string }>>("/rest/v1/crm_customers", {
    method: "POST",
    body: JSON.stringify({
      legacy_id: legacyId,
      name: "Cliente Teste Founder",
      normalized_name: "cliente teste founder",
      primary_phone: "+55 (11) 90000-0001",
      normalized_phone: "11900000001",
      origin: "verify-founder-atomic",
      data_quality_status: "ok",
      service_count: 12,
      historical_value: 1200,
      average_ticket: 100,
      average_interval_days: 25,
      last_service_at: new Date().toISOString().slice(0, 10),
      first_service_at: "2025-01-15",
    }),
  });
  const customerId = seededRows[0]?.id;
  assert(customerId, "customer criado devolve id");
  console.log(`  seed OK · customer_id=${customerId}`);

  const initialMembers = await rest<Array<{ id: string }>>(
    `/rest/v1/crm_campaign_members?select=id&customer_id=eq.${customerId}`,
  );
  assert(initialMembers.length === 0, "seed começa sem crm_campaign_members");

  // ---------------------------------------------------------------------------
  // 2) Chamar Gerar Founder direto — action=create_invite, sem commercial-save.
  //    Snapshot é construído localmente igual ao caminho real da rota.
  // ---------------------------------------------------------------------------
  const snapshot = createFounderPlanSnapshot("smart", "monthly", "hatch");
  assert(snapshot, "snapshot Smart/Mensal/Hatch precisa existir");

  const generatedResult = await rest<{ changed: boolean; customerId: string; campaign: Json }>(
    "/rest/v1/rpc/crm_manage_founder_curation_v2",
    {
      method: "POST",
      body: JSON.stringify({
        p_customer_legacy_id: legacyId,
        p_campaign_id: "founders-2026",
        p_action: "create_invite",
        p_plan_code: "smart",
        p_contracting_mode: "monthly",
        p_vehicle_category: "hatch",
        p_reason_internal: "verify-founder-atomic: primeira geração",
        p_message_public: "Convite Founder direto",
        p_plan_snapshot: snapshot,
        p_expected_updated_at: null,
        p_actor: "verify-founder-atomic",
      }),
    },
  );
  assert(generatedResult.changed === true, "create_invite retorna changed=true");
  const generatedCampaign = generatedResult.campaign as { bootstrapped?: boolean; slug?: string; planCode?: string };
  assert(generatedCampaign.bootstrapped === true, "campaign_members criado no bootstrap silencioso");
  assert(generatedCampaign.planCode === "smart", `planCode gravado === smart (atual: ${fmt(generatedCampaign.planCode)})`);
  const firstSlug = generatedCampaign.slug;
  assert(typeof firstSlug === "string" && firstSlug.startsWith("convite-"), "slug do link ativo retornado");

  // Verificações independentes por REST — não confiamos apenas no retorno RPC.
  const membersAfterGenerate = await rest<Array<{ id: string; recommended_plan_code: string; recommended_vehicle_category: string; recommendation_reason_internal: string; plan_snapshot: Json | null }>>(
    `/rest/v1/crm_campaign_members?select=id,recommended_plan_code,recommended_vehicle_category,recommendation_reason_internal,plan_snapshot&customer_id=eq.${customerId}`,
  );
  assert(membersAfterGenerate.length === 1, `exatamente 1 campaign_member (atual: ${membersAfterGenerate.length})`);
  const memberId = membersAfterGenerate[0].id;
  assert(membersAfterGenerate[0].recommended_plan_code === "smart", "curadoria salvou plano smart");
  assert(membersAfterGenerate[0].recommended_vehicle_category === "hatch", "curadoria salvou categoria hatch");
  assert(
    membersAfterGenerate[0].recommendation_reason_internal === "verify-founder-atomic: primeira geração",
    "curadoria salvou motivo interno",
  );
  const savedSnapshot = membersAfterGenerate[0].plan_snapshot as Json | null;
  assert(savedSnapshot?.planCode === "smart" && savedSnapshot?.contractingMode === "monthly", "snapshot persistido");
  assert(savedSnapshot?.monthlyPrice === 130, `snapshot monthlyPrice=130 (atual: ${fmt(savedSnapshot?.monthlyPrice)})`);

  const linksAfterGenerate = await rest<Array<{ id: string; slug: string; enabled: boolean; version: number }>>(
    `/rest/v1/crm_founder_public_links?select=id,slug,enabled,version&campaign_member_id=eq.${memberId}`,
  );
  const activeAfterGenerate = linksAfterGenerate.filter((row) => row.enabled === true);
  assert(activeAfterGenerate.length === 1, `exatamente 1 link ativo pós-generate (atual: ${activeAfterGenerate.length})`);
  assert(activeAfterGenerate[0].slug === firstSlug, "slug ativo bate com retorno RPC");

  const interactionsAfterGenerate = await rest<Array<{ interaction_type: string }>>(
    `/rest/v1/crm_interactions?select=interaction_type&customer_id=eq.${customerId}`,
  );
  assert(interactionsAfterGenerate.length === 1, "1 interaction registrada");
  assert(interactionsAfterGenerate[0].interaction_type === "convite_criado", "interaction=convite_criado");

  const auditAfterGenerate = await rest<Array<{ action: string; entity_id: string }>>(
    `/rest/v1/crm_audit_logs?select=action,entity_id&entity_id=eq.${memberId}`,
  );
  assert(auditAfterGenerate.length === 1, "1 audit log registrado");
  assert(auditAfterGenerate[0].action === "founder_curation.create_invite", "audit action=founder_curation.create_invite");

  console.log("  create_invite atômico OK · member+curadoria+snapshot+link+interaction+audit em uma transação");

  // ---------------------------------------------------------------------------
  // 3) Alterar oferta — action=replace, novo plano Priority
  // ---------------------------------------------------------------------------
  const membersRow = await rest<Array<{ updated_at: string }>>(
    `/rest/v1/crm_campaign_members?select=updated_at&id=eq.${memberId}`,
  );
  const expectedUpdatedAt = membersRow[0].updated_at;
  const replacementSnapshot = createFounderPlanSnapshot("priority", "monthly", "hatch");

  const replaceResult = await rest<{ changed: boolean; campaign: Json }>(
    "/rest/v1/rpc/crm_manage_founder_curation_v2",
    {
      method: "POST",
      body: JSON.stringify({
        p_customer_legacy_id: legacyId,
        p_campaign_id: "founders-2026",
        p_action: "replace",
        p_plan_code: "priority",
        p_contracting_mode: "monthly",
        p_vehicle_category: "hatch",
        p_reason_internal: "verify-founder-atomic: upgrade smart → priority",
        p_message_public: "Novo convite Founder",
        p_plan_snapshot: replacementSnapshot,
        p_expected_updated_at: expectedUpdatedAt,
        p_actor: "verify-founder-atomic",
      }),
    },
  );
  assert(replaceResult.changed === true, "replace retorna changed=true");
  const replaceCampaign = replaceResult.campaign as { slug?: string; planCode?: string };
  assert(replaceCampaign.planCode === "priority", `planCode gravado === priority (atual: ${fmt(replaceCampaign.planCode)})`);
  const secondSlug = replaceCampaign.slug;
  assert(typeof secondSlug === "string" && secondSlug !== firstSlug, "slug do novo link difere do anterior");

  const linksAfterReplace = await rest<Array<{ slug: string; enabled: boolean; revoked_at: string | null }>>(
    `/rest/v1/crm_founder_public_links?select=slug,enabled,revoked_at&campaign_member_id=eq.${memberId}&order=version.asc`,
  );
  const revokedRow = linksAfterReplace.find((row) => row.slug === firstSlug);
  assert(revokedRow && revokedRow.enabled === false, "link anterior revogado (enabled=false)");
  assert(revokedRow?.revoked_at, "revoked_at populado no link anterior");
  const activeAfterReplace = linksAfterReplace.filter((row) => row.enabled === true);
  assert(activeAfterReplace.length === 1, `exatamente 1 link ativo pós-replace (atual: ${activeAfterReplace.length})`);
  assert(activeAfterReplace[0].slug === secondSlug, "único link ativo é o novo slug");

  console.log("  replace atômico OK · link anterior revogado, novo link ativo, sem sleep/retry");

  // ---------------------------------------------------------------------------
  // 4) purge via crm_purge_test_founder + confirmar resíduo zero
  // ---------------------------------------------------------------------------
  await rest("/rest/v1/rpc/crm_purge_test_founder", {
    method: "POST",
    body: JSON.stringify({ p_legacy_id: legacyId }),
  });

  const residualCustomer = await rest<Array<{ id: string }>>(
    `/rest/v1/crm_customers?select=id&legacy_id=eq.${encodeURIComponent(legacyId)}`,
  );
  assert(residualCustomer.length === 0, "customer removido pelo purge");
  const residualMembers = await rest<Array<{ id: string }>>(
    `/rest/v1/crm_campaign_members?select=id&id=eq.${memberId}`,
  );
  assert(residualMembers.length === 0, "campaign_member removido pelo purge");
  const residualLinks = await rest<Array<{ id: string }>>(
    `/rest/v1/crm_founder_public_links?select=id&campaign_member_id=eq.${memberId}`,
  );
  assert(residualLinks.length === 0, "links removidos pelo purge");
  const residualInteractions = await rest<Array<{ id: string }>>(
    `/rest/v1/crm_interactions?select=id&customer_id=eq.${customerId}`,
  );
  assert(residualInteractions.length === 0, "interactions removidas pelo purge");
  const residualAudit = await rest<Array<{ id: string }>>(
    `/rest/v1/crm_audit_logs?select=id&entity_id=eq.${memberId}`,
  );
  assert(residualAudit.length === 0, "audit removido pelo purge");

  console.log("  purge OK · resíduo zero");
  console.log("[verify-founder-atomic] SUCCESS");
}

main().catch((error) => {
  console.error("[verify-founder-atomic] FAIL:", error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
