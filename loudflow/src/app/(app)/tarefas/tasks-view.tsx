"use client";

import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/states";
import { bucketFor } from "@/lib/tasks/dates";
import { FILTERS, filterLabel, type FilterKey } from "@/lib/tasks/labels";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";
import { UndoToast } from "./undo-toast";
import type { Task } from "@/lib/supabase/types";

type Member = { id: string; email: string; name: string | null };
type UnitLite = { id: string; name: string };

type Scope = "mine" | "team";

export function TasksView({
  currentUserId,
  isAdmin,
  myTasks,
  teamTasks,
  members,
  units,
}: {
  currentUserId: string;
  isAdmin: boolean;
  myTasks: Task[];
  teamTasks: Task[];
  members: Member[];
  units: UnitLite[];
}) {
  const [scope, setScope] = useState<Scope>("mine");
  const [filter, setFilter] = useState<FilterKey>("today");
  const [assignedFilter, setAssignedFilter] = useState<string>("");
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [undoTask, setUndoTask] = useState<Task | null>(null);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const unitMap = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);

  const source = scope === "mine" ? myTasks : teamTasks;

  const scoped = useMemo(() => {
    if (scope === "mine") return source;
    return source.filter((t) => {
      if (assignedFilter && t.assigned_to !== assignedFilter) return false;
      if (unitFilter === "__NETWORK__" && t.unit_id !== null) return false;
      if (unitFilter && unitFilter !== "__NETWORK__" && t.unit_id !== unitFilter) return false;
      return true;
    });
  }, [scope, source, assignedFilter, unitFilter]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { today: 0, overdue: 0, upcoming: 0, completed: 0 };
    for (const t of scoped) {
      if (t.status === "completed") {
        c.completed += 1;
        continue;
      }
      const b = bucketFor(t.due_at);
      if (b === "today") c.today += 1;
      else if (b === "overdue") c.overdue += 1;
      else c.upcoming += 1;
    }
    return c;
  }, [scoped]);

  const visible = useMemo(() => {
    return scoped
      .filter((t) => {
        if (filter === "completed") return t.status === "completed";
        if (t.status !== "pending") return false;
        return bucketFor(t.due_at) === (filter === "upcoming" ? "upcoming" : filter);
      })
      .sort((a, b) => {
        // Atrasadas mostram as mais antigas primeiro; demais, próximas primeiro.
        const ad = a.due_at ?? "";
        const bd = b.due_at ?? "";
        if (filter === "completed") {
          const ac = a.completed_at ?? "";
          const bc = b.completed_at ?? "";
          return bc.localeCompare(ac);
        }
        if (!ad && !bd) return 0;
        if (!ad) return 1;
        if (!bd) return -1;
        return ad.localeCompare(bd);
      });
  }, [scoped, filter]);

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <div className="flex items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Escopo das tarefas"
            className="inline-flex h-10 items-center gap-1 rounded-md border border-border bg-lf-graphite p-1"
          >
            {(["mine", "team"] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={scope === s}
                onClick={() => setScope(s)}
                className={
                  "inline-flex h-8 items-center gap-2 rounded px-3 text-sm font-medium transition-colors lf-focus " +
                  (scope === s
                    ? "bg-lf-surface text-foreground"
                    : "text-lf-muted hover:text-foreground")
                }
              >
                {s === "team" ? <Users className="size-4" aria-hidden /> : null}
                {s === "mine" ? "Minhas tarefas" : "Equipe"}
              </button>
            ))}
          </div>

          <Button
            type="button"
            onClick={() => setCreating(true)}
            className="gap-2"
            size="lg"
            aria-label="Nova tarefa"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova tarefa</span>
          </Button>
        </div>
      ) : null}

      {isAdmin && scope === "team" ? (
        <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-lf-muted">Responsável</span>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
            >
              <option value="">Todos</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-lf-muted">Unidade</span>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
            >
              <option value="">Todas</option>
              <option value="__NETWORK__">Toda a rede</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div role="tablist" aria-label="Filtros" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FILTERS.map((f) => {
          const active = filter === f;
          const isOverdue = f === "overdue";
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f)}
              className={
                "flex min-h-16 flex-col items-start justify-center gap-1 rounded-lg border px-4 py-3 text-left transition-colors lf-focus " +
                (active
                  ? "border-lf-volt bg-lf-surface text-foreground"
                  : "border-border bg-card text-lf-muted hover:text-foreground") +
                (isOverdue && counts.overdue > 0 && !active
                  ? " border-destructive/50 text-foreground"
                  : "")
              }
            >
              <span className="text-xs font-medium uppercase tracking-wide">
                {filterLabel(f)}
              </span>
              <span
                className={
                  "text-2xl font-semibold tabular-nums " +
                  (isOverdue && counts[f] > 0 ? "text-destructive" : "")
                }
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      <section aria-live="polite" className="space-y-3">
        {visible.length === 0 ? (
          <EmptyState
            title={emptyTitle(filter, scope)}
            description={emptyDescription(filter, scope, isAdmin)}
          />
        ) : (
          <ul className="space-y-3">
            {visible.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                unit={t.unit_id ? unitMap.get(t.unit_id) ?? null : null}
                assignee={memberMap.get(t.assigned_to) ?? null}
                showAssignee={scope === "team"}
                canManage={isAdmin}
                canComplete={
                  t.assigned_to === currentUserId || isAdmin
                }
                onEdit={() => setEditing(t)}
                onCompleted={(justDone) => setUndoTask(justDone)}
              />
            ))}
          </ul>
        )}
      </section>

      {isAdmin ? (
        <TaskDialog
          mode="create"
          open={creating}
          onOpenChange={setCreating}
          members={members}
          units={units}
        />
      ) : null}

      {isAdmin && editing ? (
        <TaskDialog
          mode="edit"
          open={!!editing}
          onOpenChange={(o) => {
            if (!o) setEditing(null);
          }}
          members={members}
          units={units}
          task={editing}
        />
      ) : null}

      {undoTask ? (
        <UndoToast
          key={undoTask.id}
          task={undoTask}
          onDismiss={() => setUndoTask(null)}
        />
      ) : null}
    </div>
  );
}

function emptyTitle(f: FilterKey, scope: Scope): string {
  const mine = scope === "mine";
  switch (f) {
    case "today":
      return mine ? "Nada para hoje" : "Ninguém tem tarefas para hoje";
    case "overdue":
      return mine ? "Nada em atraso" : "Nada em atraso na equipe";
    case "upcoming":
      return mine ? "Sem próximas tarefas" : "Sem próximas tarefas na equipe";
    case "completed":
      return mine ? "Você ainda não concluiu tarefas" : "Ninguém concluiu tarefas ainda";
  }
}

function emptyDescription(f: FilterKey, scope: Scope, isAdmin: boolean): string {
  if (f === "completed") return "Quando alguém finalizar, aparece aqui.";
  if (f === "overdue") return "Que bom. Sem prazos vencidos por enquanto.";
  if (f === "today") {
    return scope === "mine"
      ? "Aproveite para adiantar o que está em Próximas."
      : "Aproveite para revisar o que está em Próximas.";
  }
  return isAdmin
    ? "Crie uma nova tarefa em “Nova tarefa”."
    : "Nada agendado por enquanto.";
}
