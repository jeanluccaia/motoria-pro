import { cn } from '@/lib/utils'
import type { UnitStatus } from '@/types'

const statusConfig: Record<UnitStatus, { label: string; className: string }> = {
  ativa: { label: 'Aberta', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  em_breve: { label: 'Em breve', className: 'bg-lf-volt/20 text-lf-volt border-lf-volt/30' },
  em_obras: { label: 'Em obras', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
}

export function UnitBadge({ status }: { status: UnitStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex text-[10px] uppercase tracking-widest px-2 py-0.5 border rounded-full font-bold', config.className)}>
      {config.label}
    </span>
  )
}
