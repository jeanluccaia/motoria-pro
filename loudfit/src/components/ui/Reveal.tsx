interface RevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function Reveal({ children, className }: RevealProps) {
  return <div className={className}>{children}</div>
}

export function RevealGroup({
  children,
  className,
}: {
  children: React.ReactNode[]
  className?: string
  stagger?: number
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <div key={i}>{child}</div>
      ))}
    </div>
  )
}
