"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Zap,
  PhoneCall,
  CalendarClock,
  PhoneOff,
  MessageCircleDashed,
  Pause,
  Archive,
  CheckCircle,
  Users,
  Flame,
  CalendarCheck2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  MessageSquare,
  Mail,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shell/states";
import { cn } from "@/lib/utils";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
} from "@/lib/crm/labels";
import { formatLastContactShort } from "@/lib/crm/dates";
import { formatPhoneForDisplay } from "@/lib/crm/phone";
import {
  calculateLeadIntelligence,
  computeAlerts,
  sortByOperationalPriority,
  type LeadIntelligence,
} from "@/lib/crm/intelligence";
import {
  getLeadPresentation,
  groupOrderedLeads,
  countsFromBuckets,
  LEAD_GROUP_ORDER,
  type LeadGroup,
  type LeadPresentation,
  type IconKey,
  type Tone,
} from "@/lib/crm/presentation";
import { LeadDialog } from "./lead-dialog";
import { LeadDetailDialog } from "./lead-detail-dialog";
import type {
  FranchiseLead,
  FranchiseLeadActivity,
  FranchiseLeadStage,
  FranchiseLeadPriority,
  Role,
} from "@/lib/supabase/types";

type Props = {
  leads: FranchiseLead[];
  activities: FranchiseLeadActivity[];
  role: Role;
  // ISO string fixo vindo do servidor. Usado para que SSR e CSR renderizem a
  // mesma inteligência (dueLabel, tierLabel etc.) e não haja hydration
  // mismatch — a divergência de datas quebrava React dev mode com
  // `String.prototype.repeat` ao formatar o diff.
  nowIso: string;
};

type AlertFilter =
  | "none"
  | "overdueContacts"
  | "withoutReturn"
  | "phonesToConfirm";

type EnrichedEntry = {
  lead: FranchiseLead;
  intel: LeadIntelligence;
  presentation: LeadPresentation;
};

// Chip de filtro "Todos" = agrega todas as faixas. Os demais mapeiam 1:1
// para os buckets operacionais que já existem na camada de apresentação.
type GroupFilter = "all" | LeadGroup;

const GROUP_FILTER_ORDER: GroupFilter[] = ["all", ...LEAD_GROUP_ORDER];

const GROUP_FILTER_LABELS: Record<GroupFilter, string> = {
  all: "Todos",
  act_now: "Precisam de ação",
  reactivate: "Reativar",
  awaiting: "Aguardando",
  history: "Histórico",
};

const PAGE_SIZE = 10;

