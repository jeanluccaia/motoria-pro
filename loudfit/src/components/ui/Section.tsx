import { cn } from '@/lib/utils'
import { SignalMark } from './SignalMark'

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
  dark = false,
}: {
  label?: string
  title: string
  subtitle?: string | React.ReactNode
  centered?: boolean
  dark?: boolean
}) {
  return (
    <div className={cn('mb-10 md:mb-14', centered && 'text-center')}>
      {label && (
        <div className={cn('mb-4 flex items-center gap-3', centered && 'justify-center')}>
          <SignalMark />
          <p className={cn('text-xs uppercase tracking-[0.2em]', dark ? 'text-gray-500' : 'text-lf-volt')}>
            {label}
          </p>
        </div>
      )}
      <h2 className={cn('text-4xl md:text-6xl font-black', dark ? 'text-gray-900' : 'text-lf-text')}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-4 text-lg max-w-2xl', dark ? 'text-gray-500' : 'text-lf-muted')}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
