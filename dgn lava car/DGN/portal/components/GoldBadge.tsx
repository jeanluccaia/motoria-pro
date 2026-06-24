import { cn } from "@/lib/utils";

interface GoldBadgeProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function GoldBadge({ children, className, size = "md" }: GoldBadgeProps) {
  const sizes = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-3 py-1",
    lg: "text-sm px-4 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold tracking-wider uppercase",
        "gold-gradient text-[#0A0A0A]",
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
