import { cn } from '@/lib/utils'

type BgVariant = 'black' | 'graphite' | 'surface' | 'light' | 'lighter'

interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
  bg?: BgVariant
  tight?: boolean
}

const bgs: Record<BgVariant, string> = {
  black: 'bg-lf-black',
  graphite: 'bg-lf-graphite',
  surface: 'bg-lf-surface',
  light: 'bg-[#F6F6F4]',
  lighter: 'bg-[#EFEFED]',
}

export function Section({ children, className, id, bg = 'black', tight = false }: SectionProps) {
  return (
    <section id={id} className={cn(bgs[bg], tight ? 'py-12' : 'py-16 md:py-24 lg:py-28', className)}>
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">{children}</div>
    </section>
  )
}

export function SectionHeader({
  label,
  title,
  subtitle,
  centered = false,
  dark = false,
  className,
}: {
  label?: string
  title: string
  subtitle?: string | React.ReactNode
  centered?: boolean
  dark?: boolean
  className?: string
}) {
  return (
    <div className={cn('mb-10 md:mb-14 lg:mb-16', centered && 'text-center', className)}>
      {label && (
        <p className={cn(
          'mb-3 text-[11px] font-bold uppercase tracking-[0.14em]',
          dark ? 'text-gray-400' : 'text-lf-volt',
          centered && 'text-center',
        )}>
          {label}
        </p>
      )}
      <h2 className={cn('text-4xl md:text-5xl font-black leading-[1.02]', dark ? 'text-gray-900' : 'text-lf-text')}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-4 text-base md:text-lg max-w-2xl leading-relaxed', dark ? 'text-gray-500' : 'text-lf-muted')}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
