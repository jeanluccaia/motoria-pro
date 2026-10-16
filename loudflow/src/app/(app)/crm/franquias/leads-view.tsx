"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Users,
  Flame,
  CalendarCheck2,
  PhoneOff,
  AlertTriangle,
  CalendarClock,
  CircleHelp,
  PhoneForwarded,
  UserPlus,
  Clock,
  ChevronRight,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shell/states";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  stageBadgeClass,
  priorityBadgeClass,
} from "@/lib/crm/labels";
import { nextContactBucket, formatDateTime } from "@/lib/crm/dates";
import { formatPhoneForDisplay } from "@/lib/crm/phone";
import {
  calculateLeadIntelligence,
  buildCallQueue,
  computeAlerts,
  waNumberFor,
  type LeadIntelligence,
  type AttentionLevel,
} from "@/lib/crm/intelligence";
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
};

type AlertFilter =
  | "none"
  | "overdueContacts"
  | "withoutReturn"
  | "meetingsWithoutOutcome"
  | "leadsWithoutNextAction"
  | "phonesToConfirm"
  | "newLeadsWithoutContact";

export function LeadsView({ leads, activities, role }: Props) {
  const canCreate = role === "admin" || role === "marketing";

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"" | FranchiseLeadStage>("");
  const [priorityFilter, setPriorityFilter] = useState<"" | FranchiseLeadPriority>("");
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("none");
  const [creating, setCreating] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showAllPriority, setShowAllPriority] = useState(false);

  const activitiesByLead = useMemo(() => {
    const map = new Map<string, FranchiseLeadActivity[]>();
    for (const a of activities) {
      const list = map.get(a.lead_id);
      if (list) list.push(a);
      else map.set(a.lead_id, [a]);
    }
    return map;
  }, [activities]);

  const intelligenceByLead = useMemo(() => {
    const map = new Map<string, LeadIntelligence>();
    const now = new Date();
    for (const lead of leads) {
      map.set(
        lead.id,
        calculateLeadIntelligence(lead, activitiesByLead.get(lead.id) ?? [], now),
      );
    }
    return map;
  }, [leads, activitiesByLead]);

  const callQueueFull = useMemo(() => {
    return buildCallQueue(leads, activitiesByLead, new Date(), 50);
  }, [leads, activitiesByLead]);

  const callQueue = useMemo(
    () => (showAllPriority ? callQueueFull : callQueueFull.slice(0, 5)),
    [callQueueFull, showAllPriority],
  );

  const alerts = useMemo(
    () => computeAlerts(leads, activitiesByLead, new Date()),
    [leads, activitiesByLead],
  );

  const selectedLead = useMemo(
    () => (selectedLeadId ? leads.find((l) => l.id === selectedLeadId) ?? null : null),
    [selectedLeadId, leads],
  );
  const selectedLeadActivities = useMemo(
    () => (selectedLeadId ? activitiesByLead.get(selectedLeadId) ?? [] : []),
    [selectedLeadId, activitiesByLead],
  );
  const selectedLeadIntel = useMemo(
    () => (selectedLeadId ? intelligenceByLead.get(selectedLeadId) ?? null : null),
    [selectedLeadId, intelligenceByLead],
  );

  const kpis = useMemo(() => {
    let total = 0;
    let highPriority = 0;
    let scheduled = 0;
    let noResponse = 0;
    for (const l of leads) {
      total += 1;
      if (l.priority === "high" && l.pipeline_stage !== "lost" && l.pipeline_stage !== "won") {
        highPriority += 1;
      }
      if (l.pipeline_stage === "meeting_scheduled") scheduled += 1;
      const intel = intelligenceByLead.get(l.id);
      if (intel?.operationalTier === "reactivate") noResponse += 1;
    }
    return { total, highPriority, scheduled, noResponse };
  }, [leads, intelligenceByLead]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D+/g, "");

    const matches = (l: FranchiseLead): boolean => {
      if (stageFilter && l.pipeline_stage !== stageFilter) return false;
      if (priorityFilter && l.priority !== priorityFilter) return false;

      if (alertFilter !== "none") {
        const intel = intelligenceByLead.get(l.id);
        if (!intel) return false;
        const isActiveTier =
          intel.operationalTier === "respond_now" ||
          intel.operationalTier === "call_today" ||
          intel.operationalTier === "follow_up" ||
          intel.operationalTier === "verify_phone";
        if (alertFilter === "overdueContacts") {
          if (!isActiveTier) return false;
          if (!(intel.dueLabel && /atrasado|reunião há/i.test(intel.dueLabel)))
            return false;
        }
        if (alertFilter === "withoutReturn") {
          if (intel.operationalTier !== "reactivate") return false;
        }
        if (alertFilter === "meetingsWithoutOutcome") {
          if (intel.suggestedAction !== "record_meeting_outcome") return false;
        }
        if (alertFilter === "leadsWithoutNextAction") {
          if (l.next_action || intel.excludeFromActiveQueue) return false;
        }
        if (alertFilter === "phonesToConfirm") {
          if (!(l.phone && !l.phone_normalized)) return false;
        }
        if (alertFilter === "newLeadsWithoutContact") {
          if (l.pipeline_stage !== "new" || l.last_contact_at) return false;
          const acts = activitiesByLead.get(l.id) ?? [];
          if (acts.some((a) => a.activity_type === "contact")) return false;
        }
      }

      if (!q) return true;

      if (l.full_name.toLowerCase().includes(q)) return true;
      if (qDigits) {
        const phoneDigits = (l.phone ?? "").replace(/\D+/g, "");
        if (phoneDigits.includes(qDigits)) return true;
      }
      if (l.email && l.email.toLowerCase().includes(q)) return true;
      return false;
    };

    return leads.filter(matches).sort(sortLeads);
  }, [leads, search, stageFilter, priorityFilter, alertFilter, intelligenceByLead, activitiesByLead]);

  return (
    <div className="space-y-6">
      <KpiRow kpis={kpis} />

      {callQueue.length > 0 ? (
        <CallQueueSection
          queue={callQueue}
          totalPriority={callQueueFull.length}
          showAll={showAllPriority}
          onToggleAll={() => setShowAllPriority((s) => !s)}
          onOpen={(id) => setSelectedLeadId(id)}
        />
      ) : null}

      <AlertsRow
        alerts={alerts}
        active={alertFilter}
        onPick={(next) => setAlertFilter(next === alertFilter ? "none" : next)}
      />

      <section className="rounded-xl border border-border/80 bg-card/70 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-lf-muted" aria-hidden />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                onChange={(e) => setStageFilter(e.target.value as "" | FranchiseLeadStage)}
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
                onChange={(e) => setPriorityFilter(e.target.value as "" | FranchiseLeadPriority)}
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
          <p className="mt-3 flex items-center gap-2 text-xs text-lf-muted">
            Mostrando leads filtrados por “{alertFilterLabel(alertFilter)}”.
            <button
              type="button"
              onClick={() => setAlertFilter("none")}
              className="font-semibold text-lf-volt hover:underline"
            >
              Limpar filtro
            </button>
          </p>
        ) : null}
      </section>

      {visible.length === 0 ? (
        <EmptyState
          title={leads.length === 0 ? "Nenhum lead cadastrado" : "Nenhum lead encontrado"}
          description={
            leads.length === 0
              ? "Clique em “Adicionar lead” para começar."
              : "Ajuste a busca ou os filtros."
          }
          icon={<Users className="size-6" aria-hidden />}
          className="rounded-xl border-border/80 bg-card/45 py-14"
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
          {/* Tabela em >=md */}
          <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card/60 md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-lf-graphite text-left text-xs uppercase tracking-wide text-lf-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Celular</th>
                  <th className="px-4 py-3 font-medium">Último contato</th>
                  <th className="px-4 py-3 font-medium">Etapa</th>
                  <th className="px-4 py-3 font-medium">Prioridade</th>
                  <th className="px-4 py-3 font-medium">Próxima ação</th>
                  <th className="px-4 py-3 font-medium">Próximo contato</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    intel={intelligenceByLead.get(lead.id) ?? null}
                    onOpen={() => setSelectedLeadId(lead.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards em telas pequenas */}
          <ul className="space-y-3 md:hidden">
            {visible.map((lead) => (
              <li key={lead.id}>
                <LeadMobileCard
                  lead={lead}
                  intel={intelligenceByLead.get(lead.id) ?? null}
                  onOpen={() => setSelectedLeadId(lead.id)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

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

function KpiRow({ kpis }: { kpis: { total: number; highPriority: number; scheduled: number; noResponse: number } }) {
  const items: { label: string; value: number; icon: React.ReactNode; tone: string }[] = [
    { label: "Total de leads", value: kpis.total, icon: <Users className="size-4" aria-hidden />, tone: "text-foreground" },
    { label: "Prioridade alta", value: kpis.highPriority, icon: <Flame className="size-4" aria-hidden />, tone: "text-rose-200" },
    { label: "Reuniões agendadas", value: kpis.scheduled, icon: <CalendarCheck2 className="size-4" aria-hidden />, tone: "text-emerald-200" },
    { label: "Sem retorno", value: kpis.noResponse, icon: <PhoneOff className="size-4" aria-hidden />, tone: "text-rose-200" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-h-20 flex-col justify-center gap-1 rounded-xl border border-border/80 bg-card/70 px-4 py-3"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-lf-muted">
            {item.icon}
            {item.label}
          </span>
          <span className={cn("text-2xl font-semibold tabular-nums", item.tone)}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function attentionBadgeClass(level: AttentionLevel): string {
  switch (level) {
    case "critical":
      return "bg-rose-500/15 text-rose-200 border-rose-500/50";
    case "today":
      return "bg-amber-500/15 text-amber-200 border-amber-500/40";
    case "soon":
      return "bg-sky-500/15 text-sky-200 border-sky-500/30";
    case "monitor":
      return "bg-neutral-500/15 text-neutral-200 border-neutral-500/30";
    case "none":
    default:
      return "bg-neutral-500/10 text-neutral-300 border-neutral-500/20";
  }
}

function CallQueueSection({
  queue,
  totalPriority,
  showAll,
  onToggleAll,
  onOpen,
}: {
  queue: { lead: FranchiseLead; intel: LeadIntelligence }[];
  totalPriority: number;
  showAll: boolean;
  onToggleAll: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/5 via-amber-500/5 to-transparent">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-lf-graphite/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-200">
            <PhoneForwarded className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Quem chamar agora
            </h2>
            <p className="text-xs text-lf-muted">
              {totalPriority} lead{totalPriority === 1 ? "" : "s"} aguardando ação —
              recomendações explicadas por regras.
            </p>
          </div>
        </div>
        {totalPriority > 5 ? (
          <Button type="button" variant="ghost" size="sm" onClick={onToggleAll} className="gap-1 text-xs">
            {showAll ? "Mostrar só os 5 primeiros" : "Ver todos os leads prioritários"}
            <ChevronRight className="size-3" aria-hidden />
          </Button>
        ) : null}
      </header>
      <ul className="divide-y divide-border/50">
        {queue.map(({ lead, intel }) => (
          <li key={lead.id}>
            <CallQueueCard lead={lead} intel={intel} onOpen={() => onOpen(lead.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CallQueueCard({
  lead,
  intel,
  onOpen,
}: {
  lead: FranchiseLead;
  intel: LeadIntelligence;
  onOpen: () => void;
}) {
  const wa = waNumberFor(lead);
  const waHref = wa ? `https://wa.me/${wa}` : null;
  const primaryReason = intel.reasons[0];

  return (
    <article className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("normal-case tracking-normal", attentionBadgeClass(intel.attentionLevel))}
          >
            {intel.tierLabel}
          </Badge>
          <span className="truncate font-semibold text-foreground">{lead.full_name}</span>
          {intel.dueLabel ? (
            <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
              <Clock className="size-3" aria-hidden /> {intel.dueLabel}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-foreground/90">
          <span className="font-medium">Ação sugerida:</span> {intel.suggestedActionLabel}
        </p>
        {primaryReason ? (
          <p className="text-xs text-lf-muted">
            Motivo: {primaryReason}
            {intel.reasons.length > 1 ? (
              <span className="ml-1 text-lf-muted/70">
                (+ {intel.reasons.length - 1} outro{intel.reasons.length - 1 === 1 ? "" : "s"})
              </span>
            ) : null}
          </p>
        ) : null}
        <p className="mt-1 text-[11px] uppercase tracking-wide text-lf-muted">
          {formatPhoneForDisplay(lead.phone) || "Sem telefone"} · Prioridade operacional {intel.score}/100
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/50 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 lf-focus"
          >
            <MessageSquare className="size-3.5" aria-hidden /> WhatsApp
          </a>
        ) : null}
        <Button type="button" size="sm" onClick={onOpen} className="gap-1">
          Agir agora <ChevronRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </article>
  );
}

function AlertsRow({
  alerts,
  active,
  onPick,
}: {
  alerts: ReturnType<typeof computeAlerts>;
  active: AlertFilter;
  onPick: (f: AlertFilter) => void;
}) {
  const items: { key: AlertFilter; label: string; value: number; icon: React.ReactNode }[] = [
    {
      key: "overdueContacts",
      label: "Ações atrasadas",
      value: alerts.overdueContacts,
      icon: <AlertTriangle className="size-3.5" aria-hidden />,
    },
    {
      key: "withoutReturn",
      label: "Sem retorno",
      value: alerts.withoutReturn,
      icon: <PhoneOff className="size-3.5" aria-hidden />,
    },
    {
      key: "meetingsWithoutOutcome",
      label: "Reuniões sem resultado",
      value: alerts.meetingsWithoutOutcome,
      icon: <CalendarClock className="size-3.5" aria-hidden />,
    },
    {
      key: "leadsWithoutNextAction",
      label: "Sem próxima ação",
      value: alerts.leadsWithoutNextAction,
      icon: <CircleHelp className="size-3.5" aria-hidden />,
    },
    {
      key: "phonesToConfirm",
      label: "Telefones a conferir",
      value: alerts.phonesToConfirm,
      icon: <PhoneOff className="size-3.5" aria-hidden />,
    },
    {
      key: "newLeadsWithoutContact",
      label: "Novos sem contato",
      value: alerts.newLeadsWithoutContact,
      icon: <UserPlus className="size-3.5" aria-hidden />,
    },
  ];

  return (
    <section
      aria-label="Alertas"
      className="rounded-xl border border-border/80 bg-card/60 p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-lf-muted">
          Alertas
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isActive = active === item.key;
          const isEmpty = item.value === 0;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onPick(item.key)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors lf-focus",
                isActive
                  ? "border-lf-volt bg-lf-volt/15 text-lf-volt"
                  : isEmpty
                    ? "border-border/60 bg-lf-graphite/40 text-lf-muted"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
              )}
            >
              {isEmpty ? <CheckCircle2 className="size-3.5" aria-hidden /> : item.icon}
              <span>{item.label}</span>
              <span className="rounded bg-black/20 px-1.5 py-0.5 text-[11px] font-semibold">
                {item.value}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function alertFilterLabel(k: AlertFilter): string {
  switch (k) {
    case "overdueContacts":
      return "Ações atrasadas";
    case "withoutReturn":
      return "Sem retorno";
    case "meetingsWithoutOutcome":
      return "Reuniões sem resultado";
    case "leadsWithoutNextAction":
      return "Sem próxima ação";
    case "phonesToConfirm":
      return "Telefones a conferir";
    case "newLeadsWithoutContact":
      return "Novos sem contato";
    default:
      return "";
  }
}

function LeadRow({
  lead,
  intel,
  onOpen,
}: {
  lead: FranchiseLead;
  intel: LeadIntelligence | null;
  onOpen: () => void;
}) {
  const bucket = nextContactBucket(lead.next_contact_at);
  const rowAccent =
    intel?.attentionLevel === "critical"
      ? "border-l-rose-500/70"
      : bucket === "overdue"
        ? "border-l-rose-500/60"
        : bucket === "today" || intel?.attentionLevel === "today"
          ? "border-l-amber-400/60"
          : "border-l-transparent";

  return (
    <tr
      className="cursor-pointer border-t border-border/60 border-l-4 transition-colors hover:bg-lf-graphite/60"
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
      <td className={cn("px-4 py-3 font-medium text-foreground", rowAccent)}>
        <div className="flex flex-wrap items-center gap-2">
          <span>{lead.full_name}</span>
          {intel && intel.attentionLevel !== "none" && !intel.excludeFromActiveQueue ? (
            <Badge
              variant="outline"
              className={cn("normal-case tracking-normal", attentionBadgeClass(intel.attentionLevel))}
            >
              {intel.tierLabel}
            </Badge>
          ) : null}
          {lead.phone_normalized === null && lead.phone ? (
            <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
              Conferir telefone
            </span>
          ) : null}
        </div>
        {intel && !intel.excludeFromActiveQueue ? (
          <p className="mt-0.5 text-[11px] text-lf-muted">
            Prioridade operacional {intel.score}/100
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-lf-muted">{formatPhoneForDisplay(lead.phone)}</td>
      <td className="px-4 py-3 text-lf-muted">{formatDateTime(lead.last_contact_at)}</td>
      <td className="px-4 py-3">
        <Badge variant="outline" className={cn("normal-case tracking-normal", stageBadgeClass(lead.pipeline_stage))}>
          {STAGE_LABELS[lead.pipeline_stage]}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline" className={cn("normal-case tracking-normal", priorityBadgeClass(lead.priority))}>
          {PRIORITY_LABELS[lead.priority]}
        </Badge>
      </td>
      <td className="px-4 py-3 text-lf-muted">
        {lead.next_action ?? (intel && !intel.excludeFromActiveQueue ? intel.suggestedActionLabel : "—")}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "text-sm",
            bucket === "overdue"
              ? "font-medium text-rose-200"
              : bucket === "today"
                ? "font-medium text-amber-200"
                : "text-lf-muted",
          )}
        >
          {formatDateTime(lead.next_contact_at)}
        </span>
      </td>
    </tr>
  );
}

function LeadMobileCard({
  lead,
  intel,
  onOpen,
}: {
  lead: FranchiseLead;
  intel: LeadIntelligence | null;
  onOpen: () => void;
}) {
  const bucket = nextContactBucket(lead.next_contact_at);
  const wa = waNumberFor(lead);
  return (
    <article className="rounded-xl border border-border/80 bg-card/70 p-4">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left transition-colors lf-focus"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-foreground">{lead.full_name}</span>
              {intel && intel.attentionLevel !== "none" && !intel.excludeFromActiveQueue ? (
                <Badge
                  variant="outline"
                  className={cn("normal-case tracking-normal", attentionBadgeClass(intel.attentionLevel))}
                >
                  {intel.tierLabel}
                </Badge>
              ) : null}
              {lead.phone_normalized === null && lead.phone ? (
                <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                  Conferir telefone
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-lf-muted">{formatPhoneForDisplay(lead.phone) || "Sem telefone"}</p>
          </div>
          <Badge variant="outline" className={cn("shrink-0 normal-case tracking-normal", priorityBadgeClass(lead.priority))}>
            {PRIORITY_LABELS[lead.priority]}
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("normal-case tracking-normal", stageBadgeClass(lead.pipeline_stage))}>
            {STAGE_LABELS[lead.pipeline_stage]}
          </Badge>
          <span
            className={cn(
              "text-xs",
              bucket === "overdue"
                ? "font-medium text-rose-200"
                : bucket === "today"
                  ? "font-medium text-amber-200"
                  : "text-lf-muted",
            )}
          >
            Próximo contato: {formatDateTime(lead.next_contact_at)}
          </span>
        </div>

        {intel && !intel.excludeFromActiveQueue ? (
          <p className="mt-2 text-sm text-foreground/90">
            <span className="text-xs uppercase tracking-wide text-lf-muted">Ação sugerida:</span>{" "}
            {intel.suggestedActionLabel}
            <span className="ml-1 text-[11px] text-lf-muted">· {intel.score}/100</span>
          </p>
        ) : null}
      </button>
      {wa ? (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 lf-focus"
        >
          <MessageSquare className="size-4" aria-hidden /> Abrir WhatsApp
        </a>
      ) : null}
    </article>
  );
}

// Ordenação da lista principal:
// 1. Próximo contato vencido ou hoje antes de qualquer outra coisa.
// 2. Dentro desse grupo, prioridade alta primeiro.
// 3. Depois, por data de próximo contato ascendente (quem vence antes aparece antes).
// 4. Sem data de próximo contato cai para o final.
function sortLeads(a: FranchiseLead, b: FranchiseLead): number {
  const bucketScore = (b: ReturnType<typeof nextContactBucket>) => {
    if (b === "overdue") return 0;
    if (b === "today") return 1;
    if (b === "upcoming") return 2;
    return 3;
  };
  const priorityScore = (p: FranchiseLeadPriority) => (p === "high" ? 0 : p === "normal" ? 1 : 2);

  const ba = bucketScore(nextContactBucket(a.next_contact_at));
  const bb = bucketScore(nextContactBucket(b.next_contact_at));
  if (ba !== bb) return ba - bb;

  const pa = priorityScore(a.priority);
  const pb = priorityScore(b.priority);
  if (pa !== pb) return pa - pb;

  const ad = a.next_contact_at ?? "";
  const bd = b.next_contact_at ?? "";
  if (!ad && !bd) return a.full_name.localeCompare(b.full_name);
  if (!ad) return 1;
  if (!bd) return -1;
  return ad.localeCompare(bd);
}
