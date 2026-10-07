"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Users, Flame, CalendarCheck2, PhoneOff } from "lucide-react";
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

export function LeadsView({ leads, activities, role }: Props) {
  const canCreate = role === "admin" || role === "marketing";

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"" | FranchiseLeadStage>("");
  const [priorityFilter, setPriorityFilter] = useState<"" | FranchiseLeadPriority>("");
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

  const selectedLead = useMemo(
    () => (selectedLeadId ? leads.find((l) => l.id === selectedLeadId) ?? null : null),
    [selectedLeadId, leads],
  );
  const selectedLeadActivities = useMemo(
    () => (selectedLeadId ? activitiesByLead.get(selectedLeadId) ?? [] : []),
    [selectedLeadId, activitiesByLead],
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
      if (l.pipeline_stage === "no_response") noResponse += 1;
    }
    return { total, highPriority, scheduled, noResponse };
  }, [leads]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D+/g, "");

    const matches = (l: FranchiseLead): boolean => {
      if (stageFilter && l.pipeline_stage !== stageFilter) return false;
      if (priorityFilter && l.priority !== priorityFilter) return false;
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
  }, [leads, search, stageFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      <KpiRow kpis={kpis} />

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
                  <LeadRow key={lead.id} lead={lead} onOpen={() => setSelectedLeadId(lead.id)} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards em telas pequenas */}
          <ul className="space-y-3 md:hidden">
            {visible.map((lead) => (
              <li key={lead.id}>
                <LeadMobileCard lead={lead} onOpen={() => setSelectedLeadId(lead.id)} />
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

function LeadRow({ lead, onOpen }: { lead: FranchiseLead; onOpen: () => void }) {
  const bucket = nextContactBucket(lead.next_contact_at);
  const rowAccent =
    bucket === "overdue"
      ? "border-l-rose-500/60"
      : bucket === "today"
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
        {lead.full_name}
        {lead.phone_normalized === null && lead.phone ? (
          <span className="ml-2 inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
            Conferir telefone
          </span>
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
      <td className="px-4 py-3 text-lf-muted">{lead.next_action ?? "—"}</td>
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

function LeadMobileCard({ lead, onOpen }: { lead: FranchiseLead; onOpen: () => void }) {
  const bucket = nextContactBucket(lead.next_contact_at);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-xl border border-border/80 bg-card/70 p-4 text-left transition-colors hover:bg-lf-graphite/60 lf-focus"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-foreground">{lead.full_name}</span>
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

      {lead.next_action ? (
        <p className="mt-2 text-sm text-foreground/90">
          <span className="text-xs uppercase tracking-wide text-lf-muted">Próxima ação:</span>{" "}
          {lead.next_action}
        </p>
      ) : null}
    </button>
  );
}

// Ordenação:
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
