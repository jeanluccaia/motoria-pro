import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";

// Persistência do audit usa o mesmo client injetado — para permitir teste com
// fake e para nunca depender de `getSupabaseAdminClient()` fora da fronteira
// pública deste módulo (audit.ts reconecta e falha em unit test sem env).
async function auditInline(
  db: SupabaseClient,
  entry: {
    entityType: "customer";
    entityId: string;
    action: string;
    previousValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    actor: string;
    reason?: string | null;
  },
) {
  const { error } = await db.from("crm_audit_logs").insert({
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    previous_value: entry.previousValue ?? null,
    new_value: entry.newValue ?? null,
    actor: entry.actor,
    reason: entry.reason ?? null,
  });
  if (error) throw new PortalAccessError(`Falha ao gravar audit_log: ${JSON.stringify(error)}`, 502);
}

// -----------------------------------------------------------------------------
// Módulo central do provisionamento do Portal do Assinante.
//
// Cobre 3 operações, todas server-only e idempotentes:
//   - provisionPortalAccess: cria Auth user (se necessário), cria vínculo
//     crm_customer_auth 1:1, seta portal_beta_enabled=true, grava e-mail real,
//     audita e dispara magic link.
//   - resendPortalAccess: reaproveita Auth user + vínculo existente e apenas
//     dispara novo magic link.
//   - disablePortalAccess: apenas fecha o gate (portal_beta_enabled=false).
//     Não remove Auth user nem vínculo, para permitir reabertura sem duplicar.
//
// A UI passa `customerId` como aparece na ficha (legacy_id ou UUID puro). O
// resolveCustomer aceita os dois.
//
// Segurança:
//   - Service role permanece server-side (getSupabaseAdminClient).
//   - Nunca retorna tokens/URLs de magic link ao browser.
//   - Bloqueia colisão de e-mail entre customers.
//   - Bloqueia auth user já linkado a outro customer.
// -----------------------------------------------------------------------------

export class PortalAccessError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export interface PortalAccessStatus {
  enabled: boolean;
  emailMasked: string | null;
  hasAuth: boolean;
  hasSubscription: boolean;
  betaEnabledAt: string | null;
}

export interface PortalAccessMagicLinkSender {
  (email: string): Promise<{ ok: boolean; status: number }>;
}

interface CustomerRow {
  id: string;
  legacy_id: string | null;
  name: string;
  email: string | null;
  portal_beta_enabled: boolean;
  portal_beta_enabled_at: string | null;
}

// Regex conservadora — mesma família da que valida no form /entrar do Portal.
// Não pretendemos aceitar edge cases exóticos (com aspas, comentários RFC 5322);
// esse fluxo é operado por Digo com clientes reais, não por parser adversarial.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: unknown): string {
  if (typeof raw !== "string") throw new PortalAccessError("E-mail é obrigatório.", 400);
  const clean = raw.trim().toLowerCase();
  if (!clean) throw new PortalAccessError("E-mail é obrigatório.", 400);
  if (clean.length > 200) throw new PortalAccessError("E-mail muito longo.", 400);
  if (!EMAIL_REGEX.test(clean)) throw new PortalAccessError("Formato de e-mail inválido.", 400);
  return clean;
}

