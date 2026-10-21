// SLA do CRM Franqueadora Loud Fit
//
// Regra ditada pelos sócios em 2026-10-21:
//   1. Lead entra → aguarda 3 dias por resposta após o 1º contato.
//   2. Sem resposta → fazer o 2º contato → aguardar mais 3 dias.
//   3. 2 contatos sem resposta → arquivar temporário.
//   4. 20 dias depois → nova tentativa automática (cron desarquiva).
//   5. Retry sem resposta em 3 dias → arquivar definitivo.
//
// Esta camada é PURA: recebe o lead + "agora", devolve o estado e, se
// houver, o patch que o cron deve aplicar. Nunca lê DB nem muta nada.
//
// Fuso: todas as janelas são contadas em America/Sao_Paulo (via APP_TZ
// no [[intelligence.ts]], que define o conceito operacional de "dia").
// Para SLA usamos milissegundos UTC — a diferença de fuso é pequena
// em janelas de 3+ dias e evita bugs de "virar o dia" no cron.
//
// Convenções:
//   * `attempts` = contatos registrados sem resposta do lead
//     (sla_contact_attempts). Zera quando lead responde.
//   * `anchor` = quando o relógio de 3 dias começa:
//       - fora de retry: last_contact_at ?? created_at
//       - em retry: sla_last_retry_at (ignora contato NOVO durante o retry
//         de propósito — a janela de 3 dias é fixa a partir do retry).
//   * Arquivamento SLA é diferente de "lost" manual: usa
//     sla_archive_type ('temporary'|'final') para separar.

import type { FranchiseLead } from "@/lib/supabase/types";

export const SLA_FIRST_WINDOW_DAYS = 3;
export const SLA_SECOND_WINDOW_DAYS = 3;
export const SLA_RETRY_PAUSE_DAYS = 20;
export const SLA_RETRY_WINDOW_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SlaStateKind =
  // Fora do loop SLA
  | "exempt"           // won / disqualified
  | "responded"        // lead já respondeu, não aplica SLA
  | "archived_final"   // já arquivado em definitivo
  | "archived_temporary_waiting_retry" // arquivado temp, aguardando janela de 20d
  // Dentro do funil, sinalização apenas
  | "within_window"    // tudo em dia dentro da janela
  | "due_first_contact"   // sem contato nenhum há 3d+ (sócio precisa agir)
  | "due_second_contact"  // 1 contato há 3d+ sem resposta (sócio precisa agir)
  | "retry_in_progress"   // em retry, aguardando resposta
  // Transições automáticas (cron deve aplicar o patch)
  | "due_archive_temporary"  // 2 contatos sem resposta → arquivar temp
  | "due_retry"              // 20d após archive_temp → desarquivar
  | "due_archive_final";     // 3d de retry sem resposta → arquivar definitivo

export type SlaState =
  | { kind: Exclude<SlaStateKind, "due_archive_temporary" | "due_retry" | "due_archive_final">;
      deadlineAt: string | null;
    }
  | { kind: "due_archive_temporary"; patch: ArchiveTemporaryPatch }
  | { kind: "due_retry"; patch: RetryPatch }
  | { kind: "due_archive_final"; patch: ArchiveFinalPatch };

export type ArchiveTemporaryPatch = {
  pipeline_stage: "lost";
  lost_reason: string;
  sla_archive_type: "temporary";
  sla_archived_at: string;
};

export type RetryPatch = {
  pipeline_stage: "contact_attempt";
  sla_archive_type: null;
  sla_last_retry_at: string;
  sla_contact_attempts: 0;
  next_contact_at: string;
  next_action: string;
  lost_reason: null;
};

export type ArchiveFinalPatch = {
  pipeline_stage: "lost";
  lost_reason: string;
  sla_archive_type: "final";
  sla_archived_at: string;
};

export const SLA_ARCHIVE_TEMP_REASON = "SLA: 2 contatos sem resposta — pausa de 20 dias antes do retry";
export const SLA_ARCHIVE_FINAL_REASON = "SLA: retry sem resposta — arquivado em definitivo";
export const SLA_RETRY_NEXT_ACTION = "Retentar — última chance antes do arquivamento definitivo";

// ------------------------------------------------------------------
// Decisão
// ------------------------------------------------------------------

function daysBetween(fromIso: string, toMs: number): number {
  const fromMs = new Date(fromIso).getTime();
  if (Number.isNaN(fromMs)) return 0;
  return (toMs - fromMs) / DAY_MS;
}

function addDaysIso(baseMs: number, days: number): string {
  return new Date(baseMs + days * DAY_MS).toISOString();
}

