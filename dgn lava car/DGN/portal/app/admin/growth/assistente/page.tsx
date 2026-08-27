import { AlertTriangle } from "lucide-react";
import { buildAgentContext } from "@/lib/growth/agent/agent-context";
import { getDailyBriefing } from "@/lib/growth/agent/skills/daily-briefing";
import type { DailyBriefing } from "@/lib/growth/agent/types";
import { DgnAgentWorkspace } from "@/components/agent/DgnAgentWorkspace";

export const dynamic = "force-dynamic";

interface BriefingOutcome {
  briefing: DailyBriefing | null;
  facts: string[];
  inferences: string[];
  loadError: string | null;
}

async function loadBriefing(): Promise<BriefingOutcome> {
  try {
    const ctx = await buildAgentContext();
    const result = getDailyBriefing(ctx);
    return {
      briefing: result.data ?? null,
      facts: result.facts,
      inferences: result.inferences,
      loadError: null,
    };
  } catch (error) {
    return {
      briefing: null,
      facts: [],
      inferences: [],
      loadError: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}

export default async function DgnAssistentePage() {
  const outcome = await loadBriefing();

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/[0.06] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Central de inteligência
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Assistente DGN
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            Sua central de inteligência comercial. Analiso a operação da DGN e mostro onde sua
            atenção pode gerar mais resultado — leitura, análise e recomendação; nunca executo
            ação sozinho.
          </p>
        </header>

        {outcome.loadError ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.03] p-4 text-sm text-amber-200/90">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                Não foi possível carregar a inteligência agora
              </p>
              <p className="mt-1 leading-relaxed">
                A base do Growth não respondeu — nenhum card é exibido para não mostrar dado
                fictício. <span className="text-amber-200/60">({outcome.loadError})</span>
              </p>
            </div>
          </div>
        ) : null}

        <DgnAgentWorkspace briefing={outcome.briefing} disclosures={{ facts: outcome.facts, inferences: outcome.inferences }} />
      </div>
    </div>
  );
}
