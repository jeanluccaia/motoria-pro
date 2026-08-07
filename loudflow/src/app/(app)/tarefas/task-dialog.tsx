"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTask, updateTask } from "./actions";
import { utcIsoToLocalInput } from "@/lib/tasks/dates";
import type { Task, TaskPriority } from "@/lib/supabase/types";

type Member = { id: string; email: string; name: string | null };
type UnitLite = { id: string; name: string };

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
];

type Props =
  | {
      mode: "create";
      open: boolean;
      onOpenChange: (o: boolean) => void;
      members: Member[];
      units: UnitLite[];
    }
  | {
      mode: "edit";
      open: boolean;
      onOpenChange: (o: boolean) => void;
      members: Member[];
      units: UnitLite[];
      task: Task;
    };

export function TaskDialog(props: Props) {
  const { mode, open, onOpenChange, members, units } = props;
  const task = mode === "edit" ? props.task : null;

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    if (task) formData.set("id", task.id);
    startTransition(async () => {
      const r = mode === "create" ? await createTask(formData) : await updateTask(formData);
      if (r.ok) onOpenChange(false);
      else setError(r.message);
    });
  }

  const title = mode === "create" ? "Nova tarefa" : "Editar tarefa";
  const description =
    mode === "create"
      ? "Preencha o essencial. Você pode ajustar depois."
      : "Ajuste o que precisar. As alterações valem imediatamente para quem é responsável.";
  const submitLabel = mode === "create" ? "Criar tarefa" : "Salvar alterações";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="task-title">O que precisa ser feito?</Label>
            <Input
              id="task-title"
              name="title"
              required
              placeholder="Ex.: Ligar para o cliente do plano anual"
              defaultValue={task?.title ?? ""}
              disabled={pending}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="task-assigned">Responsável</Label>
            <select
              id="task-assigned"
              name="assigned_to"
              required
              defaultValue={task?.assigned_to ?? ""}
              disabled={pending}
              className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
            >
              <option value="" disabled>
                Escolha alguém
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="task-unit">Unidade</Label>
              <select
                id="task-unit"
                name="unit_id"
                defaultValue={task?.unit_id ?? ""}
                disabled={pending}
                className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
              >
                <option value="">Toda a rede</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="task-priority">Prioridade</Label>
              <select
                id="task-priority"
                name="priority"
                defaultValue={task?.priority ?? "normal"}
                disabled={pending}
                className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="task-due">Prazo</Label>
            <Input
              id="task-due"
              name="due_at"
              type="datetime-local"
              defaultValue={task ? utcIsoToLocalInput(task.due_at) : ""}
              disabled={pending}
            />
            <p className="text-xs text-lf-muted">
              Deixe em branco se essa tarefa não tem data. O horário considera o fuso de São Paulo.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="task-description">Instruções (opcional)</Label>
            <textarea
              id="task-description"
              name="description"
              rows={3}
              defaultValue={task?.description ?? ""}
              disabled={pending}
              placeholder="Detalhes que ajudam quem vai executar."
              className="min-h-24 w-full rounded-md border border-input bg-lf-graphite px-3 py-2 text-sm text-foreground placeholder:text-lf-muted lf-focus disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