// Estado atual + ação (se cron deve mutar).
export function computeSlaState(lead: FranchiseLead, now: Date = new Date()): SlaState {
  const nowMs = now.getTime();
  const nowIso = new Date(nowMs).toISOString();

  // 1) Exemções estruturais.
  if (lead.pipeline_stage === "won" || lead.pipeline_stage === "disqualified") {
    return { kind: "exempt", deadlineAt: null };
  }

  // 2) Lead respondeu → fora do loop. (Resposta nova zera attempts, então
  // ao receber uma nova mensagem do sócio o loop pode recomeçar.)
  if (lead.sla_response_received_at) {
    return { kind: "responded", deadlineAt: null };
  }

  // 3) Já arquivado em definitivo — nada a fazer.
  if (lead.pipeline_stage === "lost" && lead.sla_archive_type === "final") {
    return { kind: "archived_final", deadlineAt: null };
  }

  // 4) Arquivado temporário: ou está aguardando os 20d, ou já é hora do retry.
  if (lead.pipeline_stage === "lost" && lead.sla_archive_type === "temporary") {
    if (!lead.sla_archived_at) {
      // Dado inconsistente — tratar como aguardando (não arquiva nem desarquiva).
      return { kind: "archived_temporary_waiting_retry", deadlineAt: null };
    }
    const archivedMs = new Date(lead.sla_archived_at).getTime();
    const retryDueAt = addDaysIso(archivedMs, SLA_RETRY_PAUSE_DAYS);
    const daysSinceArchive = (nowMs - archivedMs) / DAY_MS;
    if (daysSinceArchive >= SLA_RETRY_PAUSE_DAYS) {
      return {
        kind: "due_retry",
        patch: {
          pipeline_stage: "contact_attempt",
          sla_archive_type: null,
          sla_last_retry_at: nowIso,
          sla_contact_attempts: 0,
          next_contact_at: nowIso,
          next_action: SLA_RETRY_NEXT_ACTION,
          lost_reason: null,
        },
      };
    }
    return { kind: "archived_temporary_waiting_retry", deadlineAt: retryDueAt };
  }

  // 5) Em retry (sla_last_retry_at setado e lead ativo).
  if (lead.sla_last_retry_at && lead.pipeline_stage !== "lost") {
    const retryMs = new Date(lead.sla_last_retry_at).getTime();
    const retryWindowEnd = addDaysIso(retryMs, SLA_RETRY_WINDOW_DAYS);
    const daysSinceRetry = (nowMs - retryMs) / DAY_MS;
    if (daysSinceRetry >= SLA_RETRY_WINDOW_DAYS) {
      return {
        kind: "due_archive_final",
        patch: {
          pipeline_stage: "lost",
          lost_reason: SLA_ARCHIVE_FINAL_REASON,
          sla_archive_type: "final",
          sla_archived_at: nowIso,
        },
      };
    }
    return { kind: "retry_in_progress", deadlineAt: retryWindowEnd };
  }

  // 6) Primeiro loop (fora de retry).
  const attempts = lead.sla_contact_attempts ?? 0;
  const anchorIso = lead.last_contact_at ?? lead.created_at;
  const anchorMs = new Date(anchorIso).getTime();
  const daysSinceAnchor = daysBetween(anchorIso, nowMs);

  if (attempts >= 2 && daysSinceAnchor >= SLA_SECOND_WINDOW_DAYS) {
    return {
      kind: "due_archive_temporary",
      patch: {
        pipeline_stage: "lost",
        lost_reason: SLA_ARCHIVE_TEMP_REASON,
        sla_archive_type: "temporary",
        sla_archived_at: nowIso,
      },
    };
  }

  if (attempts >= 1 && daysSinceAnchor >= SLA_FIRST_WINDOW_DAYS) {
    return {
      kind: "due_second_contact",
      deadlineAt: addDaysIso(anchorMs, SLA_FIRST_WINDOW_DAYS),
    };
  }

  if (attempts === 0 && daysSinceAnchor >= SLA_FIRST_WINDOW_DAYS) {
    return {
      kind: "due_first_contact",
      deadlineAt: addDaysIso(anchorMs, SLA_FIRST_WINDOW_DAYS),
    };
  }

  return {
    kind: "within_window",
    deadlineAt: addDaysIso(anchorMs, SLA_FIRST_WINDOW_DAYS),
  };
}

// ------------------------------------------------------------------
// Rótulos operacionais (uso na UI)
// ------------------------------------------------------------------

export function slaBadgeLabel(state: SlaState): string | null {
  switch (state.kind) {
    case "due_first_contact":
      return "SLA: fazer 1º contato";
    case "due_second_contact":
      return "SLA: fazer 2º contato";
    case "due_archive_temporary":
      return "SLA: arquivamento temporário pendente";
    case "archived_temporary_waiting_retry":
      return "SLA: pausado — retry em 20 dias";
    case "due_retry":
      return "SLA: retry pendente";
    case "retry_in_progress":
      return "SLA: retry em andamento";
    case "due_archive_final":
      return "SLA: arquivamento definitivo pendente";
    case "archived_final":
      return "SLA: arquivado em definitivo";
    case "responded":
    case "exempt":
    case "within_window":
      return null;
    default:
      return null;
  }
}

export function slaIsAutomatableTransition(state: SlaState): boolean {
  return (
    state.kind === "due_archive_temporary" ||
    state.kind === "due_retry" ||
    state.kind === "due_archive_final"
  );
}
