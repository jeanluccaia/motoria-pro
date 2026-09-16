import type { AgentContext } from "../agent-context.ts";
import type { AgentProvider } from "./types.ts";
import type { AgentQuery, AgentResponse, AttentionCard } from "../types.ts";
import { getDailyBriefing } from "../skills/daily-briefing.ts";
import { getFounderAttention } from "../skills/founder-attention.ts";
import { getCurationOpportunities } from "../skills/curation-opportunities.ts";
import { getSubscriberAttention } from "../skills/subscriber-attention.ts";
import { findCustomerByFuzzyName, getCustomerSummary } from "../skills/customer-summary.ts";
import { suggestNextAction } from "../skills/next-action.ts";
import { classifyDomain, AMBIGUOUS_INVITE_PROMPT } from "../domain-router.ts";
import { getSubscriberPortalReadiness, type PortalReadinessItem } from "../skills/portal-readiness.ts";

// -----------------------------------------------------------------------------
// DeterministicAgentProvider — roteia por intent (regex/keywords) direto para
// as skills READ-ONLY. Nenhum SELECT arbitrário, nenhuma geração de texto
// livre. Se o usuário perguntar algo fora do escopo, devolve um `help` claro
// com as sugestões suportadas. Serve como fallback quando o LLM está
// indisponível ou não há credencial configurada.
// -----------------------------------------------------------------------------

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function extractCustomerName(raw: string): string | null {
  const patterns = [
    /(?:resuma|resumo|resume|sobre|conte|fale)(?:\s+(?:o|a|do|da|de|para|sobre))?\s+(?:cliente\s+)?(.+)$/i,
    /cliente\s+(.+)$/i,
  ];
  for (const p of patterns) {
    const m = raw.trim().match(p);
    if (m && m[1]) return m[1].trim().replace(/[?!.]+$/, "");
  }
  return null;
}

function cardsBlock(cards: AttentionCard[]): AgentResponse["blocks"][number] {
  return { kind: "cards", cards };
}

const BLOCKER_LABEL: Record<string, string> = {
  MISSING_EMAIL: "sem e-mail cadastrado",
  NO_AUTH_LINK: "sem vínculo Auth",
  PORTAL_GATE_DISABLED: "gate do Portal desligado",
  NO_ACTIVE_SUBSCRIPTION: "sem assinatura ativa em crm_subscriptions",
  MISSING_PHONE_FOR_WHATSAPP: "sem telefone canônico (convite pelo WhatsApp bloqueado)",
  INCONSISTENT_PORTAL_STATE: "gate ligado sem provisionamento completo (Auth/email)",
  INCONSISTENT_SUBSCRIBER_STATE: "aparenta assinante (commercialStatus/base viva) sem linha ativa em crm_subscriptions",
};

function readinessToCards(
  ready: PortalReadinessItem[],
  blocked: PortalReadinessItem[],
): AttentionCard[] {
  const cards: AttentionCard[] = [];
  for (const item of ready) {
    cards.push({
      id: `portal-ready:${item.customerId}`,
      priority: item.whatsappInviteReady ? "alta" : "media",
      kind: "subscriber",
      title: item.name,
      reason: item.whatsappInviteReady
        ? "Acesso ao Portal provisionado; telefone canônico presente."
        : "Acesso ao Portal provisionado (por e-mail); sem telefone canônico para WhatsApp.",
      nextAction: item.whatsappInviteReady
        ? "Abrir 'Convite do Portal' via WhatsApp na ficha."
        : "Enviar magic link por e-mail, ou cadastrar telefone antes de convite pelo WhatsApp.",
      href: item.href,
      ctaLabel: "Ver cliente",
      customerId: item.customerId,
    });
  }
  for (const item of blocked) {
    const reasonLabels = item.blockers.map((b) => BLOCKER_LABEL[b] ?? b).slice(0, 3).join("; ");
    cards.push({
      id: `portal-blocked:${item.customerId}`,
      priority: "media",
      kind: "subscriber",
      title: item.name,
      reason: `Bloqueios: ${reasonLabels || "n/d"}.`,
      nextAction: "Ver ficha para resolver os motivos antes de convidar.",
      href: item.href,
      ctaLabel: "Ver cliente",
      customerId: item.customerId,
    });
  }
  return cards;
}

