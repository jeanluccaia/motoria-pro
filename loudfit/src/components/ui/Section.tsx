import { cn } from '@/lib/utils'

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
    <section id={id} className={cn(bgs[bg], tight ? 'py-12' : 'py-20 md:py-28', className)}>
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
    <div className={cn('mb-12 md:mb-16', centered && 'text-center')}>
      {label && (
        <p className="text-xs uppercase tracking-[0.2em] text-lf-volt mb-4">{label}</p>
      )}
      <h2 className="max-w-[calc(100vw-2rem)] text-3xl sm:max-w-none sm:text-4xl md:text-6xl font-black text-lf-text break-words">{title}</h2>
      {subtitle && (
        <p className="mt-4 max-w-[calc(100vw-2rem)] sm:max-w-2xl text-lg leading-relaxed text-lf-muted break-words">{subtitle}</p>
      )}
    </div>
  )
}
