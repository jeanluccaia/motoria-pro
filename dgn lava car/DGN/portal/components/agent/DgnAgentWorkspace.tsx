"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ClipboardCopy,
  Crown,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
  User,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type {
  AgentHistoryMessage,
  AgentResponse,
  AgentResponseBlock,
  AttentionCard,
  CustomerSummary,
  DailyBriefing,
  NextActionSuggestion,
  PreparationObjective,
  PreparationTone,
  PreparedAttackPlan,
  PreparedCurationBrief,
  PreparedMessage,
  Priority,
  ProviderMode,
} from "@/lib/growth/agent/types";
import {
  assertAskIsSafe,
  buildIntentPrompt,
  isAgentIntent,
  type AgentIntent,
} from "@/lib/growth/agent/intents";
import { AgentMarkdown } from "./AgentMarkdown";

// -----------------------------------------------------------------------------
// DgnAgentWorkspace
// - Bloco superior: Daily Briefing (server-fetched, mostrado inteiro no load)
// - Bloco inferior: Chat interativo que consome /api/admin/growth/agent/query
// Mobile-first: cards e chat empilham verticalmente, composer sticky no rodapé
// da coluna, targets ≥44px, safe-area respeitada.
// -----------------------------------------------------------------------------

interface Disclosures {
  facts: string[];
  inferences: string[];
}

interface Props {
  briefing: DailyBriefing | null;
  disclosures: Disclosures;
}

type ChatEntry =
  | { role: "user"; text: string }
  | { role: "agent"; response: AgentResponse }
  | { role: "error"; text: string };

const PRIORITY_STYLES: Record<Priority, { label: string; badge: string }> = {
  critica: {
    label: "Crítica",
    badge: "bg-red-500/12 text-red-300 border-red-400/30",
  },
  alta: {
    label: "Alta prioridade",
    badge: "bg-[#C9A84C]/12 text-[#E7C96A] border-[#C9A84C]/40",
  },
  media: {
    label: "Acompanhar",
    badge: "bg-white/[0.06] text-white/80 border-white/15",
  },
  oportunidade: {
    label: "Oportunidade",
    badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  },
};

const KIND_ICON: Record<AttentionCard["kind"], LucideIcon> = {
  founder: Crown,
  curation: UserCheck,
  subscriber: ShieldCheck,
  insight: Sparkles,
};

const QUICK_SUGGESTIONS = [
  "Quem devo chamar hoje?",
  "Quais Founders precisam de atenção?",
  "Quem está pronto para curadoria?",
  "Resuma minha carteira",
  "Procure oportunidades",
];

