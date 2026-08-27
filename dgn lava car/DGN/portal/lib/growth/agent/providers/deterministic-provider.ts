import type { AgentContext } from "../agent-context.ts";
import type { AgentProvider } from "./types.ts";
import type { AgentQuery, AgentResponse, AttentionCard } from "../types.ts";
import { getDailyBriefing } from "../skills/daily-briefing.ts";
import { getFounderAttention } from "../skills/founder-attention.ts";
import { getCurationOpportunities } from "../skills/curation-opportunities.ts";
import { getSubscriberAttention } from "../skills/subscriber-attention.ts";
import { findCustomerByFuzzyName, getCustomerSummary } from "../skills/customer-summary.ts";
import { suggestNextAction } from "../skills/next-action.ts";

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

export class DeterministicAgentProvider implements AgentProvider {
  async converse(query: AgentQuery, ctx: AgentContext): Promise<AgentResponse> {
    const raw = query.message ?? "";
    const message = normalize(raw);
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

    // Rota 1: daily briefing — "quem devo chamar", "o que fazer hoje"...
    if (
      /\b(hoje|agora|prioridade|atencao|chamar|fazer|briefing|carteira|panorama|resumir\s+carteira|resuma\s+minha|status)\b/.test(
        message,
      ) &&
      !/\b(founder|assinante|curadoria|cliente|resuma\s+o|sobre)\b/.test(message)
    ) {
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

    // Rota 2: Founder attention.
    if (/\b(founder|convite|convites|whatsapp)\b/.test(message)) {
      const result = getFounderAttention(ctx);
      if (result.status === "ok" && result.data) {
        return finish({
          intent: "founder-attention",
          blocks: [
            {
              kind: "text",
              text:
                pluralize(result.data.length, "Founder pede atenção agora", "Founders pedem atenção agora") + ".",
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

    // Rota 3: curadoria / oportunidades.
    if (/\b(curadoria|oportunidad|pronto|elegivel|prospect|aquisicao)\b/.test(message)) {
      const result = getCurationOpportunities(ctx);
      if (result.status === "ok" && result.data) {
        return finish({
          intent: "curation-opportunities",
          blocks: [
            {
              kind: "text",
              text:
                pluralize(result.data.length, "cliente pronto para curadoria", "clientes prontos para curadoria") +
                ".",
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

    // Rota 4: assinantes.
    if (/\b(assinante|renovacao|assinatura)\b/.test(message)) {
      const result = getSubscriberAttention(ctx);
      if (result.status === "ok" && result.data) {
        return finish({
          intent: "subscriber-attention",
          blocks: [
            {
              kind: "text",
              text:
                pluralize(result.data.length, "assinante requer atenção", "assinantes requerem atenção") + ".",
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
            "• Founders que precisam atenção",
            "• Curadoria — clientes prontos para aquisição",
            "• Assinantes — renovação e detecção",
            "• Resumo de um cliente — escreva por exemplo: “resuma José Moreira”",
          ].join("\n"),
        },
      ],
    });
  }
}
