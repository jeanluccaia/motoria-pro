import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-lf-graphite/40 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="text-lf-muted">{icon}</div> : null}
      <h3 className="text-base font-medium">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-lf-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Algo deu errado",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-6 py-10 text-center">
      <h3 className="text-base font-medium text-destructive">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-lf-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-lf-surface",
        className,
      )}
    />
  );
}

export function LoadingBlock({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-lf-muted" role="status">
      <span className="inline-block size-2 animate-pulse rounded-full bg-lf-volt" />
      {label}
    </div>
  );
}
