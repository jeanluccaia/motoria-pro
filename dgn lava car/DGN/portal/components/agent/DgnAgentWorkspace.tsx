"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  User,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type {
  AgentResponse,
  AgentResponseBlock,
  AttentionCard,
  CustomerSummary,
  DailyBriefing,
  NextActionSuggestion,
  Priority,
} from "@/lib/growth/agent/types";

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

function AttentionCardView({ card }: { card: AttentionCard }) {
  const Icon = KIND_ICON[card.kind];
  const priority = PRIORITY_STYLES[card.priority];
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
      <Link
        href={card.href}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-4 text-sm font-medium text-[#E7C96A] transition hover:bg-[#C9A84C]/[0.14]"
      >
        {card.ctaLabel}
        <ArrowRight size={14} />
      </Link>
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

function ChatSection() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries.length]);

  const send = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || pending) return;
    setInput("");
    setEntries((prev) => [...prev, { role: "user", text: trimmed }]);
    setPending(true);
    try {
      const res = await fetch("/api/admin/growth/agent/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
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

  return (
    <section aria-labelledby="chat-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="chat-heading" className="text-lg font-semibold text-white sm:text-xl">
          Conversar com o assistente
        </h2>
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
            {entries.map((entry, i) => (
              <li key={i}>
                <ChatEntryView entry={entry} />
              </li>
            ))}
            {pending && <li aria-live="polite"><PendingBubble /></li>}
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

function ChatEntryView({ entry }: { entry: ChatEntry }) {
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
  return <AgentBubble response={entry.response} />;
}

function PendingBubble() {
  return (
    <div className="flex items-center gap-2 text-sm text-white/60">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A84C]/12 text-[#C9A84C]">
        <Bot size={14} />
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Loader2 size={14} className="animate-spin" /> Consultando skills…
      </span>
    </div>
  );
}

function AgentBubble({ response }: { response: AgentResponse }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/12 text-[#C9A84C]">
        <Bot size={14} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {response.blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
        {response.disclosures ? (
          <DisclosurePanel disclosures={response.disclosures} />
        ) : null}
      </div>
    </div>
  );
}

function BlockView({ block }: { block: AgentResponseBlock }) {
  if (block.kind === "text") {
    return (
      <div className="whitespace-pre-line rounded-2xl rounded-tl-md bg-white/[0.04] px-4 py-2.5 text-sm text-white/90">
        {block.text}
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
  return null;
}

function SummaryBlock({ summary }: { summary: CustomerSummary }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#101010] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-white sm:text-base">{summary.name}</h3>
        {summary.score ? (
          <span className="inline-flex items-center rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E7C96A]">
            Score {summary.score.total} · {summary.score.tier}
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
            <dt className="min-w-0 shrink-0 text-white/50">{r.label}:</dt>
            <dd className="min-w-0 truncate text-white/85">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
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
