import { cn } from '@/lib/utils'

/** Marca gráfica de equalizador — referência literal ao "Loud" da marca. */
export function SignalMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-end gap-[3px]', className)} aria-hidden="true">
      <span className="h-2 w-[3px] bg-lf-volt" />
      <span className="h-3.5 w-[3px] bg-lf-volt" />
      <span className="h-[22px] w-[3px] bg-lf-volt" />
      <span className="h-3 w-[3px] bg-lf-volt" />
    </span>
  )
}
