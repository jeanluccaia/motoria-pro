// Derivação canônica da "situação financeira" de uma subscription para o Admin.
// Helper puro, sem I/O. Compartilhado por SubscriptionsManager (ficha do cliente),
// e por qualquer futura tela que precise responder "essa assinatura está paga?".
//
// Motivação (brief Fase 4): a UI hoje mostra `payment_status=confirmed` como
// "pago" para todo mundo. O schema é explícito: só `provider_confirmed` OU
// `manual_confirmation` significam pago. Backfill do Digo (Founders 001–003)
// entrou como `manual + confirmed + not_verified` — a UI não pode apresentar
// isso como "PagBank pago". Snapshot PagBank também congela em 2026-09-01;
// depois de N dias sem novo import, dizer "PagBank confirmado" vira mentira.
//
// Estados canônicos:
//   PAGBANK_CONFIRMED     — provider + provider_confirmed + verificação recente
//   PAGBANK_STALE         — provider + provider_confirmed, MAS última
//                            conciliação há > staleAfterDays (default 7)
//   MANUAL_VERIFIED       — manual + manual_confirmation (Digo assinou)
//   MANUAL_REGISTERED     — manual + not_verified/failed  (backfill sem verif.)
//   NO_EVIDENCE           — unknown/legacy/sem provider e sem manual
//
// isTrustedPaid é a resposta canônica pra "posso mostrar como pago?": TRUE só
// em PAGBANK_CONFIRMED e MANUAL_VERIFIED. Em qualquer outro caso, a UI DEVE
// mostrar "Verificação necessária".

export type PaymentEvidenceState =
  | "PAGBANK_CONFIRMED"
  | "PAGBANK_STALE"
  | "MANUAL_VERIFIED"
  | "MANUAL_REGISTERED"
  | "NO_EVIDENCE";

export type PaymentEvidenceTone = "emerald" | "amber" | "gray" | "red";

export interface PaymentEvidenceInput {
  paymentEvidenceSource: string | null;      // provider | manual | legacy | unknown
  paymentVerificationStatus: string | null;  // provider_confirmed | manual_confirmation | not_verified | failed
  paymentStatus: string | null;              // confirmed | pending | failed | refunded | unknown
  lastPaymentConfirmedAt: string | null;
  lastVerifiedAt: string | null;
  now?: Date;
  staleAfterDays?: number;                   // default 7
}

export interface PaymentEvidenceResult {
  state: PaymentEvidenceState;
  /** Rótulo curto exibido no badge principal. */
  headline: string;
  /** Frase explicativa (uma linha) que a UI mostra abaixo do badge. */
  detail: string;
  tone: PaymentEvidenceTone;
  /** True SÓ quando podemos apresentar a assinatura como "pago". */
  isTrustedPaid: boolean;
  /** True quando o brief manda mostrar "Verificação necessária". */
  needsVerificationLabel: boolean;
  /** Idade da última verificação em dias inteiros (piso). null quando não há data. */
  ageOfVerificationDays: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY);
}

export function derivePaymentEvidence(input: PaymentEvidenceInput): PaymentEvidenceResult {
  const now = input.now ?? new Date();
  const staleAfterDays = input.staleAfterDays ?? 7;

  const evidence = (input.paymentEvidenceSource ?? "").toLowerCase();
  const verif = (input.paymentVerificationStatus ?? "").toLowerCase();
  const status = (input.paymentStatus ?? "").toLowerCase();

  let ageDays: number | null = null;
  if (input.lastVerifiedAt) {
    const t = new Date(input.lastVerifiedAt);
    if (!Number.isNaN(t.getTime())) ageDays = Math.max(0, daysBetween(now, t));
  }

  // ------------------------------------------------------------------------
  // PagBank (provider). Só é "confirmado" quando verification=provider_confirmed
  // E a última conciliação é recente. Sem isso, cai em STALE (mesmo cliente com
  // pagamento provavelmente OK — mas não temos evidência atual pra afirmar).
  // ------------------------------------------------------------------------
  if (evidence === "provider" && verif === "provider_confirmed") {
    if (ageDays !== null && ageDays > staleAfterDays) {
      return {
        state: "PAGBANK_STALE",
        headline: "PagBank — informação desatualizada",
        detail: `Última conciliação há ${ageDays} dia${ageDays === 1 ? "" : "s"}. Cobrança pode já ter ocorrido — verifique PagBank.`,
        tone: "amber",
        isTrustedPaid: false,
        needsVerificationLabel: true,
        ageOfVerificationDays: ageDays,
      };
    }
    return {
      state: "PAGBANK_CONFIRMED",
      headline: "PagBank confirmado",
      detail: ageDays !== null
        ? `Conciliação atual (há ${ageDays} dia${ageDays === 1 ? "" : "s"}).`
        : "Confirmação vinda do provedor.",
      tone: "emerald",
      isTrustedPaid: true,
      needsVerificationLabel: false,
      ageOfVerificationDays: ageDays,
    };
  }

  // ------------------------------------------------------------------------
  // Manual — Digo assinou humanamente (verification=manual_confirmation).
  // ------------------------------------------------------------------------
  if (evidence === "manual" && verif === "manual_confirmation") {
    return {
      state: "MANUAL_VERIFIED",
      headline: "Confirmação manual verificada",
      detail: "Assinado pela operação DGN. Não passou pelo PagBank.",
      tone: "emerald",
      isTrustedPaid: true,
      needsVerificationLabel: false,
      ageOfVerificationDays: ageDays,
    };
  }

  // ------------------------------------------------------------------------
  // Manual registrado sem verificação humana (padrão do backfill 2026-09-17
  // dos Founders 001–003 e Wellington). NÃO pode ser apresentado como pago.
  // ------------------------------------------------------------------------
  if (evidence === "manual") {
    return {
      state: "MANUAL_REGISTERED",
      headline: "Confirmação manual registrada",
      detail: "Backfill sem verificação do provedor. Verificação necessária antes de tratar como pago.",
      tone: "amber",
      isTrustedPaid: false,
      needsVerificationLabel: true,
      ageOfVerificationDays: ageDays,
    };
  }

  // ------------------------------------------------------------------------
  // Sem evidência (unknown/legacy). Se o status é confirmed nesse caso, é
  // inferência inválida — nunca tratamos como pago.
  // ------------------------------------------------------------------------
  return {
    state: "NO_EVIDENCE",
    headline: "Sem comprovação registrada",
    detail: status === "confirmed"
      ? "Status 'confirmado' sem evidência do provedor nem confirmação manual. Verificação necessária."
      : "Nenhuma evidência de pagamento registrada. Verificação necessária.",
    tone: "red",
    isTrustedPaid: false,
    needsVerificationLabel: true,
    ageOfVerificationDays: ageDays,
  };
}
