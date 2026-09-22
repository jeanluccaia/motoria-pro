// Classificação canônica de crm_appointments — helper puro, sem I/O.
// Compartilhado por Dashboard, Profile 360 e futuros consumidores, para evitar
// que caminhos diferentes cheguem a categorias divergentes para o mesmo dado.
//
// Regra final (ver docs em README/agenda):
//   * status IN ('cancelled', 'no_show')      → HISTORICO
//   * status == 'done'                        → HISTORICO
//   * status IN ('scheduled', 'confirmed'):
//        scheduled_at > now → PROXIMO
//        scheduled_at <= now → PENDENTE_DESFECHO
//   * status desconhecido                     → HISTORICO (nunca "Próximos")
//
// isTestArtifact é uma flag ORTOGONAL — não altera categoria. Uma reserva
// marcada como teste continua aparecendo em Próximos/Pendentes/Histórico
// conforme o status/hora, mas a UI pode agrupá-la em bloco recolhido.
//
// Detecção de teste é DELIBERADAMENTE CONSERVADORA (brief do Digo): usa
// apenas evidências fortes — dev-speak inequívoco em notes, ou marker
// estruturado quando/se existir. NUNCA baseada em substring "teste" solta.

export type AppointmentCategory =
  | "PROXIMO"           // Próximos atendimentos
  | "PENDENTE_DESFECHO" // Passado sem desfecho (não presumir realização)
  | "HISTORICO";        // Concluído, cancelado, no-show, ou status desconhecido

export interface AppointmentClassifyInput {
  scheduledAt: string;                    // ISO timestamptz
  status: string;                          // scheduled | confirmed | done | cancelled | no_show | ...
  source?: string | null;
  notes?: string | null;
  externalRef?: string | null;
  importSource?: string | null;
  now?: Date;                              // injetável em testes
}

export interface AppointmentClassification {
  category: AppointmentCategory;
  isCancelled: boolean;
  isDone: boolean;
  isTestArtifact: boolean;
  /** Motivo humano da detecção de teste, se houver — útil pra debug/audit. */
  testReason: string | null;
}

/**
 * Regex/patterns que caracterizam artefato de teste com CONFIANÇA ALTA.
 * Cada padrão foi observado em resíduo real de smoke tests:
 *   - "editado via PATCH; id e created_at devem estar intactos" (Fatia 2b)
 *   - "SMOKE " maiúsculo seguido de código de fatia (ex.: "SMOKE 2B", "SMOKE 2C")
 * Mantido conservador: qualquer heurística nova deve ser adicionada aqui
 * com evidência de campo, não com substring genérico.
 */
const TEST_MARKERS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /id e created_at devem estar intactos/i, reason: "Nota dev-speak da Fatia 2b (PATCH smoke)" },
  { pattern: /\bSMOKE\s+\d+[A-Z]\b/, reason: "Marcador SMOKE + código de fatia em notes" },
];

function detectTestArtifact(notes: string | null | undefined): { isTest: boolean; reason: string | null } {
  const text = (notes ?? "").trim();
  if (!text) return { isTest: false, reason: null };
  for (const m of TEST_MARKERS) {
    if (m.pattern.test(text)) return { isTest: true, reason: m.reason };
  }
  return { isTest: false, reason: null };
}

export function classifyAppointment(input: AppointmentClassifyInput): AppointmentClassification {
  const now = input.now ?? new Date();
  const scheduled = new Date(input.scheduledAt);
  const status = (input.status ?? "").toLowerCase();

  const isCancelled = status === "cancelled" || status === "canceled";
  const isDone = status === "done" || status === "no_show";

  let category: AppointmentCategory;
  if (isCancelled || isDone) {
    category = "HISTORICO";
  } else if (status === "scheduled" || status === "confirmed") {
    category = scheduled.getTime() > now.getTime() ? "PROXIMO" : "PENDENTE_DESFECHO";
  } else {
    // Status desconhecido: por segurança, cai em HISTORICO (nunca em "Próximos").
    category = "HISTORICO";
  }

  const test = detectTestArtifact(input.notes);

  return {
    category,
    isCancelled,
    isDone,
    isTestArtifact: test.isTest,
    testReason: test.reason,
  };
}

/**
 * Formata data/hora no fuso operacional canônico (America/Sao_Paulo).
 * Isolado aqui para todos os consumidores mostrarem exatamente o mesmo texto.
 */
export function formatAppointmentSaoPaulo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
