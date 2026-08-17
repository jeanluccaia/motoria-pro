#!/usr/bin/env node
/**
 * ETAPA 9 — vencimentos dos 4 primeiros assinantes reais.
 *
 * Depende da migration 20260817180000_subscriber_portal.sql (colunas
 * billing_due_at, billing_due_source, billing_status,
 * payment_verification_status em crm_subscriptions).
 *
 * Grava, de forma auditada:
 *   - Rikardo Oliveira (Nº003): billing_due_at 2026-10-05
 *   - Benedito Constantino (Nº001): billing_due_at 2026-12-31
 *   - José Moreira (Nº002): billing_due_at 2026-12-31
 *   - Wellington Felix: INSERT crm_subscriptions Priority + billing_due_at 2026-12-31
 *
 * Nenhum dos 4 recebe billing_status='paid' nem
 * payment_verification_status positivo — condição "Pago" da planilha é
 * informação da gestão, não confirmação do provedor. Portal exibe
 * "Pagamento em verificação".
 *
 * Whitelist rígida por customer_id. Sem toque em nome, telefone,
 * Founder, campaign_members, tracking.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}
const MODE = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--dry-run")
  ? "dry-run"
  : null;
if (!MODE) {
  console.error("usage: apply-batch1-billing.mjs --dry-run | --apply");
  process.exit(2);
}

const ACTOR = "etapa-9-billing-batch1:claude-code";
const ORIGIN = "ASSINANTES_ATIVOS_4UCAR_2026-08-16.xlsx";
const REASON =
  "ETAPA 9 vencimentos batch1 — valores aprovados no dry-run 6053f1c.";

const RIKARDO = "cb55686f-29dc-470d-8ce3-cf271ecbebac";
const BENEDITO = "c4debcc9-3a79-4d6b-820f-bbfcf0d41cdf";
const JOSE = "7c54d056-e1aa-487e-a579-382460c24aaf";
const WELLINGTON = "2fc9edee-d3cd-4365-af5a-ac02c1ccb0bb";
const WHITELIST = new Set([RIKARDO, BENEDITO, JOSE, WELLINGTON]);

// Valores exatamente como aprovados no dry-run.
const PLAN = {
  [RIKARDO]:    { billing_due_at: "2026-10-05T00:00:00-03:00", plan: "Priority" },
  [BENEDITO]:   { billing_due_at: "2026-12-31T00:00:00-03:00", plan: "Priority" },
  [JOSE]:       { billing_due_at: "2026-12-31T00:00:00-03:00", plan: "Smart" },
  [WELLINGTON]: { billing_due_at: "2026-12-31T00:00:00-03:00", plan: "Priority" },
};

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getSubscription(customer_id) {
  const { data, error } = await supabase
    .from("crm_subscriptions")
    .select(
      "id,customer_id,subscription_plan,subscription_cycle,subscription_status,is_active_subscriber,billing_due_at,billing_due_source,billing_status,payment_method_label,payment_verification_status,cycle_started_at,cycle_ends_at,updated_at,source_reference,notes",
    )
    .eq("customer_id", customer_id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(`${customer_id} read subscription: ${error.message}`);
  return data && data.length > 0 ? data[0] : null;
}

async function preflight() {
  const state = {};
  for (const id of WHITELIST) state[id] = await getSubscription(id);

  if (!state[RIKARDO]) throw new Error("Rikardo sem crm_subscriptions");
  if (state[RIKARDO].subscription_plan !== "Priority")
    throw new Error(`Rikardo plano divergiu: ${state[RIKARDO].subscription_plan}`);

  if (!state[BENEDITO]) throw new Error("Benedito sem crm_subscriptions");
  if (state[BENEDITO].subscription_plan !== "Priority")
    throw new Error(`Benedito plano divergiu: ${state[BENEDITO].subscription_plan}`);

  if (!state[JOSE]) throw new Error("José sem crm_subscriptions");
  if (state[JOSE].subscription_plan !== "Smart")
    throw new Error(`José plano divergiu: ${state[JOSE].subscription_plan}`);

  if (state[WELLINGTON])
    throw new Error(
      "Wellington já tem crm_subscriptions — o applier vai duplicar. Aborte antes.",
    );

  // Nenhum dos existentes já deve ter billing_due_at gravado (idempotência guard)
  for (const [id, sub] of Object.entries(state)) {
    if (!sub) continue;
    if (sub.billing_due_at !== null) {
      throw new Error(
        `${id} já tem billing_due_at=${sub.billing_due_at}; abortando para não sobrescrever.`,
      );
    }
  }

  return state;
}

function buildUpdate(customer_id, sub) {
  const target = PLAN[customer_id];
  const before = {
    billing_due_at: sub.billing_due_at,
    billing_due_source: sub.billing_due_source,
    billing_status: sub.billing_status,
    payment_method_label: sub.payment_method_label,
    payment_verification_status: sub.payment_verification_status,
  };
  const after = {
    billing_due_at: target.billing_due_at,
    billing_due_source: `4uCar:${ORIGIN}`,
    // 'active' (assinatura seguindo) — condição "Pago" da planilha NÃO
    // torna billing_status='paid'. Portal usará payment_verification_status
    // 'not_verified' para exibir "em verificação".
    billing_status: "active",
    payment_method_label: null,
    payment_verification_status: "not_verified",
  };
  return {
    table: "crm_subscriptions",
    operation: "update",
    where: { id: sub.id, customer_id },
    before,
    after,
    reason: "vencimento informado pela planilha (não é confirmação financeira)",
  };
}

function buildInsertForWellington() {
  const target = PLAN[WELLINGTON];
  const values = {
    customer_id: WELLINGTON,
    subscription_plan: target.plan,
    subscription_cycle: "não identificado",
    subscription_status: "detectado",
    subscription_source: "Importação",
    is_active_subscriber: false,
    billing_due_at: target.billing_due_at,
    billing_due_source: `4uCar:${ORIGIN}`,
    billing_status: "active",
    payment_verification_status: "not_verified",
    source_reference: "4uCar/planilha_2026-08-16",
    notes:
      "Assinatura detectada pela planilha 4uCar. Vencimento informado pela gestão; sem confirmação financeira.",
  };
  return { table: "crm_subscriptions", operation: "insert", values };
}

async function applyOne(customer_id, sub) {
  if (customer_id === WELLINGTON) {
    const payload = buildInsertForWellington();
    if (MODE === "dry-run") return { intent: payload };
    const { data: inserted, error } = await supabase
      .from("crm_subscriptions")
      .insert(payload.values)
      .select("id")
      .single();
    if (error) throw new Error(`insert Wellington sub: ${error.message}`);
    const { error: aerr } = await supabase.from("crm_audit_logs").insert({
      entity_type: "crm_subscriptions",
      entity_id: inserted.id,
      action: "subscription_created_from_spreadsheet",
      previous_value: null,
      new_value: { id: inserted.id, ...payload.values },
      actor: ACTOR,
      reason: REASON,
    });
    if (aerr) throw new Error(`audit Wellington insert: ${aerr.message}`);
    return { applied: { ...payload, inserted_id: inserted.id } };
  }

  const payload = buildUpdate(customer_id, sub);
  if (MODE === "dry-run") return { intent: payload };

  const { error: uerr } = await supabase
    .from("crm_subscriptions")
    .update(payload.after)
    .eq("id", sub.id)
    .eq("customer_id", customer_id)
    .is("billing_due_at", null);
  if (uerr) throw new Error(`update sub ${customer_id}: ${uerr.message}`);

  const { error: aerr } = await supabase.from("crm_audit_logs").insert({
    entity_type: "crm_subscriptions",
    entity_id: sub.id,
    action: "billing_due_set_from_spreadsheet",
    previous_value: payload.before,
    new_value: payload.after,
    actor: ACTOR,
    reason: REASON,
  });
  if (aerr) throw new Error(`audit ${customer_id}: ${aerr.message}`);

  return { applied: payload };
}

async function verifyAfter() {
  const rows = {};
  for (const id of WHITELIST) {
    const s = await getSubscription(id);
    rows[id] = s
      ? {
          plan: s.subscription_plan,
          billing_due_at: s.billing_due_at,
          billing_due_source: s.billing_due_source,
          billing_status: s.billing_status,
          payment_verification_status: s.payment_verification_status,
        }
      : null;
  }
  return rows;
}

process.stderr.write(`[apply-billing] mode=${MODE}\n`);
const state = await preflight();
process.stderr.write(`[apply-billing] pré-voo OK\n`);
const results = {
  mode: MODE,
  actor: ACTOR,
  origin: ORIGIN,
  rikardo: await applyOne(RIKARDO, state[RIKARDO]),
  benedito: await applyOne(BENEDITO, state[BENEDITO]),
  jose: await applyOne(JOSE, state[JOSE]),
  wellington: await applyOne(WELLINGTON, state[WELLINGTON]),
  verification: MODE === "apply" ? await verifyAfter() : null,
};
process.stdout.write(JSON.stringify(results, null, 2));
process.stderr.write(`\n[apply-billing] done\n`);
