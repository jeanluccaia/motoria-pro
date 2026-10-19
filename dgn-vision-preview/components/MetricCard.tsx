import clsx from "clsx";

export function MetricCard({
  label,
  value,
  delta,
  tone = "neutral",
  icon,
  compact = false,
  badge,
}: {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "neutral" | "gold" | "positive";
  icon?: React.ReactNode;
  /** Reduz padding, tamanho de fonte e espaçamento interno. */
  compact?: boolean;
  /** Pequena etiqueta auxiliar (ex: "contexto demo") exibida acima do valor. */
  badge?: string;
}) {
  return (
    <div
      className={clsx(
        "surface-raised relative overflow-hidden group hover:border-white/10 transition-colors",
        compact ? "p-4" : "p-6"
      )}
    >
      <div
        className={clsx(
          "absolute inset-x-0 top-0 h-px",
          tone === "gold" && "bg-gradient-to-r from-transparent via-gold-400/60 to-transparent",
          tone === "positive" && "bg-gradient-to-r from-transparent via-accent-emerald/60 to-transparent",
          tone === "neutral" && "bg-gradient-to-r from-transparent via-white/10 to-transparent"
        )}
      />
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={clsx(
                "uppercase tracking-wider text-ink-400 font-medium",
                compact ? "text-[10px]" : "text-[11px]"
              )}
            >
              {label}
            </span>
            {badge && (
              <span className="pill bg-white/5 text-ink-400 border border-white/10 normal-case tracking-normal text-[9px] py-0.5 px-1.5">
                {badge}
              </span>
            )}
          </div>
          <span
            className={clsx(
              "leading-none font-semibold text-white tabular-nums tracking-tight",
              compact ? "text-[26px] mt-1" : "text-[32px] mt-1"
            )}
          >
            {value}
          </span>
        </div>
        {icon && (
          <div
            className={clsx(
              "rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-ink-300 shrink-0",
              compact ? "w-8 h-8" : "w-9 h-9"
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {delta && (
        <div className={clsx("flex items-center gap-2", compact ? "mt-2.5" : "mt-4")}>
          <span
            className={clsx(
              "pill",
              tone === "gold" && "bg-gold-400/10 text-gold-300 border border-gold-400/20",
              tone === "positive" && "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20",
              tone === "neutral" && "bg-white/5 text-ink-200 border border-white/10"
            )}
          >
            {delta}
          </span>
        </div>
      )}
    </div>
  );
}
