'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion, useInView } from 'framer-motion'

export function AnimatedNumber({
  value,
  duration = 1200,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView || reduce) return
    let current = 0
    const step = Math.max(1, Math.ceil(value / (duration / 16)))
    const id = setInterval(() => {
      current += step
      if (current >= value) { setDisplay(value); clearInterval(id) }
      else setDisplay(current)
    }, 16)
    return () => clearInterval(id)
  }, [inView, value, duration, reduce])

  return <span ref={ref} className={className}>{reduce ? value : display}</span>
}
