import { cn } from '@/lib/utils'
import { SignalMark } from './SignalMark'

interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
  bg?: 'black' | 'graphite' | 'surface'
  tight?: boolean
}

const bgs = {
  black: 'bg-lf-black',
  graphite: 'bg-lf-graphite',
  surface: 'bg-lf-surface',
}

export function Section({ children, className, id, bg = 'black', tight = false }: SectionProps) {
  return (
    <section id={id} className={cn(bgs[bg], tight ? 'py-12' : 'py-16 md:py-24', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">{children}</div>
    </section>
  )
}

export function SectionHeader({
  label,
  title,
  subtitle,
  centered = false,
}: {
  label?: string
  title: string
  subtitle?: string
  centered?: boolean
}) {
  return (
    <div className={cn('mb-10 md:mb-14', centered && 'text-center')}>
      {label && (
        <div className={cn('mb-4 flex items-center gap-3', centered && 'justify-center')}>
          <SignalMark />
          <p className="text-xs uppercase tracking-[0.2em] text-lf-volt">{label}</p>
        </div>
      )}
      <h2 className="text-4xl md:text-6xl font-black text-lf-text">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-lg text-lf-muted max-w-2xl">{subtitle}</p>
      )}
    </div>
  )
}
