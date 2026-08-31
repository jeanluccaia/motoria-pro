// Intents estruturadas do Assistente DGN — allowlist canônica.
//
// A regra: qualquer deep-link interno para `/admin/growth/assistente` deve
// usar `?intent=<nome>&customer=<id>` em vez de `?ask=<texto>`. Isso mata a
// classe de bugs onde texto arbitrário poderia disparar ferramenta destrutiva
// no futuro (Fase 3+): os intents rodam por uma allowlist fechada, e cada
// intent mapeia para um prompt determinístico que só chama skills read_only
// ou prepare_only.
//
// `?ask=` continua funcionando durante a Fase 2 para compat, mas é considerado
// deprecado — o guardrail em `assertAskIsSafe` garante que ele nunca vai
// disparar skill de escrita.

export const AGENT_INTENTS = [
  "customer_summary",
  "next_action",
  "prepare_followup",
  "prepare_founder",
  "prepare_renewal",
  "prepare_brief",
  "attack_plan",
] as const;

export type AgentIntent = (typeof AGENT_INTENTS)[number];

export function isAgentIntent(value: string): value is AgentIntent {
  return (AGENT_INTENTS as readonly string[]).includes(value);
}

/**
 * Mapeia intent + customer para o prompt determinístico enviado ao provider.
 * Nenhum campo do prompt é aceito do usuário — só o `customerId` (que é apenas
 * echoado para o LLM, nunca interpretado como instrução).
 *
 * Sempre em português para bater com o system prompt do agente.
 */
export function buildIntentPrompt(intent: AgentIntent, customerId: string | undefined): string {
  const idTail = customerId ? ` (id: ${customerId})` : "";
  switch (intent) {
    case "customer_summary":
      return `Traga o resumo 360 do cliente${idTail}.`;
    case "next_action":
      return `Sugira a próxima ação para o cliente${idTail} baseada apenas nos fatos disponíveis.`;
    case "prepare_followup":
      return `Prepare uma mensagem de follow-up para WhatsApp do cliente${idTail}.`;
    case "prepare_founder":
      return `Prepare a mensagem de aquisição Founder para o cliente${idTail}. Recuse se inelegível.`;
    case "prepare_renewal":
      return `Prepare uma mensagem de renovação para o assinante${idTail}.`;
    case "prepare_brief":
      return `Prepare o brief de curadoria pré-atendimento do cliente${idTail}.`;
    case "attack_plan":
      return `Monte o plano de ataque comercial do dia com rascunhos inline (respeite o cap).`;
  }
}

/**
 * Padrão de write banido em texto arbitrário. Se o usuário passar `?ask=`
 * contendo qualquer variação de "envie/envia/mande/despache/dispare/execute
 * WhatsApp", "atualize CRM", "grave nota", a UI DEVE ignorar o auto-envio e
 * mostrar aviso. O guardrail é UI-side; o server também tem o system prompt
 * proibindo execução, mas melhor cortar antes.
 */
const FORBIDDEN_ASK_PATTERNS: RegExp[] = [
  /\benvi(?:e|ar|a|em)\b.*(?:whats|mensag|convite)/i,
  /\bmand(?:e|ar|a|em)\b.*(?:whats|mensag|convite)/i,
  /\bdispar(?:e|ar|a|em)\b/i,
  /\bexecut(?:e|ar|a|em)\b/i,
  /\bconfirm(?:e|ar|a|em)\b.*\b(?:pagamento|founder|assinatura)\b/i,
  /\bconfirma(?:r|ção)\b.*\b(?:pagamento|founder)\b/i,
  /\batualiz(?:e|ar|a|em)\b.*\b(?:crm|status|estágio|estagio|plano)\b/i,
  /\bgrav(?:e|ar|a|em)\b.*\b(?:nota|observação|observacao|contato)\b/i,
];

/**
 * Retorna null se o texto do `?ask=` é seguro para auto-envio (leitura/preparo).
 * Retorna a mensagem de bloqueio se detectar tentativa de instrução destrutiva.
 * NÃO substitui garantias server-side; é UX para o operador ver bloqueio.
 */
export function assertAskIsSafe(ask: string): string | null {
  const trimmed = ask.trim();
  if (trimmed.length === 0) return "Prompt vazio.";
  if (trimmed.length > 500) return "Prompt muito longo (>500 caracteres).";
  for (const pattern of FORBIDDEN_ASK_PATTERNS) {
    if (pattern.test(trimmed)) {
      return "Assistente DGN não executa ações — só analisa e prepara. Pergunta ignorada.";
    }
  }
  return null;
}