export class DeterministicAgentProvider implements AgentProvider {
  async converse(query: AgentQuery, ctx: AgentContext): Promise<AgentResponse> {
    const raw = query.message ?? "";
    const startedAt = performance.now();

    const finish = (
      response: Omit<AgentResponse, "providerMode" | "metrics">,
    ): AgentResponse => ({
      ...response,
      providerMode: "deterministic",
      metrics: {
        latencyMs: Math.round(performance.now() - startedAt),
        toolCalls: 0,
      },
    });

    const classification = classifyDomain(raw);

    // Rota 0: pergunta ambígua (só "convite"/"convidar" sem âncora). Pedimos
    // desambiguação antes de assumir qualquer domínio. Antes do P0, essa rota
    // caía em founder-attention e devolvia lista Founder — resposta errada.
    if (classification.domain === "AMBIGUOUS") {
      return finish({
        intent: "help",
        blocks: [{ kind: "text", text: AMBIGUOUS_INVITE_PROMPT }],
      });
    }

    // Rota Portal: acesso/convite do Portal do Assinante.
    if (classification.domain === "SUBSCRIBER_PORTAL_ACCESS") {
      const readiness = getSubscriberPortalReadiness(ctx);
      if (readiness.status === "ok" && readiness.data) {
        const readyLine =
          readiness.data.ready.length > 0
            ? `${pluralize(readiness.data.ready.length, "assinante pronto para receber convite do Portal", "assinantes prontos para receber convite do Portal")}.`
            : "Nenhum assinante com acesso ao Portal totalmente provisionado agora.";
        const blockedLine =
          readiness.data.blocked.length > 0
            ? `${pluralize(readiness.data.blocked.length, "assinante bloqueado", "assinantes bloqueados")} — motivo canônico em cada card.`
            : "";
        const cards = readinessToCards(readiness.data.ready.slice(0, 20), readiness.data.blocked.slice(0, 20));
        return finish({
          intent: "subscriber-attention",
          blocks: [
            { kind: "text", text: [readyLine, blockedLine].filter(Boolean).join(" ") },
            cardsBlock(cards),
          ],
          disclosures: { facts: readiness.facts, inferences: readiness.inferences },
        });
      }
      return finish({
        intent: "subscriber-attention",
        blocks: [{ kind: "text", text: readiness.message ?? "Sem dados suficientes de Portal agora." }],
      });
    }

    // Rota briefing — "quem devo chamar", "o que fazer hoje"...
    if (classification.domain === "DAILY_BRIEFING") {
      const result = getDailyBriefing(ctx);
      if (result.status === "ok" && result.data) {
        return finish({
          intent: "daily-briefing",
          blocks: [
            { kind: "text", text: `${result.data.greeting}. ${result.data.headline}.` },
            cardsBlock(result.data.cards),
          ],
          disclosures: { facts: result.facts, inferences: result.inferences },
        });
      }
      return finish({
        intent: "daily-briefing",
        blocks: [{ kind: "text", text: result.message ?? "Sem prioridades identificadas agora." }],
      });
    }

    // Rota Founder — só entra quando o classifier detectou âncora Founder,
    // então "convite" isolado nunca chega aqui.
    if (classification.domain === "FOUNDER_ACQUISITION") {
      // Sub-roteador: se a pergunta cita Curadoria/oportunidades, prioriza
      // curation-opportunities; caso contrário mostra convites Founder ativos.
      const message = normalize(raw);
      if (/\b(curadoria|oportunidad|pronto|elegivel|prospect|aquisicao|aquisição)\b/.test(message)) {
        const result = getCurationOpportunities(ctx);
        if (result.status === "ok" && result.data) {
          return finish({
            intent: "curation-opportunities",
            blocks: [
              {
                kind: "text",
                text:
                  pluralize(result.data.length, "cliente pronto para curadoria", "clientes prontos para curadoria") + ".",
              },
              cardsBlock(result.data),
            ],
            disclosures: { facts: result.facts, inferences: result.inferences },
          });
        }
        return finish({
          intent: "curation-opportunities",
          blocks: [{ kind: "text", text: result.message ?? "Nenhuma oportunidade elegível agora." }],
        });
      }
      const result = getFounderAttention(ctx);
      if (result.status === "ok" && result.data) {
        return finish({
          intent: "founder-attention",
          blocks: [
            {
              kind: "text",
              text: pluralize(result.data.length, "Founder pede atenção agora", "Founders pedem atenção agora") + ".",
            },
            cardsBlock(result.data),
          ],
          disclosures: { facts: result.facts, inferences: result.inferences },
        });
      }
      return finish({
        intent: "founder-attention",
        blocks: [{ kind: "text", text: result.message ?? "Nenhum Founder pede atenção agora." }],
      });
    }

    // Rota assinantes — renovação/detecção. Adesão comercial cai aqui também,
    // porque hoje a fila usa a mesma skill de atenção.
    if (classification.domain === "SUBSCRIBER_RENEWAL" || classification.domain === "SUBSCRIPTION_SALES") {
      const result = getSubscriberAttention(ctx);
      if (result.status === "ok" && result.data) {
        return finish({
          intent: "subscriber-attention",
          blocks: [
            {
              kind: "text",
              text: pluralize(result.data.length, "assinante requer atenção", "assinantes requerem atenção") + ".",
            },
            cardsBlock(result.data),
          ],
          disclosures: { facts: result.facts, inferences: result.inferences },
        });
      }
      return finish({
        intent: "subscriber-attention",
        blocks: [{ kind: "text", text: result.message ?? "Nenhum assinante requer atenção agora." }],
      });
    }

    // Rota 5: resumo de cliente por nome.
    const nameCandidate = extractCustomerName(raw);
    if (nameCandidate) {
      const customer = findCustomerByFuzzyName(ctx, nameCandidate);
      if (!customer) {
        return finish({
          intent: "customer-summary",
          blocks: [
            {
              kind: "text",
              text: `Não encontrei "${nameCandidate}" na base atual. Tente escrever parte do nome completo.`,
            },
          ],
        });
      }
      const summary = getCustomerSummary(ctx, customer.id);
      if (summary.status === "ok" && summary.data) {
        const action = suggestNextAction(ctx, customer.id);
        const blocks: AgentResponse["blocks"] = [
          { kind: "text", text: `Resumo de ${summary.data.name}.` },
          { kind: "summary", summary: summary.data },
        ];
        if (action.status === "ok" && action.data) {
          blocks.push({ kind: "next-action", action: action.data });
        }
        return finish({
          intent: "customer-summary",
          blocks,
          disclosures: { facts: summary.facts, inferences: summary.inferences },
        });
      }
      return finish({
        intent: "customer-summary",
        blocks: [{ kind: "text", text: summary.message ?? "Não consegui montar o resumo." }],
      });
    }

    // Fallback: help.
    return finish({
      intent: "help",
      blocks: [
        {
          kind: "text",
          text: [
            "Posso ajudar com:",
            "• Quem chamar hoje (briefing do dia)",
            "• Portal do Assinante — quem está pronto para receber convite / problemas de acesso",
            "• Founders que precisam atenção / Curadoria (aquisição)",
            "• Assinantes — renovação e detecção",
            "• Resumo de um cliente — escreva por exemplo: “resuma José Moreira”",
          ].join("\n"),
        },
      ],
    });
  }
}
