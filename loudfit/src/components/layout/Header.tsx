'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

const nav = [
  { label: 'Planos', href: '/#planos' },
  { label: 'Unidades', href: '/unidades' },
  { label: 'Modalidades', href: '/modalidades' },
  { label: 'Franquias', href: '/franquias' },
  { label: 'Sobre', href: '/sobre' },
]

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-lf-black/90 backdrop-blur border-b border-lf-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-display text-xl font-black tracking-tighter text-lf-volt uppercase">
          LoudFit
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm uppercase tracking-widest text-lf-muted hover:text-lf-text transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button href="/#planos" variant="ghost" size="sm">
            Ver planos
          </Button>
          <Button href="/unidades" variant="volt" size="sm">
            Começar matrícula
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-lf-text"
          aria-label="Menu"
        >
          <span className={`block w-6 h-0.5 bg-current transition-all mb-1.5 ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-current transition-all mb-1.5 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-current transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-lf-graphite border-t border-lf-line px-4 py-6 flex flex-col gap-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-sm uppercase tracking-widest text-lf-muted hover:text-lf-text transition-colors py-2"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-lf-line">
            <Button href="/#planos" variant="ghost" className="w-full justify-center">
              Ver planos
            </Button>
            <Button href="/unidades" variant="volt" className="w-full justify-center">
              Começar matrícula
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
