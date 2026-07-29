'use client'

import { useEffect, useState } from 'react'
import { Button } from './Button'

export function StickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.85)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      aria-hidden={!visible}
      className={[
        'hidden lg:flex',
        'fixed bottom-0 left-0 right-0 z-40',
        'items-center justify-between gap-6',
        'bg-lf-black/90 backdrop-blur-md border-t border-lf-line',
        'px-12 py-4',
        'transition-transform duration-300',
        visible ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
    >
      <p className="text-sm font-medium text-lf-muted">
        Primeira mensalidade por{' '}
        <strong className="text-lf-volt">R$ 9,90</strong>
        {' '}no Power Plus
      </p>
      <Button href="/unidades" variant="volt" size="md">
        Começar matrícula
      </Button>
    </div>
  )
}
