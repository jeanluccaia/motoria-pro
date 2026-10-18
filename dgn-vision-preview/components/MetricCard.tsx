import clsx from "clsx";

export function MetricCard({
  label,
  value,
  delta,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "neutral" | "gold" | "positive";
  icon?: React.ReactNode;
}) {
  return (
    <div className="surface-raised p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div
        className={clsx(
          "absolute inset-x-0 top-0 h-px",
          tone === "gold" && "bg-gradient-to-r from-transparent via-gold-400/60 to-transparent",
          tone === "positive" && "bg-gradient-to-r from-transparent via-accent-emerald/60 to-transparent",
          tone === "neutral" && "bg-gradient-to-r from-transparent via-white/10 to-transparent"
        )}
      />
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-ink-400 font-medium">
            {label}
          </span>
          <span className="text-[32px] leading-none font-semibold text-white tabular-nums tracking-tight">
            {value}
          </span>
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-ink-300">
            {icon}
          </div>
        )}
      </div>
      {delta && (
        <div className="mt-4 flex items-center gap-2">
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
