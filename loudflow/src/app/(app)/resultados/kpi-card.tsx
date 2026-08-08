import { NOT_AVAILABLE_LABEL } from "@/lib/metrics/format";
import { cn } from "@/lib/utils";

// Card de indicador principal. Trata claramente três estados visuais:
//   * valor numérico normal
//   * "Não disponível" (fonte não fornece a métrica) — cor discreta
//   * hint opcional (texto explicativo curto)
export function KpiCard({
  label,
  value,
  hint,
  emphasis = "normal",
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: "normal" | "muted";
}) {
  const isUnavailable = value === NOT_AVAILABLE_LABEL;
  const strong = emphasis === "normal" && !isUnavailable;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-card p-5 transition-colors",
        strong ? "border-border" : "border-border/60",
      )}
    >
      <div className="text-xs font-medium uppercase tracking-widest text-lf-muted">
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl",
          isUnavailable ? "text-lf-muted/70" : "text-foreground",
        )}
      >
        {value}
      </div>
      {hint ? <p className="text-xs text-lf-muted">{hint}</p> : null}
    </div>
  );
}
