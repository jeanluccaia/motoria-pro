import { cn } from "@/lib/utils";

interface WashProgressBarProps {
  used: number;
  total: number;
  className?: string;
}

export function WashProgressBar({ used, total, className }: WashProgressBarProps) {
  const percentage = Math.min((used / total) * 100, 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">Lavagens utilizadas</span>
        <span className="text-sm font-bold text-[#C9A84C]">
          {used} <span className="text-[#9CA3AF] font-normal">/ {total}</span>
        </span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background: "linear-gradient(90deg, #C9A84C 0%, #F0D060 50%, #C9A84C 100%)",
            boxShadow: "0 0 8px rgba(201, 168, 76, 0.5)",
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] text-[#9CA3AF]">
          {total - used} lavagens restantes
        </span>
        <span className="text-[11px] text-[#C9A84C] font-medium">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}