export function LeadsView({ leads, activities, role, nowIso }: Props) {
  const canCreate = role === "admin" || role === "marketing";

  const now = useMemo(() => new Date(nowIso), [nowIso]);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"" | FranchiseLeadStage>("");
  const [priorityFilter, setPriorityFilter] = useState<"" | FranchiseLeadPriority>("");
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("none");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const activitiesByLead = useMemo(() => {
    const map = new Map<string, FranchiseLeadActivity[]>();
    for (const a of activities) {
      const list = map.get(a.lead_id);
      if (list) list.push(a);
      else map.set(a.lead_id, [a]);
    }
    return map;
  }, [activities]);

  // Ordem canônica vinda da inteligência. A UI NUNCA reordena.
  const enriched: EnrichedEntry[] = useMemo(() => {
    const base = leads.map((lead) => ({
      lead,
      intel: calculateLeadIntelligence(
        lead,
        activitiesByLead.get(lead.id) ?? [],
        now,
      ),
    }));
    base.sort(sortByOperationalPriority);
    return base.map((e) => ({
      ...e,
      presentation: getLeadPresentation(e.lead, e.intel),
    }));
  }, [leads, activitiesByLead, now]);

  const buckets = useMemo(() => groupOrderedLeads(enriched), [enriched]);
  const counts = useMemo(() => countsFromBuckets(buckets), [buckets]);

  // Lista totalmente plana, histórico sempre no fim. Mantém a ordem interna
  // de cada bucket — sortByOperationalPriority já fez o trabalho fino.
  const flatOrdered: EnrichedEntry[] = useMemo(
    () => [
      ...buckets.act_now,
      ...buckets.reactivate,
      ...buckets.awaiting,
      ...buckets.history,
    ],
    [buckets],
  );

  const alerts = useMemo(
    () => computeAlerts(leads, activitiesByLead, now),
    [leads, activitiesByLead, now],
  );

  const kpis = useMemo(() => {
    let total = 0;
    let highPriority = 0;
    let scheduled = 0;
    for (const l of leads) {
      total += 1;
      if (
        l.priority === "high" &&
        l.pipeline_stage !== "lost" &&
        l.pipeline_stage !== "won"
      )
        highPriority += 1;
      if (l.pipeline_stage === "meeting_scheduled") scheduled += 1;
    }
    return { total, highPriority, scheduled };
  }, [leads]);

  const selectedLead = useMemo(
    () => (selectedLeadId ? leads.find((l) => l.id === selectedLeadId) ?? null : null),
    [selectedLeadId, leads],
  );
  const selectedLeadActivities = useMemo(
    () => (selectedLeadId ? activitiesByLead.get(selectedLeadId) ?? [] : []),
    [selectedLeadId, activitiesByLead],
  );
  const selectedLeadIntel = useMemo(
    () =>
      selectedLeadId
        ? enriched.find((e) => e.lead.id === selectedLeadId)?.intel ?? null
        : null,
    [selectedLeadId, enriched],
  );

  // Aplicação dos filtros: group chip → alertFilter → stage/priority → busca.
  // Mantém a ordenação original — paginação acontece depois.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D+/g, "");
    return flatOrdered.filter(({ lead, intel, presentation }) => {
      if (groupFilter !== "all" && presentation.group !== groupFilter) return false;
      if (stageFilter && lead.pipeline_stage !== stageFilter) return false;
      if (priorityFilter && lead.priority !== priorityFilter) return false;

      if (alertFilter !== "none") {
        if (alertFilter === "overdueContacts") {
          if (presentation.group !== "act_now") return false;
          if (!(intel.dueLabel && /atrasado|reunião há/i.test(intel.dueLabel))) return false;
        }
        if (alertFilter === "withoutReturn") {
          if (presentation.group !== "reactivate") return false;
        }
        if (alertFilter === "phonesToConfirm") {
          if (!(lead.phone && !lead.phone_normalized)) return false;
        }
      }

      if (!q) return true;
      if (lead.full_name.toLowerCase().includes(q)) return true;
      if (qDigits) {
        const phoneDigits = (lead.phone ?? "").replace(/\D+/g, "");
        if (phoneDigits.includes(qDigits)) return true;
      }
      if (lead.email && lead.email.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [flatOrdered, groupFilter, stageFilter, priorityFilter, alertFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageEntries = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  // Mantém "Quem chamar agora" com os primeiros act_now mesmo quando o usuário
  // filtrar outros grupos — é um bloco de contexto, não parte da listagem.
  const actNowList = buckets.act_now;
  const topEntry = actNowList[0] ?? null;
  const upcomingEntries = actNowList.slice(1, 4);

  // Qualquer mudança de filtro ou busca volta para a página 1.
  function resetPage() {
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <HeaderBar count={counts.act_now} />
      <IndicatorsRow
        alerts={{
          overdueContacts: alerts.overdueContacts,
          withoutReturn: alerts.withoutReturn,
          phonesToConfirm: alerts.phonesToConfirm,
        }}
        active={alertFilter}
        onPick={(k) => {
          setAlertFilter((prev) => (prev === k ? "none" : k));
          if (k === "withoutReturn") setGroupFilter("reactivate");
          else setGroupFilter("act_now");
          resetPage();
        }}
      />
      <KpiOverview kpis={kpis} />

      {topEntry ? (
        <QuemChamarAgoraBlock
          top={topEntry}
          upcoming={upcomingEntries}
          onOpen={(id) => setSelectedLeadId(id)}
        />
      ) : null}

      <section className="rounded-xl border border-border/80 bg-card/70">
        <FilterChipsBar
          active={groupFilter}
          counts={counts}
          totalAll={flatOrdered.length}
          onChange={(g) => {
            setGroupFilter(g);
            resetPage();
          }}
        />

        <div className="flex flex-col gap-3 border-t border-border/60 p-3 sm:flex-row sm:items-center sm:p-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-lf-muted" aria-hidden />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="Buscar por nome ou telefone"
              className="pl-9"
              aria-label="Buscar leads"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            <label className="flex min-w-40 flex-col gap-1">
              <span className="sr-only">Etapa</span>
              <select
                value={stageFilter}
                onChange={(e) => {
                  setStageFilter(e.target.value as "" | FranchiseLeadStage);
                  resetPage();
                }}
                className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
                aria-label="Filtrar por etapa"
              >
                <option value="">Todas as etapas</option>
                {STAGE_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-36 flex-col gap-1">
              <span className="sr-only">Prioridade</span>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as "" | FranchiseLeadPriority);
                  resetPage();
                }}
                className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
                aria-label="Filtrar por prioridade"
              >
                <option value="">Toda prioridade</option>
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {canCreate ? (
            <Button type="button" onClick={() => setCreating(true)} className="gap-2" size="lg">
              <Plus className="size-4" aria-hidden />
              <span>Adicionar lead</span>
            </Button>
          ) : null}
        </div>

        {alertFilter !== "none" ? (
          <p className="flex items-center gap-2 border-t border-border/60 px-4 py-2 text-xs text-lf-muted">
            Mostrando leads filtrados por “{alertFilterLabel(alertFilter)}”.
            <button
              type="button"
              onClick={() => {
                setAlertFilter("none");
                resetPage();
              }}
              className="font-semibold text-lf-volt hover:underline"
            >
              Limpar filtro
            </button>
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            title={leads.length === 0 ? "Nenhum lead cadastrado" : "Nenhum lead com esses filtros"}
            description={
              leads.length === 0
                ? "Clique em “Adicionar lead” para começar."
                : "Ajuste a busca ou troque o filtro."
            }
            icon={<Users className="size-6" aria-hidden />}
            className="rounded-none border-x-0 border-b-0 border-t border-border/60 bg-transparent py-10"
            action={
              canCreate && leads.length === 0 ? (
                <Button type="button" onClick={() => setCreating(true)} className="gap-2">
                  <Plus className="size-4" aria-hidden /> Adicionar lead
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Tabela em >= md */}
            <div className="hidden overflow-hidden border-t border-border/60 md:block">
              <table className="w-full table-fixed border-collapse text-sm">
                <thead className="bg-lf-graphite text-left text-xs uppercase tracking-wide text-lf-muted">
                  <tr>
                    <th className="w-14 px-3 py-3 font-medium">#</th>
                    <th className="px-3 py-3 font-medium">Nome</th>
                    <th className="w-44 px-3 py-3 font-medium">Situação</th>
                    <th className="w-32 px-3 py-3 font-medium">Última conversa</th>
                    <th className="w-[28%] px-3 py-3 font-medium">Próxima ação</th>
                    <th className="w-56 px-3 py-3 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pageEntries.map((entry, idx) => (
                    <LeadRow
                      key={entry.lead.id}
                      entry={entry}
                      position={(safePage - 1) * PAGE_SIZE + idx + 1}
                      now={now}
                      onOpen={() => setSelectedLeadId(entry.lead.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards em telas pequenas */}
            <ul className="space-y-3 border-t border-border/60 p-3 md:hidden">
              {pageEntries.map((entry, idx) => (
                <li key={entry.lead.id}>
                  <LeadMobileCard
                    entry={entry}
                    position={(safePage - 1) * PAGE_SIZE + idx + 1}
                    now={now}
                    onOpen={() => setSelectedLeadId(entry.lead.id)}
                  />
                </li>
              ))}
            </ul>

            <PaginationBar
              page={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </>
        )}
      </section>

      {canCreate ? (
        <LeadDialog mode="create" open={creating} onOpenChange={setCreating} role={role} />
      ) : null}

      {selectedLead ? (
        <LeadDetailDialog
          open={Boolean(selectedLead)}
          onOpenChange={(open) => {
            if (!open) setSelectedLeadId(null);
          }}
          lead={selectedLead}
          activities={selectedLeadActivities}
          intelligence={selectedLeadIntel}
          role={role}
        />
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------
// Header
// ------------------------------------------------------------------

function HeaderBar({ count }: { count: number }) {
  return (
    <header className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lf-muted">
        CRM · Franquias
      </span>
      <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {count === 0
          ? "Nenhuma ação pendente agora"
          : count === 1
            ? "1 pessoa precisa de ação agora"
            : `${count} pessoas precisam de ação agora`}
      </h1>
    </header>
  );
}

// ------------------------------------------------------------------
// Indicadores "Para agir hoje"
// ------------------------------------------------------------------

function IndicatorsRow({
  alerts,
  active,
  onPick,
}: {
  alerts: { overdueContacts: number; withoutReturn: number; phonesToConfirm: number };
  active: AlertFilter;
  onPick: (f: AlertFilter) => void;
}) {
  const items: {
    key: AlertFilter;
    label: string;
    description: string;
    value: number;
    icon: React.ReactNode;
  }[] = [
    {
      key: "overdueContacts",
      label: "Ações atrasadas",
      description: "Reuniões vencidas e contatos no vermelho",
      value: alerts.overdueContacts,
      icon: <AlertTriangle className="size-4" aria-hidden />,
    },
    {
      key: "withoutReturn",
      label: "Sem retorno",
      description: "Leads sem resposta aguardando reativação",
      value: alerts.withoutReturn,
      icon: <MessageCircleDashed className="size-4" aria-hidden />,
    },
    {
      key: "phonesToConfirm",
      label: "Telefones a conferir",
      description: "Número incompleto — não enviar WhatsApp",
      value: alerts.phonesToConfirm,
      icon: <PhoneOff className="size-4" aria-hidden />,
    },
  ];

  return (
    <section aria-label="Para agir hoje" className="space-y-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lf-muted">
        Para agir hoje
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const isActive = active === item.key;
          const isEmpty = item.value === 0;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onPick(item.key)}
              className={cn(
                "flex items-center gap-3 rounded-lg border bg-card/70 px-3 py-3 text-left transition-colors lf-focus",
                isActive
                  ? "border-lf-volt bg-lf-volt/10"
                  : isEmpty
                    ? "border-border/60 hover:bg-card"
                    : "border-rose-500/40 hover:bg-rose-500/5",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
                  isEmpty ? "bg-lf-graphite/80 text-lf-muted" : "bg-rose-500/15 text-rose-200",
                  isActive ? "bg-lf-volt/20 text-lf-volt" : null,
                )}
              >
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  <span className="text-base font-semibold tabular-nums text-foreground">
                    {item.value}
                  </span>
                </div>
                <p className="truncate text-xs text-lf-muted">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// Visão geral (compacta no desktop; recolhida no mobile)
// ------------------------------------------------------------------

function KpiOverview({ kpis }: { kpis: { total: number; highPriority: number; scheduled: number } }) {
  const items: { label: string; value: number; icon: React.ReactNode }[] = [
    { label: "Total de leads", value: kpis.total, icon: <Users className="size-3.5" aria-hidden /> },
    { label: "Prioridade alta", value: kpis.highPriority, icon: <Flame className="size-3.5" aria-hidden /> },
    { label: "Reuniões", value: kpis.scheduled, icon: <CalendarCheck2 className="size-3.5" aria-hidden /> },
  ];

  return (
    <>
      <div className="hidden items-center gap-5 text-xs text-lf-muted md:flex">
        <span className="font-semibold uppercase tracking-[0.14em]">Visão geral</span>
        {items.map((it) => (
          <span key={it.label} className="inline-flex items-center gap-1.5">
            {it.icon}
            <span>{it.label}</span>
            <span className="font-semibold tabular-nums text-foreground">{it.value}</span>
          </span>
        ))}
      </div>
      <details className="md:hidden">
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-lf-muted">
          Visão geral
          <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {items.map((it) => (
            <div
              key={it.label}
              className="rounded-md border border-border/60 bg-card/60 px-3 py-2 text-center"
            >
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-lf-muted">
                {it.icon}
                <span>{it.label}</span>
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {it.value}
              </div>
            </div>
          ))}
        </div>
      </details>
    </>
  );
}

// ------------------------------------------------------------------
// Quem chamar agora (destaque dos primeiros act_now)
// ------------------------------------------------------------------

function QuemChamarAgoraBlock({
  top,
  upcoming,
  onOpen,
}: {
  top: EnrichedEntry;
  upcoming: EnrichedEntry[];
  onOpen: (id: string) => void;
}) {
  return (
    <section aria-label="Quem chamar agora" className="space-y-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lf-muted">
        Quem chamar agora
      </h2>
      <PrimaryCard entry={top} onOpen={onOpen} />
      {upcoming.length > 0 ? (
        <ol className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card/50">
          {upcoming.map((entry, idx) => (
            <li key={entry.lead.id}>
              <UpcomingItem position={idx + 2} entry={entry} onOpen={onOpen} />
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function PrimaryCard({
  entry,
  onOpen,
}: {
  entry: EnrichedEntry;
  onOpen: (id: string) => void;
}) {
  const { lead, presentation } = entry;
  return (
    <article className="relative overflow-hidden rounded-xl border border-lf-volt/50 bg-lf-graphite/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <PositionBadge n={1} prominent />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {lead.full_name}
            </h3>
            <StatusChip presentation={presentation} />
          </div>
          <p className="text-base font-medium text-foreground">
            {presentation.action.label}
          </p>
          <p className="text-xs text-lf-muted">
            <span className="font-semibold uppercase tracking-wide">Motivo:</span>{" "}
            {presentation.reason}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ActionButtons entry={entry} onOpen={onOpen} />
        <button
          type="button"
          onClick={() => onOpen(lead.id)}
          className="text-xs font-semibold text-lf-muted underline-offset-2 hover:text-foreground hover:underline lf-focus"
        >
          Ver detalhes
        </button>
      </div>
    </article>
  );
}

function UpcomingItem({
  position,
  entry,
  onOpen,
}: {
  position: number;
  entry: EnrichedEntry;
  onOpen: (id: string) => void;
}) {
  const { lead, presentation } = entry;
  return (
    <button
      type="button"
      onClick={() => onOpen(lead.id)}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-lf-graphite/50 lf-focus"
    >
      <PositionBadge n={position} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {lead.full_name}
          </span>
          <StatusChip presentation={presentation} compact />
        </div>
        <p className="truncate text-xs text-lf-muted">{presentation.reason}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-lf-muted" aria-hidden />
    </button>
  );
}

function PositionBadge({ n, prominent }: { n: number; prominent?: boolean }) {
  const label =
    n === 1 ? "1º da fila" : n === 2 ? "2º" : n === 3 ? "3º" : n === 4 ? "4º" : `${n}º`;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md bg-lf-volt px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-black",
        prominent ? "min-w-20 py-1.5 text-xs" : "min-w-14",
      )}
      aria-label={`Posição ${label} na fila`}
    >
      {label}
    </span>
  );
}

// ------------------------------------------------------------------
// Chips de filtro por grupo (substitui as abas)
// ------------------------------------------------------------------

function FilterChipsBar({
  active,
  counts,
  totalAll,
  onChange,
}: {
  active: GroupFilter;
  counts: Record<LeadGroup, number>;
  totalAll: number;
  onChange: (g: GroupFilter) => void;
}) {
  function countFor(key: GroupFilter): number {
    if (key === "all") return totalAll;
    return counts[key];
  }

  return (
    <div
      role="tablist"
      aria-label="Filtrar leads por grupo"
      className="flex flex-wrap items-center gap-2 border-b border-border/60 p-3 sm:p-4"
    >
      {GROUP_FILTER_ORDER.map((g) => {
        const isActive = g === active;
        return (
          <button
            key={g}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(g)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors lf-focus",
              isActive
                ? "border-lf-volt bg-lf-volt text-black"
                : "border-border/60 bg-lf-graphite/60 text-foreground hover:bg-lf-graphite",
            )}
          >
            <span>{GROUP_FILTER_LABELS[g]}</span>
            <span
              className={cn(
                "inline-flex min-w-6 items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                isActive ? "bg-black/20 text-black" : "bg-background/60 text-lf-muted",
              )}
            >
              {countFor(g)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------
// Paginação
// ------------------------------------------------------------------

function PaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  return (
    <div className="flex flex-col items-center justify-between gap-2 border-t border-border/60 px-3 py-3 sm:flex-row sm:px-4">
      <p className="text-xs text-lf-muted">
        Mostrando <span className="font-semibold text-foreground">{from}–{to}</span> de{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> leads
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={!hasPrev}
          className="gap-1"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Anterior
        </Button>
        <span className="min-w-20 text-center text-sm tabular-nums text-foreground">
          Página {page} de {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={!hasNext}
          className="gap-1"
        >
          Próxima
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Status chip (ícone + texto + cor)
// ------------------------------------------------------------------

function iconFor(key: IconKey, className: string): React.ReactNode {
  const common = { className, "aria-hidden": true } as const;
  switch (key) {
    case "zap":
      return <Zap {...common} />;
    case "phone-call":
      return <PhoneCall {...common} />;
    case "calendar-clock":
      return <CalendarClock {...common} />;
    case "phone-off":
      return <PhoneOff {...common} />;
    case "message-circle-dashed":
      return <MessageCircleDashed {...common} />;
    case "pause":
      return <Pause {...common} />;
    case "archive":
      return <Archive {...common} />;
    case "check-circle":
      return <CheckCircle {...common} />;
  }
}

function toneClasses(tone: Tone, variant: "chip" | "card"): string {
  const chip = variant === "chip";
  switch (tone) {
    case "critical":
      return chip
        ? "border-rose-500/50 bg-rose-500/15 text-rose-200"
        : "border-rose-500/40";
    case "warn":
      return chip
        ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
        : "border-amber-500/40";
    case "info":
      return chip
        ? "border-sky-500/40 bg-sky-500/10 text-sky-200"
        : "border-sky-500/30";
    case "ok":
      return chip
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
        : "border-emerald-500/30";
    case "muted":
    default:
      return chip
        ? "border-border/60 bg-lf-graphite/60 text-lf-muted"
        : "border-border/60";
  }
}

function StatusChip({
  presentation,
  compact,
}: {
  presentation: LeadPresentation;
  compact?: boolean;
}) {
  const classes = toneClasses(presentation.statusTone, "chip");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-semibold uppercase tracking-wide normal-case",
        compact ? "text-[10px]" : "text-[11px]",
        classes,
      )}
      role="status"
    >
      {iconFor(presentation.statusIcon, "size-3")}
      <span>{presentation.statusLabel}</span>
      {presentation.dueLabel && presentation.dueLabel !== presentation.statusLabel ? (
        <span className="opacity-80">· {presentation.dueLabel}</span>
      ) : null}
    </span>
  );
}

// ------------------------------------------------------------------
// Botões de ação
// ------------------------------------------------------------------

function ActionButtons({
  entry,
  onOpen,
}: {
  entry: EnrichedEntry;
  onOpen: (id: string) => void;
}) {
  const { lead, presentation } = entry;
  const { action } = presentation;

  // Aguardando / histórico: sem ação primária clicável.
  if (!action.primary) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-lf-muted">
        <Pause className="size-3.5" aria-hidden />
        {presentation.statusLabel}
      </span>
    );
  }

  const buttonClasses =
    "inline-flex min-h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-lf-volt px-4 text-sm font-semibold text-black hover:bg-lf-volt/90 lf-focus sm:min-h-12 sm:w-auto";
  const buttonIcon =
    action.intent === "mailto" ? (
      <Mail className="size-4" aria-hidden />
    ) : action.intent === "open_edit" ? (
      <Pencil className="size-4" aria-hidden />
    ) : (
      iconFor(presentation.statusIcon, "size-4")
    );

  const primary =
    action.intent === "mailto" && action.href ? (
      <a
        href={action.href}
        onClick={(e) => e.stopPropagation()}
        className={buttonClasses}
        aria-label={`Enviar email para ${lead.full_name}`}
      >
        {buttonIcon}
        <span>{action.buttonLabel}</span>
      </a>
    ) : (
      <Button
        type="button"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(lead.id);
        }}
        className="min-h-14 w-full gap-2 whitespace-nowrap px-4 text-sm sm:min-h-12 sm:w-auto"
      >
        {buttonIcon}
        <span>{action.buttonLabel}</span>
      </Button>
    );

  const secondary =
    action.intent === "default" &&
    presentation.phone.canUseWhatsAppSecondary &&
    presentation.phone.waHref ? (
      <a
        href={presentation.phone.waHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-500/50 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 lf-focus"
        aria-label="Abrir conversa no WhatsApp"
      >
        <MessageSquare className="size-4" aria-hidden />
        WhatsApp
      </a>
    ) : null;

  return (
    <div className="flex flex-wrap items-stretch gap-2 sm:items-center">
      {primary}
      {secondary}
    </div>
  );
}

// ------------------------------------------------------------------
// Linha da tabela (desktop)
// ------------------------------------------------------------------

function LeadRow({
  entry,
  position,
  now,
  onOpen,
}: {
  entry: EnrichedEntry;
  position: number;
  now: Date;
  onOpen: () => void;
}) {
  const { lead, presentation } = entry;
  const lastContact = formatLastContactShort(lead.last_contact_at, now);
  return (
    <tr
      className={cn(
        "cursor-pointer border-t border-border/60 transition-colors hover:bg-lf-graphite/60",
        presentation.statusTone === "critical" ? "border-l-4 border-l-rose-500/60" : null,
      )}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Abrir lead ${lead.full_name}`}
    >
      <td className="px-3 py-3 align-top text-xs font-semibold tabular-nums text-lf-muted">
        {position}º
      </td>
      <td className="px-3 py-3 align-top">
        <div className="flex flex-col">
          <span className="truncate font-medium text-foreground">{lead.full_name}</span>
          <span className="truncate text-[11px] text-lf-muted">
            {formatPhoneForDisplay(lead.phone) || (lead.email ? lead.email : "Sem contato")}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 align-top">
        <StatusChip presentation={presentation} />
      </td>
      <td className="px-3 py-3 align-top text-xs text-lf-muted">{lastContact}</td>
      <td className="px-3 py-3 align-top">
        <p className="text-sm font-medium text-foreground">{presentation.action.label}</p>
        <p className="mt-1 line-clamp-2 text-xs text-lf-muted">
          <span className="font-semibold uppercase tracking-wide">Motivo:</span>{" "}
          {presentation.reason}
        </p>
      </td>
      <td className="px-3 py-3 align-top">
        <ActionButtons entry={entry} onOpen={() => onOpen()} />
      </td>
    </tr>
  );
}

// ------------------------------------------------------------------
// Card mobile
// ------------------------------------------------------------------

function LeadMobileCard({
  entry,
  position,
  now,
  onOpen,
}: {
  entry: EnrichedEntry;
  position: number;
  now: Date;
  onOpen: () => void;
}) {
  const { lead, presentation } = entry;
  const lastContact = formatLastContactShort(lead.last_contact_at, now);
  return (
    <article className="rounded-xl border border-border/80 bg-card/70 p-4">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left lf-focus"
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex min-w-10 shrink-0 items-center justify-center rounded-md bg-lf-graphite px-2 py-1 text-[11px] font-semibold tabular-nums text-lf-muted">
            {position}º
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-base font-medium text-foreground">
                {lead.full_name}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-lf-muted">
              {formatPhoneForDisplay(lead.phone) || (lead.email ? lead.email : "Sem contato")}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusChip presentation={presentation} />
          <span className="inline-flex items-center gap-1 text-[11px] text-lf-muted">
            <CalendarClock className="size-3" aria-hidden />
            Última conversa: {lastContact}
          </span>
        </div>

        <p className="mt-3 text-sm font-medium text-foreground">
          {presentation.action.label}
        </p>
        <p className="mt-1 text-xs text-lf-muted">
          <span className="font-semibold uppercase tracking-wide">Motivo:</span>{" "}
          {presentation.reason}
        </p>
      </button>

      <div className="mt-3">
        <ActionButtons entry={entry} onOpen={onOpen} />
      </div>
    </article>
  );
}

// ------------------------------------------------------------------
// Rótulo do alertFilter
// ------------------------------------------------------------------

function alertFilterLabel(k: AlertFilter): string {
  switch (k) {
    case "overdueContacts":
      return "Ações atrasadas";
    case "withoutReturn":
      return "Sem retorno";
    case "phonesToConfirm":
      return "Telefones a conferir";
    default:
      return "";
  }
}
