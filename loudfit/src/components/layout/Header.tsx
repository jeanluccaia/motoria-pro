'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 32)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-lf-black border-b border-lf-line shadow-[0_1px_0_0_rgba(255,255,255,0.04)]'
          : 'bg-lf-black/80 border-b border-transparent backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" aria-label="LoudFit Home">
          <Image
            src="/assets/images/loudfit-logo-official-lockup-yellow.png"
            alt="LoudFit"
            width={140}
            height={40}
            className="h-auto w-[140px] object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm uppercase tracking-[0.1em] text-lf-muted hover:text-lf-text transition-colors duration-150"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <Button href="/#planos" variant="ghost" size="sm">
            Planos
          </Button>
          <Button href="/unidades" variant="volt" size="sm">
            Matricular
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-lf-text"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        >
          <span className={`block w-5 h-0.5 bg-current transition-all mb-1.5 origin-center ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-current transition-all mb-1.5 ${open ? 'opacity-0 scale-x-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-current transition-all origin-center ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        } bg-lf-graphite border-t border-lf-line`}
      >
        <div className="px-4 py-6 flex flex-col gap-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm uppercase tracking-[0.1em] text-lf-muted hover:text-lf-text transition-colors border-b border-lf-line/50 last:border-0"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2.5 pt-3">
            <Button href="/#planos" variant="ghost" className="w-full justify-center" onClick={() => setOpen(false)}>
              Ver planos
            </Button>
            <Button href="/unidades" variant="volt" className="w-full justify-center" onClick={() => setOpen(false)}>
              Começar matrícula
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
