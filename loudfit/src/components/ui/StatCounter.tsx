'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion, useInView } from 'framer-motion'

interface StatCounterProps {
  value: number
  suffix?: string
  prefix?: string
  label: string
  duration?: number
}

export function StatCounter({ value, suffix = '', prefix = '', label, duration = 1800 }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion()
  const [count, setCount] = useState(0)
  const displayCount = !inView || reduce ? value : count

  useEffect(() => {
    if (!inView || reduce) return

    let start = 0
    const step = Math.ceil(value / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, value, duration, reduce])

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 text-center">
      <span className="text-5xl md:text-6xl font-black text-lf-volt tabular-nums">
        {prefix}{displayCount.toLocaleString('pt-BR')}{suffix}
      </span>
      <span className="text-xs uppercase tracking-widest text-lf-muted">{label}</span>
    </div>
  )
}
