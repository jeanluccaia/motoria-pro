import type {
  PortalAccessIssueCode,
  PortalReadinessBlocker,
  PortalReadinessItem,
  PortalReadinessSummary,
} from "../skills/portal-readiness.ts";

// -----------------------------------------------------------------------------
// RENDERIZADOR DETERMINÍSTICO DO PORTAL READINESS
//
// Por que existe: a LLM insiste em (i) reagrupar clientes por bloqueio criando
// grupos sobrepostos, (ii) somar frequência como se fosse quantidade de
// clientes, (iii) citar customers em observações soltas fora da lista. Todas
// contadas como quebra da spec do Jean: "um cliente = um caso; contador só do
// campo estruturado".
//
// Solução: o server RENDERIZA o texto final aqui. O LLM provider substitui a
// prosa do modelo por esta saída sempre que a tool `get_subscriber_portal_readiness`
// tiver sido chamada com sucesso — a LLM não escreve nada sobre Portal
// readiness. Ela ainda pode explicar em turnos seguintes, mas o corpo da
// resposta é produzido aqui.
//
// Regras que este renderer FORÇA (nunca dependem da LLM):
//   * cada customer aparece exatamente uma vez (identidade por customer_id);
//   * blockers e issues do MESMO customer ficam juntos no mesmo item;
//   * total_evaluated = total_ready + total_blocked (invariante já garantida
//     pela skill; aqui só reafirmamos ao imprimir);
//   * blockerFrequency é rotulada como "Frequência dos bloqueios (um cliente
//     pode ter mais de um)" — nunca "quantidade de clientes";
//   * nenhum nome fora de ready ∪ blocked aparece no texto.
// -----------------------------------------------------------------------------

const BLOCKER_LABEL: Record<PortalReadinessBlocker, string> = {
  MISSING_EMAIL: "Sem e-mail cadastrado",
  NO_AUTH_LINK: "Sem vínculo Auth (crm_customer_auth)",
  PORTAL_GATE_DISABLED: "Gate portal_beta_enabled desligado",
  NO_ACTIVE_SUBSCRIPTION: "Sem assinatura ativa em crm_subscriptions",
  MISSING_PHONE_FOR_WHATSAPP: "Sem telefone canônico (convite pelo WhatsApp bloqueado)",
  INCONSISTENT_PORTAL_STATE: "Gate ligado sem provisionamento completo (Auth/e-mail)",
  INCONSISTENT_SUBSCRIBER_STATE: "Estado de assinante inconsistente (fonte não canônica diverge de crm_subscriptions)",
};

const ISSUE_LABEL: Record<PortalAccessIssueCode, string> = {
  GATE_ENABLED_WITHOUT_AUTH: "Gate ativo sem vínculo Auth",
  GATE_ENABLED_WITHOUT_EMAIL: "Gate ativo sem e-mail",
  AUTH_LINK_WITHOUT_EMAIL: "Vínculo Auth sem e-mail canônico",
  ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION: "Portal habilitado sem assinatura canônica",
  ACTIVE_SUBSCRIBER_WITHOUT_PORTAL: "Assinante canônico sem provisionamento no Portal",
  INCONSISTENT_SUBSCRIBER_STATE: "Estado de assinante inconsistente",
};

