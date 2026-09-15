import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";
import { CustomerResolutionError, resolveCustomerId } from "./customer-resolver.ts";
import { normalizePhone } from "./profile-editor-write.ts";
import {
  buildPortalWhatsAppInvite,
  DEFAULT_PORTAL_LOGIN_URL,
  PORTAL_INVITE_TEMPLATE_VERSION,
  WhatsAppInviteError,
  type PortalWhatsAppInvite,
} from "../whatsapp-invite.ts";

// -----------------------------------------------------------------------------
// prepareWhatsAppInvite (Fatia 2C):
//   * Só o servidor decide número/e-mail — cliente manda apenas customerId.
//   * Valida portal habilitado + e-mail + telefone canônico.
//   * Normaliza telefone reutilizando o helper canônico (profile-editor-write).
//   * Chama o helper puro para montar a URL do wa.me.
//   * Registra crm_interactions.whatsapp_aberto com metadata mínima
//     (destination_last4, purpose, portal_url, template). Semântica: o operador
//     ABRIU o convite; nunca afirma que a mensagem foi enviada/recebida.
//   * Não inclui token/JWT/customer_id/dados PagBank na URL (garantido pelo
//     helper + testes do módulo).
// -----------------------------------------------------------------------------

export class PortalInviteError extends Error {
  readonly status: number;
  readonly code: "portal_disabled" | "no_email" | "no_phone" | "invalid_phone" | "not_found" | "unauthorized" | "internal";
  constructor(message: string, status: number, code: PortalInviteError["code"]) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface PortalInviteReadiness {
  ready: boolean;
  reason: null | PortalInviteError["code"];
  portalEnabled: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  emailMasked: string | null;
  phoneDisplay: string | null;
}

export interface PrepareInviteInput {
  customerId: string;
  actor: string;
  portalLoginUrl?: string;
  db?: SupabaseClient;
}

export interface PreparedInvite extends PortalWhatsAppInvite {
  customerName: string;
}

interface CustomerReadRow {
  id: string;
  name: string | null;
  email: string | null;
  primary_phone: string | null;
  normalized_phone: string | null;
  portal_beta_enabled: boolean;
}

async function readCustomerForInvite(db: SupabaseClient, id: string): Promise<CustomerReadRow> {
  const { data, error } = await db
    .from("crm_customers")
    .select("id, name, email, primary_phone, normalized_phone, portal_beta_enabled")
    .eq("id", id)
    .maybeSingle();
  if (error && error.code !== "PGRST116") {
    throw new PortalInviteError(`Falha ao ler cliente: ${error.message}`, 502, "internal");
  }
  if (!data) throw new PortalInviteError("Cliente não encontrado.", 404, "not_found");
  return data as CustomerReadRow;
}

async function insertWhatsAppOpenedInteraction(
  db: SupabaseClient,
  entry: {
    customerId: string;
    actor: string;
    destinationLast4: string;
    portalLoginUrl: string;
    templateVersion: string;
  },
) {
  const { error } = await db.from("crm_interactions").insert({
    customer_id: entry.customerId,
    interaction_type: "whatsapp_aberto",
    channel: "WHATSAPP",
    description: "Convite do Portal preparado pelo Admin (URL wa.me aberta em nova aba).",
    metadata: {
      purpose: "PORTAL_INVITE",
      destination_last4: entry.destinationLast4,
      portal_url: entry.portalLoginUrl,
      template_version: entry.templateVersion,
      // NUNCA: mensagem completa, e-mail, telefone integral, customer_id.
      // destination_last4 é suficiente para o operador reconciliar depois.
    },
    actor: entry.actor,
    occurred_at: new Date().toISOString(),
  });
  if (error) throw new PortalInviteError(`Falha ao registrar interação: ${error.message}`, 502, "internal");
}

/**
 * Prepara a URL do wa.me com a mensagem do convite. NÃO envia mensagem —
 * o operador é quem clica em "Enviar" no próprio WhatsApp depois.
 */
export async function prepareWhatsAppInvite(input: PrepareInviteInput): Promise<PreparedInvite> {
  const db = input.db ?? getSupabaseAdminClient("portal-invite.prepare");

  let resolvedId: string;
  try {
    resolvedId = await resolveCustomerId(db, input.customerId);
  } catch (err) {
    if (err instanceof CustomerResolutionError) {
      throw new PortalInviteError(err.message, err.status, err.status === 404 ? "not_found" : "internal");
    }
    throw err;
  }

  const customer = await readCustomerForInvite(db, resolvedId);

  if (!customer.portal_beta_enabled) {
    throw new PortalInviteError(
      "Portal ainda não está habilitado para este cliente. Libere o acesso antes de enviar o convite.",
      409,
      "portal_disabled",
    );
  }

  const email = (customer.email ?? "").trim();
  if (!email) {
    throw new PortalInviteError("Cadastre o e-mail antes de enviar o convite.", 422, "no_email");
  }

  const rawPhone = (customer.normalized_phone ?? customer.primary_phone ?? "").trim();
  if (!rawPhone) {
    throw new PortalInviteError("Telefone não cadastrado.", 422, "no_phone");
  }

  // Re-normalização defensiva: se normalized_phone já estiver canônico, é no-op;
  // se estiver desatualizado (ex.: linha antiga com só primary_phone), aplica agora.
  let normalized: string;
  try {
    normalized = normalizePhone(rawPhone);
  } catch (err) {
    throw new PortalInviteError(
      err instanceof Error ? err.message : "Telefone inválido.",
      422,
      "invalid_phone",
    );
  }

  let invite: PortalWhatsAppInvite;
  try {
    invite = buildPortalWhatsAppInvite({
      customerName: customer.name,
      normalizedPhone: normalized,
      email,
      portalLoginUrl: input.portalLoginUrl || DEFAULT_PORTAL_LOGIN_URL,
      templateVersion: PORTAL_INVITE_TEMPLATE_VERSION,
    });
  } catch (err) {
    if (err instanceof WhatsAppInviteError) {
      throw new PortalInviteError(err.message, err.status, "invalid_phone");
    }
    throw err;
  }

  await insertWhatsAppOpenedInteraction(db, {
    customerId: resolvedId,
    actor: input.actor || "dgn-admin",
    destinationLast4: invite.destinationLast4,
    portalLoginUrl: invite.portalLoginUrl,
    templateVersion: invite.templateVersion,
  });

  return { ...invite, customerName: customer.name ?? "" };
}

// -----------------------------------------------------------------------------
// Formata telefone canônico BR (12/13 dígitos com DDI 55) para exibição amigável
// tipo "(19) 99999-9999". Puro; usado pela leitura de status para o UI mostrar
// o telefone antes do clique.
// -----------------------------------------------------------------------------

export function formatBrazilianPhoneDisplay(normalized: string | null | undefined): string | null {
  if (!normalized) return null;
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 13 || !digits.startsWith("55")) return null;
  const local = digits.slice(2);
  const ddd = local.slice(0, 2);
  const rest = local.slice(2);
  if (rest.length === 9) return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  if (rest.length === 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return null;
}
