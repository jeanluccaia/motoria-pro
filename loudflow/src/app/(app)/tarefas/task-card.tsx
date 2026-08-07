"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Building2, CalendarClock, CheckCircle2, Pencil, RotateCcw, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bucketFor, formatDueAt } from "@/lib/tasks/dates";
import { priorityLabel } from "@/lib/tasks/labels";
import { completeTask, deleteTask, reopenTask } from "./actions";
import type { Task } from "@/lib/supabase/types";

type Member = { id: string; email: string; name: string | null };
type UnitLite = { id: string; name: string };

export function TaskCard({
  task,
  unit,
  assignee,
  showAssignee,
  canManage,
  canComplete,
  onEdit,
  onCompleted,
}: {
  task: Task;
  unit: UnitLite | null;
  assignee: Member | null;
  showAssignee: boolean;
  canManage: boolean;
  canComplete: boolean;
  onEdit: () => void;
  onCompleted?: (task: Task) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onComplete() {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", task.id);
    startTransition(async () => {
      const r = await completeTask(fd);
      if (r.ok) {
        // Notifica o pai — o toast/Desfazer vive fora do card, porque a
        // tarefa some da view "Hoje/Atrasadas/Próximas" imediatamente.
        onCompleted?.(task);
      } else {
        setError(r.message);
      }
    });
  }

  function onReopen() {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", task.id);
    startTransition(async () => {
      const r = await reopenTask(fd);
      if (!r.ok) setError(r.message);
    });
  }

  function onDelete() {
    if (!confirm(`Excluir a tarefa "${task.title}"? Essa ação não pode ser desfeita.`)) return;
    const fd = new FormData();
    fd.set("id", task.id);
    startTransition(async () => {
      const r = await deleteTask(fd);
      if (!r.ok) setError(r.message);
    });
  }

  const bucket = bucketFor(task.due_at);
  const isOverdue = task.status === "pending" && bucket === "overdue";
  const isCompleted = task.status === "completed";
  const isHigh = task.priority === "high";

  return (
    <li
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm transition-colors sm:p-5",
        isOverdue
          ? "border-destructive/60"
          : isHigh && !isCompleted
            ? "border-lf-volt/60"
            : "border-border",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2">
            {isOverdue ? (
              <AlertCircle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-label="Atrasada"
              />
            ) : null}
            <h3
              className={cn(
                "text-base font-medium leading-snug sm:text-lg",
                isCompleted && "text-lf-muted line-through",
              )}
            >
              {task.title}
            </h3>
          </div>

          {task.description ? (
            <p className="whitespace-pre-line text-sm text-lf-muted">{task.description}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-lf-muted">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-3.5" aria-hidden />
              {unit ? unit.name : "Toda a rede"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5" aria-hidden />
              {formatDueAt(task.due_at)}
            </span>
            {showAssignee && assignee ? (
              <span className="inline-flex items-center gap-1.5">
                <User className="size-3.5" aria-hidden />
                {assignee.name ?? assignee.email}
              </span>
            ) : null}
            {isOverdue ? (
              <Badge variant="outline" className="border-destructive/60 text-destructive">
                Atrasada
              </Badge>
            ) : null}
            {isHigh && !isCompleted ? (
              <Badge variant="outline" className="border-lf-volt/60 text-lf-volt">
                Prioridade {priorityLabel(task.priority).toLowerCase()}
              </Badge>
            ) : null}
            {isCompleted ? <Badge variant="muted">Concluída</Badge> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          {isCompleted ? (
            canComplete ? (
              <Button
                type="button"
                variant="outline"
                onClick={onReopen}
                disabled={pending}
                className="gap-2"
              >
                <RotateCcw className="size-4" /> Reabrir
              </Button>
            ) : null
          ) : canComplete ? (
            <Button
              type="button"
              onClick={onComplete}
              disabled={pending}
              size="lg"
              className="gap-2"
              aria-label={`Concluir tarefa ${task.title}`}
            >
              <CheckCircle2 className="size-4" />
              {pending ? "Concluindo…" : "Concluir tarefa"}
            </Button>
          ) : null}

          {canManage ? (
            <div className="flex items-center gap-1 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onEdit}
                aria-label="Editar tarefa"
                title="Editar"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="Excluir tarefa"
                title="Excluir"
                disabled={pending}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="status" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}