export function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  const head = local.length <= 2 ? local[0] ?? "" : local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, local.length - head.length))}@${domain}`;
}

async function resolveCustomer(db: SupabaseClient, customerId: string): Promise<CustomerRow> {
  if (!customerId || customerId.length > 200) throw new PortalAccessError("Cliente inválido.", 400);

  // Tenta primeiro por legacy_id; se não achar, tenta por UUID puro. Os 11
  // assinantes PagBank misturam ambos (ex.: Daniela → legacy_id, Bruno → só id).
  const table = db.from("crm_customers");
  const byLegacy = await table.select("id, legacy_id, name, email, portal_beta_enabled, portal_beta_enabled_at").eq("legacy_id", customerId).maybeSingle();
  if (byLegacy.error && byLegacy.error.code !== "PGRST116") {
    throw new PortalAccessError(`Falha ao localizar cliente: ${byLegacy.error.message}`, 502);
  }
  if (byLegacy.data) return byLegacy.data as CustomerRow;

  // Se não parece UUID, para aqui — evita expor erros de banco a inputs bobos.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)) {
    throw new PortalAccessError("Cliente não encontrado.", 404);
  }
  const byId = await table.select("id, legacy_id, name, email, portal_beta_enabled, portal_beta_enabled_at").eq("id", customerId).maybeSingle();
  if (byId.error && byId.error.code !== "PGRST116") {
    throw new PortalAccessError(`Falha ao localizar cliente: ${byId.error.message}`, 502);
  }
  if (!byId.data) throw new PortalAccessError("Cliente não encontrado.", 404);
  return byId.data as CustomerRow;
}

async function customerHasSubscription(db: SupabaseClient, customerId: string): Promise<boolean> {
  const { count, error } = await db.from("crm_subscriptions").select("id", { count: "exact", head: true }).eq("customer_id", customerId);
  if (error) throw new PortalAccessError(`Falha ao verificar assinatura: ${error.message}`, 502);
  return (count ?? 0) > 0;
}

async function findAuthUserIdByEmail(db: SupabaseClient, email: string): Promise<string | null> {
  // service_role bypassa RLS e tem SELECT em auth.* — leitura direta é mais
  // barata e determinística que auth.admin.listUsers (que pagina e não filtra).
  const { data, error } = await db.schema("auth" as never).from("users").select("id").eq("email", email).maybeSingle();
  if (error && error.code !== "PGRST116") {
    throw new PortalAccessError(`Falha ao consultar Auth: ${error.message}`, 502);
  }
  return (data as { id: string } | null)?.id ?? null;
}

async function findLinkByAuthUser(db: SupabaseClient, authUserId: string): Promise<{ customer_id: string } | null> {
  const { data, error } = await db.from("crm_customer_auth").select("customer_id").eq("auth_user_id", authUserId).maybeSingle();
  if (error && error.code !== "PGRST116") throw new PortalAccessError(`Falha ao consultar vínculo: ${error.message}`, 502);
  return data as { customer_id: string } | null;
}

async function findLinkByCustomer(db: SupabaseClient, customerId: string): Promise<{ auth_user_id: string } | null> {
  const { data, error } = await db.from("crm_customer_auth").select("auth_user_id").eq("customer_id", customerId).maybeSingle();
  if (error && error.code !== "PGRST116") throw new PortalAccessError(`Falha ao consultar vínculo: ${error.message}`, 502);
  return data as { auth_user_id: string } | null;
}

async function findCustomerByEmail(db: SupabaseClient, email: string, excludeId: string): Promise<string | null> {
  const { data, error } = await db.from("crm_customers").select("id").eq("email", email).neq("id", excludeId).limit(1);
  if (error) throw new PortalAccessError(`Falha ao verificar e-mail: ${error.message}`, 502);
  const row = (data as { id: string }[])[0];
  return row?.id ?? null;
}

// -----------------------------------------------------------------------------
// Envio do magic link — replica exatamente o fluxo público do form /entrar do
// Portal (POST /auth/v1/otp com create_user=false). O user já foi provisionado
// via admin API, então a chamada é apenas o disparo do e-mail via SMTP Supabase.
// -----------------------------------------------------------------------------

export function defaultMagicLinkSender(): PortalAccessMagicLinkSender {
  return async (email: string) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !anon) {
      throw new PortalAccessError("Envio do magic link não configurado (falta NEXT_PUBLIC_SUPABASE_URL/ANON_KEY).", 500);
    }
    const redirect = `${process.env.DGN_PORTAL_ORIGIN?.trim() || "https://app.dgnclub.com"}/auth/callback?next=%2Fdashboard`;
    const response = await fetch(`${url}/auth/v1/otp`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email, create_user: false, options: { email_redirect_to: redirect } }),
    });
    return { ok: response.ok, status: response.status };
  };
}

// -----------------------------------------------------------------------------
// Leitura
// -----------------------------------------------------------------------------

export async function readPortalAccessStatus(
  customerId: string,
  db: SupabaseClient = getSupabaseAdminClient("portal-access.read"),
): Promise<PortalAccessStatus> {
  const customer = await resolveCustomer(db, customerId);
  const link = await findLinkByCustomer(db, customer.id);
  const hasSubscription = await customerHasSubscription(db, customer.id);
  return {
    enabled: customer.portal_beta_enabled,
    emailMasked: maskEmail(customer.email),
    hasAuth: Boolean(link),
    hasSubscription,
    betaEnabledAt: customer.portal_beta_enabled_at,
  };
}

// -----------------------------------------------------------------------------
// Provisionamento
// -----------------------------------------------------------------------------

export interface ProvisionInput {
  customerId: string;
  email: string;
  actor: string;
  db?: SupabaseClient;
  sendMagicLink?: PortalAccessMagicLinkSender;
}

export interface ProvisionResult {
  customerId: string;
  authUserId: string;
  emailMasked: string;
  magicLinkSent: boolean;
  reused: boolean;
}

export async function provisionPortalAccess(input: ProvisionInput): Promise<ProvisionResult> {
  const db = input.db ?? getSupabaseAdminClient("portal-access.provision");
  const email = normalizeEmail(input.email);
  const customer = await resolveCustomer(db, input.customerId);

  if (!(await customerHasSubscription(db, customer.id))) {
    throw new PortalAccessError("Cliente sem assinatura ativa — não é possível liberar o Portal.", 409);
  }

  const conflictCustomer = await findCustomerByEmail(db, email, customer.id);
  if (conflictCustomer) throw new PortalAccessError("Este e-mail já está associado a outro cliente.", 409);

  // 1) Auth user
  let authUserId = await findAuthUserIdByEmail(db, email);
  let reusedAuth = Boolean(authUserId);

  if (authUserId) {
    const otherLink = await findLinkByAuthUser(db, authUserId);
    if (otherLink && otherLink.customer_id !== customer.id) {
      throw new PortalAccessError("Este e-mail já pertence a outro assinante do Portal.", 409);
    }
  } else {
    const adminAuth = (db as unknown as { auth: { admin: { createUser(payload: { email: string; email_confirm: boolean; user_metadata?: Record<string, unknown> }): Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }> } } }).auth.admin;
    const created = await adminAuth.createUser({
      email,
      email_confirm: true,
      user_metadata: { provisioned_by: "dgn-growth-portal-access" },
    });
    if (created.error || !created.data.user) {
      throw new PortalAccessError(`Falha ao criar Auth user: ${created.error?.message ?? "sem detalhe"}`, 502);
    }
    authUserId = created.data.user.id;
  }

  // 2) Vínculo crm_customer_auth — idempotente
  const existingByCustomer = await findLinkByCustomer(db, customer.id);
  if (existingByCustomer && existingByCustomer.auth_user_id !== authUserId) {
    throw new PortalAccessError(
      "Cliente já tem outro Auth vinculado. Peça revisão antes de liberar novo acesso.",
      409,
    );
  }
  if (!existingByCustomer) {
    const { error } = await db.from("crm_customer_auth").insert({
      auth_user_id: authUserId,
      customer_id: customer.id,
    });
    if (error) throw new PortalAccessError(`Falha ao criar vínculo: ${error.message}`, 502);
  }

  // 3) Persistir e-mail real do cliente + gate
  const emailChanged = customer.email !== email;
  const betaChanged = !customer.portal_beta_enabled;
  const update = await db.from("crm_customers")
    .update({
      email,
      portal_beta_enabled: true,
      portal_beta_enabled_at: customer.portal_beta_enabled_at ?? new Date().toISOString(),
    })
    .eq("id", customer.id)
    .select("email, portal_beta_enabled, portal_beta_enabled_at")
    .single();
  if (update.error) throw new PortalAccessError(`Falha ao habilitar Portal: ${update.error.message}`, 502);

  // 4) Audit
  await auditInline(db, {
    entityType: "customer",
    entityId: customer.id,
    action: "portal_access.granted",
    previousValue: {
      email_masked: maskEmail(customer.email),
      portal_beta_enabled: customer.portal_beta_enabled,
      had_auth_link: Boolean(existingByCustomer),
    },
    newValue: {
      email_masked: maskEmail(email),
      portal_beta_enabled: true,
      auth_user_reused: reusedAuth,
      email_changed: emailChanged,
      beta_changed: betaChanged,
    },
    actor: input.actor || "dgn-admin",
    reason: reusedAuth ? "Auth user existente reutilizado." : "Novo Auth user provisionado.",
  });

  // 5) Envio do magic link — falhas não desfazem o provisionamento (o operador
  // pode simplesmente clicar "Reenviar acesso"). Apenas sinalizamos.
  const send = input.sendMagicLink ?? defaultMagicLinkSender();
  let magicLinkSent = false;
  try {
    const dispatch = await send(email);
    magicLinkSent = dispatch.ok;
    if (!dispatch.ok) {
      console.warn("[portal-access] magic link dispatch returned non-2xx", dispatch.status);
    }
  } catch (error) {
    console.error("[portal-access] magic link dispatch threw", error instanceof Error ? error.message : "erro");
  }

  return {
    customerId: customer.id,
    authUserId,
    emailMasked: maskEmail(email) ?? "",
    magicLinkSent,
    reused: reusedAuth,
  };
}

// -----------------------------------------------------------------------------
// Reenvio
// -----------------------------------------------------------------------------

export async function resendPortalAccess(
  customerId: string,
  actor: string,
  db: SupabaseClient = getSupabaseAdminClient("portal-access.resend"),
  send: PortalAccessMagicLinkSender = defaultMagicLinkSender(),
): Promise<{ magicLinkSent: boolean; emailMasked: string }> {
  const customer = await resolveCustomer(db, customerId);
  if (!customer.email) throw new PortalAccessError("Cliente ainda não tem e-mail cadastrado. Use 'Liberar acesso'.", 409);
  if (!customer.portal_beta_enabled) throw new PortalAccessError("Portal desativado para este cliente. Reative antes de reenviar.", 409);
  const link = await findLinkByCustomer(db, customer.id);
  if (!link) throw new PortalAccessError("Vínculo Auth ausente. Use 'Liberar acesso' novamente.", 409);

  const dispatch = await send(customer.email);
  const magicLinkSent = dispatch.ok;

  await auditInline(db, {
    entityType: "customer",
    entityId: customer.id,
    action: "portal_access.resent",
    newValue: { email_masked: maskEmail(customer.email), dispatch_status: dispatch.status },
    actor: actor || "dgn-admin",
  });

  return { magicLinkSent, emailMasked: maskEmail(customer.email) ?? "" };
}

// -----------------------------------------------------------------------------
// Desabilitar
// -----------------------------------------------------------------------------

export async function disablePortalAccess(
  customerId: string,
  actor: string,
  db: SupabaseClient = getSupabaseAdminClient("portal-access.disable"),
): Promise<{ enabled: boolean }> {
  const customer = await resolveCustomer(db, customerId);
  if (!customer.portal_beta_enabled) return { enabled: false };

  const update = await db.from("crm_customers")
    .update({ portal_beta_enabled: false })
    .eq("id", customer.id)
    .select("portal_beta_enabled")
    .single();
  if (update.error) throw new PortalAccessError(`Falha ao desabilitar Portal: ${update.error.message}`, 502);

  await auditInline(db, {
    entityType: "customer",
    entityId: customer.id,
    action: "portal_access.disabled",
    previousValue: { portal_beta_enabled: true },
    newValue: { portal_beta_enabled: false },
    actor: actor || "dgn-admin",
  });

  return { enabled: false };
}
