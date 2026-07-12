'use client'

import { useEffect, useRef, useState } from 'react'
import { trackFranchiseEvent } from '@/lib/franchise-analytics'

const HIDE_TARGETS = ['candidatura', 'encerramento']

export function FranchiseStickyCta() {
  const [visible, setVisible] = useState(false)
  const clickTracked = useRef(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.65)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-hide the sticky CTA when the user scrolls the candidatura section into view.
  useEffect(() => {
    const observed = HIDE_TARGETS
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (!observed.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries.some((entry) => entry.isIntersecting)
        if (inView) setVisible(false)
      },
      { rootMargin: '0px 0px -40% 0px', threshold: 0.15 },
    )
    observed.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function handleClick() {
    if (!clickTracked.current) {
      clickTracked.current = true
      trackFranchiseEvent('franchise_cta_sticky')
    }
  }

  return (
    <div
      aria-hidden={!visible}
      className={[
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 transition-transform duration-300 md:justify-end md:px-6 md:pb-6',
        visible ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
    >
      <a
        href="#candidatura"
        onClick={handleClick}
        className="lf-cta-volt pointer-events-auto inline-flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99] md:w-auto"
      >
        Quero ser franqueado
        <span aria-hidden="true">→</span>
      </a>
    </div>
  )
}