function recommendedAction(item: PortalReadinessItem): string {
  if (item.portalAccessReady) {
    return item.whatsappInviteReady
      ? "Abrir 'Convite do Portal' via WhatsApp na ficha."
      : "Enviar magic link por e-mail (telefone ausente bloqueia só o WhatsApp).";
  }
  // Prioridade de mensagem quando bloqueado — deriva estritamente dos flags do item.
  if (item.blockers.includes("INCONSISTENT_SUBSCRIBER_STATE") || item.issues.includes("INCONSISTENT_SUBSCRIBER_STATE")) {
    return "Reconciliar assinatura em crm_subscriptions antes de manter/liberar acesso.";
  }
  if (item.blockers.includes("NO_ACTIVE_SUBSCRIPTION")) {
    return "Confirmar assinatura canônica antes de qualquer ação de Portal.";
  }
  if (item.issues.includes("GATE_ENABLED_WITHOUT_AUTH") || item.issues.includes("GATE_ENABLED_WITHOUT_EMAIL")) {
    return "Refazer 'Liberar acesso' na ficha (gate ligado sem provisionamento completo).";
  }
  if (item.blockers.includes("MISSING_EMAIL")) {
    return "Cadastrar e-mail canônico antes de reenviar magic link.";
  }
  if (item.blockers.includes("NO_AUTH_LINK")) {
    return "Gerar vínculo Auth (Liberar acesso) na ficha.";
  }
  if (item.blockers.includes("PORTAL_GATE_DISABLED")) {
    return "Ligar portal_beta_enabled na ficha após conferir e-mail e Auth.";
  }
  return "Ver ficha para próximo passo.";
}

function renderItemBullets(item: PortalReadinessItem): string[] {
  const lines: string[] = [`${item.name}`];
  const seenLabels = new Set<string>();
  // Blockers primeiro, depois issues extra que ainda não estejam representadas
  // por um blocker equivalente. Cada motivo aparece uma única vez por item.
  for (const b of item.blockers) {
    const label = `- ${BLOCKER_LABEL[b]}`;
    if (!seenLabels.has(label)) {
      lines.push(label);
      seenLabels.add(label);
    }
  }
  for (const i of item.issues) {
    // INCONSISTENT_SUBSCRIBER_STATE já vira blocker com mesmo label — evita dupla linha.
    if (i === "INCONSISTENT_SUBSCRIBER_STATE") continue;
    const label = `- ${ISSUE_LABEL[i]}`;
    if (!seenLabels.has(label)) {
      lines.push(label);
      seenLabels.add(label);
    }
  }
  lines.push(`Ação: ${recommendedAction(item)}`);
  return lines;
}

/**
 * Renderiza a resposta canônica de Portal Readiness. NUNCA cria grupos que
 * repetem customers; NUNCA soma contadores por conta própria; nunca cita
 * nome fora de ready ∪ blocked.
 */
export function renderPortalReadinessResponse(summary: PortalReadinessSummary): string {
  const lines: string[] = [];

  // 1) RESUMO — números vêm exclusivamente do summary da tool.
  lines.push(
    `Resumo (Portal do Assinante): ${summary.totalEvaluated} avaliado(s), ${summary.totalPortalReady} pronto(s), ${summary.totalBlocked} bloqueado(s). Invariante: total = pronto + bloqueado.`,
  );
  lines.push("");

  // 2) PRONTOS — direto de ready[].
  if (summary.ready.length > 0) {
    lines.push(`PRONTOS (${summary.ready.length}) — subscription canônica + e-mail + Auth + gate ligados:`);
    for (const item of summary.ready) {
      lines.push(...renderItemBullets(item));
      lines.push("");
    }
  } else {
    lines.push("PRONTOS (0): nenhum customer com acesso ao Portal totalmente provisionado agora.");
    lines.push("");
  }

  // 3) BLOQUEADOS — direto de blocked[]. Cada customer 1x, todos os motivos juntos.
  if (summary.blocked.length > 0) {
    lines.push(`BLOQUEADOS (${summary.blocked.length}) — cada cliente listado uma única vez com todos os motivos consolidados:`);
    for (const item of summary.blocked) {
      lines.push(...renderItemBullets(item));
      lines.push("");
    }
  }

  // 4) FREQUÊNCIA DOS BLOQUEIOS — sem citar customers.
  const freqEntries = Object.entries(summary.blockerFrequency)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  if (freqEntries.length > 0) {
    lines.push("Frequência dos bloqueios (um cliente pode ter mais de um):");
    for (const [code, n] of freqEntries) {
      const label = BLOCKER_LABEL[code as PortalReadinessBlocker] ?? code;
      lines.push(`- ${label}: ${n}`);
    }
  }

  return lines.join("\n").trim();
}
