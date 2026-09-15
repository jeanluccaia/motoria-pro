// -----------------------------------------------------------------------------
// buildPortalWhatsAppInvite — helper puro para montar a URL do wa.me com a
// mensagem do convite do Portal já preenchida.
//
// Fatia 2C: WhatsApp é APENAS o canal de convite. O login continua sendo
// magic link via /entrar. Portanto NADA de token, JWT, user_id, customer_id,
// auth_user_id ou segredo entra na mensagem/URL.
//
// Puro (sem "server-only", sem I/O). Reusável em backend (para persistir a
// URL/audit) e testável de forma trivial.
// -----------------------------------------------------------------------------

export const PORTAL_INVITE_TEMPLATE_VERSION = "portal-invite-v1";
export const DEFAULT_PORTAL_LOGIN_URL = "https://app.dgnclub.com/entrar";

export class WhatsAppInviteError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface BuildPortalWhatsAppInviteInput {
  /** Nome canônico do assinante (usado só para extrair o primeiro nome no cumprimento). */
  customerName: string | null | undefined;
  /**
   * Telefone JÁ normalizado no formato canônico do CRM:
   * dígitos, começando com "55" (DDI BR), 12 ou 13 dígitos.
   * Reutiliza a saída de `normalizePhone` em `profile-editor-write.ts`.
   */
  normalizedPhone: string;
  /** E-mail que o cliente vai usar para autenticar em /entrar. */
  email: string;
  /** Opcional — permite override em testes. Default: DEFAULT_PORTAL_LOGIN_URL. */
  portalLoginUrl?: string;
  /** Opcional — permite versionar a mensagem. Default: PORTAL_INVITE_TEMPLATE_VERSION. */
  templateVersion?: string;
}

export interface PortalWhatsAppInvite {
  /** URL pronta para abrir em nova aba (wa.me deep-link). */
  url: string;
  /** Corpo da mensagem em texto plano (útil para preview/copy fallback). */
  message: string;
  /** Telefone final que entra no wa.me — só dígitos, com "55" na frente. */
  phoneE164: string;
  /** Últimos 4 dígitos do número — para audit/UX sem gravar PII completa. */
  destinationLast4: string;
  /** URL de login usada (para audit). */
  portalLoginUrl: string;
  /** Versão do template (para audit). */
  templateVersion: string;
  /** Primeiro nome resolvido (fallback: "assinante"). */
  firstName: string;
}

// Aceita 12 ou 13 dígitos: 55 + DDD (2) + numero (8 ou 9).
// Rejeita anything else: normalizePhone já garante DDI 55, esse regex é
// só última linha de defesa para não deixar telefone inválido escapar
// para a URL do wa.me.
const CANONICAL_BR_PHONE = /^55\d{10,11}$/;

function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "assinante";
  const trimmed = fullName.trim();
  if (!trimmed) return "assinante";
  const first = trimmed.split(/\s+/)[0] ?? "";
  return first || "assinante";
}

export function buildPortalWhatsAppInvite(input: BuildPortalWhatsAppInviteInput): PortalWhatsAppInvite {
  const phone = (input.normalizedPhone ?? "").trim();
  if (!phone) throw new WhatsAppInviteError("Telefone é obrigatório para gerar o convite.", 400);
  if (!CANONICAL_BR_PHONE.test(phone)) {
    throw new WhatsAppInviteError("Telefone precisa estar normalizado como 55 + DDD + número.", 400);
  }

  const email = (input.email ?? "").trim();
  if (!email) throw new WhatsAppInviteError("E-mail é obrigatório para o convite.", 400);

  const portalLoginUrl = (input.portalLoginUrl ?? DEFAULT_PORTAL_LOGIN_URL).trim();
  if (!/^https:\/\//.test(portalLoginUrl)) {
    // Defesa em profundidade: nunca gerar link http:// dentro de mensagem de convite.
    throw new WhatsAppInviteError("URL do Portal deve ser HTTPS.", 400);
  }

  const firstName = extractFirstName(input.customerName);
  const templateVersion = (input.templateVersion ?? PORTAL_INVITE_TEMPLATE_VERSION).trim();

  const message = buildMessage({ firstName, email, portalLoginUrl });
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return {
    url,
    message,
    phoneE164: phone,
    destinationLast4: phone.slice(-4),
    portalLoginUrl,
    templateVersion,
    firstName,
  };
}

function buildMessage({ firstName, email, portalLoginUrl }: {
  firstName: string;
  email: string;
  portalLoginUrl: string;
}): string {
  // Mensagem curta, humana, sem dados financeiros / sem token.
  // A quebra de linha aqui é literal `\n` — o wa.me converte em nova linha
  // quando o app renderiza. Testes garantem que /entrar e o e-mail aparecem.
  return [
    `Olá, ${firstName}! 👋`,
    "",
    "Seu acesso ao DGN Club já está liberado.",
    "",
    "Pelo Portal você acompanha seu plano, veículo, próximos atendimentos e histórico.",
    "",
    "Acesse:",
    portalLoginUrl,
    "",
    "Entre usando o e-mail cadastrado na DGN:",
    email,
    "",
    "DGN Club",
  ].join("\n");
}
