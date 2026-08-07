"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { reopenTask } from "./actions";
import type { Task } from "@/lib/supabase/types";

const UNDO_MS = 5_000;

export function UndoToast({
  task,
  onDismiss,
}: {
  task: Task;
  onDismiss: () => void;
}) {
  const [left, setLeft] = useState(UNDO_MS);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setLeft((prev) => {
        const next = prev - 250;
        if (next <= 0) {
          if (timer.current) clearInterval(timer.current);
          onDismiss();
          return 0;
        }
        return next;
      });
    }, 250);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [onDismiss]);

  function onUndo() {
    if (pending) return;
    if (timer.current) clearInterval(timer.current);
    const fd = new FormData();
    fd.set("id", task.id);
    startTransition(async () => {
      await reopenTask(fd);
      onDismiss();
    });
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-lg border border-border bg-lf-graphite px-4 py-3 shadow-2xl md:left-8 md:translate-x-0"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <CheckCircle2 className="size-4 shrink-0 text-lf-volt" aria-hidden />
        <span className="truncate">
          Tarefa concluída: <span className="text-foreground">{task.title}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={onUndo}
        disabled={pending}
        className="shrink-0 rounded font-medium text-lf-volt underline-offset-4 hover:underline lf-focus disabled:opacity-60"
      >
        {pending ? "Desfazendo…" : `Desfazer (${Math.ceil(left / 1000)}s)`}
      </button>
    </div>
  );
}
