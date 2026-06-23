import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'volt' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  href?: string
  className?: string
  children: React.ReactNode
}

const variants: Record<Variant, string> = {
  volt: 'bg-lf-volt text-lf-black hover:bg-lf-volt-deep font-bold',
  ghost: 'bg-transparent text-lf-text hover:bg-lf-surface border border-lf-line',
  outline: 'bg-transparent text-lf-volt hover:bg-lf-volt/10 border border-lf-volt',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

const base =
  'inline-flex items-center justify-center uppercase tracking-widest font-bold rounded-none transition-all duration-200 min-h-[44px] cursor-pointer'

export function Button({
  variant = 'volt',
  size = 'md',
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className)

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  )
}