/** Score em pt-BR (82,5 em vez de 82.5) — evita valor com precisão excessiva. */
function formatScorePtBr(score: number): string {
  if (!Number.isFinite(score) || score <= 0) return "—";
  return score.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

const OBJECTIVE_LABELS: Record<PreparationObjective, string> = {
  followup: "Follow-up",
  founder_acquisition: "Aquisição Founder",
  founder_followup: "Relacionamento Founder",
  renewal: "Renovação",
  relationship: "Relacionamento",
  reactivation: "Reativação",
};

const TONE_LABELS: Record<PreparationTone, string> = {
  padrao: "Padrão",
  mais_curta: "Mais curta",
  mais_direta: "Mais direta",
  mais_consultiva: "Mais consultiva",
  mais_pessoal: "Mais pessoal",
  menos_comercial: "Menos comercial",
};

/** Tons disponíveis para o operador pedir refação — sem `padrao`. */
const TONE_QUICK_REPLIES: PreparationTone[] = [
  "mais_curta",
  "mais_direta",
  "mais_consultiva",
  "mais_pessoal",
  "menos_comercial",
];

function toneRefinePrompt(prepared: PreparedMessage, tone: PreparationTone): string {
  const label = TONE_LABELS[tone].toLowerCase();
  return `Reescreva a mensagem para ${prepared.customerName} ${label} — mesmo objetivo (${OBJECTIVE_LABELS[prepared.objective].toLowerCase()}).`;
}

export function DgnAgentWorkspace({ briefing, disclosures }: Props) {
  return (
    <div className="mt-6 flex flex-col gap-8">
      <BriefingSection briefing={briefing} disclosures={disclosures} />
      <ChatSection />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Briefing
// -----------------------------------------------------------------------------

function BriefingSection({ briefing, disclosures }: { briefing: DailyBriefing | null; disclosures: Disclosures }) {
  if (!briefing) {
    return (
      <section className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Briefing indisponível
        </p>
        <p className="mt-2 text-sm text-white/70">
          Não foi possível carregar a inteligência agora — use o chat abaixo para pedir de novo.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="briefing-heading">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 id="briefing-heading" className="text-lg font-semibold text-white sm:text-xl">
            {briefing.greeting}
          </h2>
          <p className="mt-1 text-sm text-white/70">O que precisa da sua atenção hoje.</p>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
          {briefing.headline}
        </p>
      </div>

      {briefing.cards.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#101010] p-6 text-sm text-white/70">
          Nenhuma ação prioritária identificada agora — nada está atrasado nem visualizado sem
          resposta.
        </div>
      ) : (
        <ul className="mt-4 grid gap-3">
          {briefing.cards.map((card) => (
            <li key={card.id}>
              <AttentionCardView card={card} />
            </li>
          ))}
        </ul>
      )}

      {(disclosures.facts.length > 0 || disclosures.inferences.length > 0) && (
        <DisclosurePanel disclosures={disclosures} />
      )}

      <p className="mt-4 text-[11px] text-white/40">
        Fonte:{" "}
        {briefing.dataOrigin === "db"
          ? "Supabase (operação em tempo real)"
          : briefing.dataOrigin === "json-fallback"
            ? "JSON local (fallback temporário)"
            : "JSON local"}
      </p>
    </section>
  );
}

const CARD_PREPARE_INTENT: Record<AttentionCard["kind"], AgentIntent> = {
  founder: "prepare_followup",
  curation: "prepare_brief",
  subscriber: "prepare_renewal",
  insight: "next_action",
};

function attentionCardPrepareHref(card: AttentionCard): string | null {
  if (!card.customerId) return null;
  const intent = CARD_PREPARE_INTENT[card.kind];
  return `/admin/growth/assistente?intent=${encodeURIComponent(intent)}&customer=${encodeURIComponent(card.customerId)}`;
}

function AttentionCardView({ card }: { card: AttentionCard }) {
  const Icon = KIND_ICON[card.kind];
  const priority = PRIORITY_STYLES[card.priority];
  const prepareHref = attentionCardPrepareHref(card);
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#101010] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/12 text-[#C9A84C]">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white sm:text-base">{card.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/70">{card.reason}</p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${priority.badge}`}
        >
          {priority.label}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-white/50">
        <span className="uppercase tracking-[0.14em] text-white/40">Próxima ação · </span>
        {card.nextAction}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={card.href}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-4 text-sm font-medium text-[#E7C96A] transition hover:bg-[#C9A84C]/[0.14]"
        >
          {card.ctaLabel}
          <ArrowRight size={14} />
        </Link>
        {prepareHref ? (
          <Link
            href={prepareHref}
            data-testid="card-prepare-contact"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm font-medium text-white/85 transition hover:border-[#C9A84C]/30 hover:text-white"
          >
            <Sparkles size={13} /> Preparar contato
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function DisclosurePanel({ disclosures }: { disclosures: Disclosures }) {
  return (
    <details className="mt-4 rounded-xl border border-white/[0.06] bg-[#0C0C0C] p-4 text-xs text-white/60 open:pb-5">
      <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
        Fatos e inferências desta leitura
      </summary>
      {disclosures.facts.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Fatos</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {disclosures.facts.map((f, i) => (
              <li key={`fact-${i}`}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {disclosures.inferences.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Inferências</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {disclosures.inferences.map((f, i) => (
              <li key={`inf-${i}`}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}

// -----------------------------------------------------------------------------
// Chat
// -----------------------------------------------------------------------------

const HISTORY_UI_CAP = 6;

function buildHistoryFromEntries(entries: ChatEntry[]): AgentHistoryMessage[] {
  const history: AgentHistoryMessage[] = [];
  for (const entry of entries) {
    if (entry.role === "user") {
      history.push({ role: "user", content: entry.text });
    } else if (entry.role === "agent") {
      const text = entry.response.blocks
        .filter((b): b is Extract<AgentResponseBlock, { kind: "text" }> => b.kind === "text")
        .map((b) => b.text)
        .join("\n\n");
      if (text.trim().length > 0) {
        history.push({ role: "assistant", content: text.trim() });
      }
    }
  }
  return history.slice(-HISTORY_UI_CAP);
}

function ChatSection() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [pending, setPending] = useState(false);
  const [pendingElapsed, setPendingElapsed] = useState(0);
  const [input, setInput] = useState("");
  const [lastProviderMode, setLastProviderMode] = useState<ProviderMode | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const lastEntryRef = useRef<HTMLLIElement | null>(null);
  const searchParams = useSearchParams();
  const lastAutoKeyRef = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries.length]);

  // Após cada NOVA resposta do agente (chip de tom, intent, prompt manual),
  // scroll o último bubble para dentro da viewport — não deixa o operador
  // procurando o cartão que acabou de aparecer.
  useEffect(() => {
    const last = entries[entries.length - 1];
    if (!last || last.role !== "agent") return;
    lastEntryRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [entries]);

  // Timer de progressão do loading — não afirma tool concluída, apenas mostra
  // ao operador que o servidor continua trabalhando. Reinicia quando pending
  // volta a false.
  useEffect(() => {
    if (!pending) {
      setPendingElapsed(0);
      return;
    }
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      setPendingElapsed(Date.now() - startedAt);
    }, 500);
    return () => window.clearInterval(id);
  }, [pending]);

  const send = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || pending) return;
    setInput("");
    // Capturamos o histórico ANTES de anexar a mensagem nova para não incluir
    // ela mesma no payload.
    let historyToSend: AgentHistoryMessage[] = [];
    setEntries((prev) => {
      historyToSend = buildHistoryFromEntries(prev);
      return [...prev, { role: "user", text: trimmed }];
    });
    setPending(true);
    try {
      const res = await fetch("/api/admin/growth/agent/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: historyToSend }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        setEntries((prev) => [
          ...prev,
          { role: "error", text: body.message ?? body.error ?? "Não foi possível processar." },
        ]);
        return;
      }
      const data = (await res.json()) as AgentResponse;
      setLastProviderMode(data.providerMode ?? null);
      setEntries((prev) => [...prev, { role: "agent", response: data }]);
    } catch (error) {
      setEntries((prev) => [
        ...prev,
        { role: "error", text: error instanceof Error ? error.message : "Erro de rede." },
      ]);
    } finally {
      setPending(false);
    }
  }, [pending]);

  // Auto-envio REATIVO: dispara em cold load E em navegação client-side dentro
  // do próprio Assistente. A "chave" única evita re-disparo em re-renders sem
  // mudança real. Preferência ?intent=<name>&customer=<id> (allowlist);
  // fallback ?ask= só passa se `assertAskIsSafe` liberar.
  const intentParam = searchParams?.get("intent") ?? null;
  const customerParam = searchParams?.get("customer") ?? null;
  const askParam = searchParams?.get("ask") ?? null;
  const autoKey = intentParam
    ? `intent:${intentParam}:${customerParam ?? ""}`
    : askParam
      ? `ask:${askParam}`
      : null;

  useEffect(() => {
    if (!autoKey) return;
    if (lastAutoKeyRef.current === autoKey) return;
    lastAutoKeyRef.current = autoKey;

    let queued: string | null = null;
    let blockedMessage: string | null = null;

    if (intentParam) {
      if (!isAgentIntent(intentParam)) {
        blockedMessage = `Intent "${intentParam}" não é reconhecida.`;
      } else {
        queued = buildIntentPrompt(intentParam as AgentIntent, customerParam ?? undefined);
      }
    } else if (askParam) {
      const guard = assertAskIsSafe(askParam);
      if (guard) blockedMessage = guard;
      else queued = askParam;
    }

    if (blockedMessage) {
      setEntries((prev) => [...prev, { role: "error", text: blockedMessage! }]);
      return;
    }
    if (!queued) return;
    // Scroll para a área do chat antes de disparar — o operador vê a bolha
    // aparecendo mesmo que o briefing ocupe a viewport inicial.
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    void send(queued);
  }, [autoKey, intentParam, customerParam, askParam, send]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="chat-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="chat-heading" className="text-lg font-semibold text-white sm:text-xl">
          Conversar com o assistente
        </h2>
        <ProviderBadge mode={lastProviderMode} />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Sugestões rápidas">
        {QUICK_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            onClick={() => void send(s)}
            className="inline-flex min-h-11 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-white/80 transition hover:border-[#C9A84C]/40 hover:text-white disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="max-h-[60vh] min-h-[240px] overflow-y-auto rounded-2xl border border-white/[0.06] bg-[#0B0B0B] p-4"
        aria-live="polite"
      >
        {entries.length === 0 ? (
          <EmptyChatState />
        ) : (
          <ul className="flex flex-col gap-4">
            {entries.map((entry, i) => {
              const isLast = i === entries.length - 1;
              return (
                <li key={i} ref={isLast ? lastEntryRef : undefined}>
                  <ChatEntryView entry={entry} onQuickPrompt={(text) => void send(text)} />
                </li>
              );
            })}
            {pending && <li aria-live="polite"><PendingBubble elapsedMs={pendingElapsed} /></li>}
          </ul>
        )}
      </div>

      <ChatComposer
        value={input}
        onChange={setInput}
        onSend={() => void send(input)}
        disabled={pending}
      />
    </section>
  );
}

function EmptyChatState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#C9A84C]/12 text-[#C9A84C]">
        <Wand2 size={18} />
      </span>
      <p className="text-sm text-white/70">
        Pergunte sobre clientes, Founders, assinantes ou oportunidades.
      </p>
      <p className="text-xs text-white/40">Nada é executado — apenas análise e recomendação.</p>
    </div>
  );
}

function ChatEntryView({
  entry,
  onQuickPrompt,
}: {
  entry: ChatEntry;
  onQuickPrompt: (text: string) => void;
}) {
  if (entry.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] items-start gap-2">
          <div className="rounded-2xl rounded-tr-md bg-[#C9A84C]/10 px-4 py-2.5 text-sm text-white">
            {entry.text}
          </div>
          <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-white/70">
            <User size={14} />
          </span>
        </div>
      </div>
    );
  }
  if (entry.role === "error") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-3 py-2 text-sm text-red-200">
        <Bot size={14} className="mt-0.5 shrink-0" />
        <span>{entry.text}</span>
      </div>
    );
  }
  return <AgentBubble response={entry.response} onQuickPrompt={onQuickPrompt} />;
}

function pendingLabel(elapsedMs: number): string {
  // Progressão temporal fixa — não afirma tool concluída, só mostra que o
  // servidor continua trabalhando. Latência real está em ~18–30s.
  if (elapsedMs < 3_000) return "Entendendo seu pedido…";
  if (elapsedMs < 10_000) return "Consultando dados da DGN…";
  return "Preparando recomendação…";
}

function PendingBubble({ elapsedMs }: { elapsedMs: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/60" data-testid="agent-pending-bubble">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A84C]/12 text-[#C9A84C]">
        <Bot size={14} />
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Loader2 size={14} className="animate-spin" /> {pendingLabel(elapsedMs)}
      </span>
    </div>
  );
}

function ProviderBadge({ mode }: { mode: ProviderMode | null }) {
  if (!mode) return null;
  const isLlm = mode === "llm";
  const isFallback = mode === "deterministic-fallback";
  const label = isLlm
    ? "Assistente DGN · IA"
    : isFallback
      ? "Assistente DGN · modo básico (fallback)"
      : "Assistente DGN · modo básico";
  const cls = isLlm
    ? "border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] text-[#E7C96A]"
    : isFallback
      ? "border-amber-300/25 bg-amber-300/[0.03] text-amber-200/90"
      : "border-white/[0.08] bg-white/[0.03] text-white/70";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}
      data-testid="agent-provider-badge"
    >
      <Sparkles size={10} />
      {label}
    </span>
  );
}

function AgentBubble({
  response,
  onQuickPrompt,
}: {
  response: AgentResponse;
  onQuickPrompt: (text: string) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/12 text-[#C9A84C]">
        <Bot size={14} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {response.blocks.map((block, i) => (
          <BlockView key={i} block={block} onQuickPrompt={onQuickPrompt} />
        ))}
        {response.disclosures ? (
          <DisclosurePanel disclosures={response.disclosures} />
        ) : null}
      </div>
    </div>
  );
}

function BlockView({
  block,
  onQuickPrompt,
}: {
  block: AgentResponseBlock;
  onQuickPrompt: (text: string) => void;
}) {
  if (block.kind === "text") {
    return (
      <div className="rounded-2xl rounded-tl-md bg-white/[0.04] px-4 py-2.5 text-sm text-white/90">
        <AgentMarkdown text={block.text} />
      </div>
    );
  }
  if (block.kind === "cards") {
    if (block.cards.length === 0) {
      return (
        <div className="rounded-xl border border-white/[0.06] bg-[#101010] px-3 py-2 text-xs text-white/60">
          Sem itens que atendam ao filtro no momento.
        </div>
      );
    }
    return (
      <ul className="flex flex-col gap-2.5">
        {block.cards.map((card) => (
          <li key={card.id}>
            <AttentionCardView card={card} />
          </li>
        ))}
      </ul>
    );
  }
  if (block.kind === "summary") {
    return <SummaryBlock summary={block.summary} />;
  }
  if (block.kind === "next-action") {
    return <NextActionBlock action={block.action} />;
  }
  if (block.kind === "prepared-message") {
    return <PreparedMessageCard prepared={block.prepared} onQuickPrompt={onQuickPrompt} />;
  }
  if (block.kind === "prepared-brief") {
    return <PreparedBriefCard brief={block.brief} />;
  }
  if (block.kind === "attack-plan") {
    return <AttackPlanCard plan={block.plan} onQuickPrompt={onQuickPrompt} />;
  }
  return null;
}

function SummaryBlock({ summary }: { summary: CustomerSummary }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#101010] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-white sm:text-base">{summary.name}</h3>
        {summary.score ? (
          <span className="inline-flex items-center rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E7C96A]">
            Score {formatScorePtBr(summary.score.total)} · {summary.score.tier}
          </span>
        ) : null}
      </div>

      <FieldGroup label="Identidade" rows={summary.identity} />
      <FieldGroup label="Comercial" rows={summary.commercial} />

      {summary.founder ? (
        <FieldGroup
          label="Founder"
          rows={[
            { label: "Estágio", value: summary.founder.stage },
            { label: "Convite ativo", value: summary.founder.hasActiveInvite ? "Sim" : "Não" },
            { label: "Último engajamento", value: summary.founder.lastEngagement ?? "—" },
          ]}
        />
      ) : null}

      {summary.subscriber ? (
        <FieldGroup
          label="Assinante"
          rows={[
            { label: "Plano", value: summary.subscriber.plan },
            { label: "Status", value: summary.subscriber.status },
          ]}
        />
      ) : null}

      <Link
        href={summary.primaryHref}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-4 text-sm font-medium text-[#E7C96A] transition hover:bg-[#C9A84C]/[0.14]"
      >
        Abrir cliente
        <ArrowRight size={14} />
      </Link>
    </article>
  );
}

function FieldGroup({ label, rows }: { label: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{label}</p>
      <dl className="mt-2 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline gap-2">
            <dt className="shrink-0 text-white/50">{r.label}:</dt>
            {/* H: sem truncate — justificativa importante (ex.: "Não — Já é
                assinante DGN…") nunca deve esconder o motivo. Wrap normal com
                title tooltip como fallback. */}
            <dd className="min-w-0 whitespace-normal break-words text-white/85" title={r.value}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CopyButton({ text, label = "Copiar mensagem" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [text]);
  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      aria-label={label}
      data-testid="prepared-copy-button"
      // B-19: min-w fixa evita layout shift entre "Copiar mensagem" e "Copiado".
      className="inline-flex min-h-11 min-w-[168px] items-center justify-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.10] px-3 text-sm font-medium text-[#E7C96A] transition hover:bg-[#C9A84C]/[0.18]"
    >
      {copied ? (
        <>
          <ClipboardCheck size={14} /> Copiado
        </>
      ) : (
        <>
          <ClipboardCopy size={14} /> {label}
        </>
      )}
    </button>
  );
}

function PreparedDisclaimer() {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
      Preparado pela IA · revisar antes de enviar
    </p>
  );
}

function FactsList({ facts }: { facts: string[] }) {
  if (facts.length === 0) return null;
  return (
    <details className="rounded-lg border border-white/[0.06] bg-[#0C0C0C] px-3 py-2 text-xs text-white/60 open:pb-3">
      <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        Fatos usados ({facts.length})
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {facts.map((f, i) => (
          <li key={`pf-${i}`}>{f}</li>
        ))}
      </ul>
    </details>
  );
}

function PreparedMessageCard({
  prepared,
  onQuickPrompt,
  compact = false,
}: {
  prepared: PreparedMessage;
  onQuickPrompt: (text: string) => void;
  compact?: boolean;
}) {
  return (
    <article
      data-testid="prepared-message-card"
      className="flex flex-col gap-3 rounded-2xl border border-[#C9A84C]/25 bg-[#0F0D08] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Mensagem preparada
          </p>
          <h3 className="mt-0.5 truncate text-sm font-semibold text-white sm:text-base">
            {prepared.customerName}
          </h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E7C96A]">
          {OBJECTIVE_LABELS[prepared.objective]}
        </span>
      </div>

      {!compact && (
        <dl className="grid grid-cols-1 gap-1.5 text-xs">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Contexto
            </dt>
            <dd className="mt-0.5 text-white/80">{prepared.context}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Ângulo
            </dt>
            <dd className="mt-0.5 text-white/80">{prepared.angle}</dd>
          </div>
          {prepared.objection ? (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Objeção provável
              </dt>
              <dd className="mt-0.5 text-white/80">{prepared.objection}</dd>
            </div>
          ) : null}
        </dl>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-[#080807] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Rascunho ({TONE_LABELS[prepared.tone]})
        </p>
        <p
          className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/90"
          data-testid="prepared-draft"
        >
          {prepared.draftMessage}
        </p>
      </div>

      {!compact && (
        <p className="text-xs leading-relaxed text-white/60">
          <span className="uppercase tracking-[0.14em] text-white/40">Próximo passo · </span>
          {prepared.nextStep}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={prepared.draftMessage} />
        <Link
          href={prepared.href}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white/80 transition hover:bg-white/[0.06]"
        >
          Abrir cliente <ArrowRight size={14} />
        </Link>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Refazer com outro tom
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Ajustar tom">
          {TONE_QUICK_REPLIES.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => onQuickPrompt(toneRefinePrompt(prepared, tone))}
              data-testid={`prepared-tone-${tone}`}
              className="inline-flex min-h-9 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 text-[11px] text-white/75 transition hover:border-[#C9A84C]/40 hover:text-white"
            >
              {TONE_LABELS[tone]}
            </button>
          ))}
        </div>
      </div>

      {!compact && <FactsList facts={prepared.facts} />}
      <PreparedDisclaimer />
    </article>
  );
}

function PreparedBriefCard({ brief }: { brief: PreparedCurationBrief }) {
  const sections: Array<{ label: string; value: string }> = [
    { label: "Quem é", value: brief.who },
    { label: "Por que está aqui", value: brief.whyHere },
    { label: "Melhor argumento", value: brief.bestArgument },
    { label: "Evitar", value: brief.avoid },
    { label: "Abordagem sugerida", value: brief.suggestedApproach },
    { label: "Próximo passo", value: brief.nextStep },
  ];
  return (
    <article
      data-testid="prepared-brief-card"
      className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0F0F0F] p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Brief de curadoria
          </p>
          <h3 className="mt-0.5 truncate text-sm font-semibold text-white sm:text-base">
            {brief.customerName}
          </h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
          <UserCheck size={10} className="mr-1" /> Pré-atendimento
        </span>
      </div>

      <dl className="flex flex-col gap-2.5 text-sm">
        {sections.map((s) => (
          <div key={s.label}>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              {s.label}
            </dt>
            <dd className="mt-0.5 text-white/85">{s.value}</dd>
          </div>
        ))}
      </dl>

      <Link
        href={brief.href}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-4 text-sm font-medium text-[#E7C96A] transition hover:bg-[#C9A84C]/[0.14]"
      >
        Abrir cliente <ArrowRight size={14} />
      </Link>

      <FactsList facts={brief.facts} />
      <PreparedDisclaimer />
    </article>
  );
}

function AttackPlanCard({
  plan,
  onQuickPrompt,
}: {
  plan: PreparedAttackPlan;
  onQuickPrompt: (text: string) => void;
}) {
  return (
    <article
      data-testid="attack-plan-card"
      className="flex flex-col gap-4 rounded-2xl border border-[#C9A84C]/30 bg-[#0F0D08] p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Plano de ataque · {plan.greeting}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-white sm:text-base">{plan.headline}</h3>
        </div>
      </div>

      {plan.priorities.length > 0 && (
        <div className="flex flex-col gap-3">
          {plan.priorities.map((priority) => (
            <div
              key={priority.label}
              className="rounded-xl border border-white/[0.06] bg-[#0B0B0B] p-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E7C96A]">
                {priority.label}
              </p>
              <p className="mt-0.5 text-xs text-white/60">{priority.description}</p>
              {priority.cards.length > 0 && (
                <ul className="mt-2.5 flex flex-col gap-2">
                  {priority.cards.map((card) => (
                    <li key={card.id}>
                      <AttentionCardView card={card} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {plan.executionOrder.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Ordem de execução sugerida
          </p>
          <ol className="mt-2 flex flex-col gap-1.5">
            {plan.executionOrder.map((item, i) => (
              <li
                key={`${item.customerId ?? item.name}-${i}`}
                className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-[#0B0B0B] px-3 py-2 text-xs"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/12 text-[10px] font-semibold text-[#E7C96A]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{item.name}</p>
                  <p className="mt-0.5 text-white/60">{item.reason}</p>
                </div>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-[11px] text-white/80 hover:bg-white/[0.06]"
                  >
                    Abrir <ArrowRight size={12} />
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      )}

      {plan.preparedDrafts.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Rascunhos preparados ({plan.preparedDrafts.length})
          </p>
          <div className="mt-2 flex flex-col gap-2.5">
            {plan.preparedDrafts.map((prepared) => (
              <PreparedMessageCard
                key={`${prepared.customerId}-${prepared.objective}`}
                prepared={prepared}
                onQuickPrompt={onQuickPrompt}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {plan.preparedNotice ? (
        <p className="rounded-lg border border-amber-300/25 bg-amber-300/[0.04] px-3 py-2 text-xs text-amber-200/90">
          <MessageSquare size={12} className="mr-1 inline align-[-2px]" />
          {plan.preparedNotice}
        </p>
      ) : null}

      <PreparedDisclaimer />
    </article>
  );
}

function NextActionBlock({ action }: { action: NextActionSuggestion }) {
  return (
    <article className="flex items-start gap-3 rounded-2xl border border-[#C9A84C]/25 bg-[#C9A84C]/[0.05] p-4">
      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#C9A84C]" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Próxima ação</p>
        <p className="mt-1 text-sm font-medium text-white">{action.headline}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/60">{action.rationale}</p>
        <Link
          href={action.href}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[#E7C96A] hover:underline"
        >
          Abrir cliente <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="sticky bottom-[env(safe-area-inset-bottom)] z-10 flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#0B0B0B] p-2"
    >
      <label htmlFor="agent-input" className="sr-only">
        Pergunte ao Assistente DGN
      </label>
      <input
        id="agent-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={500}
        placeholder="Pergunte sobre clientes, Founders, assinantes ou oportunidades..."
        className="min-h-11 flex-1 rounded-lg bg-transparent px-3 text-sm text-white placeholder:text-white/40 focus:outline-none disabled:opacity-40"
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[#C9A84C]/15 px-3 text-sm font-medium text-[#E7C96A] transition hover:bg-[#C9A84C]/25 disabled:opacity-40"
        aria-label="Enviar"
      >
        {disabled ? <Loader2 size={16} className="animate-spin" /> : <SendGlyph />}
      </button>
    </form>
  );
}

function SendGlyph(): ReactNode {
  return <ArrowRight size={16} />;
}
